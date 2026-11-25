-- Solvix PostgreSQL Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS user_activity CASCADE;
DROP TABLE IF EXISTS solution_outcomes CASCADE;
DROP TABLE IF EXISTS solution_votes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS solutions CASCADE;
DROP TABLE IF EXISTS problems CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    anonymous_alias VARCHAR(60) NOT NULL,
    avatar_color VARCHAR(20) DEFAULT '#6366f1',
    reputation INT DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Problems Table (Knowledge Base)
CREATE TABLE problems (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    code_snippet TEXT,
    category VARCHAR(60) NOT NULL DEFAULT 'Programming',
    tags TEXT[] DEFAULT '{}',
    is_anonymous BOOLEAN DEFAULT TRUE,
    status VARCHAR(30) DEFAULT 'Open', -- Open, Verified, Solved
    views INT DEFAULT 1,
    moderation_status VARCHAR(20) DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Solutions Table
CREATE TABLE solutions (
    id SERIAL PRIMARY KEY,
    problem_id INT REFERENCES problems(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    code_block TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    upvotes INT DEFAULT 0,
    success_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,
    attempt_count INT DEFAULT 0,
    success_rate NUMERIC(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Solution Outcomes (Tracks individual user verification: Success / Failure)
CREATE TABLE solution_outcomes (
    id SERIAL PRIMARY KEY,
    solution_id INT REFERENCES solutions(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('success', 'failure')),
    notes VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(solution_id, user_id)
);

-- 5. Solution Votes
CREATE TABLE solution_votes (
    id SERIAL PRIMARY KEY,
    solution_id INT REFERENCES solutions(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    vote_type INT NOT NULL CHECK (vote_type IN (1, -1)),
    UNIQUE(solution_id, user_id)
);

-- 6. Threaded Comments & Replies
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    solution_id INT REFERENCES solutions(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    parent_id INT REFERENCES comments(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. User Activity History
CREATE TABLE user_activity (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- POSTED_PROBLEM, SUBMITTED_SOLUTION, TESTED_OUTCOME, UPVOTED, SEARCHED
    problem_id INT REFERENCES problems(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_problems_category ON problems(category);
CREATE INDEX idx_problems_tags ON problems USING GIN(tags);
CREATE INDEX idx_solutions_problem ON solutions(problem_id);
CREATE INDEX idx_activity_user ON user_activity(user_id);
