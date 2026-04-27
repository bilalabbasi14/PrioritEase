const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/authRoutes')
const courseRoutes = require('./routes/courseRoutes')
const taskRoutes = require('./routes/taskRoutes')
const notificationRoutes = require('./routes/notificationRoutes')
const { startJobs } = require('./jobs/notificationJob')
const pushRoutes = require('./routes/pushRoutes')
const classroomRoutes = require('./routes/classroomRoutes')
const analyticsRoutes = require('./routes/analyticsRoutes')

const app = express()

const PORT = process.env.PORT || 5000

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://priorit-ease.vercel.app',
  ],
  credentials: true,
}))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/push', pushRoutes)
app.use('/api/classroom', classroomRoutes)
app.use('/api/analytics', analyticsRoutes)

app.get('/', (req, res) => {
  res.send('PrioritEase server is running')
})

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

module.exports = app

