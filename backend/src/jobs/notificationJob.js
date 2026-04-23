const cron = require('node-cron')
const db = require('../config/db')
const { calculateDeadlinePriority } = require('../services/priorityService')
const { sendToUser } = require('../services/pushService')

// ─── Priority Recalculation ───────────────────────────────────────────────────

const recalculatePriorities = async () => {
  try {
    const [tasks] = await db.query(
      `SELECT t.id, t.user_id, t.title, t.deadline, t.deadline_priority
       FROM tasks t
       LEFT JOIN courses c ON c.id = t.course_id
       WHERE t.status = 'pending'
         AND t.deadline IS NOT NULL
         AND (t.course_id IS NULL OR c.is_archived = FALSE)`
    )

    const escalated = [] // tasks that just jumped to 'high'

    for (const task of tasks) {
      const newPriority = calculateDeadlinePriority(task.deadline)

      if (newPriority !== task.deadline_priority) {
        console.log(`[CRON] Task ${task.id} priority changed ${task.deadline_priority} -> ${newPriority}`)
        await db.query(
          'UPDATE tasks SET deadline_priority = ? WHERE id = ?',
          [newPriority, task.id]
        )

        // Track escalations to 'high' so we can notify the user
        if (newPriority === 'high') {
          escalated.push(task)
        }
      }
    }

    console.log(`[CRON] Recalculated priorities for ${tasks.length} tasks`)

    // Fire push notifications for tasks that just became high priority
    if (escalated.length) {
      await notifyEscalated(escalated)
    }
  } catch (err) {
    console.error('[CRON] Priority recalculation error:', err.message)
  }
}

// ─── Overdue Marking ─────────────────────────────────────────────────────────

const markOverdueTasks = async () => {
  try {
    const nowInPakistanSql = "DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 HOUR)"

    // Recover tasks that were incorrectly marked overdue earlier.
    await db.query(
      `UPDATE tasks t
       LEFT JOIN courses c ON c.id = t.course_id
       SET t.status = 'pending',
           t.notified_overdue = 0
       WHERE t.status = 'overdue'
         AND t.deadline IS NOT NULL
         AND t.deadline >= ${nowInPakistanSql}
         AND (t.course_id IS NULL OR c.is_archived = FALSE)`
    )

    // Fetch the affected tasks BEFORE updating so we have user_id + title
    const [overdueTasks] = await db.query(
      `SELECT t.id, t.user_id, t.title
       FROM tasks t
       LEFT JOIN courses c ON c.id = t.course_id
       WHERE t.status = 'pending'
         AND t.deadline IS NOT NULL
         AND t.deadline < ${nowInPakistanSql}
         AND COALESCE(t.notified_overdue, 0) = 0
         AND (t.course_id IS NULL OR c.is_archived = FALSE)`
    )

    // Mark all expired pending tasks as overdue, regardless of notify flag.
    const [statusResult] = await db.query(
      `UPDATE tasks t
       LEFT JOIN courses c ON c.id = t.course_id
       SET t.status = 'overdue'
       WHERE t.status = 'pending'
         AND t.deadline IS NOT NULL
         AND t.deadline < ${nowInPakistanSql}
         AND (t.course_id IS NULL OR c.is_archived = FALSE)`
    )

    if (!statusResult.affectedRows) {
      console.log('[CRON] No tasks to mark as overdue')
      return
    }

    console.log(`[CRON] Found ${statusResult.affectedRows} overdue task(s)`)

    if (!overdueTasks.length) {
      console.log(`[CRON] Marked ${statusResult.affectedRows} tasks as overdue (no new notifications)`) 
      return
    }

    const ids = overdueTasks.map((t) => t.id)
    const placeholders = ids.map(() => '?').join(',')

    await db.query(
      `UPDATE tasks SET notified_overdue = 1 WHERE id IN (${placeholders})`,
      ids
    )

    console.log(`[CRON] Marked ${statusResult.affectedRows} tasks as overdue`)

    // Fire push notifications for overdue tasks
    await notifyOverdue(overdueTasks)
  } catch (err) {
    console.error('[CRON] Overdue marking error:', err.message)
  }
}

// ─── Notification Helpers ─────────────────────────────────────────────────────

/**
 * Notify users whose tasks just escalated to high priority (deadline ≤ 24 h).
 * Also inserts a row into the notifications table so it appears in-app.
 */
const notifyEscalated = async (tasks) => {
  for (const task of tasks) {
    try {
      console.log(`[CRON] Escalation notification queued for task ${task.id} (user ${task.user_id})`)

      // Persist in-app notification
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, ?, ?, 'deadline')`,
        [
          task.user_id,
          'Deadline approaching!',
          `"${task.title}" is due in less than 24 hours.`,
        ]
      )

      // Push to browser / device
      await sendToUser(task.user_id, {
        title: '⚠️ Deadline approaching!',
        body:  `"${task.title}" is due in less than 24 hours.`,
        url:   `/tasks/${task.id}`,
      })
    } catch (err) {
      console.error(`[CRON] Escalation notify failed for task ${task.id}:`, err.message)
    }
  }
}

/**
 * Notify users whose tasks just became overdue.
 * Also inserts a row into the notifications table so it appears in-app.
 */
const notifyOverdue = async (tasks) => {
  for (const task of tasks) {
    try {
      console.log(`[CRON] Overdue notification queued for task ${task.id} (user ${task.user_id})`)

      // Persist in-app notification
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, ?, ?, 'overdue')`,
        [
          task.user_id,
          'Task overdue',
          `"${task.title}" has passed its deadline and is now overdue.`,
        ]
      )

      // Push to browser / device
      await sendToUser(task.user_id, {
        title: '🔴 Task overdue',
        body:  `"${task.title}" has passed its deadline.`,
        url:   `/tasks/${task.id}`,
      })
    } catch (err) {
      console.error(`[CRON] Overdue notify failed for task ${task.id}:`, err.message)
    }
  }
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

const startJobs = () => {
  // Runs every 5 minutes 
  cron.schedule('*/2 * * * *', async () => {
    console.log('[CRON] Running scheduled jobs...')
    await recalculatePriorities() // also fires escalation push notifications
    await markOverdueTasks()      // also fires overdue push notifications
  })

  console.log('[CRON] Jobs scheduled')
}

module.exports = { startJobs, recalculatePriorities, markOverdueTasks }