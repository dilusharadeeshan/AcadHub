import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
process.env.NODE_ENV = 'test';
process.env.STORAGE_DRIVER = 's3';
process.env.S3_BUCKET = 'private-test';
process.env.S3_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
test('S3 adapter writes encrypted private objects and streams and deletes the same key', async () => {
  const objects = new Map();
  let putHeaders;
  const server = http.createServer((req, res) => {
    const key = new URL(req.url, 'http://local').pathname;
    if (req.method === 'PUT') {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        objects.set(key, Buffer.concat(chunks));
        putHeaders = req.headers;
        res.setHeader('ETag', '"test"');
        res.end();
      });
    } else if (req.method === 'GET') {
      const data = objects.get(key);
      if (!data) {
        res.statusCode = 404;
        res.end();
        return;
      }
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Length', data.length);
      res.end(data);
    } else if (req.method === 'DELETE') {
      objects.delete(key);
      res.statusCode = 204;
      res.end();
    } else {
      res.statusCode = 405;
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  process.env.S3_ENDPOINT = 'http://127.0.0.1:' + server.address().port;
  const { storeFile, readFile, removeFile } = await import('../src/services/storage.js');
  try {
    const buffer = Buffer.from('private S3 test document'),
      file = await storeFile(buffer, {
        name: 'notes.txt',
        mime: 'text/plain',
        size: buffer.length,
        hash: 'test',
      });
    assert.match(file.key, /^[a-f0-9-]{36}$/);
    assert.equal(putHeaders['x-amz-server-side-encryption'], 'AES256');
    assert.equal(putHeaders['x-amz-acl'], undefined);
    let content = '';
    for await (const chunk of await readFile(file.key)) content += chunk.toString();
    assert.match(content, /private S3 test document/);
    await removeFile(file.key);
    assert.equal(objects.size, 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
