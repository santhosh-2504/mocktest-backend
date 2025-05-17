
// /**
//  * OpenRouter API service for AI-powered quiz generation with image support
//  */
// import dotenv from 'dotenv';
// dotenv.config({ path: './config/config.env' });
// import axios from 'axios';
// import { generateQuizPrompt, parseQuizResponse } from './quizUtils.js';
// import cloudinary from './cloudinaryConfig.js';
// import { promises as fs } from 'fs';
// import path from 'path';

// // OpenRouter configuration
// const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
// const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY; // Should be set in your environment
// const DEFAULT_MODEL = 'opengvlab/internvl3-14b:free'; // High capability model for generating quality quizzes

// /**
//  * Uploads an image to Cloudinary
//  * @param {string} imagePath - Local path to the image file
//  * @returns {Promise<string>} The Cloudinary URL of the uploaded image
//  * @throws {Error} If upload fails
//  */
// export const uploadImageToCloudinary = async (imagePath) => {
//   try {
//     const result = await cloudinary.uploader.upload(imagePath, {
//       folder: 'quiz_images',
//       resource_type: 'image'
//     });
    
//     // Delete the local file after successful upload
//     try {
//       await fs.unlink(imagePath);
//     } catch (error) {
//       console.warn('Failed to delete local image:', error);
//       // Non-critical error, continue execution
//     }
    
//     return result.secure_url;
//   } catch (error) {
//     console.error('Cloudinary upload error:', error);
//     throw new Error('Failed to upload image to cloud storage');
//   }
// };

// /**
//  * Calls the OpenRouter API to generate quiz questions based on provided topic, level, and optionally an image
//  * @param {string} topic - The topic for the quiz
//  * @param {string} level - The difficulty level (easy, medium, hard)
//  * @param {string} [imageUrl] - Optional Cloudinary URL of an image for context
//  * @returns {Promise<Object>} The parsed quiz data
//  * @throws {Error} If generation fails
//  */
// export const generateQuizWithAI = async (topic, level, imageUrl = null) => {
//   try {
//     if (!OPENROUTER_API_KEY) {
//       throw new Error('OpenRouter API key is not configured');
//     }

//     // Create message payload
//     const messages = [
//       { 
//         role: 'system', 
//         content: 'You are a quiz question generator assistant. Generate well-formatted, valid JSON quiz questions on the requested topic.'
//       }
//     ];

//     // Add user message with or without image
//     if (imageUrl) {
//       // With image
//       messages.push({
//         role: 'user',
//         content: [
//           { type: 'text', text: generateQuizPrompt(topic, level) },
//           { type: 'image_url', image_url: { url: imageUrl } }
//         ]
//       });
//     } else {
//       // Without image
//       messages.push({
//         role: 'user',
//         content: generateQuizPrompt(topic, level)
//       });
//     }

//     // Make the API request
//     const response = await axios.post(
//       OPENROUTER_API_URL,
//       {
//         model: DEFAULT_MODEL,
//         messages,
//         temperature: 0.7,
//         max_tokens: 4000,
//         response_format: { type: 'json_object' }  // Ensure JSON response if model supports it
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );

//     // Extract the response content with additional error checking
//     const aiResponse = response.data?.choices?.[0]?.message?.content;
    
//     if (!aiResponse) {
//       throw new Error('Invalid or empty response from OpenRouter API');
//     }

//     // Parse and validate the response
//     let parsedQuiz;
//     try {
//       parsedQuiz = parseQuizResponse(aiResponse);
//     } catch (error) {
//       console.error('JSON parsing error:', error);
//       throw new Error('Failed to parse AI response as valid JSON');
//     }
    
//     if (!parsedQuiz) {
//       throw new Error('Failed to parse quiz data from AI response');
//     }

//     return parsedQuiz;
//   } catch (error) {
//     console.error('AI Quiz Generation Error:', error);
//     // Provide more specific error messages based on error type
//     if (error.response?.status === 401) {
//       throw new Error('API authentication failed. Please check your OpenRouter API key.');
//     } else if (error.response?.status === 429) {
//       throw new Error('API rate limit exceeded. Please try again later.');
//     } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
//       throw new Error('Failed to connect to OpenRouter. Please check your internet connection.');
//     }
    
//     throw new Error(error.response?.data?.error || error.message || 'Failed to generate quiz questions');
//   }
// };

/**
 * OpenRouter API service for AI-powered quiz generation with image support
 */
import dotenv from 'dotenv';
dotenv.config({ path: './config/config.env' });
import axios from 'axios';
import { generateQuizPrompt, parseQuizResponse, generateTopicPrompt } from './quizUtils.js';
import cloudinary from './cloudinaryConfig.js';
import { promises as fs } from 'fs';
import path from 'path';

// OpenRouter configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY; // Should be set in your environment
const DEFAULT_MODEL = 'opengvlab/internvl3-14b:free'; // High capability model for generating quality quizzes

/**
 * Uploads an image to Cloudinary
 * @param {string} imagePath - Local path to the image file
 * @returns {Promise<string>} The Cloudinary URL of the uploaded image
 * @throws {Error} If upload fails
 */
export const uploadImageToCloudinary = async (imagePath) => {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'quiz_images',
      resource_type: 'image'
    });
    
    // Delete the local file after successful upload
    try {
      await fs.unlink(imagePath);
    } catch (error) {
      console.warn('Failed to delete local image:', error);
      // Non-critical error, continue execution
    }
    
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to cloud storage');
  }
};

/**
 * Generates an appropriate topic name based on an image and/or topic hint
 * @param {string} topicHint - Optional user-provided topic hint
 * @param {string} imageUrl - Optional Cloudinary URL of an image
 * @returns {Promise<string>} Generated topic name
 * @throws {Error} If generation fails
 */
export const generateTopicWithAI = async (topicHint = '', imageUrl = null) => {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is not configured');
    }

    // Create message payload
    const messages = [
      { 
        role: 'system', 
        content: 'You are an intelligent topic generator. Generate a concise, specific, and descriptive topic name.'
      }
    ];

    // Add user message with or without image
    if (imageUrl) {
      // With image
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: generateTopicPrompt(topicHint) },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      });
    } else {
      // Without image, but with topic hint
      messages.push({
        role: 'user',
        content: generateTopicPrompt(topicHint)
      });
    }

    // Make the API request
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: DEFAULT_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 100, // Topic generation needs fewer tokens
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract the response content
    const aiResponse = response.data?.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('Invalid or empty response from OpenRouter API');
    }

    // Clean up the topic (remove quotes, newlines, etc.)
    let generatedTopic = aiResponse.trim()
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^Topic:\s*/i, '') // Remove "Topic:" prefix if present
      .trim();
      
    // If nothing valid was generated, provide a default
    if (!generatedTopic) {
      return topicHint || 'General Knowledge Quiz';
    }

    return generatedTopic;
  } catch (error) {
    console.error('Topic Generation Error:', error);
    // Fallback to provided hint or default
    return topicHint || 'General Knowledge Quiz';
  }
};

/**
 * Calls the OpenRouter API to generate quiz questions based on provided topic, level, and optionally an image
 * @param {string} topic - The topic for the quiz
 * @param {string} level - The difficulty level (easy, medium, hard)
 * @param {string} [imageUrl] - Optional Cloudinary URL of an image for context
 * @returns {Promise<Object>} The parsed quiz data
 * @throws {Error} If generation fails
 */
export const generateQuizWithAI = async (topic, level, imageUrl = null) => {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is not configured');
    }

    // Create message payload
    const messages = [
      { 
        role: 'system', 
        content: 'You are a quiz question generator assistant. Generate well-formatted, valid JSON quiz questions on the requested topic. Each question must include an explanation for the correct answer.'
      }
    ];

    // Add user message with or without image
    if (imageUrl) {
      // With image
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: generateQuizPrompt(topic, level) },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      });
    } else {
      // Without image
      messages.push({
        role: 'user',
        content: generateQuizPrompt(topic, level)
      });
    }

    // Make the API request
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: DEFAULT_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }  // Ensure JSON response if model supports it
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract the response content with additional error checking
    const aiResponse = response.data?.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('Invalid or empty response from OpenRouter API');
    }

    // Parse and validate the response
    let parsedQuiz;
    try {
      parsedQuiz = parseQuizResponse(aiResponse);
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error('Failed to parse AI response as valid JSON');
    }
    
    if (!parsedQuiz) {
      throw new Error('Failed to parse quiz data from AI response');
    }

    return parsedQuiz;
  } catch (error) {
    console.error('AI Quiz Generation Error:', error);
    // Provide more specific error messages based on error type
    if (error.response?.status === 401) {
      throw new Error('API authentication failed. Please check your OpenRouter API key.');
    } else if (error.response?.status === 429) {
      throw new Error('API rate limit exceeded. Please try again later.');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error('Failed to connect to OpenRouter. Please check your internet connection.');
    }
    
    throw new Error(error.response?.data?.error || error.message || 'Failed to generate quiz questions');
  }
};