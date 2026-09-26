export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function assert(condition, status, message) {
  if (!condition) throw new AppError(status, message);
}
export function notFound(value, name = 'Record') {
  assert(value, 404, name + ' not found.');
  return value;
}
export const sameId = (a, b) => String(a?._id || a) === String(b?._id || b);
export const isStaff = (user) => ['admin', 'moderator'].includes(user.role);
export function requireOwner(record, user, allowStaff = false) {
  assert(
    sameId(record.author || record.uploader, user._id) || (allowStaff && isStaff(user)),
    403,
    'You do not have permission to change this content.',
  );
}
