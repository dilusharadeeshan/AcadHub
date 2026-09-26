import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV = 'test';
const { config } = await import('../src/config/env.js');
const { scan, inspectFile } = await import('../src/services/storage.js');
test('text validation rejects executable control bytes and bad encodings', async () => {
  config.clamavHost = undefined;
  for (const buffer of [Buffer.from([0, 2, 3]), Buffer.from([0xff, 0xff])])
    await assert.rejects(
      () => inspectFile({ originalname: 'notes.txt', size: buffer.length, buffer }),
      (e) => e.status === 400,
    );
});
test('scanner fails closed when the configured daemon cannot be reached', async () => {
  config.clamavHost = '127.0.0.1';
  config.clamavPort = 1;
  await assert.rejects(
    () => scan(Buffer.from('test')),
    (e) => e.status === 503,
  );
  config.clamavHost = undefined;
});
