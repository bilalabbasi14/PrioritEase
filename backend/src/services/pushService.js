const webpush = require('web-push')
const db = require('../config/db')

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

/**
 * Save or update a push subscription for a user.
 * Uses the subscription endpoint as the unique key if the browser
 * refreshes its subscription, the old row is replaced.
 */
const saveSubscription = async (userId, subscription) => {
  const { endpoint, keys } = subscription

  await db.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       p256dh     = VALUES(p256dh),
       auth       = VALUES(auth),
       updated_at = NOW()`,
    [userId, endpoint, keys.p256dh, keys.auth]
  )

  console.log(`[PUSH] Saved subscription for user ${userId}`)
}

/**
 * Remove a specific push subscription (e.g. user opts out on this device).
 */
const deleteSubscription = async (userId, endpoint) => {
  await db.query(
    'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
    [userId, endpoint]
  )

  console.log(`[PUSH] Removed subscription for user ${userId}`)
}

/**
 * Send a push notification to every registered device for a user.
 *
 * @param {number} userId
 * @param {object} payload  - { title, body, icon?, badge?, url? }
 */
const sendToUser = async (userId, payload) => {
  const [subscriptions] = await db.query(
    'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
    [userId]
  )

  if (!subscriptions.length) {
    console.log(`[PUSH] No subscriptions for user ${userId}; skipping "${payload.title || 'notification'}"`)
    return
  }

  console.log(`[PUSH] Sending "${payload.title || 'notification'}" to user ${userId} (${subscriptions.length} subscription(s))`)

  const notification = JSON.stringify({
    title: payload.title,
    body:  payload.body,
    icon:  payload.icon  || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/badge-72x72.png',
    url:   payload.url   || '/',
  })

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        notification
      )
    )
  )

  // Clean up expired / unsubscribed endpoints (410 Gone or 404 Not Found)
  const staleEndpoints = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const status = result.reason?.statusCode
      if (status === 410 || status === 404) {
        staleEndpoints.push(subscriptions[i].endpoint)
      } else {
        console.error(
          `[PUSH] Failed to send to user ${userId}:`,
          result.reason?.message
        )
      }
    }
  })

  if (staleEndpoints.length) {
    const placeholders = staleEndpoints.map(() => '?').join(',')
    await db.query(
      `DELETE FROM push_subscriptions WHERE endpoint IN (${placeholders})`,
      staleEndpoints
    )
    console.log(`[PUSH] Removed ${staleEndpoints.length} stale subscription(s)`)
  }

  console.log(`[PUSH] Finished sending "${payload.title || 'notification'}" for user ${userId}`)
}

/**
 * Send a push notification to multiple users at once (e.g. from cron job).
 *
 * @param {number[]} userIds
 * @param {object}   payload  - { title, body, icon?, badge?, url? }
 */
const sendToUsers = async (userIds, payload) => {
  if (!userIds.length) return
  await Promise.allSettled(userIds.map((id) => sendToUser(id, payload)))
}

module.exports = {
  saveSubscription,
  deleteSubscription,
  sendToUser,
  sendToUsers,
}