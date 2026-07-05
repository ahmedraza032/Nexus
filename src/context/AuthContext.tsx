import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import toast from 'react-hot-toast';
import api from '../api/axiosConfig';

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = 'business_nexus_user';
const RESET_TOKEN_KEY = 'business_nexus_reset_token';

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on initial load
  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Optionally, verify token or fetch fresh profile data here
          // const response = await api.get('/profiles/me');
          // setUser({ ...response.data, token: parsedUser.token });
        } catch (error) {
          console.error("Failed to restore session", error);
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password, role });
      const loggedInUser = response.data;
      
      // Ensure 'id' is mapped if backend returned '_id'
      if (loggedInUser._id && !loggedInUser.id) {
        loggedInUser.id = loggedInUser._id;
      }

      setUser(loggedInUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
      toast.success('Successfully logged in!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to log in';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      const newUser = response.data;

      if (newUser._id && !newUser.id) {
        newUser.id = newUser._id;
      }

      setUser(newUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      toast.success('Account created successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to register';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await api.post('/auth/forgotpassword', { email });
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send reset instructions';
      toast.error(message);
      throw new Error(message);
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      await api.put(`/auth/resetpassword/${token}`, { password: newPassword });
      toast.success('Password reset successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to reset password';
      toast.error(message);
      throw new Error(message);
    }
  };

  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      // If we're updating the currently logged-in user, use /me, or use /:id
      const targetId = userId === user?.id ? 'me' : userId;
      // Note: backend expects PUT /api/profiles/:id. 'me' isn't supported for PUT right now,
      // so we pass userId directly.
      const response = await api.put(`/profiles/${userId}`, updates);
      
      const updatedUser = response.data;
      if (updatedUser._id && !updatedUser.id) {
        updatedUser.id = updatedUser._id;
      }

      // Preserve the token
      const fullUpdatedUser = { ...user, ...updatedUser, token: user?.token || updatedUser.token };
      
      if (user?.id === userId) {
        setUser(fullUpdatedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fullUpdatedUser));
      }
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      throw new Error(message);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};