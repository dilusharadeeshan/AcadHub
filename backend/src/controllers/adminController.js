import mongoose from 'mongoose';
import Student from '../models/Student.js';
import {
  Material,
  Question,
  Answer,
  Subject,
  Report,
  Audit,
  Session,
  Guard,
} from '../models/index.js';
import { assert, notFound, sameId, isStaff } from '../utils/errors.js';
import { query, paginate, escapeRegex } from '../utils/validation.js';
import { audit, getReportTarget } from '../services/content.js';

export async function listSubjects(req, res) {
  res.json({ items: await Subject.find().sort({ semester: 1, code: 1 }).lean() });
}
export async function createSubject(req, res) {
  const item = await Subject.create(req.input);
  await audit(req.user, 'subject.created', 'subject', item._id, item.code);
  res.status(201).json({ message: 'Subject added.', item });
}
export async function updateSubject(req, res) {
  const item = notFound(
    await Subject.findByIdAndUpdate(req.params.id, req.input, {
      returnDocument: 'after',
      runValidators: true,
    }),
    'Subject',
  );
  await audit(req.user, 'subject.updated', 'subject', item._id, item.code);
  res.json({ message: 'Subject updated.', item });
}
export async function deleteSubject(req, res) {
  await mongoose.connection.transaction(async (session) => {
    const item = notFound(await Subject.findById(req.params.id).session(session), 'Subject');
    assert(
      !(await Material.exists({ subject: item._id }).session(session)) &&
        !(await Question.exists({ subject: item._id }).session(session)),
      409,
      'This subject is in use. Move its resources and questions first.',
    );
    await Subject.deleteOne({ _id: item._id }, { session });
    await audit(req.user, 'subject.deleted', 'subject', item._id, item.code, session);
  });
  res.json({ message: 'Subject removed.' });
}
export async function createReport(req, res) {
  await getReportTarget(req.input.targetType, req.input.targetId, req.user);
  assert(
    !(await Report.exists({
      reporter: req.user._id,
      targetId: req.input.targetId,
      targetType: req.input.targetType,
      status: 'open',
    })),
    409,
    'You already have an open report for this content.',
  );
  const item = await Report.create({ ...req.input, reporter: req.user._id });
  res.status(201).json({ message: 'Report submitted. A moderator will review it.', item });
}
export async function dashboard(req, res) {
  const [
    resources,
    questions,
    students,
    subjects,
    myResources,
    myQuestions,
    pending,
    recentResources,
    recentQuestions,
  ] = await Promise.all([
    Material.countDocuments({ status: 'approved' }),
    Question.countDocuments(),
    Student.countDocuments({ status: 'active' }),
    Subject.countDocuments(),
    Material.countDocuments({ uploader: req.user._id }),
    Question.countDocuments({ author: req.user._id }),
    Material.countDocuments({ uploader: req.user._id, status: 'pending' }),
    Material.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(4)
      .populate('subject', 'name code')
      .populate('uploader', 'name')
      .lean(),
    Question.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('subject', 'name code')
      .populate('author', 'name')
      .lean(),
  ]);
  res.json({
    stats: { resources, questions, students, subjects, myResources, myQuestions, pending },
    recentResources,
    recentQuestions,
  });
}
export async function adminStats(req, res) {
  const [pendingResources, openReports, pendingUsers, activeUsers, suspendedUsers, storage] =
    await Promise.all([
      Material.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'open' }),
      Student.countDocuments({ status: 'pending' }),
      Student.countDocuments({ status: 'active' }),
      Student.countDocuments({ status: 'suspended' }),
      Material.aggregate([
        {
          $group: {
            _id: null,
            bytes: { $sum: '$file.size' },
            downloads: { $sum: '$downloadCount' },
          },
        },
      ]),
    ]);
  res.json({
    stats: {
      pendingResources,
      openReports,
      pendingUsers,
      activeUsers,
      suspendedUsers,
      storageBytes: storage[0]?.bytes || 0,
      downloads: storage[0]?.downloads || 0,
    },
  });
}
export async function reviewMaterial(req, res) {
  await mongoose.connection.transaction(async (session) => {
    const item = notFound(await Material.findById(req.params.id).session(session), 'Resource');
    assert(
      !sameId(item.uploader, req.user._id),
      403,
      'Another moderator must review your resource.',
    );
    if (req.input.expectedUpdatedAt)
      assert(
        item.updatedAt.toISOString() === req.input.expectedUpdatedAt,
        409,
        'This resource changed after you opened it. Refresh and review the latest version.',
      );
    item.status = req.input.status;
    item.moderationReason = req.input.reason;
    item.reviewedAt = new Date();
    item.reviewedBy = req.user._id;
    await item.save({ session });
    await audit(
      req.user,
      'material.' + req.input.status,
      'material',
      item._id,
      req.input.reason,
      session,
    );
  });
  res.json({ message: 'Resource ' + req.input.status + '.' });
}
export async function listUsers(req, res) {
  const q = query(req),
    filter = {};
  if (q.status) filter.status = q.status;
  if (q.role) filter.role = q.role;
  if (q.search) {
    const pattern = new RegExp(escapeRegex(q.search), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }, { department: pattern }];
  }
  res.json(
    await paginate(Student, filter, q, {
      select: 'name email role status department batch semester createdAt',
    }),
  );
}
export async function updateUser(req, res) {
  assert(!sameId(req.params.id, req.user._id), 400, 'You cannot change your own access.');
  await mongoose.connection.transaction(async (session) => {
    await Guard.findOneAndUpdate(
      { _id: 'admin-access' },
      { $inc: { version: 1 } },
      { upsert: true, session },
    );
    const user = notFound(await Student.findById(req.params.id).session(session), 'User');
    if (req.user.role !== 'admin') {
      assert(
        user.role === 'student' && !req.input.role && req.input.status === 'suspended',
        403,
        'Moderators can suspend student accounts. Administrators manage all other access changes.',
      );
    }
    if (
      user.role === 'admin' &&
      ((req.input.role && req.input.role !== 'admin') ||
        (req.input.status && req.input.status !== 'active'))
    ) {
      assert(
        (await Student.countDocuments({
          role: 'admin',
          status: 'active',
          _id: { $ne: user._id },
        }).session(session)) > 0,
        409,
        'At least one active administrator must remain.',
      );
    }
    const before = user.role + '/' + user.status;
    if (req.input.role) user.role = req.input.role;
    if (req.input.status) user.status = req.input.status;
    await user.save({ session });
    await Session.deleteMany({ user: user._id }, { session });
    await audit(
      req.user,
      'user.access_changed',
      'user',
      user._id,
      before + ' → ' + user.role + '/' + user.status + '. ' + req.input.reason,
      session,
    );
  });
  res.json({ message: 'User access updated. Existing sessions have been revoked.' });
}
export async function listReports(req, res) {
  const q = query(req),
    result = await paginate(Report, q.status ? { status: q.status } : {}, q, {
      populate: [
        { path: 'reporter', select: 'name' },
        { path: 'reviewedBy', select: 'name' },
      ],
    });
  result.items = await Promise.all(
    result.items.map(async (item) => {
      let target;
      try {
        const content = await getReportTarget(item.targetType, item.targetId, req.user);
        target = {
          title: content.title || content.body?.slice(0, 120),
          path:
            item.targetType === 'material'
              ? '/resources/' + content._id
              : item.targetType === 'comment'
                ? '/resources/' + content.material
                : item.targetType === 'question'
                  ? '/questions/' + content._id
                  : '/questions/' + content.question,
        };
      } catch (error) {
        if (error.status !== 404) throw error;
        target = { title: 'Content has been removed' };
      }
      return { ...item, target };
    }),
  );
  res.json(result);
}
export async function resolveReport(req, res) {
  await mongoose.connection.transaction(async (session) => {
    const item = notFound(await Report.findById(req.params.id).session(session), 'Report');
    Object.assign(item, req.input, { reviewedBy: req.user._id, reviewedAt: new Date() });
    await item.save({ session });
    await audit(
      req.user,
      'report.' + req.input.status,
      'report',
      item._id,
      req.input.resolution,
      session,
    );
  });
  res.json({ message: 'Report ' + req.input.status + '.' });
}
export async function listAudit(req, res) {
  res.json(
    await paginate(Audit, {}, query(req), { populate: { path: 'actor', select: 'name role' } }),
  );
}
