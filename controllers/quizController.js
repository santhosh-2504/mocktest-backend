// import Quiz from '../models/Quiz.js';
// import { generateQuizWithAI, uploadImageToCloudinary } from '../utils/openRouterService.js';
// import { formatQuizForStorage } from '../utils/quizUtils.js';
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import { v4 as uuidv4 } from 'uuid';

// // Configure multer for file upload handling
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = './tmp/uploads';
//     // Create directory if it doesn't exist
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     // Generate unique filename with original extension
//     const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
//     cb(null, uniqueFilename);
//   }
// });

// // Configure file filter to only accept images
// const fileFilter = (req, file, cb) => {
//   // Accept only image files
//   if (file.mimetype.startsWith('image/')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed!'), false);
//   }
// };

// // Configure multer upload
// export const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB max file size
// });

// export const createQuiz = async (req, res) => {
//   const { topic, level, questions } = req.body;
//   try {
//     const quiz = await Quiz.create({
//       userId: req.user.id,
//       topic,
//       level,
//       questions,
//     });
//     res.status(201).json({ quiz });
//   } catch (err) {
//     console.error('Quiz creation error:', err);
//     res.status(500).json({ error: 'Quiz creation failed' });
//   }
// };

// export const generateQuiz = async (req, res) => {
//   try {
//     let { topic, level } = req.body;
//     let imageUrl = null;
    
//     // Basic validation
//     if (!topic && !req.file) {
//       return res.status(400).json({ error: 'Either topic or image is required' });
//     }
    
//     topic = topic || 'Generated from Image'; // Default topic if only image is provided
    
//     if (!['easy', 'medium', 'hard'].includes(level)) {
//       return res.status(400).json({ error: 'Valid difficulty level is required (easy, medium, hard)' });
//     }
    
//     // Process image if provided
//     if (req.file) {
//       try {
//         // Upload to Cloudinary
//         imageUrl = await uploadImageToCloudinary(req.file.path);
//       } catch (error) {
//         console.error('Image upload error:', error);
//         return res.status(500).json({ error: 'Failed to process image' });
//       }
//     }
    
//     // Generate quiz questions using OpenRouter AI with image context
//     const aiQuizData = await generateQuizWithAI(topic, level, imageUrl);
    
//     // Format the quiz data for storage (match your schema)
//     const formattedQuiz = formatQuizForStorage(aiQuizData, topic, level);
    
//     // Create the quiz in the database
//     // Note: We're not storing imageUrl in the database since it's not in your schema
//     // The image is only used for quiz generation
//     const quiz = await Quiz.create({
//       userId: req.user.id,
//       ...formattedQuiz
//     });
    
//     res.status(201).json({ quiz });
//   } catch (err) {
//     console.error('Quiz generation error:', err);
//     res.status(500).json({ error: err.message || 'Quiz generation failed' });
//   }
// };

// export const deleteQuiz = async (req, res) => {
//   try {
//     const quiz = await Quiz.findById(req.params.id);
//     if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

//     if (quiz.userId.toString() !== req.user.id)
//       return res.status(403).json({ error: 'Unauthorized' });

//     await Quiz.deleteOne({ _id: req.params.id });
//     res.json({ message: 'Quiz deleted' });
//   } catch (err) {
//     res.status(500).json({ error: 'Delete failed' });
//   }
// };

// export const getAllQuizzes = async (req, res) => {
//   try {
//     const quizzes = await Quiz.find();
//     res.json({ quizzes });
//   } catch (err) {
//     res.status(500).json({ error: 'Fetch failed' });
//   }
// };

// export const getUserQuizzes = async (req, res) => {
//   try {
//     const quizzes = await Quiz.find({ userId: req.user.id });
//     res.json({ quizzes });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch user quizzes' });
//   }
// };

import Quiz from '../models/Quiz.js';
import { generateQuizWithAI, generateTopicWithAI, askAI, uploadImageToCloudinary } from '../utils/openRouterService.js';
import { formatQuizForStorage } from '../utils/quizUtils.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for file upload handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './tmp/uploads';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Configure file filter to only accept images
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer upload
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max file size
});

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
    console.error('Quiz creation error:', err);
    res.status(500).json({ error: 'Quiz creation failed' });
  }
};

export const generateQuiz = async (req, res) => {
  try {
    let { topic, level } = req.body;
    let imageUrl = null;
    let autoGeneratedTopic = false;
    
    // Basic validation
    if (!topic && !req.file) {
      return res.status(400).json({ error: 'Either topic or image is required' });
    }
    
    if (!['easy', 'medium', 'hard'].includes(level)) {
      return res.status(400).json({ error: 'Valid difficulty level is required (easy, medium, hard)' });
    }
    
    // Process image if provided
    if (req.file) {
      try {
        // Upload to Cloudinary
        imageUrl = await uploadImageToCloudinary(req.file.path);
      } catch (error) {
        console.error('Image upload error:', error);
        return res.status(500).json({ error: 'Failed to process image' });
      }
    }
    
    // Generate AI topic if image is provided or if requested
    if (imageUrl || !topic || topic.trim() === '') {
      autoGeneratedTopic = true;
      const providedTopic = topic || '';
      // Use the image or provided topic hint to generate an appropriate topic name
      topic = await generateTopicWithAI(providedTopic, imageUrl);
    }
    
    // Generate quiz questions using OpenRouter AI with image context
    const aiQuizData = await generateQuizWithAI(topic, level, imageUrl);
    
    // Format the quiz data for storage
    const formattedQuiz = formatQuizForStorage(aiQuizData, topic, level);
    
    // Create the quiz in the database
    const quiz = await Quiz.create({
      userId: req.user.id,
      ...formattedQuiz
    });
    
    res.status(201).json({ 
      quiz,
      autoGeneratedTopic // Include flag to inform client if topic was auto-generated
    });
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
    // Fetch all quizzes in descending order based on the creation date
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.json({ quizzes });
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' });
  }
};

export const getUserQuizzes = async (req, res) => {
  try {
    // Fetch quizzes created by the authenticated user in descending order
    // based on the creation date
    const quizzes = await Quiz.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ quizzes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user quizzes' });
  }
};

export const getQuizTitles = async (req, res) => {
  try {
    // Only fetch the topic field and _id for all quizzes
    const quizTitles = await Quiz.find({}, 'topic _id');
    res.json({ quizTitles });
  } catch (err) {
    console.error('Error fetching quiz titles:', err);
    res.status(500).json({ error: 'Failed to fetch quiz titles' });
  }
};

export const askAIAboutQuestion = async (req, res) => {
  try {
    const { questionText, options, explanation } = req.body;

    // Basic validation
    if (!questionText || !options || !explanation) {
      return res.status(400).json({ error: 'Question text, options, and explanation are required' });
    }

    // Call OpenRouter service to get AI response
    const aiResponse = await askAI(questionText, options, explanation);

    res.status(200).json({ aiResponse });
  } catch (err) {
    console.error('AI question query error:', err);
    res.status(500).json({ error: err.message || 'Failed to process AI query' });
  }
};