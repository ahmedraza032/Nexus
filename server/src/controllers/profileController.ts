import { Request, Response } from 'express';
import { User } from '../models/User';
import { Meeting } from '../models/Meeting';
import { AuthRequest } from '../middleware/authMiddleware';

import mongoose from 'mongoose';

// @desc    Get any user's profile by ID (public)
// @route   GET /api/profiles/:id
// @access  Public
export const getProfileById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const viewerId = (req as AuthRequest).user?._id?.toString();
    const isOwnProfile = viewerId && viewerId === req.params.id;

    // Only increment profileViews when someone else visits the profile
    const user = isOwnProfile
      ? await User.findById(req.params.id).select('-password')
      : await User.findByIdAndUpdate(
          req.params.id,
          { $inc: { profileViews: 1 } },
          { new: true, select: '-password' }
        );

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Get logged in user profile
// @route   GET /api/profiles/me
// @access  Private
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Compute upcomingMeetings live: accepted meetings with a future startTime
    const now = new Date();
    const upcomingCount = await Meeting.countDocuments({
      $or: [{ organizer: userId }, { attendee: userId }],
      status: 'accepted',
      startTime: { $gte: now },
    });

    // Return user data with the live upcomingMeetings count
    const userObj = user.toObject() as any;
    userObj.upcomingMeetings = upcomingCount;

    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Update user profile
// @route   PUT /api/profiles/:id
// @access  Private
export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Ensure the logged in user is updating their own profile
      if (user._id.toString() !== req.user?._id.toString()) {
        res.status(401).json({ message: 'Not authorized to update this profile' });
        return;
      }

      // Update base fields
      user.name = req.body.name || user.name;
      user.bio = req.body.bio || user.bio;
      user.avatarUrl = req.body.avatarUrl || user.avatarUrl;

      // Type cast and update role-specific fields
      if (user.role === 'entrepreneur') {
        const entrepreneur = user as any;
        entrepreneur.startupName = req.body.startupName || entrepreneur.startupName;
        entrepreneur.pitchSummary = req.body.pitchSummary || entrepreneur.pitchSummary;
        entrepreneur.fundingNeeded = req.body.fundingNeeded || entrepreneur.fundingNeeded;
        entrepreneur.industry = req.body.industry || entrepreneur.industry;
        entrepreneur.location = req.body.location || entrepreneur.location;
        entrepreneur.foundedYear = req.body.foundedYear || entrepreneur.foundedYear;
        entrepreneur.teamSize = req.body.teamSize || entrepreneur.teamSize;
      } else if (user.role === 'investor') {
        const investor = user as any;
        investor.investmentInterests = req.body.investmentInterests || investor.investmentInterests;
        investor.investmentStage = req.body.investmentStage || investor.investmentStage;
        investor.portfolioCompanies = req.body.portfolioCompanies || investor.portfolioCompanies;
        investor.totalInvestments = req.body.totalInvestments || investor.totalInvestments;
        investor.minimumInvestment = req.body.minimumInvestment || investor.minimumInvestment;
        investor.maximumInvestment = req.body.maximumInvestment || investor.maximumInvestment;
      }

      const updatedUser = await user.save();

      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Get all profiles (with optional role filter)
// @route   GET /api/profiles
// @access  Public
export const optionalProtect: import('express').RequestHandler = async (req: any, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET) as { id: string };
      const user = await require('../models/User').User.findById(decoded.id).select('-password');
      if (user) req.user = user;
    }
  } catch {
    // ignore – unauthenticated access is fine for public routes
  }
  next();
};

export const getAllProfiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.query;
    const query = role ? { role: role as 'entrepreneur' | 'investor' } : {};
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/profiles/me/notifications/read
// @access  Private
export const markNotificationsAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);

    if (user) {
      // Set all unread notifications to false
      user.notifications?.forEach(notification => {
        if (notification.unread) {
          notification.unread = false;
        }
      });
      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
