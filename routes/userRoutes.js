import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { registerUser, loginUser, logoutUser , getProfile} from '../controllers/userController.js';


const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', authMiddleware, getProfile);

export default router;
