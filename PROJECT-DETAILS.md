# Business Nexus — Comprehensive Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Backend Architecture](#backend-architecture)
5. [Database Models](#database-models)
6. [API Endpoints](#api-endpoints)
7. [Authentication & Authorization](#authentication--authorization)
8. [Frontend Architecture](#frontend-architecture)
9. [Component Tree](#component-tree)
10. [Pages & Routing](#pages--routing)
11. [Real-Time Features (Socket.IO)](#real-time-features-socketio)
12. [WebRTC Video Calling](#webrtc-video-calling)
13. [Configuration Files](#configuration-files)
14. [Development Scripts](#development-scripts)
15. [Demo Users](#demo-users)

---

## Project Overview

**Business Nexus** is a full-stack platform that connects **entrepreneurs** with **investors**. It facilitates networking through connection requests, real-time messaging, meeting scheduling, video calls, and profile discovery.

- **Role-Based System**: Two user roles — `entrepreneur` and `investor`
- **Cross-Role Networking**: Connections can only exist between different roles (investors cannot connect to investors, entrepreneurs cannot connect to entrepreneurs)
- **Real-Time Communication**: Socket.IO for messaging and WebRTC for peer-to-peer video calls
- **Calendar Management**: Meeting scheduling with conflict detection, accept/reject/cancel workflow

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.5.3 | Type safety |
| Vite | 5.4.2 | Build tool |
| TailwindCSS | 3.4.1 | Utility-first CSS framework |
| React Router | 6.22.1 | Client-side routing |
| Axios | 1.6.7 | HTTP client with JWT interceptor |
| Socket.IO Client | 4.8.3 | Real-time WebSocket client |
| react-big-calendar | 1.20.0 | Calendar UI for meetings |
| lucide-react | 0.344.0 | Icon library |
| date-fns | 3.3.1 | Date formatting |
| moment | 2.30.1 | Date manipulation (calendar) |
| react-hot-toast | 2.4.1 | Toast notifications |
| react-dropzone | 14.2.3 | File upload area |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Express | 5.2.1 | HTTP server framework |
| TypeScript | 6.0.3 | Type safety (server) |
| Mongoose | 9.7.3 | MongoDB ODM |
| Socket.IO | 4.8.3 | Real-time WebSocket server |
| jsonwebtoken | 9.0.3 | JWT authentication |
| bcryptjs | 3.0.3 | Password hashing |
| nodemailer | 9.0.3 | Email sending (Gmail SMTP) |
| cors | 2.8.6 | Cross-origin resource sharing |
| dotenv | 17.4.2 | Environment variables |
| ts-node | 10.9.2 | TypeScript execution |
| nodemon | 3.1.14 | Auto-restart on changes |

### Database
- **MongoDB Atlas** (cloud-hosted) via Mongoose ODM

---

## Project Structure

```
Nexus/
├── index.html                      # Vite entry HTML
├── package.json                    # Frontend dependencies & scripts
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript project references
├── tsconfig.app.json               # TypeScript config for frontend
├── tsconfig.node.json              # TypeScript config for Vite/Node
├── tailwind.config.js              # TailwindCSS with custom theme
├── postcss.config.js               # PostCSS plugins
├── eslint.config.js                # ESLint flat config
├── vercel.json                     # Vercel deployment (SPA rewrites)
├── public/
│   └── logo.svg
├── src/                            # Frontend source
│   ├── main.tsx                    # React entry point
│   ├── App.tsx                     # Root component with routing
│   ├── index.css                   # Tailwind directives
│   ├── vite-env.d.ts               # Vite type refs
│   ├── api/                        # API client modules
│   │   ├── axiosConfig.ts          # Axios instance with JWT interceptor
│   │   ├── connectionApi.ts        # Connection CRUD API
│   │   ├── meetingApi.ts           # Meeting CRUD API
│   │   └── messageApi.ts           # Message API
│   ├── components/                 # Reusable UI components
│   │   ├── chat/
│   │   │   ├── ChatMessage.tsx     # Chat bubble
│   │   │   └── ChatUserList.tsx    # Conversation list
│   │   ├── collaboration/
│   │   │   └── CollaborationRequestCard.tsx
│   │   ├── entrepreneur/
│   │   │   └── EntrepreneurCard.tsx
│   │   ├── investor/
│   │   │   └── InvestorCard.tsx
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx # Protected layout (Navbar+Sidebar+Outlet)
│   │   │   ├── Navbar.tsx          # Top navigation
│   │   │   └── Sidebar.tsx         # Left sidebar navigation
│   │   └── ui/
│   │       ├── Avatar.tsx          # Avatar with status indicator
│   │       ├── Badge.tsx           # Status badge (7 colors)
│   │       ├── Button.tsx          # Button (9 variants, 5 sizes)
│   │       ├── Card.tsx            # Card container (Header/Body/Footer)
│   │       └── Input.tsx           # Form input with label/error
│   ├── context/
│   │   ├── AuthContext.tsx         # Auth state, login/register/logout
│   │   └── SocketContext.tsx       # Socket.IO connection, call handling
│   ├── data/
│   │   └── collaborationRequests.ts # Static dummy collaboration data
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   ├── call/
│   │   │   └── VideoCallPage.tsx
│   │   ├── chat/
│   │   │   └── ChatPage.tsx
│   │   ├── dashboard/
│   │   │   ├── EntrepreneurDashboard.tsx
│   │   │   └── InvestorDashboard.tsx
│   │   ├── deals/
│   │   │   └── DealsPage.tsx
│   │   ├── documents/
│   │   │   └── DocumentsPage.tsx
│   │   ├── entrepreneurs/
│   │   │   └── EntrepreneursPage.tsx
│   │   ├── help/
│   │   │   └── HelpPage.tsx
│   │   ├── investors/
│   │   │   └── InvestorsPage.tsx
│   │   ├── meetings/
│   │   │   └── MeetingsPage.tsx
│   │   ├── messages/
│   │   │   └── MessagesPage.tsx
│   │   ├── notifications/
│   │   │   └── NotificationsPage.tsx
│   │   ├── profile/
│   │   │   ├── EntrepreneurProfile.tsx
│   │   │   └── InvestorProfile.tsx
│   │   └── settings/
│   │       └── SettingsPage.tsx
│   └── types/
│       └── index.ts                # All TypeScript interfaces
└── server/                         # Backend source
    ├── package.json                # Server dependencies
    ├── tsconfig.json               # Server TypeScript config
    ├── test.js                     # Standalone DB test script
    ├── .env                        # Environment variables
    └── src/
        ├── server.ts               # Express app, HTTP server, Socket.IO setup
        ├── config/
        │   └── db.ts               # MongoDB connection
        ├── controllers/
        │   ├── authController.ts
        │   ├── connectionController.ts
        │   ├── meetingController.ts
        │   ├── messageController.ts
        │   └── profileController.ts
        ├── middleware/
        │   └── authMiddleware.ts   # JWT Bearer token verification
        ├── models/
        │   ├── User.ts             # Base User + Entrepreneur/Investor discriminators
        │   ├── Connection.ts       # Connection requests
        │   ├── Meeting.ts          # Meetings
        │   └── Message.ts          # Messages
        ├── routes/
        │   ├── authRoutes.ts
        │   ├── connectionRoutes.ts
        │   ├── meetingRoutes.ts
        │   ├── messageRoutes.ts
        │   └── profileRoutes.ts
        ├── scripts/
        │   └── seedDemoUsers.ts    # Creates demo entrepreneur & investor
        └── utils/
            ├── generateToken.ts    # JWT generation
            └── sendEmail.ts        # Nodemailer Gmail SMTP
```

---

## Backend Architecture

### Entry Point (`server/src/server.ts`)

1. Loads environment variables via `dotenv.config()`
2. Connects to MongoDB and seeds demo users
3. Creates Express app and HTTP server
4. Initializes Socket.IO server on the same HTTP server
5. Configures CORS for `http://localhost:5173`
6. Mounts all route handlers under `/api`
7. Request logger middleware logs every request to console
8. Sets up Socket.IO event handlers for messaging and WebRTC signaling
9. Listens on port 5000 (configurable via `PORT` env)

### Middleware

#### `authMiddleware.ts` — JWT Bearer Token Verification (`protect`)
- Extracts Bearer token from `Authorization` header
- Verifies JWT with `JWT_SECRET` from environment
- Looks up user by decoded `id` (excluding password field)
- Attaches user to `req.user` if valid
- Returns `401` for missing/invalid tokens or non-existent users

### Utilities

#### `generateToken.ts`
- Creates a JSON Web Token with `{ id: userId }` payload
- Expiration configured via `JWT_EXPIRES_IN` env (default: 7 days)

#### `sendEmail.ts`
- Creates a Nodemailer transport using Gmail SMTP
- Credentials from `EMAIL_FROM` and `EMAIL_APP_PASSWORD` env vars
- Sends HTML emails with given subject and recipient
- Logs success/failure to console

### Config

#### `db.ts` — MongoDB Connection
- Connects to `MONGODB_URI` using Mongoose
- Logs connection host on success, exits on failure

### Seed Script

#### `seedDemoUsers.ts`
Creates two demo accounts if they don't already exist:
- **Sarah Johnson** (entrepreneur): sarah@techwave.io / password123 — TechWave AI, AI industry, San Francisco
- **Michael Chen** (investor): michael@vcinnovate.com / password123 — VC Innovate, AI/SaaS/Fintech interests, Seed/Series A

---

## Database Models

### User (`User.ts`)
**Collection**: `users`

#### Base Schema
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `name` | String | Yes | — | Display name |
| `email` | String | Yes | — | Unique |
| `password` | String | Yes | — | Hashed via `bcryptjs` (salt rounds: 10) |
| `role` | String | Yes | — | `"entrepreneur"` or `"investor"` |
| `avatarUrl` | String | No | — | Falls back to `ui-avatars.com` |
| `bio` | String | No | — | User biography |
| `isOnline` | Boolean | No | false | Online status |
| `profileViews` | Number | No | 0 | Tracked via `$inc` on profile visits |
| `upcomingMeetings` | Number | No | 0 | Cached count (also computed live) |
| `notifications` | Array | No | `[]` | Array of `{ type, user: {name, avatar}, content, time, unread }` |
| `resetPasswordToken` | String | No | — | Hashed SHA-256 of reset token |
| `resetPasswordExpire` | Date | No | — | Expires 10 minutes after generation |

**Timestamps**: `createdAt`, `updatedAt` (auto)
**Discriminator Key**: `role`

#### Methods
- `matchPassword(enteredPassword)` — Compares plaintext with bcrypt hash
- `getResetPasswordToken()` — Generates random 20-byte hex token, stores SHA-256 hash, sets 10-min expiry

#### Pre-Save Hook
- If `password` field is modified, hashes it with `bcryptjs` (salt rounds: 10)

#### Entrepreneur Discriminator
Extends base User with entrepreneur-specific fields:

| Field | Type | Default |
|-------|------|---------|
| `startupName` | String | — |
| `pitchSummary` | String | — |
| `fundingNeeded` | String | — |
| `industry` | String | — |
| `location` | String | — |
| `foundedYear` | Number | — |
| `teamSize` | Number | — |

#### Investor Discriminator
Extends base User with investor-specific fields:

| Field | Type | Default |
|-------|------|---------|
| `investmentInterests` | String[] | — |
| `investmentStage` | String[] | — |
| `portfolioCompanies` | String[] | — |
| `totalInvestments` | Number | 0 |
| `minimumInvestment` | String | — |
| `maximumInvestment` | String | — |

---

### Connection (`Connection.ts`)
**Collection**: `connections`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `requester` | ObjectId (ref: User) | Yes | Who sent the request |
| `recipient` | ObjectId (ref: User) | Yes | Who receives the request |
| `status` | String | Yes (default: `pending`) | `pending` / `accepted` / `rejected` |
| `message` | String | No | Optional intro message (max 500 chars) |

**Indexes**:
- `{ requester: 1, recipient: 1 }` — **Unique** (prevents duplicate requests)
- `{ recipient: 1, status: 1 }` — Fast lookup for incoming requests
- `{ requester: 1, status: 1 }` — Fast lookup for outgoing requests

**Business Rules**:
- Only cross-role connections allowed (investor ↔ entrepreneur)
- Cannot connect with yourself
- Rejected requests can be re-sent (updates to `pending`)

---

### Meeting (`Meeting.ts`)
**Collection**: `meetings`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | String | Yes | Meeting title (trimmed) |
| `organizer` | ObjectId (ref: User) | Yes | Who created the meeting |
| `attendee` | ObjectId (ref: User) | Yes | Who is invited |
| `startTime` | Date | Yes | Start datetime |
| `endTime` | Date | Yes | End datetime |
| `status` | String | Yes (default: `pending`) | `pending` / `accepted` / `rejected` / `cancelled` |
| `message` | String | No | Optional invitation message |
| `location` | String | No | Location or virtual meeting link |
| `notes` | String | No | Additional notes |

**Indexes**:
- `{ organizer: 1, startTime: 1, endTime: 1 }` — Conflict detection for organizer
- `{ attendee: 1, startTime: 1, endTime: 1 }` — Conflict detection for attendee

**Business Rules**:
- Must be connected (accepted) to schedule a meeting
- Cannot schedule with yourself
- Cannot schedule in the past
- End time must be after start time
- Conflict detection checks both participants' existing accepted meetings
- Only attendee can accept/reject pending meetings
- Only organizer can cancel or update pending meetings
- Upon acceptance, both participants' `upcomingMeetings` incremented
- Upon cancellation of accepted meeting, both participants' `upcomingMeetings` decremented
- Only cancelled/rejected meetings can be deleted

---

### Message (`Message.ts`)
**Collection**: `messages`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `senderId` | ObjectId (ref: User) | Yes | Message sender |
| `receiverId` | ObjectId (ref: User) | Yes | Message recipient |
| `content` | String | Yes | Message content |
| `isRead` | Boolean | No (default: false) | Read status |

**Indexes**:
- `{ senderId: 1, receiverId: 1 }` — Conversation queries
- `{ receiverId: 1, senderId: 1 }` — Reverse direction queries
- `{ receiverId: 1, isRead: 1 }` — Unread count queries

**Business Rules**:
- Messages can only be sent between accepted connections (REST endpoint)
- Socket.IO messages are saved to DB regardless of connection status

---

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/register` | Public | Register a new user. Body: `{ name, email, password, role }`. Returns user + JWT token. |
| `POST` | `/api/auth/login` | Public | Authenticate user. Body: `{ email, password, role }`. Returns user + JWT token. |
| `POST` | `/api/auth/forgotpassword` | Public | Request password reset. Body: `{ email }`. Sends HTML email with reset link. |
| `PUT` | `/api/auth/resetpassword/:resettoken` | Public | Reset password. Body: `{ password }`. Returns new JWT token. |
| `PUT` | `/api/auth/updatepassword` | Private | Change password while logged in. Body: `{ currentPassword, newPassword }`. |

### Profiles (`/api/profiles`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/profiles` | Public | Get all profiles. Optional query: `?role=entrepreneur` or `?role=investor`. |
| `GET` | `/api/profiles/me` | Private | Get current user's profile. Computes live `upcomingMeetings` count. |
| `PUT` | `/api/profiles/me/notifications/read` | Private | Mark all notifications as read. |
| `GET` | `/api/profiles/:id` | Public* | Get a user's profile by ID. Increments `profileViews` unless viewer is owner. (*Uses `optionalProtect` middleware to detect self-view.) |
| `PUT` | `/api/profiles/:id` | Private | Update own profile. Updates both base fields and role-specific fields. |

### Connections (`/api/connections`) — All Private

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/connections` | Send a connection request. Body: `{ recipientId, message? }`. Cross-role only. |
| `GET` | `/api/connections` | Get all connections for current user. Optional query: `?status=pending`. |
| `GET` | `/api/connections/status/:userId` | Get connection status with a specific user. Returns `{ status, connectionId, connection? }`. Status: `none` / `pending_sent` / `pending_received` / `accepted`. |
| `PUT` | `/api/connections/:id` | Accept or reject a request. Body: `{ action: 'accepted' | 'rejected' }`. Recipient only. |
| `DELETE` | `/api/connections/:id` | Disconnect (remove any connection). Either participant can disconnect. |

### Meetings (`/api/meetings`) — All Private

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/meetings` | Schedule a meeting. Body: `{ title, attendeeId, startTime, endTime, message?, location? }`. Checks connection + conflict. |
| `GET` | `/api/meetings` | Get all meetings for current user. Optional query: `?status=`, `?from=`, `?to=`. |
| `GET` | `/api/meetings/:id` | Get a single meeting by ID. Participant only. |
| `PUT` | `/api/meetings/:id/accept` | Accept a pending meeting. Attendee only. Runs conflict check. |
| `PUT` | `/api/meetings/:id/reject` | Reject a pending meeting. Attendee only. |
| `PUT` | `/api/meetings/:id/cancel` | Cancel a meeting. Organizer only. Decrements `upcomingMeetings` if was accepted. |
| `PUT` | `/api/meetings/:id` | Update meeting details. Organizer only, pending only. Reruns conflict check if times changed. |
| `DELETE` | `/api/meetings/:id` | Delete a cancelled/rejected meeting. Either participant. |

### Messages (`/api/messages`) — All Private

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/messages/conversations` | Get all conversations. Uses MongoDB aggregation to find latest message per partner, joins partner user data. |
| `GET` | `/api/messages/:userId` | Get all messages between current user and `:userId` (sorted oldest first). |
| `POST` | `/api/messages` | Send a message via REST. Body: `{ receiverId, content }`. Requires accepted connection. |
| `PUT` | `/api/messages/read/:userId` | Mark all messages from `:userId` to current user as read. |

---

## Authentication & Authorization

### Flow
1. User registers with `name`, `email`, `password`, and `role` (entrepreneur/investor)
2. Password is hashed with `bcryptjs` before storage
3. A JWT token (7-day expiry) is generated and returned
4. Frontend stores token in `localStorage` and includes it in all requests via Axios interceptor
5. Protected routes use `protect` middleware which verifies the JWT Bearer token
6. The `AuthContext` polls `/api/profiles/me` every 15 seconds to keep user data fresh

### Password Reset Flow
1. User submits email via `/api/auth/forgotpassword`
2. Server generates a random 20-byte hex token, stores SHA-256 hash, sets 10-min expiry
3. An HTML email is sent with a link to `${FRONTEND_URL}/reset-password?token=...`
4. User clicks link, enters new password on Reset Password page
5. Server hashes the token from URL, finds user with matching hashed token and non-expired expiry, sets new password

### JWT Payload
```json
{ "id": "<mongodb-object-id>" }
```

---

## Frontend Architecture

### State Management
- **AuthContext** (`src/context/AuthContext.tsx`): Manages user authentication state, login, register, logout, forgot/reset password, profile update, notification marking. Stores user in localStorage. Polls `/profiles/me` every 15 seconds.
- **SocketContext** (`src/context/SocketContext.tsx`): Manages Socket.IO connection to `http://localhost:5000`. Registers user on connect. Listens for incoming calls with a full-screen modal overlay.

### API Layer (`src/api/`)
All API modules use the shared Axios instance from `axiosConfig.ts`:
- **axiosConfig.ts**: Creates axios instance with `baseURL: 'http://localhost:5000/api'`. Request interceptor attaches JWT `Bearer` token from localStorage.
- **connectionApi.ts**: `sendConnectionRequest`, `respondToRequest`, `disconnect`, `getMyConnections`, `getConnectionStatus`
- **meetingApi.ts**: `scheduleMeeting`, `getMeetings`, `getMeetingById`, `acceptMeeting`, `rejectMeeting`, `cancelMeeting`, `updateMeeting`, `deleteMeeting`
- **messageApi.ts**: `getConversations`, `getMessagesBetweenUsers`, `markMessagesAsRead`, `sendMessageREST`

### UI Component Library (`src/components/ui/`)
- **Button**: 9 variants (primary/secondary/accent/outline/ghost/link/success/warning/error), 5 sizes, loading spinner
- **Card**: Compound component with Card, CardHeader, CardBody, CardFooter
- **Input**: Form input with label, error message, helper text, adornments, forwardRef
- **Avatar**: Image with 5 sizes, online/offline/away/busy status indicators, fallback to ui-avatars.com
- **Badge**: 7 color variants, 3 sizes

### Custom Tailwind Theme (`tailwind.config.js`)
Extended colors: `primary` (blue), `secondary` (teal), `accent` (amber), `success` (green), `warning` (yellow), `error` (red). Custom animations: `fade-in`, `slide-in`.

---

## Component Tree

```
<App>
  <AuthProvider>
    <Router>
      <SocketProvider>
        <Toaster />
        <Routes>
          ├── /login → <LoginPage />
          ├── /register → <RegisterPage />
          ├── /forgot-password → <ForgotPasswordPage />
          ├── /reset-password → <ResetPasswordPage />
          └── <DashboardLayout> (protected)
              ├── <Navbar />       — Top bar: logo, nav links, avatar, logout
              ├── <Sidebar />       — Left nav, role-based items
              └── <Outlet>
                  ├── /dashboard/entrepreneur → <EntrepreneurDashboard />
                  │   ├── Stats cards (pending reqs, connections, meetings, views)
                  │   ├── Connection requests list (accept/decline)
                  │   └── Recommended investors grid
                  ├── /dashboard/investor → <InvestorDashboard />
                  │   ├── Stats cards (startups, industries, connections)
                  │   ├── Connection requests list
                  │   └── Filterable entrepreneurs grid
                  ├── /profile/entrepreneur/:id → <EntrepreneurProfile />
                  │   ├── Profile header + Connect button
                  │   ├── About, startup, team, funding sections
                  │   ├── Documents section
                  │   └── Collaboration requests
                  ├── /profile/investor/:id → <InvestorProfile />
                  │   ├── Profile header + Connect button
                  │   ├── About, interests, portfolio sections
                  │   └── Investment details
                  ├── /investors → <InvestorsPage />
                  │   └── Search + filter + investor cards grid
                  ├── /entrepreneurs → <EntrepreneursPage />
                  │   └── Search + filter + entrepreneur cards grid
                  ├── /messages → <MessagesPage />
                  │   └── <ChatUserList /> conversation list
                  ├── /chat/:userId? → <ChatPage />
                  │   ├── <ChatUserList /> sidebar
                  │   ├── Message area with <ChatMessage /> bubbles
                  │   └── Voice/video call buttons
                  ├── /meetings → <MeetingsPage />
                  │   ├── react-big-calendar (dark theme)
                  │   ├── Schedule modal
                  │   ├── Meeting detail panel (accept/reject/cancel)
                  │   └── Sidebar list with status filters
                  ├── /call/:roomId → <VideoCallPage />
                  │   ├── Local video (PIP)
                  │   ├── Remote video (full screen)
                  │   └── Mute/camera/end controls
                  ├── /notifications → <NotificationsPage />
                  │   ├── Connection requests (inline accept/decline)
                  │   └── General notifications list
                  ├── /documents → <DocumentsPage />
                  │   └── File listing + upload UI (static data)
                  ├── /deals → <DealsPage />
                  │   └── Investment deals table (static data)
                  ├── /settings → <SettingsPage />
                  │   ├── Profile editing form
                  │   └── Password change form
                  └── /help → <HelpPage />
                      ├── FAQ list
                      ├── Support cards
                      └── Contact form
```

---

## Pages & Routing

### Authentication Pages
| Page | Route | Description |
|------|-------|-------------|
| LoginPage | `/login` | Email/password/role form. Demo quick-login buttons for Sarah (entrepreneur) & Michael (investor). |
| RegisterPage | `/register` | Name/email/password/role with terms checkbox. |
| ForgotPasswordPage | `/forgot-password` | Email input → success state with "Check your email" view. |
| ResetPasswordPage | `/reset-password` | Token from URL `?token=`. New password + confirm. Invalid token error state. |

### Protected Pages (wrapped in `DashboardLayout`)
| Page | Route | Description |
|------|-------|-------------|
| EntrepreneurDashboard | `/dashboard/entrepreneur` | Metrics overview + connection management + investor discovery |
| InvestorDashboard | `/dashboard/investor` | Metrics + connection management + startup discovery with search/filter |
| EntrepreneurProfile | `/profile/entrepreneur/:id` | Full profile with dynamic Connect button (handles all connection states) |
| InvestorProfile | `/profile/investor/:id` | Full profile with dynamic Connect button |
| InvestorsPage | `/investors` | Directory with search + filter (stage, interests, location) |
| EntrepreneursPage | `/entrepreneurs` | Directory with search + filter (industry, funding, location) |
| ChatPage | `/chat/:userId?` | Real-time chat via Socket.IO. Connection gate. Voice/video call buttons. |
| MessagesPage | `/messages` | Conversation list (uses ChatUserList component) |
| MeetingsPage | `/meetings` | Full calendar (react-big-calendar) + schedule/manage meetings |
| VideoCallPage | `/call/:roomId` | WebRTC peer-to-peer video call with mute/camera/hangup |
| NotificationsPage | `/notifications` | Inbox with inline accept/decline for connection requests |
| DocumentsPage | `/documents` | Document listing with storage bar (static dummy data) |
| SettingsPage | `/settings` | Profile editing + password change |
| HelpPage | `/help` | FAQ + support + contact form |
| DealsPage | `/deals` | Investment deals table with stats (static dummy data) |

### Route Configuration (`App.tsx`)
```tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  <Route path="/reset-password" element={<ResetPasswordPage />} />
  <Route element={<DashboardLayout />}>
    <Route path="/dashboard/entrepreneur" element={<EntrepreneurDashboard />} />
    <Route path="/dashboard/investor" element={<InvestorDashboard />} />
    <Route path="/profile/entrepreneur/:id" element={<EntrepreneurProfile />} />
    <Route path="/profile/investor/:id" element={<InvestorProfile />} />
    <Route path="/investors" element={<InvestorsPage />} />
    <Route path="/entrepreneurs" element={<EntrepreneursPage />} />
    <Route path="/messages" element={<MessagesPage />} />
    <Route path="/chat/:userId?" element={<ChatPage />} />
    <Route path="/meetings" element={<MeetingsPage />} />
    <Route path="/call/:roomId" element={<VideoCallPage />} />
    <Route path="/notifications" element={<NotificationsPage />} />
    <Route path="/documents" element={<DocumentsPage />} />
    <Route path="/deals" element={<DealsPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/help" element={<HelpPage />} />
  </Route>
  <Route path="/" element={<Navigate to="/login" replace />} />
  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
```

---

## Real-Time Features (Socket.IO)

### Server-Side (`server/src/server.ts`)

**User Tracking**: A `Map<string, string>` maps `userId → socketId` for direct message delivery.

| Event | Direction | Description |
|-------|-----------|-------------|
| `register` | Client → Server | Client sends `userId` upon connection. Server maps socketId to userId. |
| `sendMessage` | Client → Server | `{ senderId, receiverId, content }`. Saved to DB. Emitted to sender (`messageSent`) and receiver (`receiveMessage`) if online. |
| `call-user` | Client → Server | `{ userToCallId, callerId, callerName, roomId, isVideo }`. Server forwards `incoming-call` to receiver's socket. |
| `decline-call` | Client → Server | `{ callerId }`. Server forwards `call-declined` back to the caller. |
| `join-call` | Client → Server | `roomId`. Socket joins the room. Server emits `user-connected` to other peers in the room. |
| `webrtc-offer` | Client → Server | `{ offer, roomId }`. Forwarded to other peers in the room. |
| `webrtc-answer` | Client → Server | `{ answer, roomId }`. Forwarded to other peers in the room. |
| `webrtc-ice-candidate` | Client → Server | `{ candidate, roomId }`. Forwarded to other peers in the room. |
| `leave-call` | Client → Server | `roomId`. Socket leaves the room. Server emits `user-disconnected` to other peers. |
| `disconnect` | Built-in | Server removes userId from the Map. |

### Client-Side (SocketContext)

- Connects to `http://localhost:5000` via Socket.IO client
- Registers user on connection with their userId
- Listens for `incoming-call` events and shows a full-screen modal overlay with caller info and Accept/Decline buttons
- On accept: navigates to `/call/:roomId`
- The overlay is rendered at the App level for global call notifications

---

## WebRTC Video Calling

### Signaling Flow (via Socket.IO)
1. Caller clicks call button → generates a UUID `roomId` → emits `call-user` via socket
2. Receiver's socket receives `incoming-call` → SocketContext shows accept/decline modal
3. Receiver accepts → navigates to `/call/:roomId` → VideoCallPage joins the room
4. Caller also navigates to `/call/:roomId` after hearing `call-declined` or timeout
5. Both peers create `RTCPeerConnection`, get local media stream
6. Peer 1 creates an SDP offer → sets local description → sends via `webrtc-offer`
7. Peer 2 receives offer → sets remote description → creates answer → sends via `webrtc-answer`
8. ICE candidates are exchanged via `webrtc-ice-candidate` as they're discovered
9. Remote stream is displayed once tracks are received

### VideoCallPage Features
- Local video displayed in Picture-in-Picture (small overlay)
- Remote video displayed full-screen
- Controls: mute/unmute microphone, toggle camera, end call
- Uses `navigator.mediaDevices.getUserMedia({ video: true, audio: true })`

---

## Configuration Files

### Environment Variables (`server/.env`)
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=supersecretjwtkey_please_change_in_production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
EMAIL_FROM=...
EMAIL_APP_PASSWORD=...
```

### Vite Config (`vite.config.ts`)
```ts
export default defineConfig({
  plugins: [react()],
  optimizeDeps: { exclude: ['lucide-react'] },
});
```

### Tailwind Config (`tailwind.config.js`)
- Content paths: `./index.html`, `./src/**/*.{js,ts,jsx,tsx}`
- Extended colors: primary (blue), secondary (teal), accent (amber), success/warning/error
- Custom animations: `fade-in`, `slide-in`
- Font: Inter

### ESLint Config (`eslint.config.js`)
- Flat config format
- Plugins: `@eslint/js`, `typescript-eslint`, `react-hooks`, `react-refresh`
- Ignores: `dist`
- Browser globals

### Vercel Config (`vercel.json`)
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```
SPA rewrite rule for client-side routing.

### Server TypeScript (`server/tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "strict": true
  }
}
```

---

## Development Scripts

### Frontend (root `package.json`)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Production build via `vite build` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

### Backend (`server/package.json`)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start with `nodemon` (auto-restart on changes) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled JS from `dist/` |

---

## Demo Users

The seed script (`server/src/scripts/seedDemoUsers.ts`) creates two accounts on first run:

### Entrepreneur — Sarah Johnson
- **Email**: `sarah@techwave.io`
- **Password**: `password123`
- **Role**: entrepreneur
- **Startup**: TechWave AI
- **Industry**: Artificial Intelligence
- **Location**: San Francisco, CA
- **Funding Needed**: $1.5M
- **Founded**: 2023
- **Team Size**: 5
- **Bio**: Passionate about building AI-driven solutions. 10+ years in software engineering.
- **Profile Views**: 120

### Investor — Michael Chen
- **Email**: `michael@vcinnovate.com`
- **Password**: `password123`
- **Role**: investor
- **Company**: VC Innovate
- **Interests**: Artificial Intelligence, SaaS, Fintech
- **Stages**: Seed, Series A
- **Portfolio**: CloudNative, DataFlow, FinSecure
- **Investment Range**: $100k – $2M
- **Total Investments**: 12
- **Bio**: Managing Partner at VC Innovate. Focus on early-stage AI and SaaS startups.
- **Profile Views**: 85
