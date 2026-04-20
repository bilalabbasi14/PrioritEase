const express = require('express')
const router = express.Router()
const { getTasks, getTaskById, createTask, updateTask, deleteTask } = require('../controllers/taskController')
const authMiddleware = require('../middleware/authMiddleware')

router.use(authMiddleware)

router.get('/', getTasks)
router.get('/:id', getTaskById)
router.post('/', createTask)
router.put('/:id', updateTask)
router.delete('/:id', deleteTask)

module.exports = router