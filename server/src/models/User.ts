import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'entrepreneur' | 'investor';
  avatarUrl?: string;
  bio?: string;
  isOnline?: boolean;
  createdAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
  getResetPasswordToken(): string;
}

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['entrepreneur', 'investor'], required: true },
    avatarUrl: { type: String },
    bio: { type: String },
    isOnline: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
    discriminatorKey: 'role',
  }
);

userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set expire (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

});

export const User = mongoose.model<IUser>('User', userSchema);

// Entrepreneur Discriminator
export interface IEntrepreneur extends IUser {
  startupName?: string;
  pitchSummary?: string;
  fundingNeeded?: string;
  industry?: string;
  location?: string;
  foundedYear?: number;
  teamSize?: number;
}

const entrepreneurSchema = new Schema({
  startupName: { type: String },
  pitchSummary: { type: String },
  fundingNeeded: { type: String },
  industry: { type: String },
  location: { type: String },
  foundedYear: { type: Number },
  teamSize: { type: Number },
});

export const Entrepreneur = User.discriminator<IEntrepreneur>('entrepreneur', entrepreneurSchema);

// Investor Discriminator
export interface IInvestor extends IUser {
  investmentInterests?: string[];
  investmentStage?: string[];
  portfolioCompanies?: string[];
  totalInvestments?: number;
  minimumInvestment?: string;
  maximumInvestment?: string;
}

const investorSchema = new Schema({
  investmentInterests: [{ type: String }],
  investmentStage: [{ type: String }],
  portfolioCompanies: [{ type: String }],
  totalInvestments: { type: Number, default: 0 },
  minimumInvestment: { type: String },
  maximumInvestment: { type: String },
});

export const Investor = User.discriminator<IInvestor>('investor', investorSchema);
