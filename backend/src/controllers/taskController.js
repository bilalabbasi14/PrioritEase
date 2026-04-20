const db = require('../config/db')

const { calculateDeadlinePriority } = require('../services/priorityService')

exports.getTasks = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT tasks.*, courses.name as course_name, courses.color as course_color
       FROM tasks
       LEFT JOIN courses ON tasks.course_id = courses.id
       WHERE tasks.user_id = ?
       ORDER BY tasks.deadline ASC`,
      [req.user.id]
    )
    return res.status(200).json(rows)
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

exports.getTaskById = async (req, res) => {
  const { id } = req.params
  try {
    const [rows] = await db.query(
      `SELECT tasks.*, courses.name as course_name, courses.color as course_color
       FROM tasks
       LEFT JOIN courses ON tasks.course_id = courses.id
       WHERE tasks.id = ? AND tasks.user_id = ?`,
      [id, req.user.id]
    )
    if (rows.length === 0)
      return res.status(404).json({ message: 'Task not found' })
    return res.status(200).json(rows[0])
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

exports.createTask = async (req, res) => {
  const { course_id, title, description, deadline, user_priority, classroom_link } = req.body
  if (!title) return res.status(400).json({ message: 'Title is required' })

  const deadline_priority = calculateDeadlinePriority(deadline)

  try {
    const [result] = await db.query(
      `INSERT INTO tasks 
       (user_id, course_id, title, description, deadline, deadline_priority, user_priority, classroom_link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        course_id || null,
        title,
        description || null,
        deadline || null,
        deadline_priority,
        user_priority || 'medium',
        classroom_link || null
      ]
    )
    const [rows] = await db.query('SELECT * FROM tasks WHERE id = ?', [result.insertId])
    return res.status(201).json(rows[0])
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

exports.updateTask = async (req, res) => {
  const { id } = req.params
  const { title, description, deadline, user_priority, status, course_id, classroom_link } = req.body

  try {
    const [rows] = await db.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    )
    if (rows.length === 0)
      return res.status(404).json({ message: 'Task not found' })

    const task = rows[0]
    const newDeadline = deadline ?? task.deadline
    const deadline_priority = calculateDeadlinePriority(newDeadline)

    await db.query(
      `UPDATE tasks SET
       title = ?, description = ?, deadline = ?, deadline_priority = ?,
       user_priority = ?, status = ?, course_id = ?, classroom_link = ?
       WHERE id = ?`,
      [
        title || task.title,
        description ?? task.description,
        newDeadline,
        deadline_priority,
        user_priority || task.user_priority,
        status || task.status,
        course_id ?? task.course_id,
        classroom_link ?? task.classroom_link,
        id
      ]
    )
    const [updated] = await db.query('SELECT * FROM tasks WHERE id = ?', [id])
    return res.status(200).json(updated[0])
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

exports.deleteTask = async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await db.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    )
    if (rows.length === 0)
      return res.status(404).json({ message: 'Task not found' })

    await db.query('DELETE FROM tasks WHERE id = ?', [id])
    return res.status(200).json({ message: 'Task deleted' })
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}