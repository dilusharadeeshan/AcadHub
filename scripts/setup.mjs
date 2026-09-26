import fs from 'node:fs';
import crypto from 'node:crypto';
const target = 'backend/.env';
if (!fs.existsSync(target)) {
  const template = fs
    .readFileSync('backend/.env.example', 'utf8')
    .replace(
      'replace-with-a-unique-random-secret-at-least-32-characters',
      crypto.randomBytes(48).toString('base64url'),
    );
  fs.writeFileSync(target, template, { mode: 0o600 });
  console.log(
    'Created backend/.env with a fresh secret. Configure your MongoDB connection and initial administrator.',
  );
} else
  console.log(
    'Preserved existing backend/.env. Compare it with backend/.env.example for new required settings.',
  );
if (!fs.existsSync('frontend/.env')) fs.copyFileSync('frontend/.env.example', 'frontend/.env');
console.log('Next: configure backend/.env, start MongoDB, run npm run seed, then npm run dev.');
