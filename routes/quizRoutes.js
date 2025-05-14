import express from 'express';
import { 
  createQuiz, 
  deleteQuiz, 
  getAllQuizzes, 
  getUserQuizzes,
  generateQuiz
} from '../controllers/quizController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authMiddleware, createQuiz);
router.post('/generate', authMiddleware, generateQuiz);
router.delete('/:id', authMiddleware, deleteQuiz);
router.get('/', getAllQuizzes);
router.get('/user', authMiddleware, getUserQuizzes);

export default router;