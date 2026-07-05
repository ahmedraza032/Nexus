import crypto from 'crypto';
import { Request, Response } from 'express';
import { User, Entrepreneur, Investor } from '../models/User';
import generateToken from '../utils/generateToken';
import sendEmail from '../utils/sendEmail';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    let user;
    const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

    if (role === 'entrepreneur') {
      user = await Entrepreneur.create({
        name,
        email,
        password,
        role,
        avatarUrl: defaultAvatarUrl,
      });
    } else if (role === 'investor') {
      user = await Investor.create({
        name,
        email,
        password,
        role,
        avatarUrl: defaultAvatarUrl,
      });
    } else {
      res.status(400).json({ message: 'Invalid role specified' });
      return;
    }

    if (user) {
      res.status(201).json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: (user as any).createdAt,
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password, role } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && user.role === role && (await user.matchPassword(password))) {
      res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: (user as any).createdAt,
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(401).json({ message: 'Invalid email, password, or role' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('forgotPassword called with email:', req.body.email);
    const user = await User.findOne({ email: req.body.email });
    console.log('User found:', user ? user.email : 'NOT FOUND');

    if (!user) {
      res.status(404).json({ message: 'There is no user with that email' });
      return;
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    console.log('Reset token generated');

    await user.save({ validateBeforeSave: false });
    console.log('User saved with reset token');

    // Create reset url — update this to your deployed frontend URL in production
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <div style="background-color: #4f46e5; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Business Nexus</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827; margin-top: 0;">Reset Your Password</h2>
          <p style="color: #6b7280;">Hi ${user.name},</p>
          <p style="color: #6b7280;">We received a request to reset the password for your Business Nexus account. Click the button below to create a new password. This link will expire in <strong>10 minutes</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 13px;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${resetUrl}" style="color: #4f46e5; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Business Nexus — Password Reset Request',
        html: htmlMessage,
      });

      res.status(200).json({ success: true, data: 'Email sent' });
    } catch (emailError) {
      // Log the actual error so we can see what's going wrong
      console.error('Email send failed:', emailError);

      // If email fails, clean up the token so user can try again
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      res.status(500).json({ message: 'Email could not be sent. Please try again later.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken as string)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid token' });
      return;
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      token: generateToken(user._id.toString()),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: (error as Error).message });
  }
};

// @desc    Update password (while logged in)
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check current password is correct
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: (error as Error).message });
  }
};
