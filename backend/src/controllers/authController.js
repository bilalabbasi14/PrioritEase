const db = require('../config/db')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
require('dotenv').config()

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage' // required for auth-code flow from browser
)

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

exports.googleLogin = async (req, res) => {
  const { code } = req.body

  if (!code)
    return res.status(400).json({ message: 'Authorization code is required' })

  try {
    // Exchange auth code for tokens
    const { tokens } = await client.getToken(code)
    const { access_token, refresh_token, id_token } = tokens

    // Verify the id_token to get user info
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
        `UPDATE users
         SET name = ?, email = ?, google_access_token = ?,
             google_refresh_token = COALESCE(?, google_refresh_token)
         WHERE google_id = ?`,
        [name, email, access_token, refresh_token ?? null, google_id]
      )
    } else {
      const [result] = await db.query(
        `INSERT INTO users (name, email, google_id, google_access_token, google_refresh_token)
         VALUES (?, ?, ?, ?, ?)`,
        [name, email, google_id, access_token, refresh_token ?? null]
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
    return res.status(401).json({ message: 'Google auth failed', error: err.message })
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