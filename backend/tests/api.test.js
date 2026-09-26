import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'integration-test-secret-with-at-least-32-characters';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.STORAGE_DRIVER = 'local';
delete process.env.CLAMAV_HOST;
let repl,
  app,
  tmp,
  models,
  Student,
  subject,
  student,
  peer,
  moderator,
  admin,
  pending,
  material,
  question,
  answer,
  comment,
  report;
const password = 'Integration-passphrase-42';
async function account(email, role = 'student', status = 'active') {
  const user = await Student.create({
    name: email.split('@')[0],
    email,
    password: await bcrypt.hash(password, 4),
    role,
    status,
    department: 'Computer Science',
    batch: '2024/2025',
    semester: 3,
  });
  const agent = request.agent(app),
    csrf = (await agent.get('/api/auth/csrf').expect(200)).body.csrfToken;
  const login = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrf)
    .send({ email, password })
    .expect(200);
  return { agent, csrf, user, cookie: login.headers['set-cookie'] };
}
const send = (actor, method, url, body) =>
  actor.agent[method](url).set('X-CSRF-Token', actor.csrf).send(body);
const materialInput = () => ({
  title: 'Graph traversal revision notes',
  description: 'Original notes covering breadth first search and depth first search.',
  subject: String(subject._id),
  category: 'Lecture notes',
  semester: 3,
  academicYear: '2026/2027',
  link: '',
});
const questionInput = () => ({
  title: 'How does breadth first search find shortest paths?',
  body: 'I understand the traversal order, but I need help explaining why it finds the shortest path in an unweighted graph.',
  subject: String(subject._id),
  tags: ['graphs', 'algorithms'],
});
before(
  async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'acadhub-test-'));
    process.env.UPLOAD_DIR = tmp;
    repl = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
    process.env.MONGODB_URI = repl.getUri('acadhub_test');
    await mongoose.connect(process.env.MONGODB_URI);
    ({ default: Student } = await import('../src/models/Student.js'));
    models = await import('../src/models/index.js');
    ({ createApp: app } = await import('../src/app.js'));
    app = app();
    for (const Model of [Student, ...Object.values(models)]) await Model.init();
    await models.Guard.create({ _id: 'admin-access', version: 0 });
    subject = await models.Subject.create({
      name: 'Data Structures',
      code: 'CS201',
      department: 'Computer Science',
      semester: 3,
    });
    student = await account('student@test.example');
    peer = await account('peer@test.example');
    moderator = await account('moderator@test.example', 'moderator');
    admin = await account('admin@test.example', 'admin');
    pending = await account('pending@test.example', 'student', 'pending');
  },
  { timeout: 300000 },
);
after(async () => {
  await mongoose.disconnect();
  if (repl) await repl.stop();
  if (tmp) await fs.rm(tmp, { recursive: true, force: true });
});

test('health, secure headers, authentication boundaries, and safe errors', async () => {
  await request(app).get('/api/health').expect(200).expect('X-Content-Type-Options', 'nosniff');
  await request(app).get('/api/materials').expect(401);
  await pending.agent.get('/api/materials').expect(403);
  await pending.agent.get('/api/auth/profile').expect(200);
  await student.agent.get('/api/admin/stats').expect(403);
  await student.agent.get('/api/materials/not-an-id').expect(400);
  await student.agent.get('/api/materials?limit=999').expect(400);
  const data = await student.agent.get('/api/auth/profile').expect(200);
  assert.equal(data.body.user.email, student.user.email);
  assert.ok(!JSON.stringify(data.body).includes('password'));
  await student.agent.get('/api/materials?search[$ne]=x').expect(400);
  await request(app).get('/api/health').set('Origin', 'https://untrusted.example').expect(403);
});
test('registration validates types, rejects privilege escalation, hashes passwords and requires approval', async () => {
  const base = {
    name: 'New Student',
    email: 'NEW@test.example',
    password,
    department: 'Computer Science',
    batch: '2024/2025',
    semester: 3,
    agreeToPolicy: true,
  };
  await send(student, 'post', '/api/auth/register', { ...base, role: 'admin' }).expect(400);
  await send(student, 'post', '/api/auth/register', { ...base, email: { $ne: null } }).expect(400);
  await send(student, 'post', '/api/auth/register', { ...base, password: 'short' }).expect(400);
  const result = await send(student, 'post', '/api/auth/register', base).expect(201);
  assert.equal(result.body.user.status, 'pending');
  assert.equal(result.body.user.role, 'student');
  assert.equal(result.body.user.email, 'new@test.example');
  const saved = await Student.findOne({ email: 'new@test.example' }).select('+password');
  assert.notEqual(saved.password, password);
  assert.equal(await bcrypt.compare(password, saved.password), true);
  await send(student, 'post', '/api/auth/register', base).expect(409);
});
test('CSRF and origin protections block untrusted writes', async () => {
  await student.agent.post('/api/questions').send(questionInput()).expect(403);
  await student.agent
    .post('/api/questions')
    .set('X-CSRF-Token', student.csrf)
    .set('Origin', 'https://evil.example')
    .send(questionInput())
    .expect(403);
  await student.agent
    .post('/api/questions')
    .set('X-CSRF-Token', student.csrf)
    .set('Sec-Fetch-Site', 'cross-site')
    .send(questionInput())
    .expect(403);
});
test('profile updates are validated and cannot change roles or email', async () => {
  const input = {
    name: 'Updated Student',
    department: 'Computer Science',
    batch: '2024/2025',
    semester: 4,
    bio: 'I enjoy algorithms.',
  };
  await send(student, 'patch', '/api/auth/profile', { ...input, role: 'admin' }).expect(400);
  const result = await send(student, 'patch', '/api/auth/profile', input).expect(200);
  assert.equal(result.body.user.semester, 4);
});
test('uploads reject unsupported extensions, disguised files, empty and oversized content', async () => {
  const upload = (name, buffer) => {
    let req = student.agent.post('/api/materials').set('X-CSRF-Token', student.csrf);
    for (const [key, value] of Object.entries(materialInput())) req = req.field(key, String(value));
    return req.attach('file', buffer, name);
  };
  await upload('bad.exe', Buffer.from('executable')).expect(400);
  await upload('fake.pdf', Buffer.from('not a pdf')).expect(400);
  await upload('empty.txt', Buffer.alloc(0)).expect(400);
  await upload('bad.txt', Buffer.from([0xff, 0, 0x1])).expect(400);
  await upload('large.txt', Buffer.alloc(10 * 1024 * 1024 + 1, 65)).expect(413);
  const result = await upload(
    'notes.txt',
    Buffer.from('Original notes on breadth first search and graph traversal.'),
  ).expect(201);
  material = result.body.item;
  assert.equal(material.status, 'pending');
  assert.ok(!material.file.key);
  assert.ok(!material.file.hash);
  await upload(
    'duplicate.txt',
    Buffer.from('Original notes on breadth first search and graph traversal.'),
  ).expect(409);
});
test('pending files and metadata are private to uploader and staff until approved', async () => {
  await peer.agent.get('/api/materials/' + material._id).expect(404);
  await peer.agent.get('/api/materials/' + material._id + '/file').expect(404);
  await student.agent.get('/api/materials/' + material._id).expect(200);
  await moderator.agent.get('/api/materials/' + material._id + '/file?view=true').expect(200);
  const list = await peer.agent.get('/api/materials').expect(200);
  assert.equal(list.body.pagination.total, 0);
  await send(student, 'patch', '/api/admin/materials/' + material._id, {
    status: 'approved',
    reason: '',
  }).expect(403);
  await send(moderator, 'patch', '/api/admin/materials/' + material._id, {
    status: 'rejected',
    reason: '',
  }).expect(400);
  await send(moderator, 'patch', '/api/admin/materials/' + material._id, {
    status: 'approved',
    reason: 'Reviewed the original study notes.',
  }).expect(200);
  const download = await peer.agent.get('/api/materials/' + material._id + '/file').expect(200);
  assert.match(download.headers['content-disposition'], /^attachment/);
  assert.match(download.text, /breadth first search/);
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal((await models.Material.findById(material._id)).downloadCount, 1);
});
test('search, filters, sorting and pagination return actual database records without private storage details', async () => {
  const result = await peer.agent
    .get(
      '/api/materials?search=Data%20Structures&semester=3&academicYear=2026%2F2027&category=Lecture%20notes&sort=downloads&limit=1',
    )
    .expect(200);
  assert.equal(result.body.pagination.total, 1);
  assert.equal(result.body.items[0]._id, material._id);
  const text = JSON.stringify(result.body);
  assert.ok(!text.includes('test.example'));
  assert.ok(!text.includes('"key"'));
  assert.ok(!text.includes('"hash"'));
  await peer.agent.get('/api/materials?status=pending').expect(403);
  const none = await peer.agent.get('/api/materials?search=nonexistent').expect(200);
  assert.equal(none.body.items.length, 0);
});
test('resource votes are idempotent, reversible and prohibit self-voting', async () => {
  await send(student, 'put', '/api/materials/' + material._id + '/vote', { useful: true }).expect(
    400,
  );
  for (let i = 0; i < 2; i++)
    await send(peer, 'put', '/api/materials/' + material._id + '/vote', { useful: true }).expect(
      200,
    );
  assert.equal((await models.Material.findById(material._id)).usefulCount, 1);
  await send(peer, 'put', '/api/materials/' + material._id + '/vote', { useful: false }).expect(
    200,
  );
  assert.equal((await models.Material.findById(material._id)).usefulCount, 0);
});
test('comment CRUD enforces authorship and supports moderator removal', async () => {
  const result = await send(peer, 'post', '/api/materials/' + material._id + '/comments', {
    body: 'This helps explain the graph traversal order.',
  }).expect(201);
  comment = result.body.item;
  await send(student, 'patch', '/api/comments/' + comment._id, {
    body: 'Unauthorized edit',
  }).expect(403);
  await send(peer, 'patch', '/api/comments/' + comment._id, {
    body: 'Updated explanation of graph traversal order.',
  }).expect(200);
  const list = await student.agent.get('/api/materials/' + material._id + '/comments').expect(200);
  assert.equal(list.body.items.length, 1);
  await send(student, 'delete', '/api/comments/' + comment._id).expect(403);
});
test('question and answer CRUD, useful votes and acceptance protect ownership and relationships', async () => {
  question = (await send(student, 'post', '/api/questions', questionInput()).expect(201)).body.item;
  await send(peer, 'patch', '/api/questions/' + question._id, questionInput()).expect(403);
  answer = (
    await send(peer, 'post', '/api/questions/' + question._id + '/answers', {
      body: 'BFS explores vertices in layers of increasing distance from the start.',
    }).expect(201)
  ).body.item;
  await send(student, 'patch', '/api/answers/' + answer._id, { body: 'Wrong owner' }).expect(403);
  await send(peer, 'patch', '/api/answers/' + answer._id, {
    body: 'BFS explores each layer before advancing to the next distance.',
  }).expect(200);
  await send(peer, 'put', '/api/answers/' + answer._id + '/vote', { useful: true }).expect(400);
  await send(student, 'put', '/api/answers/' + answer._id + '/vote', { useful: true }).expect(200);
  await send(peer, 'put', '/api/questions/' + question._id + '/accepted-answer', {
    answerId: answer._id,
  }).expect(403);
  const other = (
    await send(peer, 'post', '/api/questions', {
      ...questionInput(),
      title: 'Another question about graph traversal?',
    }).expect(201)
  ).body.item;
  await send(peer, 'put', '/api/questions/' + other._id + '/accepted-answer', {
    answerId: answer._id,
  }).expect(400);
  await send(student, 'put', '/api/questions/' + question._id + '/accepted-answer', {
    answerId: answer._id,
  }).expect(200);
  const solved = await student.agent.get('/api/questions?status=solved&search=graphs').expect(200);
  assert.equal(solved.body.items[0]._id, question._id);
  const detail = await peer.agent.get('/api/questions/' + question._id + '/answers').expect(200);
  assert.equal(detail.body.items[0].usefulCount, 1);
  await send(student, 'delete', '/api/questions/' + other._id).expect(403);
});
test('reports validate access, prevent duplicate open reports, resolve and leave an audit record', async () => {
  const input = {
    targetType: 'comment',
    targetId: comment._id,
    reason: 'Inaccurate',
    details: 'This explanation needs additional context and a citation.',
  };
  report = (await send(student, 'post', '/api/reports', input).expect(201)).body.item;
  await send(student, 'post', '/api/reports', input).expect(409);
  await student.agent.get('/api/admin/reports').expect(403);
  const list = await moderator.agent.get('/api/admin/reports?status=open').expect(200);
  assert.equal(list.body.items[0].target.path, '/resources/' + material._id);
  await send(moderator, 'delete', '/api/comments/' + comment._id).expect(200);
  await send(moderator, 'patch', '/api/admin/reports/' + report._id, {
    status: 'resolved',
    resolution: 'The inaccurate comment has been removed.',
  }).expect(200);
  await moderator.agent.get('/api/admin/audit').expect(403);
  const audit = await admin.agent.get('/api/admin/audit').expect(200);
  assert.ok(audit.body.items.some((a) => a.action === 'report.resolved'));
});
test('owner edits require renewed review, and other students cannot delete resources', async () => {
  await send(peer, 'patch', '/api/materials/' + material._id, materialInput()).expect(403);
  await send(peer, 'delete', '/api/materials/' + material._id).expect(403);
  await send(student, 'patch', '/api/materials/' + material._id, {
    ...materialInput(),
    title: 'Updated graph traversal notes',
  }).expect(200);
  assert.equal((await models.Material.findById(material._id)).status, 'pending');
  await peer.agent.get('/api/materials/' + material._id).expect(404);
});
test('subject CRUD is restricted and in-use subjects cannot be deleted', async () => {
  const input = {
    name: 'Test Networks',
    code: 'NET101',
    department: 'Computer Science',
    semester: 2,
    description: '',
  };
  await send(student, 'post', '/api/subjects', input).expect(403);
  const item = (await send(moderator, 'post', '/api/subjects', input).expect(201)).body.item;
  await send(moderator, 'patch', '/api/subjects/' + item._id, {
    ...input,
    name: 'Networks Updated',
  }).expect(200);
  await send(moderator, 'delete', '/api/subjects/' + item._id).expect(403);
  await send(admin, 'delete', '/api/subjects/' + subject._id).expect(409);
  await send(admin, 'delete', '/api/subjects/' + item._id).expect(200);
});
test('account approval, role changes, suspension and self-protection take effect immediately', async () => {
  await send(moderator, 'patch', '/api/admin/users/' + pending.user._id, {
    status: 'active',
    reason: 'Approve the account',
  }).expect(403);
  await send(admin, 'patch', '/api/admin/users/' + pending.user._id, {
    status: 'active',
    reason: 'Confirmed the batch membership.',
  }).expect(200);
  await pending.agent.get('/api/auth/profile').expect(401);
  await send(admin, 'patch', '/api/admin/users/' + admin.user._id, {
    role: 'student',
    reason: 'Attempt to change own role',
  }).expect(400);
  await send(moderator, 'patch', '/api/admin/users/' + admin.user._id, {
    status: 'suspended',
    reason: 'Unauthorized staff suspension',
  }).expect(403);
  await send(moderator, 'patch', '/api/admin/users/' + peer.user._id, {
    status: 'suspended',
    reason: 'Confirmed repeated spam reports.',
  }).expect(200);
  await peer.agent.get('/api/materials').expect(401);
  await send(moderator, 'patch', '/api/admin/users/' + student.user._id, {
    role: 'admin',
    reason: 'Attempt to elevate a user',
  }).expect(403);
});
test('deleting answers clears accepted-answer references and counts', async () => {
  await send(moderator, 'delete', '/api/answers/' + answer._id).expect(200);
  const saved = await models.Question.findById(question._id);
  assert.equal(saved.answerCount, 0);
  assert.ok(!saved.acceptedAnswer);
  assert.equal(await models.Vote.countDocuments({ targetId: answer._id }), 0);
  await send(student, 'delete', '/api/questions/' + question._id).expect(200);
  await student.agent.get('/api/questions/' + question._id).expect(404);
});
test('deleting a resource also deletes discussions and votes and queues private storage cleanup', async () => {
  await send(student, 'delete', '/api/materials/' + material._id).expect(200);
  await student.agent.get('/api/materials/' + material._id).expect(404);
  assert.equal(await models.Comment.countDocuments({ material: material._id }), 0);
});
test('password changes revoke every active session and never expose a password', async () => {
  await send(student, 'put', '/api/auth/password', {
    currentPassword: 'incorrect',
    password: 'New-test-password-123',
  }).expect(400);
  await send(student, 'put', '/api/auth/password', {
    currentPassword: password,
    password: 'New-test-password-123',
  }).expect(200);
  await student.agent.get('/api/auth/profile').expect(401);
});
test('logout revokes the stored session and cookies are HTTP-only', async () => {
  assert.ok(
    admin.cookie.some((cookie) => cookie.includes('HttpOnly') && cookie.includes('SameSite=Lax')),
  );
  const cookie = admin.cookie.map((c) => c.split(';')[0]).join('; ');
  await send(admin, 'post', '/api/auth/logout').expect(200);
  await request(app).get('/api/auth/profile').set('Cookie', cookie).expect(401);
});

test('concurrent votes stay unique and counters stay consistent', async () => {
  const item = await models.Material.create({
    ...materialInput(),
    uploader: student.user._id,
    status: 'approved',
    link: 'https://example.edu/notes',
    category: 'Academic links',
  });
  const result = await Promise.all(
    Array.from({ length: 4 }, () =>
      send(moderator, 'put', '/api/materials/' + item._id + '/vote', { useful: true }),
    ),
  );
  assert.ok(result.every((r) => r.status === 200));
  assert.equal(await models.Vote.countDocuments({ targetId: item._id }), 1);
  assert.equal((await models.Material.findById(item._id)).usefulCount, 1);
});
test('a stale review and a moderator reviewing their own resource are rejected', async () => {
  const item = await models.Material.create({ ...materialInput(), uploader: student.user._id });
  await send(moderator, 'patch', '/api/admin/materials/' + item._id, {
    status: 'approved',
    reason: 'Valid review',
    expectedUpdatedAt: '2020-01-01T00:00:00.000Z',
  }).expect(409);
  const own = await models.Material.create({ ...materialInput(), uploader: moderator.user._id });
  await send(moderator, 'patch', '/api/admin/materials/' + own._id, {
    status: 'approved',
    reason: 'Self approval attempt',
  }).expect(403);
});
test('shared rate-limit windows increment atomically and HTTP throttling returns 429', async () => {
  const { MongoRateLimitStore } = await import('../src/services/rateLimitStore.js'),
    a = new MongoRateLimitStore('test-shared'),
    b = new MongoRateLimitStore('test-shared');
  a.init({ windowMs: 60000 });
  b.init({ windowMs: 60000 });
  const counts = await Promise.all([
    a.increment('same-client'),
    b.increment('same-client'),
    a.increment('same-client'),
  ]);
  assert.deepEqual(counts.map((c) => c.totalHits).sort(), [1, 2, 3]);
  await a.resetKey('same-client');
  let response;
  for (let i = 0; i < 22; i++)
    response = await send(moderator, 'post', '/api/auth/login', {
      email: 'missing@test.example',
      password: 'wrong-password',
    });
  assert.equal(response.status, 429);
  assert.ok(response.headers['retry-after']);
});
test('pagination recovers after requesting a page beyond the current results', async () => {
  const response = await moderator.agent.get('/api/materials?page=999&limit=1').expect(200);
  assert.ok(response.body.pagination.page <= response.body.pagination.pages);
  assert.ok(response.body.items.length > 0);
});
test('legacy user migration adds only missing fields and preserves hashes and roles', async () => {
  const { migrateLegacyUsers } = await import('../src/services/migration.js');
  const result = await Student.collection.insertOne({
    name: 'Legacy User',
    email: 'legacy@test.example',
    password: 'preserved-hash',
  });
  await migrateLegacyUsers();
  const migrated = await Student.findById(result.insertedId).select('+password');
  assert.equal(migrated.password, 'preserved-hash');
  assert.equal(migrated.status, 'active');
  assert.equal(migrated.role, 'student');
  assert.equal((await Student.findById(moderator.user._id)).role, 'moderator');
});
