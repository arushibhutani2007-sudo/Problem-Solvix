const express = require('express');
const db = require('../config/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { moderateContent } = require('../services/moderationService');
const { federatedExternalSearch } = require('../services/externalApiService');

const router = express.Router();

// GET /api/problems - Search, Filter & Rank Knowledge Base + Optional External APIs
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { q = '', category = '', tag = '', status = '', includeExternal = 'false' } = req.query;

    const conditions = [`p.moderation_status = 'approved'`];
    const values = [];
    let idx = 1;

    if (q.trim()) {
      conditions.push(`(p.title ILIKE $${idx} OR p.description ILIKE $${idx} OR $${idx + 1} = ANY(p.tags))`);
      values.push(`%${q.trim()}%`, q.trim().toLowerCase());
      idx += 2;
    }

    if (category && category !== 'All') {
      conditions.push(`p.category = $${idx}`);
      values.push(category);
      idx += 1;
    }

    if (tag.trim()) {
      conditions.push(`$${idx} = ANY(p.tags)`);
      values.push(tag.trim().toLowerCase());
      idx += 1;
    }

    if (status && status !== 'All') {
      conditions.push(`p.status = $${idx}`);
      values.push(status);
      idx += 1;
    }

    const sql = `
      SELECT 
        p.id, p.title, p.description, p.code_snippet, p.category, p.tags,
        p.is_anonymous, p.status, p.views, p.created_at,
        CASE WHEN p.is_anonymous THEN COALESCE(u.anonymous_alias, 'Anonymous#000') ELSE COALESCE(u.username, 'CommunityMember') END AS author_display,
        COALESCE(u.avatar_color, '#6366f1') AS avatar_color,
        COUNT(DISTINCT s.id)::int AS solution_count,
        COALESCE(MAX(s.success_rate), 0)::float AS top_success_rate,
        COALESCE(SUM(s.upvotes), 0)::int AS total_upvotes
      FROM problems p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN solutions s ON s.problem_id = p.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY p.id, u.anonymous_alias, u.username, u.avatar_color
      ORDER BY top_success_rate DESC, total_upvotes DESC, p.created_at DESC
    `;

    const kbResult = await db.query(sql, values);

    let externalResults = [];
    if (includeExternal === 'true' && q.trim()) {
      externalResults = await federatedExternalSearch(q.trim());
    }

    res.json({
      problems: kbResult.rows,
      externalResults
    });
  } catch (err) {
    console.error('Fetch problems error:', err);
    res.status(500).json({ error: 'Failed to retrieve problems from Knowledge Base.' });
  }
});

// GET /api/problems/external/search - Dedicated Multi-Source Federated Search
router.get('/external/search', async (req, res) => {
  try {
    const { q = '', sources = 'stackoverflow,reddit,github' } = req.query;
    if (!q.trim()) {
      return res.status(400).json({ error: 'Search query `q` is required.' });
    }
    const sourceList = sources.split(',').map((s) => s.trim().toLowerCase());
    const results = await federatedExternalSearch(q.trim(), sourceList);
    res.json({ query: q.trim(), count: results.length, results });
  } catch (err) {
    console.error('External search error:', err);
    res.status(500).json({ error: 'External API search failed.' });
  }
});

// GET /api/problems/:id - Single Problem Detail + Ranked Solutions + Threaded Comments
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const problemId = parseInt(req.params.id, 10);
    if (Number.isNaN(problemId)) return res.status(400).json({ error: 'Invalid problem ID' });

    await db.query('UPDATE problems SET views = views + 1 WHERE id = $1', [problemId]);

    const problemRes = await db.query(
      `SELECT 
        p.*,
        CASE WHEN p.is_anonymous THEN COALESCE(u.anonymous_alias, 'Anonymous#000') ELSE COALESCE(u.username, 'Member') END AS author_display,
        COALESCE(u.avatar_color, '#8b5cf6') AS avatar_color
       FROM problems p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [problemId]
    );

    if (problemRes.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    const solutionsRes = await db.query(
      `SELECT 
        s.*,
        CASE WHEN s.is_anonymous THEN COALESCE(u.anonymous_alias, 'Anonymous#000') ELSE COALESCE(u.username, 'Member') END AS author_display,
        COALESCE(u.avatar_color, '#06b6d4') AS avatar_color,
        COALESCE(u.reputation, 10) AS author_reputation
       FROM solutions s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.problem_id = $1
       ORDER BY s.success_rate DESC, s.upvotes DESC, s.created_at ASC`,
      [problemId]
    );

    const solutionIds = solutionsRes.rows.map((s) => s.id);
    let comments = [];
    let userVotes = {};
    let userOutcomes = {};

    if (solutionIds.length > 0) {
      const commentsRes = await db.query(
        `SELECT 
          c.*,
          CASE WHEN c.is_anonymous THEN COALESCE(u.anonymous_alias, 'Anonymous#000') ELSE COALESCE(u.username, 'Member') END AS author_display
         FROM comments c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.solution_id = ANY($1::int[])
         ORDER BY c.created_at ASC`,
        [solutionIds]
      );
      comments = commentsRes.rows;

      if (req.user) {
        const votesRes = await db.query(
          'SELECT solution_id, vote_type FROM solution_votes WHERE user_id = $1 AND solution_id = ANY($2::int[])',
          [req.user.id, solutionIds]
        );
        votesRes.rows.forEach((v) => {
          userVotes[v.solution_id] = v.vote_type;
        });

        const outcomesRes = await db.query(
          'SELECT solution_id, outcome FROM solution_outcomes WHERE user_id = $1 AND solution_id = ANY($2::int[])',
          [req.user.id, solutionIds]
        );
        outcomesRes.rows.forEach((o) => {
          userOutcomes[o.solution_id] = o.outcome;
        });
      }
    }

    const enrichedSolutions = solutionsRes.rows.map((sol) => ({
      ...sol,
      userVote: userVotes[sol.id] || 0,
      userOutcome: userOutcomes[sol.id] || null,
      comments: comments.filter((c) => c.solution_id === sol.id)
    }));

    // Also fetch related external discussions automatically based on problem title
    const externalDiscussions = await federatedExternalSearch(problemRes.rows[0].title);

    res.json({
      problem: problemRes.rows[0],
      solutions: enrichedSolutions,
      externalDiscussions: externalDiscussions.slice(0, 6)
    });
  } catch (err) {
    console.error('Problem detail error:', err);
    res.status(500).json({ error: 'Failed to load problem details.' });
  }
});

// POST /api/problems - Create Problem (With Automated Moderation Check)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, code_snippet = '', category = 'Programming', tags = [], is_anonymous = true } = req.body;

    // Step 1: Automated Moderation Gate (from Synopsis Flowchart)
    const mod = moderateContent({ title, description });
    if (!mod.passed) {
      return res.status(422).json({ error: mod.reason, moderationFailed: true });
    }

    const cleanTags = Array.isArray(tags)
      ? tags.map((t) => t.trim().toLowerCase()).filter(Boolean)
      : String(tags)
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);

    const insertRes = await db.query(
      `INSERT INTO problems (user_id, title, description, code_snippet, category, tags, is_anonymous, moderation_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved')
       RETURNING *`,
      [req.user.id, title.trim(), description.trim(), code_snippet || null, category, cleanTags, Boolean(is_anonymous)]
    );

    const created = insertRes.rows[0];

    await db.query(
      `INSERT INTO user_activity (user_id, action_type, problem_id, metadata)
       VALUES ($1, 'POSTED_PROBLEM', $2, $3)`,
      [req.user.id, created.id, JSON.stringify({ title: created.title, anonymous: created.is_anonymous })]
    );

    await db.query('UPDATE users SET reputation = reputation + 5 WHERE id = $1', [req.user.id]);

    res.status(201).json({ problem: created, moderation: mod.reason });
  } catch (err) {
    console.error('Create problem error:', err);
    res.status(500).json({ error: 'Failed to publish problem.' });
  }
});

module.exports = router;
