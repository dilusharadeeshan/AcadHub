import { Router } from 'express';
import {
  registerStudent,
  loginStudent,
  getProfile,
  logoutStudent,
  updateProfile,
  changePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { issueCsrf, loginLimiter } from '../middleware/security.js';
import {
  validate,
  registrationSchema,
  loginSchema,
  profileSchema,
  passwordSchema,
} from '../utils/validation.js';
const router = Router();
router.get('/csrf', issueCsrf);
router.post('/register', loginLimiter, validate(registrationSchema), registerStudent);
router.post('/login', loginLimiter, validate(loginSchema), loginStudent);
router.post('/logout', logoutStudent);
router.get('/profile', protect, getProfile);
router.patch('/profile', protect, validate(profileSchema), updateProfile);
router.put('/password', loginLimiter, protect, validate(passwordSchema), changePassword);
export default router;
