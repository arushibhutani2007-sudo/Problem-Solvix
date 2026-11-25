# Solvix — Smart Problem-Solving & Verified Knowledge Base

**B.Tech Semester-5 Full Stack Development Lab Project**  
**Jaypee Institute of Information Technology (JIIT), Sector 128, Noida**  
**Submitted by:** Arushi (992401030244) & Anahita (992401030251)  
**Submitted to:** Mr. Nitish

---

## Overview
**Solvix** is a full-stack centralized problem-solving platform that unifies anonymous problem posting, multi-source external solution discovery (**Stack Overflow / Stack Exchange**, **Reddit**, and **GitHub**), community solutions with nested discussions, and **empirical outcome verification** (Success Rate & Attempt Tracking).

## Tech Stack
- **Frontend:** React.js (Vite), HTML5, CSS3 (Custom Glassmorphism & Bento Grid UI, Responsive Dark Theme), Lucide Icons
- **Backend:** Node.js, Express.js, JWT Authentication, Bcrypt, Content Moderation Filter
- **Database:** PostgreSQL (`pg` driver, relational schema with triggers/indexes, plus automatic fallback/seed script)
- **External APIs:** Stack Exchange API v2.3, Reddit Public JSON/Data API, GitHub REST API v3

---

## Quick Start Guide

### 1. Database Setup (PostgreSQL)
Make sure PostgreSQL is running locally, then create a database named `solvix_db`:
```sql
CREATE DATABASE solvix_db;
```
Run the schema and seed SQL:
```bash
psql -U postgres -d solvix_db -f server/sql/schema.sql
psql -U postgres -d solvix_db -f server/sql/seed.sql
```

### 2. Backend Setup
```bash
cd server
cp .env.example .env   # Update DATABASE_URL with your PostgreSQL credentials
npm install
npm run dev
```
The Express server runs on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
The React app runs on `http://localhost:5173`.

---

## Key Features Implemented
1. **Anonymous & Authenticated Posting:** Toggle full anonymity (`Anonymous Solver #XXXX`) when posting problems while still linking activity privately to your personal dashboard.
2. **Automated Content Moderation Pipeline:** Real-time keyword/spam/toxicity screening before storing problems or solutions in the Knowledge Base (matching the synopsis flowchart).
3. **Federated External API Search & Ranking Engine:** Queries Stack Exchange, Reddit, and GitHub simultaneously, merges results with local Knowledge Base solutions, and ranks them by relevance, votes, and verified success rate.
4. **Solution Outcome Verification ("Did It Work?"):** Users mark solutions as **Worked (Success)** or **Didn't Work (Failure)**, dynamically recalculating each solution's empirical **Success Rate %** and **Attempt Count**.
5. **Nested Community Discussions & Upvoting:** Submit markdown/code solutions, upvote helpful answers, and post threaded comments/replies.
6. **Personalized Analytics Dashboard:** Track posted problems, solutions contributed, success outcomes tested, reputation score, and saved/revisited knowledge base items.
