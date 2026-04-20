const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/authRoutes')
const courseRoutes = require('./routes/courseRoutes')
const taskRoutes = require('./routes/taskRoutes')
const notificationRoutes = require('./routes/notificationRoutes')
const { startJobs } = require('./jobs/notificationJob')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/notifications', notificationRoutes)

app.get('/', (req, res) => {
  res.send('PrioritEase server is running')
})

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
  startJobs()
})
