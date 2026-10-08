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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // User collection එකත් එක්ක link කිරීම
      required: true,
    },
  },
  {
    timestamps: true, // මේකෙන් createdAt සහ updatedAt auto generate වෙනවා
  }
);

const Notice = mongoose.model('Notice', noticeSchema);

export default Notice;
