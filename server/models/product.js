const db = require('./db')
const store = db.getStore()

async function getAll() {
  return store.products
}

async function addProduct({ name, purchase_price, sale_price, stock }) {
  const newProduct = {
    id: store.products.length ? Math.max(...store.products.map(p => p.id)) + 1 : 1,
    name,
    purchase_price: Number(purchase_price),
    sale_price: Number(sale_price),
    stock: Number(stock),
    sold: 0
  }
  store.products.push(newProduct)
  return newProduct
}

async function updateProduct(id, attrs) {
  const p = store.products.find(p => p.id === id)
  if (!p) throw new Error('Product not found')
  Object.assign(p, attrs)
  return p
}

async function deleteProduct(id) {
  const idx = store.products.findIndex(p => p.id === id)
  if (idx === -1) throw new Error('Product not found')
  store.products.splice(idx, 1)
}

module.exports = { getAll, addProduct, updateProduct, deleteProduct }
