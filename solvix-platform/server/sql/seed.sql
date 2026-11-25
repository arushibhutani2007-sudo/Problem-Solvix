-- Demo Seed Data for Solvix Platform
-- Password for demo accounts: Password@123 (bcrypt hash)
INSERT INTO users (username, email, password_hash, anonymous_alias, avatar_color, reputation) VALUES
('arushi_dev', 'arushi@jiit.ac.in', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CipherFox#402', '#8b5cf6', 340),
('anahita_codes', 'anahita@jiit.ac.in', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'NeonOwl#819', '#06b6d4', 295),
('nitish_mentor', 'nitish@jiit.ac.in', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'QuantumSage#101', '#10b981', 820);

INSERT INTO problems (user_id, title, description, code_snippet, category, tags, is_anonymous, status, views) VALUES
(1, 'PostgreSQL connection pool exhaustion in Node.js Express under concurrent requests',
 'We are running an Express REST API with node-postgres (pg). Under load testing (150+ concurrent requests), queries hang and throw "timeout exceeded when trying to connect". Closing clients manually in some routes broke transactions. What is the cleanest pooling pattern?',
 'const { Pool } = require("pg");
const pool = new Pool({ max: 10 });
// Some routes call pool.connect() without client.release() on thrown errors',
 'Programming', ARRAY['postgresql', 'nodejs', 'express', 'connection-pool'], TRUE, 'Verified', 142),

(2, 'React useEffect infinite re-render loop when syncing URL query filters with state',
 'Whenever a user selects tags or categories in our search filter bar, updating searchParams triggers useEffect which resets local filter state and triggers another navigation cycle.',
 'useEffect(() => {
  setFilters(parseParams(searchParams));
}, [searchParams, filters]);',
 'Programming', ARRAY['react', 'hooks', 'javascript', 'frontend'], FALSE, 'Verified', 98),

(1, 'How to prove Master Theorem Case 2 edge case with logarithmic factors in Algorithms?',
 'In our Semester-5 Design & Analysis of Algorithms tutorial, we have T(n) = 2T(n/2) + n log n. Standard basic forms only cover n^c, how do we formally justify the extra log factor?',
 NULL,
 'Academic', ARRAY['algorithms', 'master-theorem', 'complexity', 'dsa'], TRUE, 'Verified', 76),

(2, 'Docker container cannot reach host PostgreSQL on Linux without hardcoding IP',
 'On macOS host.docker.internal works out of the box, but on Ubuntu 24.04 our backend container fails with ECONNREFUSED 127.0.0.1:5432.',
 'DATABASE_URL=postgresql://postgres:pass@localhost:5432/solvix_db',
 'DevOps & Systems', ARRAY['docker', 'linux', 'postgresql', 'networking'], TRUE, 'Open', 64);

INSERT INTO solutions (problem_id, user_id, content, code_block, is_anonymous, upvotes, success_count, failure_count, attempt_count, success_rate) VALUES
(1, 3, 'Always wrap dedicated client checkouts in a try / finally block so client.release() runs even when a query throws. For single queries, use pool.query() directly which auto-releases.',
 'const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("INSERT INTO problems...");
  await client.query("COMMIT");
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
} finally {
  client.release();
}',
 FALSE, 24, 18, 1, 19, 94.74),

(1, 2, 'Increase idleTimeoutMillis and set connectionTimeoutMillis so failing requests fail fast instead of piling up in the event loop.',
 'const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});',
 TRUE, 11, 7, 3, 10, 70.00),

(2, 1, 'Remove `filters` from the dependency array and derive state directly from `searchParams` using useMemo instead of duplicating state in useEffect.',
 'const activeFilters = useMemo(() => parseParams(searchParams), [searchParams]);',
 FALSE, 19, 14, 0, 14, 100.00),

(3, 3, 'Use the Extended Master Theorem: when f(n) = Theta(n^(log_b a) * log^k n), the runtime resolves directly to Theta(n^(log_b a) * log^(k+1) n). Here a=2, b=2, k=1 => Theta(n log^2 n).',
 NULL,
 FALSE, 15, 11, 0, 11, 100.00);

INSERT INTO comments (solution_id, user_id, body, is_anonymous) VALUES
(1, 1, 'Tested this with k6 at 300 VUs — zero connection leaks after adding the finally block!', TRUE),
(3, 2, 'Removing duplicate state completely fixed the flicker too. Thanks!', FALSE);

INSERT INTO user_activity (user_id, action_type, problem_id, metadata) VALUES
(1, 'POSTED_PROBLEM', 1, '{"title": "PostgreSQL connection pool exhaustion in Node.js"}'),
(1, 'TESTED_OUTCOME', 1, '{"outcome": "success", "solution_id": 1}'),
(2, 'SUBMITTED_SOLUTION', 1, '{"problem_id": 1}'),
(2, 'POSTED_PROBLEM', 2, '{"title": "React useEffect infinite re-render loop"}');
