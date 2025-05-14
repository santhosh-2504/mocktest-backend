import Quiz from '../models/Quiz.js';
import { generateQuizWithAI } from '../utils/openRouterService.js';
import { formatQuizForStorage } from '../utils/quizUtils.js';

export const createQuiz = async (req, res) => {
  const { topic, level, questions } = req.body;
  try {
    const quiz = await Quiz.create({
      userId: req.user.id,
      topic,
      level,
      questions,
    });
    res.status(201).json({ quiz });
  } catch (err) {
    res.status(500).json({ error: 'Quiz creation failed' });
  }
};

export const generateQuiz = async (req, res) => {
  const { topic, level } = req.body;
  
  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: 'Topic is required' });
  }
  
  if (!['easy', 'medium', 'hard'].includes(level)) {
    return res.status(400).json({ error: 'Valid difficulty level is required (easy, medium, hard)' });
  }
  
  try {
    // Generate quiz questions using OpenRouter AI
    const aiQuizData = await generateQuizWithAI(topic, level);
    
    // Format the quiz data for storage
    const formattedQuiz = formatQuizForStorage(aiQuizData, topic, level);
    
    // Create the quiz in the database
    const quiz = await Quiz.create({
      userId: req.user.id,
      ...formattedQuiz
    });
    
    res.status(201).json({ quiz });
  } catch (err) {
    console.error('Quiz generation error:', err);
    res.status(500).json({ error: err.message || 'Quiz generation failed' });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    if (quiz.userId.toString() !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized' });

    await Quiz.deleteOne({ _id: req.params.id });
    res.json({ message: 'Quiz deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
};

export const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json({ quizzes });
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' });
  }
};

export const getUserQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ userId: req.user.id });
    res.json({ quizzes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user quizzes' });
  }
};