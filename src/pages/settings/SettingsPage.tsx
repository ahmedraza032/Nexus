import React, { useState, useRef } from 'react';
import { User, Lock, Bell, Globe, Palette, CreditCard, Building2, DollarSign, Users, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import toast from 'react-hot-toast';
import { Entrepreneur, Investor } from '../../types';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Base profile state
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Entrepreneur-specific state
  const entrepreneur = user?.role === 'entrepreneur' ? user as unknown as Entrepreneur : null;
  const [startupName, setStartupName] = useState(entrepreneur?.startupName || '');
  const [industry, setIndustry] = useState(entrepreneur?.industry || '');
  const [location, setLocation] = useState(entrepreneur?.location || '');
  const [foundedYear, setFoundedYear] = useState(entrepreneur?.foundedYear?.toString() || '');
  const [teamSize, setTeamSize] = useState(entrepreneur?.teamSize?.toString() || '');
  const [pitchSummary, setPitchSummary] = useState(entrepreneur?.pitchSummary || '');
  const [fundingNeeded, setFundingNeeded] = useState(entrepreneur?.fundingNeeded || '');

  // Investor-specific state
  const investor = user?.role === 'investor' ? user as unknown as Investor : null;
  const [minInvestment, setMinInvestment] = useState(investor?.minimumInvestment || '');
  const [maxInvestment, setMaxInvestment] = useState(investor?.maximumInvestment || '');
  const [investmentInterests, setInvestmentInterests] = useState(
    investor?.investmentInterests?.join(', ') || ''
  );
  const [investmentStage, setInvestmentStage] = useState(
    investor?.investmentStage?.join(', ') || ''
  );

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  if (!user) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setIsUploadingAvatar(true);
    try {
      const response = await api.post('/profiles/avatar', formData);
      const newAvatarUrl = response.data.avatarUrl;
      setAvatarUrl(newAvatarUrl);
      toast.success('Photo updated successfully');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to upload photo';
      toast.error(message);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const userId = (user as any)._id || user.id;

      const updates: Record<string, any> = { name, bio };

      if (user.role === 'entrepreneur') {
        updates.startupName = startupName;
        updates.industry = industry;
        updates.location = location;
        updates.foundedYear = parseInt(foundedYear) || undefined;
        updates.teamSize = parseInt(teamSize) || undefined;
        updates.pitchSummary = pitchSummary;
        updates.fundingNeeded = fundingNeeded;
      } else if (user.role === 'investor') {
        updates.minimumInvestment = minInvestment;
        updates.maximumInvestment = maxInvestment;
        updates.investmentInterests = investmentInterests.split(',').map((s) => s.trim()).filter(Boolean);
        updates.investmentStage = investmentStage.split(',').map((s) => s.trim()).filter(Boolean);
      }

      await updateProfile(userId, updates);
    } catch (err) {
      // error toast shown inside updateProfile
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setIsSavingPassword(true);
    try {
      await api.put('/auth/updatepassword', { currentPassword, newPassword });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update password';
      toast.error(message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const profileLink = user.role === 'entrepreneur'
    ? `/profile/entrepreneur/${(user as any)._id || user.id}`
    : `/profile/investor/${(user as any)._id || user.id}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and settings</p>
        </div>
        <Link to={profileLink}>
          <Button variant="outline">View My Profile</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings navigation */}
        <Card className="lg:col-span-1">
          <CardBody className="p-2">
            <nav className="space-y-1">
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-md">
                <User size={18} className="mr-3" />
                Profile
              </button>
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Lock size={18} className="mr-3" />
                Security
              </button>
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Bell size={18} className="mr-3" />
                Notifications
              </button>
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Globe size={18} className="mr-3" />
                Language
              </button>
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Palette size={18} className="mr-3" />
                Appearance
              </button>
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <CreditCard size={18} className="mr-3" />
                Billing
              </button>
            </nav>
          </CardBody>
        </Card>

        <div className="lg:col-span-3 space-y-6">

          {/* ── Basic Profile ── */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <Avatar src={avatarUrl} alt={user.name} size="xl" />
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      isLoading={isUploadingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change Photo
                    </Button>
                    <p className="mt-2 text-sm text-gray-500">JPG, GIF or PNG. Max size of 5MB</p>
                  </div>
                </div>

                {/* Base fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
                  <Input label="Email" type="email" value={user.email} disabled fullWidth />
                  <Input label="Role" value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} disabled fullWidth />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself..."
                  />
                </div>

                {/* ── Entrepreneur-specific fields ── */}
                {user.role === 'entrepreneur' && (
                  <>
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <Building2 size={18} className="text-primary-600" />
                        Startup Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Startup Name" value={startupName} onChange={(e) => setStartupName(e.target.value)} fullWidth />
                        <Input label="Industry" placeholder="e.g. FinTech, HealthTech" value={industry} onChange={(e) => setIndustry(e.target.value)} fullWidth />
                        <Input
                          label="Location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          fullWidth
                          startAdornment={<MapPin size={16} />}
                        />
                        <Input
                          label="Founded Year"
                          type="number"
                          placeholder="e.g. 2022"
                          value={foundedYear}
                          onChange={(e) => setFoundedYear(e.target.value)}
                          fullWidth
                          startAdornment={<Calendar size={16} />}
                        />
                        <Input
                          label="Team Size"
                          type="number"
                          placeholder="e.g. 5"
                          value={teamSize}
                          onChange={(e) => setTeamSize(e.target.value)}
                          fullWidth
                          startAdornment={<Users size={16} />}
                        />
                        <Input
                          label="Funding Needed (Current Round)"
                          placeholder="e.g. $2M Series A"
                          value={fundingNeeded}
                          onChange={(e) => setFundingNeeded(e.target.value)}
                          fullWidth
                          startAdornment={<DollarSign size={16} />}
                        />
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pitch Summary</label>
                        <textarea
                          className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          rows={4}
                          value={pitchSummary}
                          onChange={(e) => setPitchSummary(e.target.value)}
                          placeholder="Describe your startup's mission, product, and traction..."
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ── Investor-specific fields ── */}
                {user.role === 'investor' && (
                  <>
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <DollarSign size={18} className="text-primary-600" />
                        Investment Preferences
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Minimum Investment"
                          placeholder="e.g. $100K"
                          value={minInvestment}
                          onChange={(e) => setMinInvestment(e.target.value)}
                          fullWidth
                        />
                        <Input
                          label="Maximum Investment"
                          placeholder="e.g. $5M"
                          value={maxInvestment}
                          onChange={(e) => setMaxInvestment(e.target.value)}
                          fullWidth
                        />
                        <div className="md:col-span-2">
                          <Input
                            label="Investment Interests (comma-separated)"
                            placeholder="e.g. FinTech, HealthTech, SaaS"
                            value={investmentInterests}
                            onChange={(e) => setInvestmentInterests(e.target.value)}
                            fullWidth
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Input
                            label="Investment Stage (comma-separated)"
                            placeholder="e.g. Pre-seed, Seed, Series A"
                            value={investmentStage}
                            onChange={(e) => setInvestmentStage(e.target.value)}
                            fullWidth
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" type="button" onClick={() => { setName(user.name); setBio(user.bio || ''); }}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isSavingProfile}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          {/* ── Security ── */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    <Badge variant="error" className="mt-1">Not Enabled</Badge>
                  </div>
                  <Button variant="outline" type="button">Enable</Button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Change Password</h3>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <Input label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required fullWidth />
                  <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required fullWidth />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    fullWidth
                    error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : undefined}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" isLoading={isSavingPassword}>Update Password</Button>
                  </div>
                </form>
              </div>
            </CardBody>
          </Card>

        </div>
      </div>
    </div>
  );
};