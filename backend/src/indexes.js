import mongoose from 'mongoose';
import { config } from './config/env.js';
import Student from './models/Student.js';
import * as models from './models/index.js';
try {
  if (!config.mongoUri) throw new Error('MONGODB_URI is required.');
  await mongoose.connect(config.mongoUri);
  for (const Model of [Student, ...Object.values(models)]) await Model.createIndexes();
  console.log('Database indexes are ready.');
} catch {
  console.error('Index creation failed. Check database connectivity and index conflicts.');
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
