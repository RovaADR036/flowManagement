const express = require('express')
const router = express.Router()
const db = require('../models/db')
const store = db.getStore()

function authorize(req, res, next) {
  // Reuse simple header-based auth
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
}

router.get('/products', authorize, async (req, res) => {
  res.json(store.products)
})

router.post('/products', authorize, async (req, res) => {
  const { name, unit, purchase_price, sale_price, stock } = req.body
  if (!name || purchase_price == null || sale_price == null || stock == null) {
    return res.status(400).json({ error: 'Missing fields' })
  }
  const newProduct = {
    id: store.products.length ? Math.max(...store.products.map(p => p.id)) + 1 : 1,
    name,
    unit: unit || 'pièce',
    purchase_price: Number(purchase_price),
    sale_price: Number(sale_price),
    stock: Number(stock),
    sold: 0
  }
  store.products.push(newProduct)
  res.status(201).json(newProduct)
})

router.put('/products/:id', authorize, async (req, res) => {
  const id = Number(req.params.id)
  const product = store.products.find(p => p.id === id)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  const { name, unit, purchase_price, sale_price, stock } = req.body
  if (name != null) product.name = name
  if (unit != null) product.unit = unit
  if (purchase_price != null) product.purchase_price = Number(purchase_price)
  if (sale_price != null) product.sale_price = Number(sale_price)
  if (stock != null) product.stock = Number(stock)
  res.json(product)
})

router.delete('/products/:id', authorize, async (req, res) => {
  const id = Number(req.params.id)
  const idx = store.products.findIndex(p => p.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Product not found' })
  store.products.splice(idx, 1)
  res.status(204).send()
})

module.exports = router
