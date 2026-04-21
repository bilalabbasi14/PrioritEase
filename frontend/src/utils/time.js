export const parsePakistanDatetime = (value) => {
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

export const formatDateInPakistan = (value, options = {}) => {
  const parsed = parsePakistanDatetime(value)
  if (!parsed) return ''

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    ...options,
  }).format(parsed)
}

const getPakistanDayStamp = (value) => {
  const parsed = parsePakistanDatetime(value)
  if (!parsed) return null

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(parsed)

  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)

  if (!year || !month || !day) return null
  return Date.UTC(year, month - 1, day)
}

export const getPakistanCalendarDayDiff = (target, base = new Date()) => {
  const targetStamp = getPakistanDayStamp(target)
  const baseStamp = getPakistanDayStamp(base)

  if (targetStamp == null || baseStamp == null) return null
  return Math.round((targetStamp - baseStamp) / (1000 * 60 * 60 * 24))
}
