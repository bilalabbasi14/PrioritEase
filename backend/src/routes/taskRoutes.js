const express = require('express')
const router = express.Router()
const { getTasks, getTaskById, createTask, updateTask, deleteTask, archiveTask } = require('../controllers/taskController')
const authMiddleware = require('../middleware/authMiddleware')

router.use(authMiddleware)

router.get('/', getTasks)
router.get('/:id', getTaskById)
router.post('/', createTask)
router.put('/:id', updateTask)
router.patch('/:id/archive', archiveTask)
router.delete('/:id', deleteTask)

module.exports = router