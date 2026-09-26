import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import { Session } from '../models/index.js';
import { config, authCookie, cookieOptions } from '../config/env.js';
import { assert } from '../utils/errors.js';
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  department: user.department,
  batch: user.batch,
  semester: user.semester,
  bio: user.bio,
  createdAt: user.createdAt,
});
export async function registerStudent(req, res) {
  const { agreeToPolicy, ...input } = req.input;
  const user = await Student.create({
    ...input,
    status: 'pending',
    role: 'student',
    password: await bcrypt.hash(input.password, 12),
  });
  res.status(201).json({
    message: 'Account created. Sign in to track your administrator approval.',
    user: publicUser(user),
  });
}
export async function loginStudent(req, res) {
  const { email, password, remember } = req.input;
  const user = await Student.findOne({ email }).select('+password');
  // Use a real bcrypt hash even when an account is absent.
  const valid = await bcrypt.compare(
    password,
    user?.password || '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxKKMXBRVLtnEcmMCGJnqiZNnOa',
  );
  assert(user && valid, 401, 'Invalid email or password.');
  assert(
    user.status !== 'suspended',
    403,
    'Your account is suspended. Contact your administrator.',
  );
  const lifetime = (remember ? 7 : 1) * 24 * 60 * 60;
  const session = await Session.create({
    user: user._id,
    expiresAt: new Date(Date.now() + lifetime * 1000),
  });
  const token = jwt.sign(
    { studentId: user._id.toString(), sid: session._id.toString() },
    config.jwtSecret,
    { algorithm: 'HS256', expiresIn: lifetime, issuer: 'acadhub', audience: 'acadhub-web' },
  );
  res.cookie(authCookie, token, {
    ...cookieOptions,
    ...(remember ? { maxAge: lifetime * 1000 } : {}),
  });
  res.json({ message: 'Welcome back.', user: publicUser(user) });
}
export async function getProfile(req, res) {
  res.json({ user: publicUser(req.user) });
}
export async function updateProfile(req, res) {
  Object.assign(req.user, req.input);
  await req.user.save();
  res.json({ message: 'Profile updated.', user: publicUser(req.user) });
}
export async function changePassword(req, res) {
  const user = await Student.findById(req.user._id).select('+password');
  assert(
    await bcrypt.compare(req.input.currentPassword, user.password),
    400,
    'Current password is incorrect.',
  );
  user.password = await bcrypt.hash(req.input.password, 12);
  await user.save();
  await Session.deleteMany({ user: user._id });
  res.clearCookie(authCookie, cookieOptions);
  res.json({ message: 'Password changed. Please sign in again.' });
}
export async function logoutStudent(req, res) {
  const token = req.cookies[authCookie];
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret, {
        algorithms: ['HS256'],
        issuer: 'acadhub',
        audience: 'acadhub-web',
      });
      await Session.deleteOne({ _id: payload.sid, user: payload.studentId });
    } catch (error) {
      if (!['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name))
        throw error;
    }
  }
  res.clearCookie(authCookie, cookieOptions);
  res.json({ message: 'You have signed out.' });
}
