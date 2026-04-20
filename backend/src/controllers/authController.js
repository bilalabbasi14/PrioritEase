const db = require('../config/db')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
require('dotenv').config()

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

exports.googleLogin = async (req, res) => {
  const { id_token } = req.body

  if (!id_token)
    return res.status(400).json({ message: 'Google token is required' })

  try {
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const { sub: google_id, email, name, picture } = payload

    const [rows] = await db.query(
      'SELECT * FROM users WHERE google_id = ?',
      [google_id]
    )

    let user

    if (rows.length > 0) {
      user = rows[0]
      await db.query(
        'UPDATE users SET name = ?, email = ? WHERE google_id = ?',
        [name, email, google_id]
      )
    } else {
      const [result] = await db.query(
        'INSERT INTO users (name, email, google_id) VALUES (?, ?, ?)',
        [name, email, google_id]
      )
      user = { id: result.insertId, email }
    }

    return res.status(200).json({
      token: generateToken(user),
      name,
      email,
      picture,
    })
  } catch (err) {
    return res.status(401).json({ message: 'Invalid Google token', error: err.message })
  }
}

exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, google_id, created_at FROM users WHERE id = ?',
      [req.user.id]
    )
    if (rows.length === 0)
      return res.status(404).json({ message: 'User not found' })

    return res.status(200).json(rows[0])
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message })
  }
}