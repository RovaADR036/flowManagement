const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const db = new Database(path.join(dataDir, 'shop.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    unit TEXT DEFAULT 'pièce',
    purchase_price REAL NOT NULL,
    sale_price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    sold INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    customer_name TEXT DEFAULT 'Client',
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    unit_cost REAL NOT NULL,
    total_price REAL NOT NULL,
    profit REAL NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`)

// Add customer_name column if upgrading from old schema
const cols = db.prepare("PRAGMA table_info(sales)").all()
if (!cols.find(c => c.name === 'customer_name')) {
  db.exec("ALTER TABLE sales ADD COLUMN customer_name TEXT DEFAULT 'Client'")
}

// Seed data if empty
const count = db.prepare('SELECT COUNT(*) as c FROM products').get()
if (count.c === 0) {
  const insert = db.prepare('INSERT INTO products (name, unit, purchase_price, sale_price, stock) VALUES (?, ?, ?, ?, ?)')
  insert.run('Produit A', 'pièce', 10, 20, 50)
  insert.run('Produit B', 'litre', 5, 12, 30)
  insert.run('Produit C', 'kg', 8, 15, 20)
  console.log('Database seeded with sample products')
}

console.log('SQLite database ready')
module.exports = db
