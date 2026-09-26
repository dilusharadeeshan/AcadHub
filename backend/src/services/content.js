import mongoose from 'mongoose';
import { Material, Question, Answer, Comment, Subject, Vote, Audit } from '../models/index.js';
import { assert, notFound, requireOwner, isStaff, sameId } from '../utils/errors.js';
export const authorFields = 'name department batch';
export const materialPopulate = [
  { path: 'subject', select: 'name code semester' },
  { path: 'uploader', select: authorFields },
];
export const questionPopulate = [
  { path: 'subject', select: 'name code' },
  { path: 'author', select: authorFields },
];
export async function subjectExists(id, session = null) {
  if (session)
    notFound(
      await Subject.findByIdAndUpdate(id, { $inc: { referenceVersion: 1 } }, { session }),
      'Subject',
    );
  else notFound(await Subject.exists({ _id: id }), 'Subject');
}
export async function getMaterial(id, user, session = null) {
  const item = notFound(
    await Material.findById(id).select('+file.key +file.hash').session(session),
    'Resource',
  );
  assert(
    item.status === 'approved' || sameId(item.uploader, user._id) || isStaff(user),
    404,
    'Resource not found.',
  );
  return item;
}
export const audit = (user, action, targetType, targetId, details = '', session = null) =>
  Audit.create([{ actor: user._id, action, targetType, targetId, details }], { session });
export async function setVote(user, type, id, useful) {
  const Model = type === 'material' ? Material : Answer;
  await mongoose.connection.transaction(async (session) => {
    const target =
      type === 'material'
        ? await getMaterial(id, user, session)
        : notFound(await Model.findById(id).session(session), 'Answer');
    if (type === 'answer')
      notFound(await Question.exists({ _id: target.question }).session(session), 'Question');
    assert(
      !sameId(target.uploader || target.author, user._id),
      400,
      'You cannot vote on your own contribution.',
    );
    if (type === 'material')
      assert(target.status === 'approved', 400, 'Only approved resources can receive votes.');
    const filter = { user: user._id, targetType: type, targetId: id };
    const existing = await Vote.findOne(filter).session(session);
    if (useful && !existing) {
      await Vote.create([filter], { session });
      await Model.updateOne({ _id: id }, { $inc: { usefulCount: 1 } }, { session });
    }
    if (!useful && existing) {
      await Vote.deleteOne({ _id: existing._id }, { session });
      await Model.updateOne({ _id: id }, { $inc: { usefulCount: -1 } }, { session });
    }
  });
  return {
    useful,
    usefulCount: (await Model.findById(id).select('usefulCount'))?.usefulCount || 0,
  };
}
export async function getReportTarget(type, id, user) {
  if (type === 'material') return getMaterial(id, user);
  const Model = { comment: Comment, question: Question, answer: Answer }[type];
  const item = notFound(await Model.findById(id), 'Reported content');
  if (type === 'comment') await getMaterial(item.material, user);
  if (type === 'answer') notFound(await Question.exists({ _id: item.question }), 'Question');
  return item;
}
export async function deleteDiscussion(type, id, user) {
  await mongoose.connection.transaction(async (session) => {
    const Model = { comment: Comment, question: Question, answer: Answer }[type];
    const item = notFound(await Model.findById(id).session(session), 'Content');
    requireOwner(item, user, true);
    if (type === 'comment') await getMaterial(item.material, user, session);
    if (type === 'question') {
      const answers = await Answer.find({ question: id }).select('_id').session(session);
      await Vote.deleteMany(
        { targetType: 'answer', targetId: { $in: answers.map((a) => a._id) } },
        { session },
      );
      await Answer.deleteMany({ question: id }, { session });
    }
    if (type === 'answer') {
      await Question.updateOne({ _id: item.question }, { $inc: { answerCount: -1 } }, { session });
      await Question.updateOne(
        { _id: item.question, acceptedAnswer: id },
        { $unset: { acceptedAnswer: 1 } },
        { session },
      );
      await Vote.deleteMany({ targetType: 'answer', targetId: id }, { session });
    }
    await Model.deleteOne({ _id: id }, { session });
    if (isStaff(user))
      await audit(user, 'content.deleted', type, id, 'Removed through moderation.', session);
  });
}
