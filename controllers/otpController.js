import OTP from '../models/OTP.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/sendEmail.js';
import crypto from 'crypto';

// Generate a 4-digit OTP
const generateOTP = () => {
  return crypto.randomInt(1000, 9999).toString();
};

// Send OTP to email
export const sendOTP = async (req, res) => {
  const { email, name } = req.body;
  
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Generate new OTP
    const otp = generateOTP();

    // Save OTP to database
    await OTP.create({
      email: email.toLowerCase(),
      otp: otp
    });

    // Send OTP via email
    const subject = 'Your OTP for Account Registration';
    const message = `Dear ${name || 'User'},

Your OTP for account registration is: ${otp}

This OTP is valid for 5 minutes only. Please do not share this OTP with anyone.

If you didn't request this OTP, please ignore this email.

Best regards,
Your App Team`;

    await sendEmail({
      email: email.toLowerCase(),
      subject,
      message
    });

    res.status(200).json({ 
      message: 'OTP sent successfully to your email',
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
};

// Verify OTP and register user
export const registerWithOTP = async (req, res) => {
  const { name, email, phone, password, otp } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !phone || !password || !otp) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength (at least 6 characters)
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Find the OTP record
    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase(),
      verified: false
    }).sort({ createdAt: -1 }); // Get the latest OTP

    if (!otpRecord) {
      return res.status(400).json({ error: 'OTP not found or expired. Please request a new OTP.' });
    }

    // Check if OTP has exceeded maximum attempts
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: 'Maximum verification attempts exceeded. Please request a new OTP.' });
    }

    // Verify OTP
    if (otpRecord.otp !== otp.toString()) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();
      
      const remainingAttempts = 3 - otpRecord.attempts;
      return res.status(400).json({ 
        error: `Invalid OTP. ${remainingAttempts} attempts remaining.`
      });
    }

    // OTP is valid, mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone.trim(),
      password: hashedPassword
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Clean up - delete the used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    // Remove password from user object before sending response
    const { password: _, ...userData } = user.toObject();

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// Resend OTP (if user didn't receive or it expired)
export const resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Generate new OTP
    const otp = generateOTP();

    // Save OTP to database
    await OTP.create({
      email: email.toLowerCase(),
      otp: otp
    });

    // Send OTP via email
    const subject = 'Your OTP for Account Registration (Resent)';
    const message = `Your new OTP for account registration is: ${otp}

This OTP is valid for 5 minutes only. Please do not share this OTP with anyone.

If you didn't request this OTP, please ignore this email.

Best regards,
Your App Team`;

    await sendEmail({
      email: email.toLowerCase(),
      subject,
      message
    });

    res.status(200).json({ 
      message: 'OTP resent successfully to your email',
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ error: 'Failed to resend OTP. Please try again.' });
  }
};

// Add these functions to your controllers/otpController.js file

// Send OTP for password reset
export const sendPasswordResetOTP = async (req, res) => {
  const { email } = req.body;
  
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user exists (we need to find the user to reset their password)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Generate new OTP
    const otp = generateOTP();

    // Save OTP to database
    await OTP.create({
      email: email.toLowerCase(),
      otp: otp
    });

    // Send OTP via email
    const subject = 'Your OTP for Password Reset';
    const message = `Dear ${user.name},

Your OTP for password reset is: ${otp}

This OTP is valid for 5 minutes only. Please do not share this OTP with anyone.

If you didn't request this password reset, please ignore this email and secure your account.

Best regards,
Your App Team`;

    await sendEmail({
      email: email.toLowerCase(),
      subject,
      message
    });

    res.status(200).json({ 
      message: 'Password reset OTP sent successfully to your email',
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error('Error sending password reset OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
};

// Verify OTP for password reset
export const verifyPasswordResetOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Validate inputs
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Find the OTP record
    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase(),
      verified: false
    }).sort({ createdAt: -1 }); // Get the latest OTP

    if (!otpRecord) {
      return res.status(400).json({ error: 'OTP not found or expired. Please request a new OTP.' });
    }

    // Check if OTP has exceeded maximum attempts
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: 'Maximum verification attempts exceeded. Please request a new OTP.' });
    }

    // Verify OTP
    if (otpRecord.otp !== otp.toString()) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();
      
      const remainingAttempts = 3 - otpRecord.attempts;
      return res.status(400).json({ 
        error: `Invalid OTP. ${remainingAttempts} attempts remaining.`
      });
    }

    // OTP is valid, mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Generate a temporary token for password reset
    // This token will be used to validate the reset password request
    const resetToken = jwt.sign(
      { email: email.toLowerCase() }, 
      process.env.JWT_SECRET, 
      { expiresIn: '15m' } // Token valid for 15 minutes
    );

    res.status(200).json({
      message: 'OTP verified successfully. You can now reset your password.',
      resetToken
    });

  } catch (error) {
    console.error('Error verifying password reset OTP:', error);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
};

// Reset password with verified OTP
export const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    // Validate inputs
    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Verify the reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired reset token. Please try again.' });
    }

    // Find the user
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    // Clean up - delete any OTPs for this email
    await OTP.deleteMany({ email: decoded.email });

    res.status(200).json({
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Password reset failed. Please try again.' });
  }
};