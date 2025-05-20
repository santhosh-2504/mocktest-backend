// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// dotenv.config({ path: './config/config.env' });
// import connectDB from './config/db.js';
// import quizRoutes from './routes/quizRoutes.js';
// import userRoutes from './routes/userRoutes.js';

// connectDB();

// const app = express();
// app.use(cors({
//   origin: '*',
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
// app.use(express.json());

// //Testing backend
// app.get('/', (req, res) => {
//   res.send('API is running...');
// });

// app.use('/api/quizzes', quizRoutes);
// app.use('/api/users', userRoutes);

// export default app;

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config({ path: './config/config.env' });
import connectDB from './config/db.js';
import quizRoutes from './routes/quizRoutes.js';
import userRoutes from './routes/userRoutes.js';
import otpRoutes from './routes/otpRoutes.js';

connectDB();

const app = express();
app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

//Testing backend
app.get('/', (req, res) => {
  res.send('API is running...');
});
app.use(express.static('public'));

app.use('/api/quizzes', quizRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', otpRoutes);

export default app;