const db = require('./database')

function getAll() {
  return db.prepare('SELECT * FROM sales ORDER BY date DESC').all()
}

function getRecent(limit = 5) {
  return db.prepare('SELECT * FROM sales ORDER BY date DESC LIMIT ?').all(limit)
}

function getFiltered(startDate, endDate) {
  let sql = 'SELECT * FROM sales WHERE 1=1'
  const params = []
  if (startDate) { sql += ' AND date >= ?'; params.push(startDate) }
  if (endDate) { sql += ' AND date <= ?'; params.push(endDate) }
  sql += ' ORDER BY date DESC'
  return db.prepare(sql).all(...params)
}

function add({ product_id, customer_name, quantity, unit_price, unit_cost, total_price, profit }) {
  const insertSale = db.prepare('INSERT INTO sales (product_id, customer_name, quantity, unit_price, unit_cost, total_price, profit, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  const updateProduct = db.prepare('UPDATE products SET stock = stock - ?, sold = sold + ? WHERE id = ?')

  const date = new Date().toISOString()
  const result = insertSale.run(product_id, customer_name || 'Client', quantity, unit_price, unit_cost, total_price, profit, date)
  updateProduct.run(quantity, quantity, product_id)

  return db.prepare('SELECT * FROM sales WHERE id = ?').get(result.lastInsertRowid)
}

function addBatch({ customer_name, items }) {
  const insertSale = db.prepare('INSERT INTO sales (product_id, customer_name, quantity, unit_price, unit_cost, total_price, profit, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  const updateStock = db.prepare('UPDATE products SET stock = stock - ?, sold = sold + ? WHERE id = ?')
  const getProduct = db.prepare('SELECT * FROM products WHERE id = ?')

  const now = new Date().toISOString()
  const ids = []

  const transaction = db.transaction(() => {
    for (const item of items) {
      const product = getProduct.get(item.product_id)
      if (!product) throw new Error(`Product ${item.product_id} not found`)
      if (product.stock < item.quantity) throw new Error(`Not enough stock for ${product.name}`)

      const total_price = Math.round(product.sale_price * item.quantity * 100) / 100
      const profit = Math.round((product.sale_price - product.purchase_price) * item.quantity * 100) / 100

      const result = insertSale.run(product.id, customer_name || 'Client', item.quantity, product.sale_price, product.purchase_price, total_price, profit, now)
      updateStock.run(item.quantity, item.quantity, product.id)
      ids.push(result.lastInsertRowid)
    }
  })

  transaction()
  return db.prepare(`SELECT * FROM sales WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids)
}

module.exports = { getAll, getRecent, getFiltered, add, addBatch }
