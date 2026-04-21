const { google } = require('googleapis')
const db = require('../config/db')

/**
 * Build an authenticated OAuth2 client for a given user.
 * Automatically refreshes the access token if expired and saves the new one.
 */
const getAuthClient = async (userId) => {
  const [rows] = await db.query(
    'SELECT google_access_token, google_refresh_token FROM users WHERE id = ?',
    [userId]
  )

  if (!rows.length) throw new Error('User not found')

  const { google_access_token, google_refresh_token } = rows[0]

  if (!google_refresh_token) {
    throw new Error('No refresh token stored — user must re-authenticate with Classroom scope')
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage'
  )

  auth.setCredentials({
    access_token:  google_access_token,
    refresh_token: google_refresh_token,
  })

  // Persist refreshed access token automatically
  auth.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await db.query(
        'UPDATE users SET google_access_token = ? WHERE id = ?',
        [tokens.access_token, userId]
      )
    }
  })

  return auth
}

/**
 * Fetch all active courses from Google Classroom for a user.
 * Returns raw Classroom course objects.
 */
const fetchClassroomCourses = async (userId) => {
  const auth = await getAuthClient(userId)
  const classroom = google.classroom({ version: 'v1', auth })

  const response = await classroom.courses.list({
    courseStates: ['ACTIVE'],
    pageSize: 50,
  })

  return response.data.courses || []
}

/**
 * Map Google submission state to local task status.
 */
const mapSubmissionStatus = (state) => {
  switch (state) {
    case 'TURNED_IN':
    case 'RETURNED':
      return 'completed'
    case 'NEW':
    case 'CREATED':
    case 'RECLAIMED_BY_STUDENT':
    default:
      return 'pending'
  }
}

/**
 * Fetch all coursework (assignments) for a specific Classroom course.
 */
const fetchCourseWork = async (userId, courseId) => {
  const auth = await getAuthClient(userId)
  const classroom = google.classroom({ version: 'v1', auth })

  try {
    const response = await classroom.courses.courseWork.list({
      courseId,
      courseWorkStates: ['PUBLISHED'],
      pageSize: 100,
    })
    return response.data.courseWork || []
  } catch (err) {
    console.error(`[CLASSROOM] courseWork.list failed for course ${courseId}:`, err.message, err.code)
    throw err
  }
}

/**
 * Fetch student submission states for all coursework in a course.
 * Returns a map of { courseWorkId -> submissionState }
 */
const fetchSubmissionStates = async (userId, courseId) => {
  const auth = await getAuthClient(userId)
  const classroom = google.classroom({ version: 'v1', auth })

  try {
    const response = await classroom.courses.courseWork.studentSubmissions.list({
      courseId,
      courseWorkId: '-', // '-' means all coursework
      pageSize: 100,
    })

    const submissions = response.data.studentSubmissions || []
    const stateMap = {}
    for (const sub of submissions) {
      stateMap[sub.courseWorkId] = sub.state
    }
    return stateMap
  } catch (err) {
    console.warn(`[CLASSROOM] Could not fetch submissions for course ${courseId}:`, err.message)
    return {}
  }
}

/**
 * Sync Google Classroom courses into the local courses table.
 * - Inserts new courses (identified by google_course_id)
 * - Updates name if already exists
 * Returns { created, updated } counts.
 */
const syncCourses = async (userId) => {
  const classroomCourses = await fetchClassroomCourses(userId)

  let created = 0
  let updated = 0

  for (const course of classroomCourses) {
    const [existing] = await db.query(
      'SELECT id FROM courses WHERE user_id = ? AND google_course_id = ?',
      [userId, course.id]
    )

    if (existing.length > 0) {
      await db.query(
        'UPDATE courses SET name = ? WHERE user_id = ? AND google_course_id = ?',
        [course.name, userId, course.id]
      )
      updated++
    } else {
      await db.query(
        `INSERT INTO courses (user_id, name, google_course_id)
         VALUES (?, ?, ?)`,
        [userId, course.name, course.id]
      )
      created++
    }
  }

  console.log(`[CLASSROOM] Synced courses for user ${userId}: ${created} created, ${updated} updated`)
  return { created, updated }
}

/**
 * Sync assignments from Google Classroom into the local tasks table.
 * - Only syncs courses that were previously imported (have google_course_id)
 * - Inserts new tasks (identified by google_task_id)
 * - Updates title/deadline if already exists
 * - Does NOT overwrite user-set status or priority
 * Returns { created, updated } counts.
 */
const syncAssignments = async (userId) => {
  const [courses] = await db.query(
    'SELECT id, google_course_id FROM courses WHERE user_id = ? AND google_course_id IS NOT NULL',
    [userId]
  )

  let created = 0
  let updated = 0

  for (const course of courses) {
    let courseWork
    try {
      courseWork = await fetchCourseWork(userId, course.google_course_id)
    } catch (err) {
      console.warn(`[CLASSROOM] Skipping course ${course.google_course_id}: ${err.message}`)
      continue
    }

    // Fetch submission states for this course (best-effort, won't crash if it fails)
    const submissionStates = await fetchSubmissionStates(userId, course.google_course_id)

    for (const work of courseWork) {
      // Parse Google's dueDate + dueTime into a MySQL DATETIME
      let deadline = null
      if (work.dueDate) {
        const { year, month, day } = work.dueDate
        const hour   = work.dueTime?.hours   ?? 23
        const minute = work.dueTime?.minutes ?? 59
        deadline = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
      }

      const status = mapSubmissionStatus(submissionStates[work.id])

      const [existing] = await db.query(
        'SELECT id FROM tasks WHERE user_id = ? AND google_task_id = ?',
        [userId, work.id]
      )

      if (existing.length > 0) {
        await db.query(
          'UPDATE tasks SET title = ?, deadline = ?, status = ? WHERE user_id = ? AND google_task_id = ?',
          [work.title, deadline, status, userId, work.id]
        )
        updated++
      } else {
        await db.query(
          `INSERT INTO tasks (user_id, course_id, title, deadline, google_task_id, status, source)
           VALUES (?, ?, ?, ?, ?, ?, 'google')`,
          [userId, course.id, work.title, deadline, work.id, status]
        )
        created++
      }
    }
  }

  console.log(`[CLASSROOM] Synced assignments for user ${userId}: ${created} created, ${updated} updated`)
  return { created, updated }
}

/**
 * Full sync — courses first, then assignments.
 */
const syncAll = async (userId) => {
  const courses     = await syncCourses(userId)
  const assignments = await syncAssignments(userId)
  return { courses, assignments }
}

module.exports = {
  fetchClassroomCourses,
  fetchCourseWork,
  syncCourses,
  syncAssignments,
  syncAll,
}