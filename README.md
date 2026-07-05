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
