const express = require('express')
const router = express.Router()

// Simple hardcoded user for authentication (for now)
const USERS = [
  { email: 'admin@shop.com', password: '123456' }
]

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  const user = USERS.find(u => u.email === email && u.password === password)
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  // Simple token: base64(email:ts)
  const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
  res.json({ token, email })
})

module.exports = router
