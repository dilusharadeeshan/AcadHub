import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { config, production } from './config/env.js';
import { csrfProtection, rejectOperators, apiLimiter } from './middleware/security.js';
import { AppError } from './utils/errors.js';
import authRoutes from './routes/authRoutes.js';
import apiRoutes from './routes/apiRoutes.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.set('X-Request-ID', req.requestId);
    next();
  });
  app.use((req, res, next) => {
    if (production && !req.secure && req.path !== '/api/health')
      return res.status(400).json({ message: 'HTTPS is required.' });
    next();
  });
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-site' },
      contentSecurityPolicy: production ? undefined : false,
    }),
  );
  app.use(
    cors({
      origin: (origin, done) =>
        done(
          !origin || config.origins.includes(origin)
            ? null
            : new AppError(403, 'Origin is not allowed.'),
          true,
        ),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '64kb' }));
  app.use(cookieParser());
  app.get('/api/health', (req, res) =>
    res
      .status(mongoose.connection.readyState === 1 ? 200 : 503)
      .json({ status: mongoose.connection.readyState === 1 ? 'ok' : 'unavailable' }),
  );
  app.use(
    '/api',
    apiLimiter,
    (req, res, next) => {
      res.set('Cache-Control', 'no-store');
      next();
    },
    rejectOperators,
    csrfProtection,
  );
  app.use('/api/auth', authRoutes);
  app.use('/api', apiRoutes);
  app.use('/api', (req, res) => res.status(404).json({ message: 'API endpoint not found.' }));
  const dist = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
  if (existsSync(path.join(dist, 'index.html'))) {
    app.use(express.static(dist, { index: false, maxAge: production ? '1h' : 0 }));
    app.get(/.*/, (req, res) => {
      res.set('Cache-Control', 'no-cache');
      res.sendFile(path.join(dist, 'index.html'));
    });
  } else app.get('/', (req, res) => res.json({ message: 'AcadHub API is running.' }));
  app.use((req, res) => res.status(404).json({ message: 'Page not found.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    let status = error.status || 500,
      message = error.message,
      errors = error.errors;
    if (error.code === 11000) {
      status = 409;
      message = 'This record already exists. Please use a different value.';
      errors = undefined;
    }
    if (error.name === 'VersionError') {
      status = 409;
      message = 'This record changed while you were editing it. Refresh and try again.';
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      status = 400;
      message = 'Please check the submitted values.';
      errors = undefined;
    }
    if (error.name === 'MulterError') {
      status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'File is too large. Choose a smaller file.'
          : 'Upload one file with the required fields.';
    }
    if (['MongoNetworkError', 'MongoServerSelectionError'].includes(error.name)) {
      status = 503;
      message = 'The database is temporarily unavailable. Please try again.';
    }
    if (status >= 500) {
      console.error(JSON.stringify({ requestId: req.requestId, status, errorType: error.name }));
      message = status === 503 ? message : 'Something went wrong. Please try again.';
    }
    res.status(status).json({ message, ...(errors ? { errors } : {}), requestId: req.requestId });
  });
  return app;
}
