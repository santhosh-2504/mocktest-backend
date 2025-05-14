import express from 'express';
import dotenv from 'dotenv';
dotenv.config({ path: './config/config.env' });
import connectDB from './config/db.js';
import quizRoutes from './routes/quizRoutes.js';
import userRoutes from './routes/userRoutes.js';

connectDB();

const app = express();
app.use(express.json());

//Testing backend
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/quizzes', quizRoutes);
app.use('/api/users', userRoutes);

export default app;
