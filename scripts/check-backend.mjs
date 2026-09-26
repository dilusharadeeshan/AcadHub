import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
for (const name of fs
  .readdirSync('backend/src', { recursive: true })
  .filter((n) => n.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', path.join('backend/src', name)], {
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('Backend syntax checks passed.');
