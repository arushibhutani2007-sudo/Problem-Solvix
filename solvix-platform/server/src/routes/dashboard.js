const express = require('express');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard - Personalized User Dashboard & Activity History
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userRes = await db.query(
      'SELECT id, username, email, anonymous_alias, avatar_color, reputation, created_at FROM users WHERE id = $1',
      [userId]
    );

    const myProblems = await db.query(
      `SELECT p.*, COUNT(s.id)::int AS solution_count, COALESCE(MAX(s.success_rate), 0)::float AS top_success_rate
       FROM problems p
       LEFT JOIN solutions s ON s.problem_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [userId]
    );

    const mySolutions = await db.query(
      `SELECT s.*, p.title AS problem_title, p.category
       FROM solutions s
       JOIN problems p ON s.problem_id = p.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );

    const myOutcomes = await db.query(
      `SELECT so.*, s.content AS solution_preview, s.success_rate, p.id AS problem_id, p.title AS problem_title
       FROM solution_outcomes so
       JOIN solutions s ON so.solution_id = s.id
       JOIN problems p ON s.problem_id = p.id
       WHERE so.user_id = $1
       ORDER BY so.created_at DESC`,
      [userId]
    );

    const activityHistory = await db.query(
      `SELECT ua.*, p.title AS problem_title
       FROM user_activity ua
       LEFT JOIN problems p ON ua.problem_id = p.id
       WHERE ua.user_id = $1
       ORDER BY ua.created_at DESC
       LIMIT 25`,
      [userId]
    );

    // Aggregate personal KPIs
    const avgSolutionSuccess =
      mySolutions.rows.length > 0
        ? Number(
            (
              mySolutions.rows.reduce((acc, s) => acc + Number(s.success_rate || 0), 0) / mySolutions.rows.length
            ).toFixed(1)
          )
        : 0;

    res.json({
      profile: userRes.rows[0],
      stats: {
        problemsPosted: myProblems.rows.length,
        solutionsContributed: mySolutions.rows.length,
        outcomesVerified: myOutcomes.rows.length,
        avgSolutionSuccessRate: avgSolutionSuccess,
        reputation: userRes.rows[0]?.reputation || 0
      },
      myProblems: myProblems.rows,
      mySolutions: mySolutions.rows,
      myOutcomes: myOutcomes.rows,
      activityHistory: activityHistory.rows
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard metrics.' });
  }
});

module.exports = router;
