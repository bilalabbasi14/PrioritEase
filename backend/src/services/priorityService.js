const calculateDeadlinePriority = (deadline) => {
  if (!deadline) return 'low'
  const now = new Date()
  const due = new Date(deadline)
  const hoursLeft = (due - now) / (1000 * 60 * 60)
  if (hoursLeft <= 24) return 'high'
  if (hoursLeft <= 72) return 'medium'
  return 'low'
}

module.exports = { calculateDeadlinePriority }