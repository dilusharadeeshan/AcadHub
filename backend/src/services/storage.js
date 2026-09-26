import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { fileTypeFromBuffer } from 'file-type';
import { config, production } from '../config/env.js';
import { assert, AppError } from '../utils/errors.js';

const s3 = new S3Client({
  region: config.s3Region,
  ...(config.s3Endpoint ? { endpoint: config.s3Endpoint, forcePathStyle: true } : {}),
});
const allowed = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  txt: 'text/plain',
};
export async function inspectFile(file) {
  assert(file && file.size > 0, 400, 'Choose a non-empty file.');
  assert(file.size <= config.maxFileSize, 413, 'The file exceeds the upload size limit.');
  const extension = path.extname(file.originalname).slice(1).toLowerCase();
  assert(allowed[extension], 400, 'Allowed files: PDF, PNG, JPEG and plain UTF-8 text.');
  let detected;
  try {
    detected = await fileTypeFromBuffer(file.buffer);
  } catch {
    throw new AppError(400, 'This file is damaged or unsupported.');
  }
  if (extension === 'txt') {
    let content;
    try {
      content = new TextDecoder('utf-8', { fatal: true }).decode(file.buffer);
    } catch {
      throw new AppError(400, 'Text files must use UTF-8 encoding.');
    }
    assert(
      !detected && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(content),
      400,
      'This is not a plain-text file.',
    );
  } else
    assert(
      detected?.mime === allowed[extension],
      400,
      'The file contents do not match its extension.',
    );
  await scan(file.buffer);
  return {
    name: path
      .basename(file.originalname)
      .replace(/[^\p{L}\p{N} ._()-]/gu, '_')
      .slice(-160),
    mime: allowed[extension],
    size: file.size,
    hash: createHash('sha256').update(file.buffer).digest('hex'),
  };
}
export async function scan(buffer) {
  if (!config.clamavHost) {
    assert(!production, 503, 'File scanning is unavailable.');
    return;
  }
  await new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: config.clamavHost, port: config.clamavPort });
    let response = '',
      finished = false;
    const finish = (error) => {
      if (finished) return;
      finished = true;
      socket.destroy();
      error ? reject(error) : resolve();
    };
    socket.setTimeout(30000, () =>
      finish(new AppError(503, 'File scan timed out. Try again later.')),
    );
    socket.on('error', () =>
      finish(new AppError(503, 'File scanning is unavailable. Try again later.')),
    );
    socket.on('data', (chunk) => {
      response += chunk.toString();
      if (response.length > 4096) return finish(new AppError(503, 'Invalid scanner response.'));
      if (response.includes('\0') || response.includes('\n')) {
        if (response.includes(' FOUND'))
          finish(new AppError(400, 'The security scan rejected this file.'));
        else if (/: OK[\0\n]/.test(response)) finish();
        else finish(new AppError(503, 'File scanning failed. Try again later.'));
      }
    });
    socket.on('end', () => {
      if (!finished) finish(new AppError(503, 'Incomplete scanner response.'));
    });
    socket.on('connect', () => {
      socket.write('zINSTREAM\0');
      for (let offset = 0; offset < buffer.length; offset += 65536) {
        const chunk = buffer.subarray(offset, offset + 65536),
          length = Buffer.alloc(4);
        length.writeUInt32BE(chunk.length);
        socket.write(length);
        socket.write(chunk);
      }
      socket.write(Buffer.alloc(4));
    });
  });
}
function diskPath(key) {
  assert(/^[a-f\d-]{36}$/.test(key), 500, 'Invalid stored file reference.');
  return path.join(config.uploadDir, key);
}
export async function storeFile(buffer, metadata) {
  const key = randomUUID();
  if (config.storageDriver === 's3')
    await s3.send(
      new PutObjectCommand({
        Bucket: config.s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: metadata.mime,
        ServerSideEncryption: 'AES256',
      }),
    );
  else {
    await fs.mkdir(config.uploadDir, { recursive: true });
    await fs.writeFile(diskPath(key), buffer, { flag: 'wx', mode: 0o600 });
  }
  return { ...metadata, key };
}
export async function removeFile(key) {
  if (!key) return;
  if (config.storageDriver === 's3')
    await s3.send(new DeleteObjectCommand({ Bucket: config.s3Bucket, Key: key }));
  else await fs.rm(diskPath(key), { force: true });
}
export async function readFile(key) {
  if (config.storageDriver === 's3')
    return (await s3.send(new GetObjectCommand({ Bucket: config.s3Bucket, Key: key }))).Body;
  await fs.access(diskPath(key));
  return createReadStream(diskPath(key));
}
