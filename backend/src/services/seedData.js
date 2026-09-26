import bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';
import Student from '../models/Student.js';
import { Subject, Material, Question, Answer, Comment, Audit } from '../models/index.js';
import { storeFile } from './storage.js';
export const demoAccounts = [
  { name: 'Alex Morgan', email: 'student@acadhub.test', role: 'student' },
  { name: 'Nethmi Perera', email: 'peer@acadhub.test', role: 'student' },
  { name: 'Sam Fernando', email: 'moderator@acadhub.test', role: 'moderator' },
  { name: 'Jordan Silva', email: 'admin@acadhub.test', role: 'admin' },
];
export async function seedSubjects() {
  const data = [
    {
      code: 'CS201',
      name: 'Data Structures & Algorithms',
      semester: 3,
      description: 'Build a solid foundation in efficient problem solving.',
    },
    {
      code: 'CS202',
      name: 'Database Management Systems',
      semester: 3,
      description: 'From relational models to designing dependable data systems.',
    },
    {
      code: 'CS203',
      name: 'Operating Systems',
      semester: 3,
      description: 'Understand processes, memory, and the systems beneath your code.',
    },
    {
      code: 'MA201',
      name: 'Discrete Mathematics',
      semester: 3,
      description: 'Logic, sets, graphs, and the mathematics of computing.',
    },
    {
      code: 'CS204',
      name: 'Web Development',
      semester: 4,
      description: 'Create thoughtful, accessible experiences for the web.',
    },
    {
      code: 'CS205',
      name: 'Computer Networks',
      semester: 4,
      description: 'Explore how information moves across connected systems.',
    },
  ];
  const subjects = [];
  for (const entry of data)
    subjects.push(
      await Subject.findOneAndUpdate(
        { code: entry.code },
        { $setOnInsert: { ...entry, department: 'Computer Science' } },
        { upsert: true, returnDocument: 'after' },
      ),
    );
  return subjects;
}
export async function seedDemo(password) {
  if (!password || password.length < 10)
    throw new Error('Set a demo password of at least 10 characters.');
  const subjects = await seedSubjects(),
    users = [],
    hash = await bcrypt.hash(password, 12);
  for (const account of demoAccounts)
    users.push(
      await Student.findOneAndUpdate(
        { email: account.email },
        {
          $setOnInsert: {
            ...account,
            password: hash,
            status: 'active',
            department: 'Computer Science',
            batch: '2024/2025',
            semester: 3,
            bio: 'Learning something new, one question at a time.',
          },
        },
        { upsert: true, returnDocument: 'after' },
      ),
    );
  const [student, peer, moderator, admin] = users;
  const examples = [
    [
      'Trees & graphs: a visual study guide',
      'A concise guide to binary trees, traversal strategies, and graph representations. Includes self-check questions and worked examples.',
      0,
      'Lecture notes',
      'Trees are connected acyclic graphs. In-order traversal visits left subtree, root, then right subtree. Compare adjacency lists with matrices for sparse graphs.',
    ],
    [
      'SQL practice: joins, groups & subqueries',
      'Original practice questions covering inner joins, grouping, and nested queries. Test your understanding before the next lab.',
      1,
      'Homework',
      'Create Student and Enrollment tables. Find students with no enrollments using a LEFT JOIN and a NULL check. Group enrollments by subject and explain HAVING.',
    ],
    [
      'Process scheduling revision sheet',
      'A quick refresher on FCFS, shortest-job-first, priority scheduling, and round robin, with helpful comparisons.',
      2,
      'Reference',
      'Round robin gives each runnable process a time quantum. Short quanta improve responsiveness but increase context switching overhead.',
    ],
    [
      'Discrete maths: proofs made simpler',
      'Peer-written explanations of induction, contradiction, and direct proofs, with pointers for choosing an approach.',
      3,
      'Lecture notes',
      'Induction: prove a base case, assume a statement holds for n, then prove n+1. A proof by contradiction starts by assuming the negation.',
    ],
    [
      'Database lab: normalization exercises',
      'A step-by-step lab worksheet for functional dependencies and normal forms, with practice scenarios to discuss.',
      1,
      'Lab manuals',
      'Identify candidate keys and functional dependencies. Remove partial dependencies for 2NF. Explain why 3NF matters.',
    ],
    [
      'Web development learning outline',
      'An original subject outline for semantic HTML, CSS layout, React state, and secure API design.',
      4,
      'Syllabi',
      'Study semantic HTML; responsive CSS; accessible forms; React state; API errors; server-side authorization; deployment.',
    ],
  ];
  for (let i = 0; i < examples.length; i++) {
    const [title, description, index, category, content] = examples[i],
      uploader = i % 2 ? peer._id : student._id;
    if (await Material.exists({ title, uploader })) continue;
    const buffer = Buffer.from(
      '# ' +
        title +
        '\n\n' +
        content +
        '\n\nOriginal AcadHub demonstration material. Not an official faculty solution.\n',
    );
    const file = await storeFile(buffer, {
      name: title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.txt',
      mime: 'text/plain',
      size: buffer.length,
      hash: createHash('sha256').update(buffer).digest('hex'),
    });
    await Material.create({
      title,
      description,
      subject: subjects[index]._id,
      category,
      semester: subjects[index].semester,
      academicYear: '2026/2027',
      uploader,
      status: 'approved',
      reviewedBy: moderator._id,
      reviewedAt: new Date(),
      file,
    });
  }
  const questions = [
    [
      'When should I use an adjacency list instead of a matrix?',
      'I understand both representations, but I am unsure how graph density affects memory and traversal performance. How should I choose?',
      0,
      ['graphs', 'complexity'],
    ],
    [
      'What is the difference between WHERE and HAVING in SQL?',
      'Both clauses seem to filter data, but some queries fail when I move a condition between them. What is the rule?',
      1,
      ['sql', 'queries'],
    ],
    [
      'How do I choose a time quantum for round robin?',
      'A short quantum seems responsive but causes more context switches. What are the main tradeoffs when choosing the quantum?',
      2,
      ['scheduling'],
    ],
  ];
  for (let i = 0; i < questions.length; i++) {
    const [title, body, index, tags] = questions[i];
    const question = await Question.findOneAndUpdate(
      { title, author: student._id },
      { $setOnInsert: { title, body, subject: subjects[index]._id, tags, author: student._id } },
      { upsert: true, returnDocument: 'after' },
    );
    if (i === 0 && !(await Answer.exists({ question: question._id }))) {
      const answer = await Answer.create({
        question: question._id,
        author: peer._id,
        body: 'An adjacency list uses O(V + E) space, so it works well for sparse graphs. A matrix uses O(V²) space but checks whether an edge exists in O(1). Choose based on graph density and your most frequent operations.',
      });
      await Question.updateOne(
        { _id: question._id },
        { $set: { answerCount: 1, acceptedAnswer: answer._id } },
      );
    }
  }
  const first = await Material.findOne({ title: examples[0][0] });
  if (first && !(await Comment.exists({ material: first._id })))
    await Comment.create({
      material: first._id,
      author: peer._id,
      body: 'The traversal comparison helped me connect the lecture to our lab exercises. Thanks for sharing!',
    });
  if (!(await Audit.exists({ action: 'demo.seeded' })))
    await Audit.create({
      actor: admin._id,
      action: 'demo.seeded',
      targetType: 'system',
      details: 'Original sample content and development-only accounts created.',
    });
  return { users, subjects };
}
