import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a notice title'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide notice content'],
      trim: true,
    },
    category: {
  type: String,
  required: [true, 'Please select a notice category'],
  enum: ['general', 'ca','exam', 'academic', 'event'],
  lowercase: true,
  trim: true,
},
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student', // link with user collection
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Notice = mongoose.model('Notice', noticeSchema);

export default Notice;
