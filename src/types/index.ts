export type UserRole = 'entrepreneur' | 'investor';

export interface AppNotification {
  id?: string;
  _id?: string;
  type: string;
  user: {
    name: string;
    avatar: string;
  };
  content: string;
  time: string;
  unread: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  isOnline?: boolean;
  profileViews?: number;
  upcomingMeetings?: number;
  notifications?: AppNotification[];
  createdAt: string;
}

export interface Entrepreneur extends User {
  role: 'entrepreneur';
  startupName: string;
  pitchSummary: string;
  fundingNeeded: string;
  industry: string;
  location: string;
  foundedYear: number;
  teamSize: number;
}

export interface Investor extends User {
  role: 'investor';
  investmentInterests: string[];
  investmentStage: string[];
  portfolioCompanies: string[];
  totalInvestments: number;
  minimumInvestment: string;
  maximumInvestment: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface CollaborationRequest {
  id: string;
  investorId: string;
  entrepreneurId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  shared: boolean;
  url: string;
  ownerId: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  markNotificationsAsRead: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Meeting Types ────────────────────────────────────────────────────────────

export type MeetingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface MeetingParticipant {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Meeting {
  _id: string;
  title: string;
  organizer: MeetingParticipant;
  attendee: MeetingParticipant;
  startTime: string;   // ISO 8601
  endTime: string;     // ISO 8601
  status: MeetingStatus;
  message?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleMeetingPayload {
  title: string;
  attendeeId: string;
  startTime: string;   // ISO 8601
  endTime: string;     // ISO 8601
  message?: string;
  location?: string;
}

export interface UpdateMeetingPayload {
  title?: string;
  startTime?: string;
  endTime?: string;
  message?: string;
  location?: string;
}

/** Shape expected by react-big-calendar */
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Meeting;
}

// ─── Connection Types ────────────────────────────────────────────────────────────

/** What the server returns for /api/connections/status/:userId */
export type ConnectionClientStatus =
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'accepted';

export interface Connection {
  _id: string;
  requester: MeetingParticipant;
  recipient: MeetingParticipant;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionStatusResponse {
  status: ConnectionClientStatus;
  connectionId: string | null;
  connection?: Connection;
}