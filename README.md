# Full Stack Development Internship Task #2 – Nexus Platform

## Week 1 – Setup & Core Backend Foundations

During the first week, we successfully established the foundational architecture for the Nexus Platform, moving from static dummy data to a fully integrated, database-backed full-stack application.

Here is a summary of the major features implemented:

### 1. Environment & Architecture Setup
- **Full-Stack Integration:** Successfully connected the React frontend with the Express.js / Node.js backend.
- **Database Configuration:** Configured MongoDB using Mongoose to store application data persistently.
- **API Client Setup:** Configured an Axios client (`axiosConfig.ts`) to automatically handle base URLs and inject JWT authentication tokens into request headers.

### 2. User Authentication & Authorization
- **Secure Authentication:** Implemented secure registration and login flows using `bcryptjs` for password hashing and `jsonwebtoken` (JWT) for session management.
- **Role-Based Access Control:** Configured distinct user roles for **Entrepreneurs** and **Investors**, ensuring users are properly categorized upon registration.
- **Password Management:** Built backend capabilities for password resets and updates.

### 3. Advanced Database Modeling
- **Mongoose Discriminators:** Utilized MongoDB schema discriminators to inherit from a base `User` model, allowing distinct, specialized fields for different user roles while keeping them in a single `users` collection.
- **Extended Profiles:** 
  - **Entrepreneur Schema:** Stores specific fields such as `startupName`, `pitchSummary`, `industry`, `fundingNeeded`, `location`, and `teamSize`.
  - **Investor Schema:** Stores specific fields such as `investmentInterests`, `investmentStage`, `portfolioCompanies`, and investment ranges.

### 4. RESTful API Development
- **Auth Routes (`/api/auth`):** Endpoints for `/register`, `/login`, `/forgotpassword`, `/resetpassword`, and `/updatepassword`.
- **Profile Routes (`/api/profiles`):** 
  - `GET /api/profiles`: Fetches all user profiles, with an optional `?role=` query parameter to filter by user type.
  - `GET /api/profiles/me`: Retrieves the currently authenticated user's profile.
  - `GET /api/profiles/:id` & `PUT /api/profiles/:id`: Fetch or update specific user profiles.

### 5. Frontend Dynamic Data Integration
- **Removed Hardcoded Data:** Completely removed the dummy data files (`data/users.ts`) to ensure the application strictly relies on the database.
- **Dynamic Dashboards & Lists:** 
  - **Entrepreneurs Page:** Dynamically fetches and filters startups looking for investment.
  - **Investors Page:** Dynamically fetches and filters active investors.
  - **Dashboards:** Both Investor and Entrepreneur dashboards dynamically pull metrics, recommendations, and recent profiles via the API.
- **Graceful Fallbacks:** Updated components (like the Chat placeholders and Collaboration Requests) to dynamically resolve user profiles by fetching their IDs from the database, preventing app crashes while waiting for future backend features.

---

## Week 2 – Core Platform Features & Real-Time Systems

During the second week, we transformed Nexus from a basic directory into a fully interactive platform with connections, scheduling, real-time messaging, video calls, and document management — all backed by robust backend systems.

Here is a summary of the five milestones completed:

### Milestone 1: Connection Management System

- **Connection Model** (`server/src/models/Connection.ts`): Full connection lifecycle with `pending`, `accepted`, and `rejected` statuses. Unique compound indexes prevent duplicate requests. Cross-role gating ensures entrepreneurs only connect with investors and vice versa.
- **REST API** (`/api/connections`): Endpoints for sending requests, listing connections with status filters, checking connection status between two users, accepting/rejecting requests, and disconnecting.
- **Frontend Integration**:
  - **ConnectButton**: Dynamic 5-state component (`none` → Connect, `pending_sent` → Request Sent, `pending_received` → Accept/Decline, `accepted` → Connected) on all profile pages.
  - **Dashboards**: Inline Accept/Decline for incoming requests with profile previews and intro messages. Stats cards showing pending requests and total connections.
  - **Notifications Page**: Manage all pending requests with Accept/Decline/View Profile actions.
  - **Chat Gate**: Chat access restricted to accepted connections only, with a "Not Connected Yet" lock screen.

### Milestone 2: Meeting & Scheduling System

- **Meeting Model** (`server/src/models/Meeting.ts`): Full-featured scheduling with organizer/attendee roles, start/end times, conflict detection via overlapping time indices, and status lifecycle (`pending` → `accepted`/`rejected`/`cancelled`).
- **REST API** (`/api/meetings`): Schedule meetings (validates connection and checks time conflicts for both parties), accept/reject (attendee only), cancel (organizer only), update meeting details, and delete cancelled/rejected meetings. Automatic `upcomingMeetings` counter management.
- **Frontend Integration**:
  - **MeetingsPage**: Full calendar UI using `react-big-calendar` with Month/Week/Day/Agenda views. Dark-themed custom styling. Click empty slots to schedule, click events to view details.
  - **ScheduleModal**: Form with participant selector (accepted connections only), datetime pickers, location/meeting link, and invitation message.
  - **DetailPanel**: Role-specific action buttons — Accept/Decline for attendees, Cancel for organizers, Delete for resolved meetings. Color-coded status badges.
  - **Profile Integration**: "Schedule Meeting" button visible on connected user profiles.

### Milestone 3: Real-Time Messaging & Chat

- **Message Model** (`server/src/models/Message.ts`): Stores messages with sender/receiver references, content, read status, and timestamps.
- **REST API** (`/api/messages`): List conversations (MongoDB aggregation grouping latest message per partner with user data), fetch message history between two users, send via REST, mark messages as read.
- **Socket.IO Real-Time Layer**: Client registers on connect (`userId → socketId` mapping). `sendMessage` event saves to DB and instantly relays to the receiver if online via `receiveMessage` event. Real-time delivery without page refresh.
- **Frontend Integration**:
  - **ChatPage**: Full chat interface with conversations sidebar (last message preview, online status, unread badges), message history with auto-scroll, and real-time send/receive via Socket.IO.
  - **ChatMessage**: Bubble-style messages — right-aligned blue for sender, left-aligned gray for receiver. Relative timestamps.
  - **ChatUserList**: Conversation list with active state highlighting, unread "New" badges, and partner profile previews.
  - **MessagesPage**: Standalone full-height conversation list for the `/messages` route.

### Milestone 4: Video & Audio Calling (WebRTC)

- **Socket.IO Signaling Layer**: Events for `call-user`, `decline-call`, `join-call`, `leave-call`, and WebRTC signaling (`webrtc-offer`, `webrtc-answer`, `webrtc-ice-candidate`).
- **VideoCallPage**: Full-screen video call with remote video as background, local video as Picture-in-Picture (top-right), mute/unmute toggle, camera on/off toggle, and end call button. Uses `navigator.mediaDevices.getUserMedia` for local media and Google STUN servers for NAT traversal.
- **Incoming Call Modal** (`SocketContext`): Full-screen overlay showing caller name and call type (Audio/Video) with Accept (green) and Decline (red) buttons — appears anywhere in the app when a call arrives.
- **Chat Integration**: Voice call and Video call buttons in the chat header, enabling 1-click call initiation from any conversation.

### Milestone 5: Document Management System

- **Document Model** (`server/src/models/Document.ts`): Stores document metadata (name, type, size, MIME), file path, uploader/owner, shared-with list, version tracking, status (`draft`/`active`/`archived`), and digital signature subdocument.
- **REST API** (`/api/documents`): Upload (multipart, 10MB max), list (own + shared with status filter), view metadata, download as attachment, preview inline for browser rendering, share with users, sign with image upload, update status, and delete (removes files from disk).
- **File Upload Middleware**: Multer-based upload handling for documents (10MB max, PDF/DOC/DOCX/XLS/XLSX/PNG/JPG), signatures (5MB max, images), and avatars (5MB max, images). Timestamp-based unique filenames.
- **Frontend Integration**:
  - **DocumentsPage**: Full document management dashboard with storage usage bar (vs 20GB), status filter sidebar (all/active/draft/archived), search, and document list with action buttons.
  - **DocumentRow**: File-type icons (color-coded), metadata display, shared/signed badges, and hover-action buttons (View, Share, Sign, Delete).
  - **DocumentViewerModal**: Multi-format previewer — PDF via `react-pdf` with page navigation and zoom, DOCX via `mammoth` HTML conversion, XLSX via `xlsx` table rendering, images with zoom, and unsupported fallback.
  - **SignaturePad**: Freehand drawing canvas via `react-signature-canvas` with clear and save functionality.
  - **UploadDocumentModal**: Drag-and-drop file upload via `react-dropzone` with file preview and custom name input.
  - **Share Panel**: Inline user ID input to share documents with other platform users.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework with type safety |
| Vite | Build tool and dev server |
| TailwindCSS | Utility-first CSS framework |
| React Router v6 | Client-side routing |
| Axios | HTTP client with JWT interceptor |
| Socket.IO Client | Real-time messaging and WebRTC signaling |
| react-big-calendar | Calendar for meeting scheduling |
| react-pdf | PDF document preview |
| mammoth | DOCX to HTML conversion |
| xlsx | Spreadsheet parsing and rendering |
| react-signature-canvas | Digital signature pad |
| react-dropzone | Drag-and-drop file upload |
| lucide-react | Icons |
| react-hot-toast | Toast notifications |
| date-fns + moment | Date manipulation |

### Backend
| Technology | Purpose |
|---|---|
| Express 5 + TypeScript | REST API server |
| Mongoose | MongoDB ODM with discriminators |
| Socket.IO | WebSocket server for real-time features |
| jsonwebtoken + bcryptjs | JWT auth and password hashing |
| nodemailer | Email sending (Gmail SMTP) |
| multer | File upload handling |
| cors | Cross-origin resource sharing |

### Database
- MongoDB Atlas (cloud-hosted) with Mongoose ODM
- Collections: `users` (with role discriminators), `connections`, `meetings`, `messages`, `documents`

### Deployment
- **Frontend**: Vercel (auto-deploy from GitHub)
- **Backend**: Render (auto-deploy from GitHub)
- **Database**: MongoDB Atlas

---

## Project Structure

```
Nexus/
├── (Frontend - root)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── .env.development          # Local dev environment variables
│   ├── .env.production           # Production environment variables
│   ├── vercel.json               # Vercel SPA rewrites
│   ├── index.html
│   ├── public/
│   │   ├── logo.svg
│   │   └── pdf.worker.min.mjs    # PDF.js worker
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/                  # Axios-based API modules
│       │   ├── axiosConfig.ts
│       │   ├── authApi.ts
│       │   ├── profileApi.ts
│       │   ├── connectionApi.ts
│       │   ├── meetingApi.ts
│       │   ├── messageApi.ts
│       │   └── documentApi.ts
│       ├── components/
│       │   ├── layout/           # Navbar, Sidebar, DashboardLayout
│       │   ├── ui/               # Reusable UI (Button, Card, Avatar, etc.)
│       │   ├── chat/             # ChatMessage, ChatUserList
│       │   └── documents/        # DocumentRow, Viewer, SignaturePad, UploadModal
│       ├── context/              # AuthContext, SocketContext
│       ├── pages/                # 16+ page components
│       │   ├── dashboard/        # EntrepreneurDashboard, InvestorDashboard
│       │   ├── profile/          # EntrepreneurProfile, InvestorProfile
│       │   ├── chat/             # ChatPage
│       │   ├── call/             # VideoCallPage
│       │   ├── meetings/         # MeetingsPage
│       │   ├── documents/        # DocumentsPage
│       │   ├── notifications/    # NotificationsPage
│       │   ├── messages/         # MessagesPage
│       │   ├── entrepreneurs/    # EntrepreneursPage
│       │   ├── investors/        # InvestorsPage
│       │   ├── settings/         # SettingsPage
│       │   ├── auth/             # LoginPage, RegisterPage, ForgotPasswordPage
│       │   └── landing/          # LandingPage
│       └── types/                # TypeScript interfaces
│
└── server/
    ├── package.json
    ├── tsconfig.json
    ├── .env.example              # Environment variables template
    ├── .env                      # Environment variables (gitignored)
    └── src/
        ├── server.ts             # Entry point (Express + Socket.IO)
        ├── config/db.ts          # MongoDB connection
        ├── controllers/          # Auth, Profile, Connection, Meeting, Message, Document
        ├── middleware/            # Auth (JWT), Upload (multer)
        ├── models/               # User, Connection, Meeting, Message, Document
        ├── routes/               # Express routes
        ├── scripts/              # Seed script for demo users
        └── utils/                # Token generation, email sending
```
