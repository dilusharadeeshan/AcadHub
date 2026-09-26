import { createHash } from 'node:crypto';
import { RequestLimit } from '../models/index.js';
// Shared fixed windows work consistently across server processes. IP addresses are not stored in plaintext.
export class MongoRateLimitStore {
  localKeys = false;
  constructor(prefix) {
    this.prefix = prefix;
  }
  init(options) {
    this.windowMs = options.windowMs;
  }
  id(key) {
    return this.prefix + ':' + createHash('sha256').update(key).digest('hex');
  }
  async increment(key) {
    const now = new Date(),
      expired = { $lte: [{ $ifNull: ['$resetTime', new Date(0)] }, now] };
    const update = [
      {
        $set: {
          hits: { $cond: [expired, 1, { $add: [{ $ifNull: ['$hits', 0] }, 1] }] },
          resetTime: { $cond: [expired, new Date(now.getTime() + this.windowMs), '$resetTime'] },
        },
      },
    ];
    let record;
    try {
      record = await RequestLimit.findOneAndUpdate({ _id: this.id(key) }, update, {
        upsert: true,
        returnDocument: 'after',
        updatePipeline: true,
      }).lean();
    } catch (error) {
      if (error.code !== 11000) throw error;
      record = await RequestLimit.findOneAndUpdate({ _id: this.id(key) }, update, {
        returnDocument: 'after',
        updatePipeline: true,
      }).lean();
    }
    return { totalHits: record.hits, resetTime: record.resetTime };
  }
  async decrement(key) {
    await RequestLimit.updateOne({ _id: this.id(key), hits: { $gt: 0 } }, { $inc: { hits: -1 } });
  }
  async resetKey(key) {
    await RequestLimit.deleteOne({ _id: this.id(key) });
  }
}
