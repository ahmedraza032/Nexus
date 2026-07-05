import { Request, Response } from 'express';
import { User } from '../models/User';
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
    const user = await User.findById(req.params.id).select('-password');
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
    const user = await User.findById(req.user?._id);

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
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

