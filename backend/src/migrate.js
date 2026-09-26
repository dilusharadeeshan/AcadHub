import mongoose from 'mongoose';
import { config } from './config/env.js';
import { migrateLegacyUsers } from './services/migration.js';
try {
  if (!config.mongoUri) throw new Error('MONGODB_URI is required.');
  await mongoose.connect(config.mongoUri);
  await migrateLegacyUsers();
  console.log(
    'Legacy profile defaults applied. Existing values, roles, statuses and password hashes were preserved.',
  );
} catch {
  console.error('Migration failed. Check database access.');
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
