import mongoose from 'mongoose';
import { drainFileRemovals } from '../services/cleanup.js';
import { pipeline } from 'node:stream/promises';
import { Material, Comment, Vote, Subject, FileRemoval } from '../models/index.js';
import { inspectFile, storeFile, removeFile, readFile } from '../services/storage.js';
import {
  getMaterial,
  subjectExists,
  materialPopulate,
  authorFields,
  setVote,
  audit,
} from '../services/content.js';
import { assert, requireOwner, isStaff } from '../utils/errors.js';
import { query, paginate, escapeRegex } from '../utils/validation.js';

export async function listMaterials(req, res) {
  const q = query(req),
    filter = { status: 'approved' };
  if (q.mine === 'true') {
    filter.uploader = req.user._id;
    delete filter.status;
    if (q.status) filter.status = q.status;
  } else if (q.status && q.status !== 'approved') {
    assert(isStaff(req.user), 403, 'Only moderators can review pending resources.');
    filter.status = q.status;
  }
  for (const key of ['subject', 'category', 'semester', 'academicYear'])
    if (q[key]) filter[key] = q[key];
  if (q.search) {
    const regex = new RegExp(escapeRegex(q.search), 'i');
    const subjects = await Subject.find({ $or: [{ name: regex }, { code: regex }] })
      .select('_id')
      .limit(100)
      .lean();
    filter.$or = [
      { title: regex },
      { description: regex },
      { subject: { $in: subjects.map((s) => s._id) } },
    ];
  }
  const sort =
    q.sort === 'downloads'
      ? { downloadCount: -1, _id: -1 }
      : q.sort === 'useful'
        ? { usefulCount: -1, _id: -1 }
        : { createdAt: -1, _id: -1 };
  res.json(await paginate(Material, filter, q, { sort, populate: materialPopulate }));
}
export async function createMaterial(req, res) {
  const input = req.input;
  await subjectExists(input.subject);
  assert(
    Boolean(req.file) !== Boolean(input.link),
    400,
    'Provide either one file or an academic link.',
  );
  assert(
    (input.category === 'Academic links') === Boolean(input.link),
    400,
    'Choose Academic links for a link, or a document category for a file.',
  );
  let file;
  if (req.file) {
    const metadata = await inspectFile(req.file);
    assert(
      !(await Material.exists({ 'file.hash': metadata.hash })),
      409,
      'This file is already in the library. Search for the existing resource.',
    );
    file = await storeFile(req.file.buffer, metadata);
  }
  let item;
  try {
    await mongoose.connection.transaction(async (session) => {
      await subjectExists(input.subject, session);
      [item] = await Material.create(
        [{ ...input, file, uploader: req.user._id, status: 'pending' }],
        { session },
      );
    });
  } catch (error) {
    if (file)
      await removeFile(file.key).catch(() =>
        console.error('Orphan upload requires storage reconciliation.'),
      );
    throw error;
  }
  res.status(201).json({
    message: 'Resource submitted for review.',
    item: await Material.findById(item._id).populate(materialPopulate),
  });
}
export async function materialDetail(req, res) {
  const material = await getMaterial(req.params.id, req.user);
  const item = await Material.findById(material._id).populate(materialPopulate);
  const useful = Boolean(
    await Vote.exists({ user: req.user._id, targetType: 'material', targetId: material._id }),
  );
  res.json({ item, useful });
}
export async function updateMaterial(req, res) {
  let savedId;
  await mongoose.connection.transaction(async (session) => {
    const item = await getMaterial(req.params.id, req.user, session);
    requireOwner(item, req.user);
    await subjectExists(req.input.subject, session);
    assert(
      Boolean(item.file?.key) !== Boolean(req.input.link),
      400,
      'A file resource must keep its file, and a link resource must keep a link. Upload a new resource to replace a file.',
    );
    assert(
      (req.input.category === 'Academic links') === Boolean(req.input.link),
      400,
      'Choose the category matching the resource type.',
    );
    Object.assign(item, req.input, {
      status: 'pending',
      moderationReason: '',
      reviewedBy: undefined,
      reviewedAt: undefined,
    });
    await item.save({ session });
    savedId = item._id;
  });
  res.json({
    message: 'Changes saved and submitted for review.',
    item: await Material.findById(savedId).populate(materialPopulate),
  });
}
export async function deleteMaterial(req, res) {
  const item = await getMaterial(req.params.id, req.user);
  requireOwner(item, req.user, true);
  // Commit a deletion job with the metadata change; failed storage operations retry safely.
  await mongoose.connection.transaction(async (session) => {
    const current = await getMaterial(item._id, req.user, session);
    requireOwner(current, req.user, true);
    if (current.file?.key) await FileRemoval.create([{ key: current.file.key }], { session });
    await Comment.deleteMany({ material: item._id }, { session });
    await Vote.deleteMany({ targetType: 'material', targetId: item._id }, { session });
    await Material.deleteOne({ _id: item._id }, { session });
    if (isStaff(req.user))
      await audit(
        req.user,
        'material.deleted',
        'material',
        item._id,
        'Removed through moderation.',
        session,
      );
  });
  void drainFileRemovals().catch(() => console.error('File cleanup will retry.'));
  res.json({ message: 'Resource removed.' });
}
export async function downloadMaterial(req, res) {
  const item = await getMaterial(req.params.id, req.user);
  assert(item.file?.key, 400, 'This resource is an academic link.');
  let stream;
  try {
    stream = await readFile(item.file.key);
  } catch {
    res.status(503).json({ message: 'The file is temporarily unavailable. Please try again.' });
    return;
  }
  const inline = req.query.view === 'true';
  res.set({
    'Content-Type': item.file.mime,
    'Content-Length': String(item.file.size),
    'Cache-Control': 'private, no-store',
    'Content-Security-Policy': "sandbox; default-src 'none'; style-src 'unsafe-inline'",
    'X-Content-Type-Options': 'nosniff',
  });
  res.setHeader(
    'Content-Disposition',
    (inline ? 'inline' : 'attachment') + "; filename*=UTF-8''" + encodeURIComponent(item.file.name),
  );
  try {
    await pipeline(stream, res);
    if (!inline) await Material.updateOne({ _id: item._id }, { $inc: { downloadCount: 1 } });
  } catch (error) {
    if (error.code !== 'ERR_STREAM_PREMATURE_CLOSE') console.error('File streaming failed.');
  }
}
export async function openLink(req, res) {
  const item = await getMaterial(req.params.id, req.user);
  assert(item.link, 400, 'This resource contains a file.');
  await Material.updateOne({ _id: item._id }, { $inc: { downloadCount: 1 } });
  res.json({ url: item.link });
}
export async function materialVote(req, res) {
  res.json(await setVote(req.user, 'material', req.params.id, req.input.useful));
}
export async function listComments(req, res) {
  await getMaterial(req.params.id, req.user);
  res.json(
    await paginate(Comment, { material: req.params.id }, query(req), {
      sort: { createdAt: 1, _id: 1 },
      populate: { path: 'author', select: authorFields },
    }),
  );
}
export async function addComment(req, res) {
  let id;
  await mongoose.connection.transaction(async (session) => {
    const item = await getMaterial(req.params.id, req.user, session);
    assert(item.status === 'approved', 400, 'Comments open after approval.');
    await Material.updateOne({ _id: item._id }, { $set: { updatedAt: new Date() } }, { session });
    const [comment] = await Comment.create(
      [{ material: item._id, author: req.user._id, body: req.input.body }],
      { session },
    );
    id = comment._id;
  });
  res.status(201).json({
    message: 'Comment posted.',
    item: await Comment.findById(id).populate('author', authorFields),
  });
}
