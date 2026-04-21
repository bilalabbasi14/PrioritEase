const express = require('express')
const router  = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const { syncAll, syncCourses, syncAssignments, fetchClassroomCourses } = require('../services/classroomService')

router.use(authMiddleware)

// GET /api/classroom/courses — preview Classroom courses without syncing
router.get('/courses', async (req, res) => {
  try {
    const courses = await fetchClassroomCourses(req.user.id)
    res.json(courses)
  } catch (err) {
    if (err.message.includes('re-authenticate')) {
      return res.status(403).json({ error: err.message })
    }
    console.error('[CLASSROOM] Fetch courses error:', err.message)
    res.status(500).json({ error: 'Failed to fetch Classroom courses' })
  }
})

// POST /api/classroom/sync — full sync (courses + assignments)
router.post('/sync', async (req, res) => {
  try {
    const result = await syncAll(req.user.id)
    res.json(result)
  } catch (err) {
    if (err.message.includes('re-authenticate')) {
      return res.status(403).json({ error: err.message })
    }
    console.error('[CLASSROOM] Sync error:', err.message)
    res.status(500).json({ error: 'Sync failed' })
  }
})

// POST /api/classroom/sync/courses — sync courses only
router.post('/sync/courses', async (req, res) => {
  try {
    const result = await syncCourses(req.user.id)
    res.json(result)
  } catch (err) {
    console.error('[CLASSROOM] Sync courses error:', err.message)
    res.status(500).json({ error: 'Course sync failed' })
  }
})

// POST /api/classroom/sync/assignments — sync assignments only
router.post('/sync/assignments', async (req, res) => {
  try {
    const result = await syncAssignments(req.user.id)
    res.json(result)
  } catch (err) {
    console.error('[CLASSROOM] Sync assignments error:', err.message)
    res.status(500).json({ error: 'Assignment sync failed' })
  }
})

module.exports = router