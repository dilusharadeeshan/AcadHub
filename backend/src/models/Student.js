import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'moderator', 'admin'], default: 'student' },
    // Existing accounts retain access; registration explicitly sets pending.
    status: { type: String, enum: ['active', 'pending', 'suspended'], default: 'active' },
    department: { type: String, trim: true, maxlength: 100, default: '' },
    batch: { type: String, trim: true, maxlength: 40, default: '' },
    semester: { type: Number, min: 1, max: 12, default: 1 },
    bio: { type: String, maxlength: 500, default: '' },
  },
  { timestamps: true },
);
schema.index({ status: 1, createdAt: -1 });
schema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});
export default mongoose.model('Student', schema);
