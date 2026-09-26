import 'dotenv/config';
import path from 'node:path';

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  origins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((v) => v.trim()),
  trustProxy: Number(process.env.TRUST_PROXY || 0),
  storageDriver: process.env.STORAGE_DRIVER || 'local',
  uploadDir: path.resolve(process.env.UPLOAD_DIR || './var/uploads'),
  maxFileSize: Number(process.env.MAX_FILE_MB || 10) * 1024 * 1024,
  clamavHost: process.env.CLAMAV_HOST,
  clamavPort: Number(process.env.CLAMAV_PORT || 3310),
  s3Bucket: process.env.S3_BUCKET,
  s3Region: process.env.S3_REGION || 'us-east-1',
  s3Endpoint: process.env.S3_ENDPOINT,
};
export const production = config.env === 'production';
export const cookieOptions = { httpOnly: true, secure: production, sameSite: 'lax', path: '/' };
export const authCookie = production ? '__Host-acadhub.session' : 'token';
export const csrfCookie = production ? '__Host-acadhub.csrf' : 'acadhub.csrf';
export function validateConfig() {
  if (!config.mongoUri) throw new Error('MONGODB_URI is required.');
  if (!['development', 'test', 'production'].includes(config.env))
    throw new Error('NODE_ENV must be development, test, or production.');
  if (!Number.isInteger(config.trustProxy) || config.trustProxy < 0 || config.trustProxy > 10)
    throw new Error('TRUST_PROXY must be the exact number of trusted proxy hops (0–10).');
  if (!Number.isInteger(config.clamavPort) || config.clamavPort < 1 || config.clamavPort > 65535)
    throw new Error('CLAMAV_PORT must be a valid port.');
  if (production && config.s3Endpoint && new URL(config.s3Endpoint).protocol !== 'https:')
    throw new Error('Production S3_ENDPOINT must use HTTPS.');
  if (!config.jwtSecret || config.jwtSecret.length < 32 || config.jwtSecret.startsWith('replace-'))
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535)
    throw new Error('PORT must be a valid port.');
  if (
    !Number.isFinite(config.maxFileSize) ||
    config.maxFileSize < 1024 ||
    config.maxFileSize > 25 * 1024 * 1024
  )
    throw new Error('MAX_FILE_MB must be between 0.001 and 25.');
  if (!['local', 's3'].includes(config.storageDriver))
    throw new Error('STORAGE_DRIVER must be local or s3.');
  for (const origin of config.origins) {
    const url = new URL(origin);
    if (url.origin !== origin || (production && url.protocol !== 'https:'))
      throw new Error('CLIENT_ORIGIN must list exact origins; production requires HTTPS.');
  }
  if (config.storageDriver === 's3' && !config.s3Bucket)
    throw new Error('S3_BUCKET is required for S3 storage.');
  if (production && (config.storageDriver !== 's3' || !config.clamavHost))
    throw new Error('Production requires private S3 storage and CLAMAV_HOST.');
}
