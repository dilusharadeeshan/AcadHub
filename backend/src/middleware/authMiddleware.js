import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import { Session } from '../models/index.js';
import { authCookie, config } from '../config/env.js';
import { AppError, assert } from '../utils/errors.js';

export async function protect(req, res, next) {
  const token = req.cookies[authCookie];
  assert(token, 401, 'Please sign in to continue.');
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'acadhub',
      audience: 'acadhub-web',
    });
  } catch {
    throw new AppError(401, 'Your session has expired. Please sign in again.');
  }
  assert(
    /^[a-f\d]{24}$/i.test(decoded.sid || '') && /^[a-f\d]{24}$/i.test(decoded.studentId || ''),
    401,
    'Invalid session.',
  );
  const [session, user] = await Promise.all([
    Session.findOne({ _id: decoded.sid, user: decoded.studentId, expiresAt: { $gt: new Date() } }),
    Student.findById(decoded.studentId),
  ]);
  assert(session && user, 401, 'Your session has ended. Please sign in again.');
  assert(
    user.status !== 'suspended',
    403,
    'Your account is suspended. Contact your administrator.',
  );
  req.user = user;
  req.studentId = user._id;
  req.session = session;
  next();
}
export function active(req, res, next) {
  assert(req.user.status === 'active', 403, 'Your account is waiting for administrator approval.');
  next();
}
export const roles =
  (...allowed) =>
  (req, res, next) => {
    assert(
      allowed.includes(req.user.role),
      403,
      'You do not have permission to access this feature.',
    );
    next();
  };
