import mongoose from 'mongoose';
import { migrateLegacyUsers } from './services/migration.js';
import bcrypt from 'bcrypt';
import { config, validateConfig, production } from './config/env.js';
import Student from './models/Student.js';
import { Audit, Guard } from './models/index.js';
import { seedSubjects, seedDemo } from './services/seedData.js';
try {
  validateConfig();
  await mongoose.connect(config.mongoUri);
  await Guard.updateOne(
    { _id: 'admin-access' },
    { $setOnInsert: { version: 0 } },
    { upsert: true },
  );
  await migrateLegacyUsers();
  await seedSubjects();
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    if (
      process.env.ADMIN_PASSWORD.length < 14 ||
      Buffer.byteLength(process.env.ADMIN_PASSWORD) > 72
    )
      throw new Error('ADMIN_PASSWORD must contain 14–72 UTF-8 bytes.');
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('ADMIN_EMAIL must be valid.');
    const existing = await Student.findOne({ email });
    if (existing && existing.role !== 'admin')
      throw new Error(
        'This email belongs to a non-admin account. Use an existing administrator to change access.',
      );
    if (!existing) {
      const user = await Student.create({
        name: process.env.ADMIN_NAME || 'AcadHub Administrator',
        email,
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
        role: 'admin',
        status: 'active',
        department: process.env.DEPARTMENT || 'Computer Science',
        batch: 'Staff',
      });
      await Audit.create({
        actor: user._id,
        action: 'admin.bootstrapped',
        targetType: 'user',
        targetId: user._id,
        details: 'Administrator created through deployment seed command.',
      });
    }
  }
  if (process.env.SEED_DEMO === 'true') {
    if (production) throw new Error('Demo accounts are prohibited in production.');
    await seedDemo(process.env.DEMO_PASSWORD);
  }
  console.log('Seed completed. Existing accounts, passwords and content were preserved.');
} catch (error) {
  console.error('Seed failed: ' + error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
