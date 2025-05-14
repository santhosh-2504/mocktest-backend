/**
 * OpenRouter AI prompt utilities for quiz generation
 */

// Define the difficulty levels
const DIFFICULTY_MAPPING = {
    easy: 'beginner level with straightforward questions',
    medium: 'intermediate level with moderately challenging questions',
    hard: 'advanced level with difficult questions requiring deep knowledge'
  };
  
  /**
   * Generates the prompt for OpenRouter API to create a quiz based on topic and level
   * @param {string} topic - The quiz topic
   * @param {string} level - The difficulty level (easy, medium, hard)
   * @returns {string} The formatted prompt
   */
  export const generateQuizPrompt = (topic, level) => {
    const difficultyDescription = DIFFICULTY_MAPPING[level.toLowerCase()] || DIFFICULTY_MAPPING.medium;
    
    return `Generate a ${difficultyDescription} quiz about "${topic}". 
  Create exactly 10 multiple-choice questions.
  
  For each question:
  1. Provide a clear question text
  2. Provide exactly 4 options
  3. Clearly mark which option is correct (as a 0-based index)
  
  Format your response as a valid JSON object with the following structure:
  {
    "questions": [
      {
        "questionText": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctOption": 0  // 0-based index of correct answer
      },
      // ... more questions
    ]
  }
  
  Ensure each question is factually accurate and that there is exactly one correct answer per question. Make the incorrect options plausible but clearly incorrect to someone knowledgeable in the topic.
  `;
  };
  
  /**
   * Parses the OpenRouter AI response and validates it
   * @param {string} response - The raw response from OpenRouter
   * @returns {Object|null} Parsed quiz data or null if invalid
   */
  export const parseQuizResponse = (response) => {
    try {
      let parsedData;
      
      // If the response is already an object, use it directly
      if (typeof response === 'object') {
        parsedData = response;
      } else {
        // Extract JSON from the response text
        // This handles cases where the AI might add explanatory text around the JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        
        parsedData = JSON.parse(jsonMatch[0]);
      }
      
      // Validate the structure
      if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
        return null;
      }
      
      // Ensure exactly 10 questions
      if (parsedData.questions.length !== 10) {
        return null;
      }
      
      // Validate each question
      for (const question of parsedData.questions) {
        if (!question.questionText || 
            !Array.isArray(question.options) || 
            question.options.length !== 4 ||
            typeof question.correctOption !== 'number' ||
            question.correctOption < 0 ||
            question.correctOption > 3) {
          return null;
        }
      }
      
      return parsedData;
    } catch (error) {
      console.error('Error parsing quiz response:', error);
      return null;
    }
  };
  
  /**
   * Formats quiz data for database storage
   * @param {Object} parsedQuiz - Parsed quiz data
   * @param {string} topic - The quiz topic
   * @param {string} level - The difficulty level
   * @returns {Object} Formatted quiz data
   */
  export const formatQuizForStorage = (parsedQuiz, topic, level) => {
    return {
      topic,
      level,
      questions: parsedQuiz.questions.map(q => ({
        questionText: q.questionText,
        options: q.options,
        correctOption: q.correctOption + 1 // Convert to 1-based index for database storage
      }))
    };
  };