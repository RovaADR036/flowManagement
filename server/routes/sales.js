const express = require('express')
const router = express.Router()
const saleModel = require('../models/sale')
const productModel = require('../models/product')

function authorize(req, res, next) {
  if (!req.headers.authorization) return res.status(401).json({ error: 'Not authenticated' })
  next()
}

router.get('/sales', authorize, (req, res) => {
  res.json(saleModel.getAll())
})

router.post('/sales', authorize, (req, res) => {
  const { product_id, quantity, customer_name } = req.body
  const pid = Number(product_id)
  const qty = Number(quantity)
  if (!pid || !qty) return res.status(400).json({ error: 'Missing fields' })

  const product = productModel.getById(pid)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  if (product.stock < qty) return res.status(400).json({ error: 'Not enough stock' })

  const r2 = v => Math.round(v * 100) / 100
  const sale = saleModel.add({
    product_id: pid,
    customer_name: customer_name || 'Client',
    quantity: qty,
    unit_price: r2(product.sale_price),
    unit_cost: r2(product.purchase_price),
    total_price: r2(product.sale_price * qty),
    profit: r2((product.sale_price - product.purchase_price) * qty)
  })
  res.status(201).json(sale)
})

router.post('/sales/batch', authorize, (req, res) => {
  const { customer_name, items } = req.body
  if (!items || !items.length) return res.status(400).json({ error: 'No items' })

  try {
    const sales = saleModel.addBatch({ customer_name: customer_name || 'Client', items })
    res.status(201).json(sales)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

module.exports = router
