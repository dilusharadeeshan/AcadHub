import mongoose from 'mongoose';
import { Question, Answer, Comment, Vote, Subject } from '../models/index.js';
import {
  subjectExists,
  questionPopulate,
  authorFields,
  setVote,
  deleteDiscussion,
  getMaterial,
} from '../services/content.js';
import { assert, notFound, requireOwner, sameId } from '../utils/errors.js';
import { query, paginate, escapeRegex } from '../utils/validation.js';
export async function listQuestions(req, res) {
  const q = query(req),
    filter = {};
  if (q.subject) filter.subject = q.subject;
  if (q.mine === 'true') filter.author = req.user._id;
  if (q.status === 'solved') filter.acceptedAnswer = { $ne: null };
  if (q.status === 'unanswered') filter.answerCount = 0;
  if (q.search) {
    const regex = new RegExp(escapeRegex(q.search), 'i');
    const subjects = await Subject.find({ $or: [{ name: regex }, { code: regex }] })
      .select('_id')
      .limit(100);
    filter.$or = [
      { title: regex },
      { body: regex },
      { tags: regex },
      { subject: { $in: subjects.map((s) => s._id) } },
    ];
  }
  res.json(await paginate(Question, filter, q, { populate: questionPopulate }));
}
export async function createQuestion(req, res) {
  let item;
  await mongoose.connection.transaction(async (session) => {
    await subjectExists(req.input.subject, session);
    [item] = await Question.create([{ ...req.input, author: req.user._id }], { session });
  });
  res.status(201).json({ message: 'Your question is live.', item });
}
export async function questionDetail(req, res) {
  const item = notFound(
    await Question.findById(req.params.id).populate(questionPopulate),
    'Question',
  );
  res.json({ item });
}
export async function updateQuestion(req, res) {
  let item;
  await mongoose.connection.transaction(async (session) => {
    item = notFound(await Question.findById(req.params.id).session(session), 'Question');
    requireOwner(item, req.user);
    await subjectExists(req.input.subject, session);
    Object.assign(item, req.input);
    await item.save({ session });
  });
  res.json({ message: 'Question updated.', item });
}
export async function listAnswers(req, res) {
  notFound(await Question.exists({ _id: req.params.id }), 'Question');
  const result = await paginate(Answer, { question: req.params.id }, query(req), {
    sort: { usefulCount: -1, createdAt: 1, _id: 1 },
    populate: { path: 'author', select: authorFields },
  });
  const votes = await Vote.find({
    user: req.user._id,
    targetType: 'answer',
    targetId: { $in: result.items.map((i) => i._id) },
  }).select('targetId');
  const ids = new Set(votes.map((v) => String(v.targetId)));
  res.json({
    ...result,
    items: result.items.map((a) => ({ ...a, useful: ids.has(String(a._id)) })),
  });
}
export async function addAnswer(req, res) {
  let item;
  await mongoose.connection.transaction(async (session) => {
    notFound(
      await Question.findOneAndUpdate(
        { _id: req.params.id },
        { $inc: { answerCount: 1 } },
        { session },
      ),
      'Question',
    );
    [item] = await Answer.create(
      [{ question: req.params.id, author: req.user._id, body: req.input.body }],
      { session },
    );
  });
  res.status(201).json({ message: 'Answer posted.', item });
}
export const updateBody = (type) => async (req, res) => {
  const Model = type === 'comment' ? Comment : Answer;
  const item = notFound(await Model.findById(req.params.id), 'Content');
  requireOwner(item, req.user);
  if (type === 'comment') await getMaterial(item.material, req.user);
  else notFound(await Question.exists({ _id: item.question }), 'Question');
  item.body = req.input.body;
  await item.save();
  res.json({ message: 'Changes saved.', item });
};
export const removeDiscussion = (type) => async (req, res) => {
  await deleteDiscussion(type, req.params.id, req.user);
  res.json({ message: 'Content removed.' });
};
export async function acceptAnswer(req, res) {
  await mongoose.connection.transaction(async (session) => {
    const question = notFound(await Question.findById(req.params.id).session(session), 'Question');
    requireOwner(question, req.user);
    if (req.input.answerId) {
      const answer = notFound(await Answer.findById(req.input.answerId).session(session), 'Answer');
      assert(
        sameId(answer.question, question._id),
        400,
        'This answer belongs to a different question.',
      );
    }
    question.acceptedAnswer = req.input.answerId;
    await question.save({ session });
  });
  res.json({
    message: req.input.answerId
      ? 'Answer accepted. Question marked as solved.'
      : 'Accepted answer cleared.',
  });
}
export async function answerVote(req, res) {
  res.json(await setVote(req.user, 'answer', req.params.id, req.input.useful));
}
