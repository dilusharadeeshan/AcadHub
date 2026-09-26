import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const ref = (name, required = true) => ({ type: Schema.Types.ObjectId, ref: name, required });
const options = { timestamps: true, optimisticConcurrency: true };
const session = new Schema(
  { user: ref('Student'), expiresAt: { type: Date, required: true } },
  options,
);
session.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
session.index({ user: 1 });
export const Session = model('Session', session);
const subject = new Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    code: { type: String, required: true, uppercase: true, trim: true, unique: true },
    department: { type: String, required: true },
    semester: { type: Number, min: 1, max: 12, required: true },
    description: { type: String, default: '' },
    referenceVersion: { type: Number, default: 0 },
  },
  options,
);
export const Subject = model('Subject', subject);
const material = new Schema(
  {
    title: { type: String, required: true, maxlength: 160 },
    description: { type: String, required: true, maxlength: 5000 },
    subject: ref('Subject'),
    category: { type: String, required: true },
    semester: { type: Number, required: true, min: 1, max: 12 },
    academicYear: { type: String, required: true },
    uploader: ref('Student'),
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    moderationReason: { type: String, default: '' },
    reviewedBy: ref('Student', false),
    reviewedAt: Date,
    link: { type: String, default: '' },
    file: {
      key: { type: String, select: false },
      name: String,
      mime: String,
      size: Number,
      hash: { type: String, select: false },
    },
    downloadCount: { type: Number, default: 0, min: 0 },
    usefulCount: { type: Number, default: 0, min: 0 },
  },
  options,
);
material.index({ status: 1, createdAt: -1 });
material.index({ status: 1, subject: 1, semester: 1, category: 1, academicYear: 1 });
material.index({ status: 1, downloadCount: -1 });
material.index({ status: 1, usefulCount: -1 });
material.index({ uploader: 1, createdAt: -1 });
material.index(
  { 'file.hash': 1 },
  { unique: true, partialFilterExpression: { 'file.hash': { $type: 'string' } } },
);
material.index({ title: 'text', description: 'text' });
export const Material = model('Material', material);
const comment = new Schema(
  {
    material: ref('Material'),
    author: ref('Student'),
    body: { type: String, required: true, maxlength: 5000 },
  },
  options,
);
comment.index({ material: 1, createdAt: 1 });
export const Comment = model('Comment', comment);
const question = new Schema(
  {
    title: { type: String, required: true, maxlength: 180 },
    body: { type: String, required: true, maxlength: 10000 },
    subject: ref('Subject'),
    tags: [{ type: String, maxlength: 30 }],
    author: ref('Student'),
    acceptedAnswer: ref('Answer', false),
    answerCount: { type: Number, default: 0, min: 0 },
  },
  options,
);
question.index({ createdAt: -1 });
question.index({ subject: 1, createdAt: -1 });
question.index({ author: 1 });
question.index({ title: 'text', body: 'text', tags: 'text' });
export const Question = model('Question', question);
const answer = new Schema(
  {
    question: ref('Question'),
    author: ref('Student'),
    body: { type: String, required: true, maxlength: 5000 },
    usefulCount: { type: Number, default: 0, min: 0 },
  },
  options,
);
answer.index({ question: 1, createdAt: 1 });
export const Answer = model('Answer', answer);
const vote = new Schema(
  {
    user: ref('Student'),
    targetType: { type: String, enum: ['material', 'answer'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
  },
  options,
);
vote.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });
export const Vote = model('Vote', vote);
const report = new Schema(
  {
    reporter: ref('Student'),
    targetType: {
      type: String,
      enum: ['material', 'comment', 'question', 'answer'],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    details: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' },
    resolution: { type: String, default: '' },
    reviewedBy: ref('Student', false),
    reviewedAt: Date,
  },
  options,
);
report.index({ status: 1, createdAt: -1 });
report.index(
  { reporter: 1, targetType: 1, targetId: 1 },
  { unique: true, partialFilterExpression: { status: 'open' } },
);
export const Report = model('Report', report);
const audit = new Schema(
  {
    actor: ref('Student'),
    action: { type: String, required: true },
    targetType: String,
    targetId: Schema.Types.ObjectId,
    details: { type: String, maxlength: 2000 },
  },
  options,
);
audit.index({ createdAt: -1 });
export const Audit = model('Audit', audit);

const removal = new Schema(
  {
    key: { type: String, required: true, unique: true },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: Date,
  },
  options,
);
export const FileRemoval = model('FileRemoval', removal);
const guard = new Schema({ _id: String, version: { type: Number, default: 0 } });
export const Guard = model('Guard', guard);

const requestLimit = new Schema({ _id: String, hits: Number, resetTime: Date });
requestLimit.index({ resetTime: 1 }, { expireAfterSeconds: 0 });
export const RequestLimit = model('RequestLimit', requestLimit);
