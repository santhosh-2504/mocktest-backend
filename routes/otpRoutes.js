// Updated otpRoutes.js with password reset routes

import express from 'express';
import { 
  sendOTP, 
  registerWithOTP, 
  resendOTP,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword
} from '../controllers/otpController.js';

const router = express.Router();

// Registration routes
router.post('/send-otp', sendOTP);
router.post('/register-with-otp', registerWithOTP);
router.post('/resend-otp', resendOTP);

// Password reset routes
router.post('/forgot-password', sendPasswordResetOTP);
router.post('/verify-reset-otp', verifyPasswordResetOTP);
router.post('/reset-password', resetPassword);

export default router;