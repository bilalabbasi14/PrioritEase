const db = require('../config/db')

exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT notifications.*, tasks.title as task_title
       FROM notifications
       LEFT JOIN tasks ON notifications.task_id = tasks.id
       WHERE notifications.user_id = ?
       ORDER BY notifications.sent_at DESC`,
      [req.user.id]
    )
    return res.status(200).json(rows)
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

exports.markAsRead = async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    )
    if (rows.length === 0)
      return res.status(404).json({ message: 'Notification not found' })

    await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id])
    return res.status(200).json({ message: 'Marked as read' })
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

exports.markAllAsRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [req.user.id]
    )
    return res.status(200).json({ message: 'All notifications marked as read' })
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

exports.deleteNotification = async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    )
    if (rows.length === 0)
      return res.status(404).json({ message: 'Notification not found' })

    await db.query('DELETE FROM notifications WHERE id = ?', [id])
    return res.status(200).json({ message: 'Notification deleted' })
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

exports.deleteAllNotifications = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM notifications WHERE user_id = ?',
      [req.user.id]
    )
    return res.status(200).json({ message: 'All notifications deleted' })
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

exports.getUnreadCount = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    )
    return res.status(200).json({ count: rows[0].count })
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}