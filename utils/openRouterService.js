/**
 * OpenRouter API service for AI-powered quiz generation
 */
import dotenv from 'dotenv';
dotenv.config({ path: './config/config.env' });
import axios from 'axios';
import { generateQuizPrompt, parseQuizResponse } from './quizUtils.js';

// OpenRouter configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY; // Should be set in your environment
const DEFAULT_MODEL = 'opengvlab/internvl3-14b:free'; // High capability model for generating quality quizzes

/**
 * Calls the OpenRouter API to generate quiz questions based on provided topic and level
 * @param {string} topic - The topic for the quiz
 * @param {string} level - The difficulty level (easy, medium, hard)
 * @returns {Promise<Object>} The parsed quiz data
 * @throws {Error} If generation fails
 */
export const generateQuizWithAI = async (topic, level) => {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is not configured');
    }

    const prompt = generateQuizPrompt(topic, level);

    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: 'You are a quiz question generator assistant. Generate well-formatted, valid JSON quiz questions on the requested topic.' },
          { role: 'user', content: prompt }
        ],
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

    // Extract the response content
    const aiResponse = response.data.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('Invalid response from OpenRouter API');
    }

    // Parse and validate the response
    const parsedQuiz = parseQuizResponse(aiResponse);
    if (!parsedQuiz) {
      throw new Error('Failed to parse quiz data from AI response');
    }

    return parsedQuiz;
  } catch (error) {
    console.error('AI Quiz Generation Error:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to generate quiz questions');
  }
};