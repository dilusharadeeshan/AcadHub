import mongoose from 'mongoose';
import { drainFileRemovals } from './services/cleanup.js';
import { Guard } from './models/index.js';
import { config, validateConfig } from './config/env.js';
import { createApp } from './app.js';
let server, cleanupTimer;
try {
  validateConfig();
} catch (error) {
  console.error('Configuration error: ' + error.message);
  process.exit(1);
}
try {
  // Request schemas and rejectOperators allow only safe, typed filters.
  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 10000,
    autoIndex: config.env !== 'production',
  });
  await Guard.updateOne(
    { _id: 'admin-access' },
    { $setOnInsert: { version: 0 } },
    { upsert: true },
  );
  cleanupTimer = setInterval(
    () => void drainFileRemovals().catch(() => console.error('File cleanup is unavailable.')),
    60000,
  );
  cleanupTimer.unref();
  server = createApp().listen(config.port, () =>
    console.log('AcadHub listening on port ' + config.port),
  );
} catch (error) {
  console.error(
    'Startup failed (' +
      error.name +
      '). Verify database connectivity and required environment configuration.',
  );
  process.exitCode = 1;
  await mongoose.disconnect();
}
async function shutdown() {
  clearInterval(cleanupTimer);
  const timer = setTimeout(() => process.exit(1), 10000);
  timer.unref();
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  clearTimeout(timer);
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
