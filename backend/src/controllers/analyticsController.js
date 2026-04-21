const db = require('../config/db')

/**
 * GET /api/analytics/summary
 * Returns total, completed, overdue, pending counts + completion rate.
 */
exports.getSummary = async (req, res) => {
  try {
    const [[row]] = await db.query(
      `SELECT
         COUNT(*)                                          AS total,
         SUM(status = 'completed')                        AS completed,
         SUM(status = 'overdue')                          AS overdue,
         SUM(status = 'pending')                          AS pending,
         ROUND(SUM(status = 'completed') / COUNT(*) * 100, 1) AS completion_rate
       FROM tasks t
       LEFT JOIN courses c ON c.id = t.course_id
       WHERE t.user_id = ?
         AND (t.course_id IS NULL OR c.is_archived = FALSE)`,
      [req.user.id]
    )

    res.json(row)
  } catch (err) {
    console.error('[ANALYTICS] Summary error:', err.message)
    res.status(500).json({ error: 'Failed to fetch summary' })
  }
}

/**
 * GET /api/analytics/tasks-per-course
 * Returns task counts broken down by course.
 */
exports.getTasksPerCourse = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         c.id                          AS course_id,
         c.name                        AS course_name,
         c.color,
         COUNT(t.id)                   AS total,
         SUM(t.status = 'completed')   AS completed,
         SUM(t.status = 'overdue')     AS overdue,
         SUM(t.status = 'pending')     AS pending
       FROM courses c
       LEFT JOIN tasks t
         ON t.course_id = c.id AND t.user_id = ?
       WHERE c.user_id = ? AND c.is_archived = FALSE
       GROUP BY c.id
       ORDER BY total DESC`,
      [req.user.id, req.user.id]
    )

    res.json(rows)
  } catch (err) {
    console.error('[ANALYTICS] Tasks per course error:', err.message)
    res.status(500).json({ error: 'Failed to fetch tasks per course' })
  }
}

/**
 * GET /api/analytics/upcoming?days=7
 * Returns pending tasks due within the next N days (default 7).
 */
exports.getUpcomingDeadlines = async (req, res) => {
  const days = parseInt(req.query.days) || 7

  try {
    const nowInPakistanSql = "DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 HOUR)"

    const [rows] = await db.query(
      `SELECT
         t.id, t.title, t.deadline, t.deadline_priority, t.user_priority,
         c.name AS course_name, c.color
       FROM tasks t
       LEFT JOIN courses c ON c.id = t.course_id
       WHERE t.user_id = ?
         AND t.status = 'pending'
         AND t.deadline IS NOT NULL
         AND t.deadline BETWEEN ${nowInPakistanSql} AND DATE_ADD(${nowInPakistanSql}, INTERVAL ? DAY)
         AND (t.course_id IS NULL OR c.is_archived = FALSE)
       ORDER BY t.deadline ASC`,
      [req.user.id, days]
    )

    res.json(rows)
  } catch (err) {
    console.error('[ANALYTICS] Upcoming deadlines error:', err.message)
    res.status(500).json({ error: 'Failed to fetch upcoming deadlines' })
  }
}

/**
 * GET /api/analytics/trend?weeks=6
 * Returns completed task count per week for the last N weeks (default 6).
 * Useful for a completion trend chart on the dashboard.
 */
exports.getCompletionTrend = async (req, res) => {
  const weeks = parseInt(req.query.weeks) || 6

  try {
    const [rows] = await db.query(
      `SELECT
         YEARWEEK(created_at, 1)   AS week,
         MIN(DATE(created_at))     AS week_start,
         COUNT(*)                  AS completed
       FROM tasks t
       LEFT JOIN courses c ON c.id = t.course_id
       WHERE t.user_id = ?
         AND status = 'completed'
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? WEEK)
         AND (t.course_id IS NULL OR c.is_archived = FALSE)
       GROUP BY YEARWEEK(created_at, 1)
       ORDER BY week ASC`,
      [req.user.id, weeks]
    )

    res.json(rows)
  } catch (err) {
    console.error('[ANALYTICS] Trend error:', err.message)
    res.status(500).json({ error: 'Failed to fetch completion trend' })
  }
}