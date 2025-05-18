import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    select : false,
    required: true,
  },
  quizAttempts: [{
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    score: Number,
    updatedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

export default mongoose.model('User', userSchema);
