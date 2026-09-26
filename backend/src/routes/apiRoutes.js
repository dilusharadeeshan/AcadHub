import { Router } from 'express';
import multer from 'multer';
import { config } from '../config/env.js';
import { protect, active, roles } from '../middleware/authMiddleware.js';
import { uploadLimiter, writeLimiter } from '../middleware/security.js';
import * as v from '../utils/validation.js';
import * as m from '../controllers/materialController.js';
import * as d from '../controllers/discussionController.js';
import * as a from '../controllers/adminController.js';
const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSize, files: 1, fields: 10, fieldSize: 12000, parts: 12 },
});
router.use(protect, active);
router.param('id', (req, res, next, id) => {
  v.parse(v.oid, id);
  next();
});
router.get('/meta', (req, res) =>
  res.json({
    categories: v.categories,
    maxFileBytes: config.maxFileSize,
    allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg', 'txt'],
  }),
);
router.get('/dashboard', a.dashboard);
router.get('/subjects', a.listSubjects);
router.post('/subjects', roles('admin', 'moderator'), v.validate(v.subjectSchema), a.createSubject);
router.patch(
  '/subjects/:id',
  roles('admin', 'moderator'),
  v.validate(v.subjectSchema),
  a.updateSubject,
);
router.delete('/subjects/:id', roles('admin'), a.deleteSubject);
router.get('/materials', m.listMaterials);
router.post(
  '/materials',
  uploadLimiter,
  upload.single('file'),
  v.validate(v.materialSchema),
  m.createMaterial,
);
router.get('/materials/:id', m.materialDetail);
router.patch('/materials/:id', writeLimiter, v.validate(v.materialSchema), m.updateMaterial);
router.delete('/materials/:id', writeLimiter, m.deleteMaterial);
router.get('/materials/:id/file', m.downloadMaterial);
router.post('/materials/:id/open', m.openLink);
router.put('/materials/:id/vote', writeLimiter, v.validate(v.voteSchema), m.materialVote);
router.get('/materials/:id/comments', m.listComments);
router.post('/materials/:id/comments', writeLimiter, v.validate(v.bodySchema), m.addComment);
router.patch('/comments/:id', writeLimiter, v.validate(v.bodySchema), d.updateBody('comment'));
router.delete('/comments/:id', writeLimiter, d.removeDiscussion('comment'));
router.get('/questions', d.listQuestions);
router.post('/questions', writeLimiter, v.validate(v.questionSchema), d.createQuestion);
router.get('/questions/:id', d.questionDetail);
router.patch('/questions/:id', writeLimiter, v.validate(v.questionSchema), d.updateQuestion);
router.delete('/questions/:id', writeLimiter, d.removeDiscussion('question'));
router.get('/questions/:id/answers', d.listAnswers);
router.post('/questions/:id/answers', writeLimiter, v.validate(v.bodySchema), d.addAnswer);
router.put('/questions/:id/accepted-answer', v.validate(v.acceptSchema), d.acceptAnswer);
router.patch('/answers/:id', writeLimiter, v.validate(v.bodySchema), d.updateBody('answer'));
router.delete('/answers/:id', writeLimiter, d.removeDiscussion('answer'));
router.put('/answers/:id/vote', writeLimiter, v.validate(v.voteSchema), d.answerVote);
router.post('/reports', writeLimiter, v.validate(v.reportSchema), a.createReport);
router.use('/admin', roles('admin', 'moderator'));
router.get('/admin/stats', a.adminStats);
router.get('/admin/users', a.listUsers);
router.patch('/admin/users/:id', v.validate(v.userAdminSchema), a.updateUser);
router.patch('/admin/materials/:id', v.validate(v.moderationSchema), a.reviewMaterial);
router.get('/admin/reports', a.listReports);
router.patch('/admin/reports/:id', v.validate(v.resolutionSchema), a.resolveReport);
router.get('/admin/audit', roles('admin'), a.listAudit);
export default router;
