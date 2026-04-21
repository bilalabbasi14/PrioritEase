const { parsePakistanDatetime } = require('./timeService')

const calculateDeadlinePriority = (deadline) => {
  if (!deadline) return 'low'
  const now = new Date()
  const due = parsePakistanDatetime(deadline)
  if (!due) return 'low'
  const hoursLeft = (due - now) / (1000 * 60 * 60)
  if (hoursLeft <= 24) return 'high'
  if (hoursLeft <= 72) return 'medium'
  return 'low'
}

module.exports = { calculateDeadlinePriority }