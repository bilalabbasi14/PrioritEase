const express = require('express')
const router = express.Router()
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount
} = require('../controllers/notificationController')
const authMiddleware = require('../middleware/authMiddleware')

router.use(authMiddleware)

router.get('/', getNotifications)
router.get('/unread-count', getUnreadCount)
router.put('/mark-all-read', markAllAsRead)
router.put('/:id/read', markAsRead)
router.delete('/all', deleteAllNotifications)
router.delete('/:id', deleteNotification)

module.exports = router