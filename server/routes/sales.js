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
  const { product_id, quantity } = req.body
  const pid = Number(product_id)
  const qty = Number(quantity)
  if (!pid || !qty) return res.status(400).json({ error: 'Missing fields' })

  const product = productModel.getById(pid)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  if (product.stock < qty) return res.status(400).json({ error: 'Not enough stock' })

  const sale = saleModel.add({
    product_id: pid,
    quantity: qty,
    unit_price: product.sale_price,
    unit_cost: product.purchase_price,
    total_price: product.sale_price * qty,
    profit: (product.sale_price - product.purchase_price) * qty
  })
  res.status(201).json(sale)
})

module.exports = router
