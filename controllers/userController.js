// import User from '../models/User.js';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';

// export const registerUser = async (req, res) => {
//   const { name, email, phone, password } = req.body;
//   try {
//     const existing = await User.findOne({ email });
//     if (existing) return res.status(400).json({ error: 'Email already in use' });

//     const hashed = await bcrypt.hash(password, 10);
//     const user = await User.create({ name, email, phone, password: hashed });

//     res.status(201).json({ message: 'User registered' });
//   } catch (err) {
//     res.status(500).json({ error: 'Registration failed' });
//   }
// };

// export const loginUser = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await User.findOne({ email }).select('+password');
//     if (!user) return res.status(400).json({ message: 'Invalid credentials' });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

//     // Exclude password before sending user
//     const { password: _, ...userData } = user.toObject();

//     res.json({ token, user: userData });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Login failed' });
//   }
// };

// export const logoutUser = async (req, res) => {
//   res.json({ message: 'Logout handled on client by removing token' });
// };

// export const getProfile = async (req, res) => {
//   const user = await User.findById(req.user.id).select('-password');
//   res.status(200).json(user);
// };

// // export const updateQuizScore = async (req, res) => {
// //   const { quizId, score } = req.body;
  
// //   try {
// //     // Validate required fields
// //     if (!quizId || score === undefined || score === null) {
// //       return res.status(400).json({ 
// //         error: 'Quiz ID and score are required' 
// //       });
// //     }

// //     // Validate score is a number
// //     if (typeof score !== 'number' || score < 0) {
// //       return res.status(400).json({ 
// //         error: 'Score must be a non-negative number' 
// //       });
// //     }

// //     const user = await User.findById(req.user.id);
// //     if (!user) {
// //       return res.status(404).json({ error: 'User not found' });
// //     }

// //     // Add the new quiz attempt to the user's quizAttempts array
// //     user.quizAttempts.push({
// //       quiz: quizId,
// //       score: score,
// //       updatedAt: new Date()
// //     });

// //     await user.save();

// //     res.status(200).json({ 
// //       message: 'Quiz score updated successfully',
// //       quizAttempt: {
// //         quiz: quizId,
// //         score: score,
// //         updatedAt: new Date()
// //       }
// //     });
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ error: 'Failed to update quiz score' });
// //   }
// // };

// export const updateQuizScore = async (req, res) => {
//   const { quizId, score } = req.body;
  
//   try {
//     // Validate required fields
//     if (!quizId || score === undefined || score === null) {
//       return res.status(400).json({ 
//         error: 'Quiz ID and score are required' 
//       });
//     }

//     // Validate score is a number
//     if (typeof score !== 'number' || score < 0) {
//       return res.status(400).json({ 
//         error: 'Score must be a non-negative number' 
//       });
//     }

//     // First, try to update existing quiz attempt
//     const updateResult = await User.findOneAndUpdate(
//       { 
//         _id: req.user.id,
//         'quizAttempts.quiz': quizId
//       },
//       { 
//         $set: {
//           'quizAttempts.$.score': score,
//           'quizAttempts.$.updatedAt': new Date()
//         }
//       },
//       { new: true }
//     );

//     if (updateResult) {
//       // Successfully updated existing attempt
//       const updatedAttempt = updateResult.quizAttempts.find(
//         attempt => attempt.quiz.toString() === quizId
//       );

//       return res.status(200).json({ 
//         message: 'Quiz score updated successfully',
//         quizAttempt: {
//           quiz: quizId,
//           score: score,
//           updatedAt: updatedAttempt.updatedAt
//         }
//       });
//     } else {
//       // No existing attempt found, create new one
//       const addResult = await User.findByIdAndUpdate(
//         req.user.id,
//         {
//           $push: {
//             quizAttempts: {
//               quiz: quizId,
//               score: score,
//               updatedAt: new Date()
//             }
//           }
//         },
//         { new: true }
//       );

//       if (!addResult) {
//         return res.status(404).json({ error: 'User not found' });
//       }

//       res.status(200).json({ 
//         message: 'Quiz score recorded successfully',
//         quizAttempt: {
//           quiz: quizId,
//           score: score,
//           updatedAt: new Date()
//         }
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to update quiz score' });
//   }
// };

import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Keep the original register function for backward compatibility (if needed)
export const registerUser = async (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, phone, password: hashed });

    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find user and explicitly select password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Exclude password before sending user
    const { password: _, ...userData } = user.toObject();

    res.json({ 
      message: 'Login successful',
      token, 
      user: userData 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
};

export const logoutUser = async (req, res) => {
  res.json({ message: 'Logout handled on client by removing token' });
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateQuizScore = async (req, res) => {
  const { quizId, score } = req.body;
  
  try {
    // Validate required fields
    if (!quizId || score === undefined || score === null) {
      return res.status(400).json({ 
        error: 'Quiz ID and score are required' 
      });
    }

    // Validate score is a number
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ 
        error: 'Score must be a non-negative number' 
      });
    }

    // First, try to update existing quiz attempt
    const updateResult = await User.findOneAndUpdate(
      { 
        _id: req.user.id,
        'quizAttempts.quiz': quizId
      },
      { 
        $set: {
          'quizAttempts.$.score': score,
          'quizAttempts.$.updatedAt': new Date()
        }
      },
      { new: true }
    );

    if (updateResult) {
      // Successfully updated existing attempt
      const updatedAttempt = updateResult.quizAttempts.find(
        attempt => attempt.quiz.toString() === quizId
      );

      return res.status(200).json({ 
        message: 'Quiz score updated successfully',
        quizAttempt: {
          quiz: quizId,
          score: score,
          updatedAt: updatedAttempt.updatedAt
        }
      });
    } else {
      // No existing attempt found, create new one
      const addResult = await User.findByIdAndUpdate(
        req.user.id,
        {
          $push: {
            quizAttempts: {
              quiz: quizId,
              score: score,
              updatedAt: new Date()
            }
          }
        },
        { new: true }
      );

      if (!addResult) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({ 
        message: 'Quiz score recorded successfully',
        quizAttempt: {
          quiz: quizId,
          score: score,
          updatedAt: new Date()
        }
      });
    }
  } catch (err) {
    console.error('Update quiz score error:', err);
    res.status(500).json({ error: 'Failed to update quiz score' });
  }
};