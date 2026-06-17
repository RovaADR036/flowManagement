const express = require('express')
const router = express.Router()
const db = require('../models/database')

function ensureAuth(req, res, next) {
  if (!req.headers.authorization) return res.status(401).json({ error: 'Not authenticated' })
  next()
}

router.get('/dashboard', ensureAuth, (req, res) => {
  const { start, end } = req.query

  // Build date filter for sales
  let saleWhere = 'WHERE 1=1'
  const params = []
  if (start) { saleWhere += ' AND date >= ?'; params.push(start) }
  if (end) { saleWhere += ' AND date <= ?'; params.push(end + 'T23:59:59.999Z') }

  // Aggregate sales metrics
  const salesAgg = db.prepare(`SELECT COALESCE(SUM(total_price),0) as totalSales, COALESCE(SUM(profit),0) as totalProfit, COALESCE(SUM(quantity),0) as totalSoldUnits FROM sales ${saleWhere}`).get(...params)

  // Stock value
  const stockRow = db.prepare('SELECT COALESCE(SUM(stock * purchase_price),0) as stockValue FROM products').get()

  // Recent sales with product name
  const recentSales = db.prepare(`SELECT s.*, p.name as product_name FROM sales s LEFT JOIN products p ON s.product_id = p.id ORDER BY s.date DESC LIMIT 5`).all()

  const costIndicator = salesAgg.totalSales - salesAgg.totalProfit

  res.json({
    totalSales: salesAgg.totalSales,
    totalProfit: salesAgg.totalProfit,
    stockValue: stockRow.stockValue,
    costIndicator,
    totalSoldUnits: salesAgg.totalSoldUnits,
    recentSales
  })
})

module.exports = router
