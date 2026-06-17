const db = require('./db')
const store = db.getStore()

async function addSale({ product_id, quantity, unit_price, unit_cost, total_price, profit }) {
  const sale = {
    id: store.sales.length ? Math.max(...store.sales.map(s => s.id)) + 1 : 1,
    product_id,
    quantity,
    unit_price,
    unit_cost,
    total_price,
    profit,
    date: new Date().toISOString()
  }
  store.sales.push(sale)
  return sale
}

async function getAll() {
  return store.sales
}

module.exports = { addSale, getAll }
