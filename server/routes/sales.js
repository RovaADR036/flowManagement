const express = require('express')
const router = express.Router()
const db = require('../models/db')
const store = db.getStore()

function authorize(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
}

router.get('/sales', authorize, async (req, res) => {
  res.json(store.sales)
})

router.post('/sales', authorize, async (req, res) => {
  const { product_id, quantity } = req.body
  const pid = Number(product_id)
  const qty = Number(quantity)
  if (!pid || !qty) return res.status(400).json({ error: 'Missing fields' })
  const product = store.products.find(p => p.id === pid)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  if (product.stock < qty) return res.status(400).json({ error: 'Not enough stock' })

  const unit_price = product.sale_price
  const unit_cost = product.purchase_price
  const total_price = unit_price * qty
  const profit = (unit_price - unit_cost) * qty
  const sale = {
    id: store.sales.length ? Math.max(...store.sales.map(s => s.id)) + 1 : 1,
    product_id: pid,
    quantity: qty,
    unit_price,
    unit_cost,
    total_price,
    profit,
    date: new Date().toISOString()
  }
  store.sales.push(sale)
  // Update stock and sold count
  product.stock -= qty
  product.sold += qty
  res.status(201).json(sale)
})

module.exports = router
