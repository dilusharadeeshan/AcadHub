// Disposable development/test server. Never uses the configured application database.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'disposable-e2e-secret-with-more-than-32-characters';
process.env.CLIENT_ORIGIN = 'http://127.0.0.1:5100';
process.env.STORAGE_DRIVER = 'local';
process.env.PORT = '5100';
delete process.env.CLAMAV_HOST;
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'acadhub-browser-'));
process.env.UPLOAD_DIR = tmp;
const repl = await MongoMemoryReplSet.create({
  replSet: { count: 1, storageEngine: 'wiredTiger' },
});
process.env.MONGODB_URI = repl.getUri('acadhub_browser_test');
await mongoose.connect(process.env.MONGODB_URI);
const { default: Student } = await import('../src/models/Student.js');
const models = await import('../src/models/index.js');
for (const Model of [Student, ...Object.values(models)]) await Model.init();
await models.Guard.create({ _id: 'admin-access', version: 0 });
const { seedDemo } = await import('../src/services/seedData.js');
await seedDemo('Browser-test-passphrase-42');
const { createApp } = await import('../src/app.js');
const server = createApp().listen(5100, '127.0.0.1', () =>
  console.log('Disposable AcadHub preview ready at http://127.0.0.1:5100'),
);
async function close() {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await repl.stop();
  await fs.rm(tmp, { recursive: true, force: true });
  process.exit(0);
}
process.once('SIGINT', close);
process.once('SIGTERM', close);
