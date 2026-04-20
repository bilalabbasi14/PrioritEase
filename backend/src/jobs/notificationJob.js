const cron = require('node-cron')
const db = require('../config/db')
const { calculateDeadlinePriority } = require('../services/priorityService')

const recalculatePriorities = async () => {
  try {
    const [tasks] = await db.query(
      `SELECT id, deadline FROM tasks
       WHERE status = 'pending' AND deadline IS NOT NULL`
    )

    for (const task of tasks) {
      const newPriority = calculateDeadlinePriority(task.deadline)
      await db.query(
        'UPDATE tasks SET deadline_priority = ? WHERE id = ?',
        [newPriority, task.id]
      )
    }

    console.log(`[CRON] Recalculated priorities for ${tasks.length} tasks`)
  } catch (err) {
    console.error('[CRON] Priority recalculation error:', err.message)
  }
}

const markOverdueTasks = async () => {
  try {
    const [result] = await db.query(
      `UPDATE tasks
       SET status = 'overdue'
       WHERE status = 'pending'
       AND deadline IS NOT NULL
       AND deadline < NOW()`
    )
    console.log(`[CRON] Marked ${result.affectedRows} tasks as overdue`)
  } catch (err) {
    console.error('[CRON] Overdue marking error:', err.message)
  }
}

const startJobs = () => {
  // runs every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running priority recalculation...')
    await recalculatePriorities()
    await markOverdueTasks()
  })

  console.log('[CRON] Jobs scheduled')
}

module.exports = { startJobs, recalculatePriorities, markOverdueTasks }