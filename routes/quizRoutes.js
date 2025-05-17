// import express from 'express';
// import { 
//   createQuiz, 
//   deleteQuiz, 
//   getAllQuizzes, 
//   getUserQuizzes,
//   generateQuiz
// } from '../controllers/quizController.js';
// import authMiddleware from '../middleware/auth.js';

// const router = express.Router();

// router.post('/create', authMiddleware, createQuiz);
// router.post('/generate', authMiddleware, generateQuiz);
// router.delete('/:id', authMiddleware, deleteQuiz);
// router.get('/', getAllQuizzes);
// router.get('/user', authMiddleware, getUserQuizzes);

// export default router;

import express from 'express';
import { 
  createQuiz, 
  generateQuiz, 
  getAllQuizzes, 
  getUserQuizzes, 
  deleteQuiz,
  getQuizTitles,
  upload
} from '../controllers/quizController.js';
import authMiddleware from '../middleware/auth.js';


const router = express.Router();


// Quiz generation route with file upload support
router.post('/generate', upload.single('image'), authMiddleware, generateQuiz);

// Standard CRUD routes
router.post('/create', authMiddleware, createQuiz);
router.get('/', getAllQuizzes);
router.get('/user', authMiddleware, getUserQuizzes);
router.delete('/:id', authMiddleware, deleteQuiz);
router.get('/titles', getQuizTitles); // New endpoint for quiz titles

export default router;