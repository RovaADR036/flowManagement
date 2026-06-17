const express = require('express')
const router = express.Router()
const productModel = require('../models/product')

function authorize(req, res, next) {
  if (!req.headers.authorization) return res.status(401).json({ error: 'Not authenticated' })
  next()
}

router.get('/products', authorize, (req, res) => {
  res.json(productModel.getAll())
})

router.post('/products', authorize, (req, res) => {
  const { name, unit, purchase_price, sale_price, stock } = req.body
  if (!name || purchase_price == null || sale_price == null || stock == null) {
    return res.status(400).json({ error: 'Missing fields' })
  }
  const product = productModel.add({ name, unit, purchase_price, sale_price, stock })
  res.status(201).json(product)
})

router.put('/products/:id', authorize, (req, res) => {
  const id = Number(req.params.id)
  const existing = productModel.getById(id)
  if (!existing) return res.status(404).json({ error: 'Product not found' })
  const updated = productModel.update(id, req.body)
  res.json(updated)
})

router.delete('/products/:id', authorize, (req, res) => {
  const id = Number(req.params.id)
  const existing = productModel.getById(id)
  if (!existing) return res.status(404).json({ error: 'Product not found' })
  productModel.remove(id)
  res.status(204).send()
})

module.exports = router
