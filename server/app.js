const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

// Routers
const authRoutes = require('./routes/auth')
const dashboardRoutes = require('./routes/dashboard')
const productRoutes = require('./routes/products')
const saleRoutes = require('./routes/sales')

const app = express()
const PORT = process.env.PORT || 5000
const db = require('./models/db')

// Basic CORS setup for local development and API access from frontend
app.use(cors({ origin: true, credentials: true }))
app.use(bodyParser.json())

// API routes
app.use('/api', authRoutes)
app.use('/api', dashboardRoutes)
app.use('/api', productRoutes)
app.use('/api', saleRoutes)

db.initSeed().then(() => {
  app.listen(PORT, () => {
    console.log(`Shop backend listening on http://localhost:${PORT}`)
  })
})

module.exports = app
