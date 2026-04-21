const PAKISTAN_TIMEZONE_OFFSET_MINUTES = 5 * 60

/**
 * Parse a DB DATETIME string as Pakistan local time and return a real JS Date.
 * Accepts: "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss".
 */
const parsePakistanDatetime = (value) => {
  if (!value) return null
  if (value instanceof Date) return value

  const raw = String(value).trim().replace('T', ' ')
  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2})(?::(\d{2}))?/
  )

  if (!match) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const [, y, mo, d, h, mi, s = '00'] = match
  const utcMillis = Date.UTC(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h) - 5,
    Number(mi),
    Number(s)
  )
  return new Date(utcMillis)
}

/**
 * Classroom dueDate + dueTime are in UTC. Convert and store as PKT DATETIME string.
 */
const classroomDueUtcToPakistanDatetime = (dueDate, dueTime) => {
  if (!dueDate) return null

  const year = Number(dueDate.year)
  const month = Number(dueDate.month)
  const day = Number(dueDate.day)
  const hour = Number(dueTime?.hours ?? 23)
  const minute = Number(dueTime?.minutes ?? 59)

  const utcMillis = Date.UTC(year, month - 1, day, hour, minute, 0)
  const pakistanMillis = utcMillis + PAKISTAN_TIMEZONE_OFFSET_MINUTES * 60 * 1000
  const d = new Date(pakistanMillis)

  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const min = String(d.getUTCMinutes()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:00`
}

module.exports = {
  PAKISTAN_TIMEZONE_OFFSET_MINUTES,
  parsePakistanDatetime,
  classroomDueUtcToPakistanDatetime,
}
