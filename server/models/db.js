// Simple in-memory data store with optional MySQL fallback (stubbed for this demo)
let _store = {
  products: [],
  sales: []
}

const useMysql = !!process.env.DB_HOST

async function initSeed() {
  if (_store.products.length === 0) {
    _store.products = [
      { id: 1, name: 'Produit A', unit: 'pièce', purchase_price: 10.0, sale_price: 20.0, stock: 50, sold: 0 },
      { id: 2, name: 'Produit B', unit: 'litre', purchase_price: 5.0, sale_price: 12.0, stock: 30, sold: 0 },
      { id: 3, name: 'Produit C', unit: 'kg', purchase_price: 8.0, sale_price: 15.0, stock: 20, sold: 0 }
    ]
  }
  if (_store.sales.length === 0) {
    // Seed with a couple of sample sales (optional)
    _store.sales = []
  }
}

function getStore() {
  return _store
}

module.exports = {
  useMysql,
  initSeed,
  getStore
}
