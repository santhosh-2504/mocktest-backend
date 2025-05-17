
// /**
//  * OpenRouter AI prompt utilities for quiz generation with image support
//  */

// // Define the difficulty levels
// const DIFFICULTY_MAPPING = {
//   easy: 'beginner level with straightforward questions',
//   medium: 'intermediate level with moderately challenging questions',
//   hard: 'advanced level with difficult questions requiring deep knowledge'
// };

// /**
//  * Generates the prompt for OpenRouter API to create a quiz based on topic and level
//  * @param {string} topic - The quiz topic
//  * @param {string} level - The difficulty level (easy, medium, hard)
//  * @returns {string} The formatted prompt
//  */
// export const generateQuizPrompt = (topic, level) => {
//   const difficultyDescription = DIFFICULTY_MAPPING[level.toLowerCase()] || DIFFICULTY_MAPPING.medium;
  
//   // Different prompt approach if we have an image attached
//   const imageContext = `If an image is attached, carefully analyze its content. Create questions directly related to what you see in the image. For example, if it's a traffic sign, create questions about its meaning, usage, and situations where it applies. If it's a scientific diagram, ask about its components and their relationships. Extract information and use it as a primary source for creating factual quiz questions.`;
  
//   return `Generate a ${difficultyDescription} quiz about "${topic}".
  
// ${imageContext}

// Create exactly 10 multiple-choice questions.

// For each question:
// 1. Provide a clear question text
// 2. Provide exactly 4 options
// 3. Clearly mark which option is correct (as a 0-based index)

// Format your response as a valid JSON object with the following structure:
// {
//   "questions": [
//     {
//       "questionText": "Question text here?",
//       "options": ["Option A", "Option B", "Option C", "Option D"],
//       "correctOption": 0  // 0-based index of correct answer
//     },
//     // ... more questions
//   ]
// }

// Ensure each question is factually accurate and that there is exactly one correct answer per question. Make the incorrect options plausible but clearly incorrect to someone knowledgeable in the topic.
// `;
// };

// /**
//  * Parses the OpenRouter AI response and validates it
//  * @param {string|Object} response - The raw response from OpenRouter
//  * @returns {Object|null} Parsed quiz data or null if invalid
//  */
// export const parseQuizResponse = (response) => {
//   try {
//     let parsedData;
    
//     // If the response is already an object, use it directly
//     if (typeof response === 'object' && response !== null) {
//       parsedData = response;
//     } else if (typeof response === 'string') {
//       // Extract JSON from the response text
//       // This handles cases where the AI might add explanatory text around the JSON
//       const jsonMatch = response.match(/\{[\s\S]*\}/);
//       if (!jsonMatch) {
//         console.error('No JSON object found in response');
//         return null;
//       }
      
//       try {
//         parsedData = JSON.parse(jsonMatch[0]);
//       } catch (jsonError) {
//         console.error('JSON parse error:', jsonError);
        
//         // Try a more aggressive JSON extraction approach
//         // Look for anything that starts with '{"questions":' and ends with '}'
//         const aggressiveMatch = response.match(/\{"questions":[\s\S]*\}/);
//         if (!aggressiveMatch) {
//           return null;
//         }
        
//         try {
//           parsedData = JSON.parse(aggressiveMatch[0]);
//         } catch (secondError) {
//           console.error('Second JSON parse attempt failed:', secondError);
//           return null;
//         }
//       }
//     } else {
//       console.error('Invalid response type:', typeof response);
//       return null;
//     }
    
//     // Validate the structure
//     if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
//       console.error('Missing or invalid questions array');
//       return null;
//     }
    
//     // If less than 10 questions, try to work with what we have
//     if (parsedData.questions.length < 1) {
//       console.error('Not enough questions returned');
//       return null;
//     }
    
//     // Validate each question and fix any issues if possible
//     const validatedQuestions = [];
    
//     for (const question of parsedData.questions) {
//       // Skip questions with missing text
//       if (!question.questionText) {
//         console.warn('Skipping question with missing text');
//         continue;
//       }
      
//       // Ensure options is an array
//       if (!Array.isArray(question.options)) {
//         console.warn('Skipping question with invalid options');
//         continue;
//       }
      
//       // Ensure exactly 4 options or pad to 4 if possible
//       let options = [...question.options];
//       if (options.length < 4) {
//         console.warn(`Padding question with ${4 - options.length} extra options`);
//         for (let i = options.length; i < 4; i++) {
//           options.push(`Option ${i + 1}`);
//         }
//       } else if (options.length > 4) {
//         console.warn('Trimming options to 4');
//         options = options.slice(0, 4);
//       }
      
//       // Validate correctOption is a number within bounds
//       let correctOption = question.correctOption;
//       if (typeof correctOption !== 'number' || correctOption < 0 || correctOption > 3) {
//         console.warn('Fixing invalid correctOption');
//         correctOption = 0; // Default to first option if invalid
//       }
      
//       // Add the validated question
//       validatedQuestions.push({
//         questionText: question.questionText,
//         options,
//         correctOption
//       });

//       // Stop if we have 10 questions
//       if (validatedQuestions.length >= 10) {
//         break;
//       }
//     }
    
//     // Return at least one question or null
//     if (validatedQuestions.length >= 1) {
//       return { questions: validatedQuestions };
//     } else {
//       return null;
//     }
//   } catch (error) {
//     console.error('Error parsing quiz response:', error);
//     return null;
//   }
// };

// /**
//  * Formats quiz data for database storage
//  * @param {Object} parsedQuiz - Parsed quiz data
//  * @param {string} topic - The quiz topic
//  * @param {string} level - The difficulty level
//  * @returns {Object} Formatted quiz data
//  */
// export const formatQuizForStorage = (parsedQuiz, topic, level) => {
//   return {
//     topic,
//     level,
//     questions: parsedQuiz.questions.map(q => ({
//       questionText: q.questionText,
//       options: q.options,
//       correctOption: q.correctOption + 1 // Convert to 1-based index for database storage
//     }))
//   };
// };

/**
 * Utility functions for quiz generation and processing
 */

/**
 * Generates a prompt for the AI to create a topic name based on an image or hint
 * @param {string} topicHint - Optional user-provided topic hint
 * @returns {string} The formatted prompt
 */
export const generateTopicPrompt = (topicHint = '') => {
  if (topicHint && topicHint.trim()) {
    return `Based on this hint "${topicHint}" and the image (if provided), generate a concise, specific, and educational topic name for a quiz. The topic should be descriptive but no longer than 5-7 words. Respond only with the topic name, without any additional text.`;
  } else {
    return `Based on the provided image, generate a concise, specific, and educational topic name for a quiz. The topic should be descriptive but no longer than 5-7 words. Respond only with the topic name, without any additional text.`;
  }
};

/**
 * Generates a prompt for the AI to create quiz questions
 * @param {string} topic - The quiz topic
 * @param {string} level - The difficulty level (easy, medium, hard)
 * @returns {string} The formatted prompt
 */
export const generateQuizPrompt = (topic, level) => {
  return `Generate a quiz on the topic "${topic}" with a difficulty level of "${level}".

Create 10 multiple-choice questions.

For each question:
1. Include the question text
2. Provide exactly 4 options (labeled 1-4)
3. Indicate the correct option (as a number 1-4)
4. Include a detailed explanation of why the correct answer is right and why others are wrong

Return the result as a valid JSON object with the following structure:
{
  "questions": [
    {
      "questionText": "Your question here",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctOption": 2,
      "explanation": "Detailed explanation for why option 2 is correct and why others are wrong"
    },
    ...more questions
  ]
}

Ensure all questions relate directly to the topic "${topic}" and are appropriate for the ${level} difficulty level. If using an image as context, make the questions relevant to the content of the image.`;
};

/**
 * Parses the AI response to extract structured quiz data
 * @param {string} aiResponse - The response from the AI
 * @returns {Object} Parsed quiz data
 * @throws {Error} If parsing fails
 */
export const parseQuizResponse = (aiResponse) => {
  try {
    // If the response is already an object, return it
    if (typeof aiResponse === 'object') {
      return aiResponse;
    }
    
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in the response');
    }
    
    const jsonStr = jsonMatch[0];
    const parsed = JSON.parse(jsonStr);
    
    // Validate the structure
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid quiz format: missing questions array');
    }
    
    // Validate each question has required fields
    parsed.questions.forEach((q, index) => {
      if (!q.questionText) {
        throw new Error(`Question ${index + 1} is missing questionText`);
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        throw new Error(`Question ${index + 1} has invalid options`);
      }
      if (typeof q.correctOption !== 'number' || q.correctOption < 1 || q.correctOption > q.options.length) {
        throw new Error(`Question ${index + 1} has invalid correctOption`);
      }
      if (!q.explanation) {
        console.warn(`Question ${index + 1} is missing explanation, adding placeholder`);
        q.explanation = "No explanation provided.";
      }
    });
    
    return parsed;
  } catch (error) {
    console.error('Error parsing quiz response. Can you please try again:', error);
    throw error;
  }
};

/**
 * Formats the AI-generated quiz data for storage in MongoDB
 * @param {Object} quizData - Quiz data from AI
 * @param {string} topic - Quiz topic
 * @param {string} level - Quiz difficulty level
 * @returns {Object} Formatted quiz data
 */
export const formatQuizForStorage = (quizData, topic, level) => {
  // Validate and ensure all fields are present
  const questions = quizData.questions.map(q => ({
    questionText: q.questionText,
    options: q.options,
    correctOption: q.correctOption,
    explanation: q.explanation || "No explanation provided." // Ensure explanation exists
  }));
  
  return {
    topic,
    level,
    questions
  };
};