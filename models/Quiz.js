import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: String,
  options: [String],
  correctOption: Number, // 1-based index
  explanation: String, // Added explanation field
});

const quizSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  topic: String,
  level: String,
  questions: [questionSchema],
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);
