const express = require('express')
const router = express.Router()
const { googleLogin, getMe } = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/google', googleLogin)
router.get('/me', authMiddleware, getMe)

module.exports = router