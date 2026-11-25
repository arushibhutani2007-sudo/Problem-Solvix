const express = require('express');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { moderateContent } = require('../services/moderationService');

const router = express.Router();

// POST /api/solutions/:problemId - Submit a Solution
router.post('/:problemId', authenticateToken, async (req, res) => {
  try {
    const problemId = parseInt(req.params.problemId, 10);
    const { content, code_block = '', is_anonymous = false } = req.body;

    const mod = moderateContent({ content });
    if (!mod.passed) {
      return res.status(422).json({ error: mod.reason, moderationFailed: true });
    }

    const result = await db.query(
      `INSERT INTO solutions (problem_id, user_id, content, code_block, is_anonymous)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [problemId, req.user.id, content.trim(), code_block || null, Boolean(is_anonymous)]
    );

    await db.query(
      `INSERT INTO user_activity (user_id, action_type, problem_id, metadata)
       VALUES ($1, 'SUBMITTED_SOLUTION', $2, $3)`,
      [req.user.id, problemId, JSON.stringify({ solution_id: result.rows[0].id })]
    );

    await db.query('UPDATE users SET reputation = reputation + 15 WHERE id = $1', [req.user.id]);

    res.status(201).json({ solution: result.rows[0] });
  } catch (err) {
    console.error('Submit solution error:', err);
    res.status(500).json({ error: 'Failed to submit solution.' });
  }
});

// POST /api/solutions/:solutionId/vote - Upvote / Downvote Helpful Answer
router.post('/:solutionId/vote', authenticateToken, async (req, res) => {
  try {
    const solutionId = parseInt(req.params.solutionId, 10);
    const voteType = req.body.vote_type === -1 ? -1 : 1;

    const existing = await db.query(
      'SELECT * FROM solution_votes WHERE solution_id = $1 AND user_id = $2',
      [solutionId, req.user.id]
    );

    if (existing.rows.length > 0) {
      if (existing.rows[0].vote_type === voteType) {
        // Toggle off
        await db.query('DELETE FROM solution_votes WHERE id = $1', [existing.rows[0].id]);
      } else {
        await db.query('UPDATE solution_votes SET vote_type = $1 WHERE id = $2', [voteType, existing.rows[0].id]);
      }
    } else {
      await db.query(
        'INSERT INTO solution_votes (solution_id, user_id, vote_type) VALUES ($1, $2, $3)',
        [solutionId, req.user.id, voteType]
      );
    }

    const sumRes = await db.query(
      'SELECT COALESCE(SUM(vote_type), 0)::int AS total FROM solution_votes WHERE solution_id = $1',
      [solutionId]
    );
    const upvotes = sumRes.rows[0].total;

    await db.query('UPDATE solutions SET upvotes = $1 WHERE id = $2', [upvotes, solutionId]);

    res.json({ upvotes });
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ error: 'Failed to record vote.' });
  }
});

// POST /api/solutions/:solutionId/outcome - Try Solution & Mark Outcome (Success / Failure)
// Dynamically calculates success_rate & attempt_count as specified in the Synopsis Flowchart
router.post('/:solutionId/outcome', authenticateToken, async (req, res) => {
  try {
    const solutionId = parseInt(req.params.solutionId, 10);
    const { outcome, notes = '' } = req.body;

    if (!['success', 'failure'].includes(outcome)) {
      return res.status(400).json({ error: 'Outcome must be either "success" or "failure".' });
    }

    await db.query(
      `INSERT INTO solution_outcomes (solution_id, user_id, outcome, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (solution_id, user_id)
       DO UPDATE SET outcome = EXCLUDED.outcome, notes = EXCLUDED.notes, created_at = CURRENT_TIMESTAMP`,
      [solutionId, req.user.id, outcome, notes]
    );

    // Recalculate success_count, failure_count, attempt_count, and success_rate
    const statsRes = await db.query(
      `SELECT 
        COUNT(*) FILTER (WHERE outcome = 'success')::int AS success_count,
        COUNT(*) FILTER (WHERE outcome = 'failure')::int AS failure_count,
        COUNT(*)::int AS attempt_count
       FROM solution_outcomes
       WHERE solution_id = $1`,
      [solutionId]
    );

    const { success_count, failure_count, attempt_count } = statsRes.rows[0];
    const success_rate = attempt_count > 0 ? Number(((success_count / attempt_count) * 100).toFixed(2)) : 0;

    const updatedSol = await db.query(
      `UPDATE solutions
       SET success_count = $1, failure_count = $2, attempt_count = $3, success_rate = $4
       WHERE id = $5
       RETURNING *`,
      [success_count, failure_count, attempt_count, success_rate, solutionId]
    );

    const sol = updatedSol.rows[0];

    // If solution achieves >= 70% success rate with >= 2 attempts, mark problem as Verified
    if (sol && success_rate >= 70 && attempt_count >= 2) {
      await db.query(`UPDATE problems SET status = 'Verified' WHERE id = $1`, [sol.problem_id]);
    }

    // Update user history
    if (sol) {
      await db.query(
        `INSERT INTO user_activity (user_id, action_type, problem_id, metadata)
         VALUES ($1, 'TESTED_OUTCOME', $2, $3)`,
        [req.user.id, sol.problem_id, JSON.stringify({ solution_id: solutionId, outcome, success_rate })]
      );
    }

    res.json({
      solution: sol,
      metrics: { success_count, failure_count, attempt_count, success_rate }
    });
  } catch (err) {
    console.error('Outcome tracking error:', err);
    res.status(500).json({ error: 'Failed to record solution outcome.' });
  }
});

// POST /api/solutions/:solutionId/comments - Comment & Reply on Solutions
router.post('/:solutionId/comments', authenticateToken, async (req, res) => {
  try {
    const solutionId = parseInt(req.params.solutionId, 10);
    const { body, parent_id = null, is_anonymous = false } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }

    const result = await db.query(
      `INSERT INTO comments (solution_id, user_id, parent_id, body, is_anonymous)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [solutionId, req.user.id, parent_id || null, body.trim(), Boolean(is_anonymous)]
    );

    const userRes = await db.query('SELECT username, anonymous_alias FROM users WHERE id = $1', [req.user.id]);
    const u = userRes.rows[0];

    res.status(201).json({
      comment: {
        ...result.rows[0],
        author_display: is_anonymous ? u.anonymous_alias : u.username
      }
    });
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ error: 'Failed to post comment.' });
  }
});

module.exports = router;
