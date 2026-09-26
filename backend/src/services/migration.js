import Student from '../models/Student.js';
export async function migrateLegacyUsers() {
  const defaults = {
    role: 'student',
    status: 'active',
    department: '',
    batch: '',
    semester: 1,
    bio: '',
  };
  for (const [field, value] of Object.entries(defaults))
    await Student.updateMany({ [field]: { $exists: false } }, { $set: { [field]: value } });
}
