import { test } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
process.env.NODE_ENV = 'test';
const { config } = await import('../src/config/env.js');
const { scan } = await import('../src/services/storage.js');
test('ClamAV stream protocol accepts clean results and rejects detections and scanner failures', async () => {
  let response = 'stream: OK\0',
    received;
  const server = net.createServer((socket) => {
    let data = Buffer.alloc(0);
    socket.on('data', (chunk) => {
      data = Buffer.concat([data, chunk]);
      if (data.subarray(-4).equals(Buffer.alloc(4))) {
        received = data;
        socket.end(response);
      }
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  config.clamavHost = '127.0.0.1';
  config.clamavPort = server.address().port;
  try {
    await scan(Buffer.from('original text'));
    assert.equal(received.subarray(0, 10).toString(), 'zINSTREAM\0');
    response = 'stream: TestSignature FOUND\0';
    await assert.rejects(
      () => scan(Buffer.from('test')),
      (e) => e.status === 400,
    );
    response = 'stream: scanner ERROR\0';
    await assert.rejects(
      () => scan(Buffer.from('test')),
      (e) => e.status === 503,
    );
  } finally {
    config.clamavHost = undefined;
    await new Promise((resolve) => server.close(resolve));
  }
});
