import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { config } from './config/env.js';
import Student from './models/Student.js';
import { Audit, Session } from './models/index.js';
try {
  const email = process.env.ACCOUNT_EMAIL?.trim().toLowerCase(),
    password = process.env.ACCOUNT_NEW_PASSWORD;
  if (!email || !password || password.length < 14 || Buffer.byteLength(password) > 72)
    throw new Error('Set ACCOUNT_EMAIL and a 14–72-byte ACCOUNT_NEW_PASSWORD.');
  await mongoose.connect(config.mongoUri);
  const actor = await Student.findOne({
    email: process.env.ADMIN_EMAIL?.trim().toLowerCase(),
    role: 'admin',
    status: 'active',
  });
  if (!actor) throw new Error('ADMIN_EMAIL must identify an active administrator.');
  const user = await Student.findOne({ email });
  if (!user) throw new Error('Account not found.');
  await mongoose.connection.transaction(async (session) => {
    user.password = await bcrypt.hash(password, 12);
    await user.save({ session });
    await Session.deleteMany({ user: user._id }, { session });
    await Audit.create(
      [
        {
          actor: actor._id,
          action: 'user.password_reset',
          targetType: 'user',
          targetId: user._id,
          details: 'Server maintenance operator reset password after identity verification.',
        },
      ],
      { session },
    );
  });
  console.log(
    'Password updated and sessions revoked. Deliver credentials through your institution’s secure channel.',
  );
} catch (error) {
  console.error('Maintenance failed: ' + error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
