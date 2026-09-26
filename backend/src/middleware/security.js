import { randomBytes, timingSafeEqual } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import { MongoRateLimitStore } from '../services/rateLimitStore.js';
import { config, csrfCookie, cookieOptions } from '../config/env.js';
import { assert } from '../utils/errors.js';
export function issueCsrf(req, res) {
  const token = /^[a-f\d]{64}$/.test(req.cookies[csrfCookie] || '')
    ? req.cookies[csrfCookie]
    : randomBytes(32).toString('hex');
  res.cookie(csrfCookie, token, cookieOptions);
  res.json({ csrfToken: token });
}
export function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  assert(!origin || config.origins.includes(origin), 403, 'This request origin is not allowed.');
  assert(req.get('sec-fetch-site') !== 'cross-site', 403, 'Cross-site requests are not allowed.');
  const cookie = req.cookies[csrfCookie] || '',
    header = req.get('x-csrf-token') || '';
  assert(
    /^[a-f\d]{64}$/.test(header) &&
      cookie.length === header.length &&
      timingSafeEqual(Buffer.from(cookie), Buffer.from(header)),
    403,
    'Security check expired. Refresh the page and try again.',
  );
  next();
}
export function rejectOperators(req, res, next) {
  const inspect = (value, depth = 0) => {
    assert(depth <= 15, 400, 'Request is too deeply nested.');
    if (value && typeof value === 'object')
      for (const [key, child] of Object.entries(value)) {
        assert(
          !key.startsWith('$') &&
            !key.includes('.') &&
            !['__proto__', 'prototype', 'constructor'].includes(key),
          400,
          'Unsupported input key.',
        );
        inspect(child, depth + 1);
      }
  };
  inspect(req.body);
  inspect(req.query);
  next();
}
const limiter = (limit, windowMs, message) =>
  rateLimit({
    limit,
    windowMs,
    store: new MongoRateLimitStore(String(limit) + '-' + windowMs),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message },
  });
export const apiLimiter = limiter(
  600,
  15 * 60 * 1000,
  'Too many requests. Please wait a few minutes.',
);
export const loginLimiter = limiter(
  20,
  15 * 60 * 1000,
  'Too many sign-in attempts. Try again in 15 minutes.',
);
export const uploadLimiter = limiter(
  15,
  60 * 60 * 1000,
  'Upload limit reached. Try again in an hour.',
);
export const writeLimiter = limiter(
  100,
  15 * 60 * 1000,
  'You are posting too quickly. Try again in a few minutes.',
);
