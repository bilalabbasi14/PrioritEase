const express = require('express')
const router  = express.Router()
const { saveSubscription, deleteSubscription } = require('../services/pushService')

const authMiddleware = require('../middleware/authMiddleware')
router.use(authMiddleware)


/**
 * POST /api/push/subscribe
 *
 * Body: the PushSubscription object from the browser
 * {
 *   endpoint: "https://fcm.googleapis.com/...",
 *   keys: { p256dh: "...", auth: "..." }
 * }
 */
router.post('/subscribe', async (req, res) => {
  const subscription = req.body

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).json({ error: 'Invalid subscription object' })
  }

  try {
    await saveSubscription(req.user.id, subscription)
    console.log(`[PUSH] Subscribe request succeeded for user ${req.user.id}`)
    res.status(201).json({ message: 'Subscription saved' })
  } catch (err) {
    console.error('[PUSH] Subscribe error:', err.message)
    res.status(500).json({ error: 'Failed to save subscription' })
  }
})

/**
 * DELETE /api/push/subscribe
 *
 * Body: { endpoint: "https://..." }
 * Removes just this device's subscription for the logged-in user.
 */
router.delete('/subscribe', async (req, res) => {
  const { endpoint } = req.body

  if (!endpoint) {
    return res.status(400).json({ error: 'endpoint is required' })
  }

  try {
    await deleteSubscription(req.user.id, endpoint)
    console.log(`[PUSH] Unsubscribe request succeeded for user ${req.user.id}`)
    res.json({ message: 'Subscription removed' })
  } catch (err) {
    console.error('[PUSH] Unsubscribe error:', err.message)
    res.status(500).json({ error: 'Failed to remove subscription' })
  }
})

/**
 * GET /api/push/vapid-public-key
 *
 * Returns the VAPID public key so the frontend can call
 * pushManager.subscribe({ applicationServerKey: key, ... })
 */
router.get('/vapid-public-key', (req, res) => {
  console.log('[PUSH] VAPID public key requested')
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
})

module.exports = router