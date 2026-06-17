const express = require('express')
const router = express.Router()

// Simple auth check: expect Authorization: Bearer <token>
function ensureAuth(req, res, next) {
  const auth = req.headers['authorization'] || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  // In this demo, we don't validate signature, just ensure it's a non-empty string
  try {
    const decoded = Buffer.from(token, 'base64').toString('ascii')
    const parts = decoded.split(':')
    if (parts.length >= 1) {
      req.user = parts[0]
      return next()
    }
  } catch (e) {
    // fallthrough
  }
  res.status(401).json({ error: 'Not authenticated' })
}

// Import in-memory store from db module (initSeed will populate on first run)
const db = require('../models/db')

router.get('/dashboard', ensureAuth, async (req, res) => {
  // Optional date filters: start and end in ISO (YYYY-MM-DD)
  const { start, end } = req.query

  // Retrieve current in-memory data
  const products = db.getStore().products
  const sales = db.getStore().sales

  // Helper: parse dates, default to all
  const startDate = start ? new Date(start) : null
  const endDate = end ? new Date(end) : null

  const filterSales = sales.filter(s => {
    const d = new Date(s.date)
    if (startDate && d < startDate) return false
    if (endDate && d > endDate) return false
    return true
  })

  // Metrics
  const totalSales = filterSales.reduce((acc, s) => acc + s.total_price, 0)
  const totalProfit = filterSales.reduce((acc, s) => acc + s.profit, 0)
  const totalSoldUnits = filterSales.reduce((acc, s) => acc + s.quantity, 0)

  // Revenue = totalSales, Stock value = sum(stock * purchase_price)
  const stockValue = products.reduce((acc, p) => acc + (p.stock * p.purchase_price), 0)

  // Cost indicator: here consider cost as totalProfit deficit; computed as (totalSales - totalProfit)
  const costIndicator = totalSales - totalProfit

  // Recent sales (last 5)
  const recentSales = sales.slice(-5).reverse().map(s => {
    const prod = products.find(p => p.id === s.product_id)
    return { ...s, product_name: prod ? prod.name : 'Inconnu' }
  })

  res.json({ totalSales, totalProfit, stockValue, costIndicator, totalSoldUnits, recentSales, currency: 'EUR' })
})

module.exports = router
