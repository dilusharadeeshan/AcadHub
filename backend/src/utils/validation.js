import { z } from 'zod';
import { AppError } from './errors.js';

export const categories = [
  'Homework',
  'Past papers',
  'Answers',
  'Lecture notes',
  'Lab manuals',
  'Syllabi',
  'Reference',
  'Academic links',
];
export const oid = z.string().regex(/^[a-f\d]{24}$/i, 'Choose a valid record.');
const text = (min, max) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine(
      (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v),
      'Unsupported control characters.',
    );
const password = z
  .string()
  .min(10, 'Use at least 10 characters.')
  .max(72)
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes.');
const email = z
  .email()
  .max(254)
  .transform((v) => v.toLowerCase());
const semester = z.coerce.number().int().min(1).max(12);
export const profileSchema = z
  .object({
    name: text(2, 80),
    department: text(2, 100),
    batch: text(2, 40),
    semester,
    bio: text(0, 500).default(''),
  })
  .strict();
export const registrationSchema = profileSchema.omit({ bio: true }).extend({
  email,
  password,
  agreeToPolicy: z.literal(true, { error: 'Agree to the community guidelines.' }),
});
export const loginSchema = z
  .object({ email, password: z.string().min(1).max(200), remember: z.boolean().default(false) })
  .strict();
export const passwordSchema = z
  .object({ currentPassword: z.string().min(1).max(200), password })
  .strict();
export const materialSchema = z
  .object({
    title: text(4, 160),
    description: text(10, 5000),
    subject: oid,
    category: z.enum(categories),
    semester,
    academicYear: z
      .string()
      .regex(/^20\d{2}(?:[-/]20\d{2})?$/, 'Use an academic year such as 2026 or 2026/2027.'),
    link: z
      .union([
        z.literal(''),
        z
          .url()
          .max(2000)
          .refine((v) => {
            const u = new URL(v);
            return u.protocol === 'https:' && !u.username && !u.password;
          }, 'Use a public HTTPS link without credentials.'),
      ])
      .default(''),
  })
  .strict();
export const questionSchema = z
  .object({
    title: text(8, 180),
    body: text(15, 10000),
    subject: oid,
    tags: z.array(text(2, 30)).max(5).default([]),
  })
  .strict();
export const bodySchema = z.object({ body: text(2, 5000) }).strict();
export const reportSchema = z
  .object({
    targetType: z.enum(['material', 'comment', 'question', 'answer']),
    targetId: oid,
    reason: z.enum(['Inaccurate', 'Copyright', 'Inappropriate', 'Duplicate', 'Spam', 'Other']),
    details: text(10, 2000),
  })
  .strict();
export const subjectSchema = z
  .object({
    name: text(2, 100),
    code: text(2, 20),
    department: text(2, 100),
    semester,
    description: text(0, 500).default(''),
  })
  .strict();
export const moderationSchema = z
  .object({
    status: z.enum(['approved', 'rejected']),
    expectedUpdatedAt: z.iso.datetime().optional(),
    reason: text(0, 1000).default(''),
  })
  .strict()
  .refine((v) => v.status !== 'rejected' || v.reason.length >= 5, {
    message: 'Explain why the resource was rejected.',
    path: ['reason'],
  });
export const userAdminSchema = z
  .object({
    role: z.enum(['student', 'moderator', 'admin']).optional(),
    status: z.enum(['active', 'pending', 'suspended']).optional(),
    reason: text(5, 500),
  })
  .strict()
  .refine((v) => v.role || v.status, 'Choose a change.');
export const resolutionSchema = z
  .object({ status: z.enum(['resolved', 'dismissed']), resolution: text(5, 1000) })
  .strict();
export const voteSchema = z.object({ useful: z.boolean() }).strict();
export const acceptSchema = z.object({ answerId: oid.nullable() }).strict();
export const listSchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(12),
    search: text(0, 100).optional(),
    subject: oid.optional(),
    category: z.enum(categories).optional(),
    semester: semester.optional(),
    academicYear: z.string().max(20).optional(),
    sort: z.enum(['newest', 'downloads', 'useful']).default('newest'),
    mine: z.enum(['true', 'false']).optional(),
    status: z
      .enum([
        'pending',
        'approved',
        'rejected',
        'solved',
        'unanswered',
        'open',
        'resolved',
        'dismissed',
        'active',
        'suspended',
      ])
      .optional(),
    role: z.enum(['student', 'moderator', 'admin']).optional(),
  })
  .strict();
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const error = new AppError(400, 'Please check the highlighted fields.');
    error.errors = Object.fromEntries(
      result.error.issues.map((i) => [i.path.join('.') || 'form', i.message]),
    );
    throw error;
  }
  return result.data;
}
export const validate = (schema) => (req, res, next) => {
  req.input = parse(schema, req.body);
  next();
};
export const query = (req) => parse(listSchema, req.query);
export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export async function paginate(Model, filter, q, options = {}) {
  const { limit } = q;
  const fetchPage = (page) =>
    Model.find(filter)
      .sort(options.sort || { createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(options.select || '')
      .populate(options.populate || [])
      .lean();
  let [items, total] = await Promise.all([fetchPage(q.page), Model.countDocuments(filter)]);
  const pages = Math.max(1, Math.ceil(total / limit)),
    page = Math.min(q.page, pages);
  if (page !== q.page) items = await fetchPage(page);
  return { items, pagination: { page, limit, total, pages } };
}
