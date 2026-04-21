const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const {
  getSummary,
  getTasksPerCourse,
  getUpcomingDeadlines,
  getCompletionTrend,
} = require('../controllers/analyticsController')

router.use(authMiddleware)

router.get('/summary', getSummary)
router.get('/tasks-per-course', getTasksPerCourse)
router.get('/upcoming', getUpcomingDeadlines)
router.get('/trend', getCompletionTrend)

module.exports = router