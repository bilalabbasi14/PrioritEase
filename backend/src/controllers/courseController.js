const db = require('../config/db')

exports.getCourses = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM courses WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    )
    return res.status(200).json(rows)
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

exports.createCourse = async (req, res) => {
  const { name, description, color } = req.body
  if (!name) return res.status(400).json({ message: 'Course name is required' })

  try {
    const [result] = await db.query(
      'INSERT INTO courses (user_id, name, description, color) VALUES (?, ?, ?, ?)',
      [req.user.id, name, description || null, color || '#6366f1']
    )
    const [rows] = await db.query('SELECT * FROM courses WHERE id = ?', [result.insertId])
    return res.status(201).json(rows[0])
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

exports.updateCourse = async (req, res) => {
  const { id } = req.params
  const { name, description, color } = req.body

  try {
    const [rows] = await db.query(
      'SELECT * FROM courses WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    )
    if (rows.length === 0)
      return res.status(404).json({ message: 'Course not found' })

    await db.query(
      'UPDATE courses SET name = ?, description = ?, color = ? WHERE id = ?',
      [name || rows[0].name, description ?? rows[0].description, color || rows[0].color, id]
    )
    const [updated] = await db.query('SELECT * FROM courses WHERE id = ?', [id])
    return res.status(200).json(updated[0])
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}

exports.deleteCourse = async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await db.query(
      'SELECT * FROM courses WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    )
    if (rows.length === 0)
      return res.status(404).json({ message: 'Course not found' })

    await db.query('DELETE FROM courses WHERE id = ?', [id])
    return res.status(200).json({ message: 'Course deleted' })
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}