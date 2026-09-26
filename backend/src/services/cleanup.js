import { FileRemoval } from '../models/index.js';
import { removeFile } from './storage.js';
let running = false;
export async function drainFileRemovals() {
  if (running) return;
  running = true;
  try {
    for (const job of await FileRemoval.find().sort({ createdAt: 1 }).limit(25)) {
      try {
        await removeFile(job.key);
        await FileRemoval.deleteOne({ _id: job._id });
      } catch {
        await FileRemoval.updateOne(
          { _id: job._id },
          { $inc: { attempts: 1 }, $set: { lastAttemptAt: new Date() } },
        );
      }
    }
  } finally {
    running = false;
  }
}
