const db = require('./database')

function getAll() {
  return db.prepare('SELECT * FROM products ORDER BY id').all()
}

function getById(id) {
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id)
}

function add({ name, unit, purchase_price, sale_price, stock, min_stock }) {
  const stmt = db.prepare('INSERT INTO products (name, unit, purchase_price, sale_price, stock, min_stock) VALUES (?, ?, ?, ?, ?, ?)')
  const result = stmt.run(name, unit || 'pièce', Number(purchase_price), Number(sale_price), Number(stock), min_stock != null ? Number(min_stock) : 5)
  return getById(result.lastInsertRowid)
}

function update(id, attrs) {
  const fields = []
  const values = []
  const allowed = ['name', 'unit', 'purchase_price', 'sale_price', 'stock', 'min_stock']
  for (const key of allowed) {
    if (attrs[key] !== undefined && attrs[key] !== null) {
      fields.push(`${key} = ?`)
      values.push(key === 'name' || key === 'unit' ? attrs[key] : Number(attrs[key]))
    }
  }
  if (fields.length === 0) return getById(id)
  values.push(id)
  db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return getById(id)
}

function remove(id) {
  db.prepare('DELETE FROM products WHERE id = ?').run(id)
}

module.exports = { getAll, getById, add, update, remove }
