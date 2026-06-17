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

function add({ product_id, quantity, unit_price, unit_cost, total_price, profit }) {
  const insertSale = db.prepare('INSERT INTO sales (product_id, quantity, unit_price, unit_cost, total_price, profit, date) VALUES (?, ?, ?, ?, ?, ?, ?)')
  const updateProduct = db.prepare('UPDATE products SET stock = stock - ?, sold = sold + ? WHERE id = ?')

  const date = new Date().toISOString()
  const result = insertSale.run(product_id, quantity, unit_price, unit_cost, total_price, profit, date)
  updateProduct.run(quantity, quantity, product_id)

  return db.prepare('SELECT * FROM sales WHERE id = ?').get(result.lastInsertRowid)
}

module.exports = { getAll, getRecent, getFiltered, add }
