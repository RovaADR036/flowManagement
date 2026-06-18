import React, { useEffect, useState, useRef, useCallback } from 'react'
import axios from 'axios'

const STORAGE_KEY = 'shop_recent_customers'

export default function Sales() {
  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [qty, setQty] = useState('')
  const [amount, setAmount] = useState('')
  const [cart, setCart] = useState([])
  const [sales, setSales] = useState([])
  const [message, setMessage] = useState(null)
  const [amountReceived, setAmountReceived] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const [recentCustomers, setRecentCustomers] = useState([])

  const searchRef = useRef(null)
  const headers = { Authorization: 'Bearer placeholder' }
  const API = 'http://localhost:5000/api'

  // Load recent customers from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      setRecentCustomers(saved)
    } catch {}
  }, [])

  const saveRecentCustomers = useCallback((name) => {
    if (!name || name === 'Client') return
    setRecentCustomers(prev => {
      const updated = [name, ...prev.filter(n => n !== name)].slice(0, 5)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const selectedProduct = products.find(p => p.id === Number(productId))

  // Filter products based on search
  const filtered = searchTerm.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 8)
    : []

  // Top products (count by sale rows)
  const saleCounts = {}
  sales.forEach(s => { saleCounts[s.product_id] = (saleCounts[s.product_id] || 0) + 1 })
  const topProducts = [...products]
    .map(p => ({ ...p, saleCount: saleCounts[p.id] || 0 }))
    .filter(p => p.saleCount > 0)
    .sort((a, b) => b.saleCount - a.saleCount)

  // Group sales by customer
  const groups = {}
  sales.forEach(s => {
    const name = s.customer_name || 'Client'
    if (!groups[name]) groups[name] = { customer: name, items: [], total: 0, profit: 0 }
    groups[name].items.push(s)
    groups[name].total += s.total_price
    groups[name].profit += s.profit
  })
  const groupedSales = Object.values(groups)

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0)
  const cartProfit = cart.reduce((sum, item) => sum + item.profit, 0)

  function selectProduct(prod) {
    setProductId(String(prod.id))
    setSearchTerm(prod.name)
    setShowResults(false)
    setSelectedIdx(-1)
    setQty('1')
    setAmount(String(prod.sale_price))
  }

  function onQtyChange(val) {
    setQty(val)
    const prod = selectedProduct || products.find(p => p.id === Number(productId))
    if (prod && val) {
      setAmount(String(Number(val) * prod.sale_price))
    } else {
      setAmount('')
    }
  }

  function onAmountChange(val) {
    setAmount(val)
    const prod = selectedProduct || products.find(p => p.id === Number(productId))
    if (prod && val && prod.sale_price > 0) {
      setQty(String(Number(val) / prod.sale_price))
    } else {
      setQty('')
    }
  }

  function addToCart() {
    const prod = selectedProduct || products.find(p => p.id === Number(productId))
    if (!prod || !qty || Number(qty) <= 0) return
    const q = Number(qty)
    if (q > prod.stock) { setMessage(`Stock insuffisant ! (${prod.stock} disponible)`); return }
    setCart([...cart, {
      product_id: prod.id,
      name: prod.name,
      unit: prod.unit,
      quantity: q,
      unit_price: prod.sale_price,
      total: Math.round(prod.sale_price * q * 100) / 100,
      profit: Math.round((prod.sale_price - prod.purchase_price) * q * 100) / 100
    }])
    setProductId('')
    setSearchTerm('')
    setQty('')
    setAmount('')
    setMessage(null)
    searchRef.current?.focus()
  }

  function removeFromCart(idx) {
    setCart(cart.filter((_, i) => i !== idx))
  }

  async function finalizeSale() {
    if (!cart.length) return
    const name = customerName.trim() || 'Client'
    try {
      await axios.post(`${API}/sales/batch`, {
        customer_name: name,
        items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity }))
      }, { headers })
      setMessage(`Vente finalisée pour ${name} ✓`)
      setCart([])
      setCustomerName('')
      setAmountReceived('')
      if (name !== 'Client') saveRecentCustomers(name)
      load()
      searchRef.current?.focus()
    } catch (e) {
      setMessage(e.response?.data?.error || 'Erreur lors de la finalisation')
    }
  }

  async function load() {
    const resP = await axios.get(`${API}/products`, { headers })
    setProducts(resP.data)
    const resS = await axios.get(`${API}/sales`, { headers })
    setSales(resS.data)
  }

  useEffect(() => { load() }, [])

  // Keyboard handler
  function handleKeyDown(e) {
    if (showResults && filtered.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, filtered.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' && selectedIdx >= 0) { e.preventDefault(); selectProduct(filtered[selectedIdx]); return }
      if (e.key === 'Escape') { setShowResults(false); setSelectedIdx(-1); return }
    }
    if (e.key === 'Enter' && searchTerm && !productId && filtered.length > 0) {
      e.preventDefault()
      selectProduct(filtered[0])
      return
    }
    if (e.key === 'Enter' && productId && qty && Number(qty) > 0) {
      e.preventDefault()
      addToCart()
      return
    }
    if (e.key === 'F12') {
      e.preventDefault()
      if (cart.length > 0) finalizeSale()
    }
  }

  return (
    <div className="page" onKeyDown={handleKeyDown}>
      <h1>Ventes</h1>

      <div className="card">
        <div className="row wrap">
          <div className="field-group">
            <label>Client</label>
            <input placeholder="Nom du client" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            {recentCustomers.length > 0 && (
              <div className="recent-clients">
                {recentCustomers.map(name => (
                  <button key={name} className="chip" onClick={() => setCustomerName(name)}>{name}</button>
                ))}
              </div>
            )}
          </div>

          <div className="field-group search-group">
            <label>Produit (taper pour chercher)</label>
            <input
              ref={searchRef}
              placeholder="Ex: huile, farine..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setShowResults(true); setSelectedIdx(-1); setProductId(''); setQty(''); setAmount('') }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              autoFocus
            />
            {showResults && filtered.length > 0 && (
              <div className="search-results">
                {filtered.map((p, i) => (
                  <div key={p.id}
                    className={`search-item ${i === selectedIdx ? 'selected' : ''}`}
                    onMouseDown={() => selectProduct(p)}
                  >
                    <span className="search-name">{p.name}</span>
                    <span className="search-price">{p.sale_price} Ar/{p.unit || 'pièce'}</span>
                    <span className="search-stock">stock: {p.stock}</span>
                    {p.stock <= (p.min_stock || 5) && <span className="search-alert">⚠</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {productId && selectedProduct && (
            <>
              <div className="field-group">
                <label>Quantité ({selectedProduct.unit || 'pièce'})</label>
                <input type="number" min="0" step="any" value={qty} onChange={e => onQtyChange(e.target.value)} />
              </div>
              <span className="or">ou</span>
              <div className="field-group">
                <label>Montant (Ar)</label>
                <input type="number" min="0" step="any" value={amount} onChange={e => onAmountChange(e.target.value)} />
              </div>
              <div className="sale-info">
                Prix : <strong>{Number(selectedProduct.sale_price).toFixed(2)} Ar/{selectedProduct.unit || 'pièce'}</strong>
                {qty && amount && <span> | Ligne : <strong>{Number(amount).toFixed(2)} Ar</strong></span>}
              </div>
              {selectedProduct.stock <= (selectedProduct.min_stock || 5) && (
                <div className="stock-warning">⚠ Stock bas ({selectedProduct.stock} {selectedProduct.unit || 'pièce'})</div>
              )}
            </>
          )}
        </div>
        <button className="btn-add" onClick={addToCart} disabled={!qty || Number(qty) <= 0}>
          ➕ Ajouter {productId ? '(Entrée)' : ''}
        </button>
        {message && <div className="message">{message}</div>}
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="card cart-card">
          <div className="cart-header">
            <h3>Panier — {customerName || 'Client'}</h3>
            <span className="cart-summary">
              Total : {cartTotal.toFixed(2)} Ar | Bénéfice : {cartProfit.toFixed(2)} Ar
            </span>
          </div>
          <table className="table">
            <thead>
              <tr><th>Produit</th><th>Unité</th><th>Qté</th><th>Prix unitaire</th><th>Total</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {cart.map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td>{item.unit || 'pièce'}</td>
                  <td>{item.quantity.toFixed(2)}</td>
                  <td>{item.unit_price.toFixed(2)} Ar</td>
                  <td>{item.total.toFixed(2)} Ar</td>
                  <td><button className="btn-danger" onClick={() => removeFromCart(i)}>Retirer</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="payment-section">
            <div className="payment-row">
              <span>Total à payer :</span>
              <strong>{cartTotal.toFixed(2)} Ar</strong>
            </div>
            <div className="payment-row">
              <label>Montant reçu :</label>
              <input type="number" min="0" step="any" value={amountReceived} onChange={e => setAmountReceived(e.target.value)} placeholder="0" />
            </div>
            {Number(amountReceived) >= cartTotal ? (
              <div className="payment-row change-row">
                <span>Reste à rendre :</span>
                <strong className="change-value">{(Number(amountReceived) - cartTotal).toFixed(2)} Ar</strong>
              </div>
            ) : amountReceived ? (
              <div className="payment-row change-row insufficient">
                <span>Il manque :</span>
                <strong>{(cartTotal - Number(amountReceived)).toFixed(2)} Ar</strong>
              </div>
            ) : null}
          </div>

          <button className="btn-finalize" onClick={finalizeSale} disabled={Number(amountReceived) < cartTotal}>
            ✅ Finaliser (F12) — {cart.length} article{cart.length > 1 ? 's' : ''}
          </button>
        </div>
      )}

      <div className="sales-layout">
        <div className="sales-main">
          <h2>Factures</h2>
          {groupedSales.length === 0 && <p className="empty">Aucune vente pour le moment.</p>}
          {groupedSales.map(group => (
            <div key={group.customer} className="invoice-group">
              <div className="invoice-header">
                <span className="invoice-client">{group.customer}</span>
                <span className="invoice-total">
                  Total : {group.total.toFixed(2)} Ar | Bénéfice : {group.profit.toFixed(2)} Ar
                </span>
              </div>
              <table className="table">
                <thead>
                  <tr><th>Date</th><th>Produit</th><th>Unité</th><th>Qté</th><th>Prix unitaire</th><th>Total</th><th>Profit</th></tr>
                </thead>
                <tbody>
                  {group.items.map(s => {
                    const prod = products.find(p => p.id === s.product_id) || {}
                    return (
                      <tr key={s.id}>
                        <td>{new Date(s.date).toLocaleDateString('fr-FR')}</td>
                        <td>{prod.name}</td>
                        <td>{prod.unit || 'pièce'}</td>
                        <td>{Number(s.quantity).toFixed(2)}</td>
                        <td>{Number(s.unit_price).toFixed(2)} Ar</td>
                        <td>{Number(s.total_price).toFixed(2)} Ar</td>
                        <td>{Number(s.profit).toFixed(2)} Ar</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <aside className="top-sidebar">
          <h3>Top produits</h3>
          <ol className="top-list">
            {topProducts.map((p, i) => {
              const badge = p.stock <= 0 ? '🔴 Rupture' : p.stock <= (p.min_stock || 5) ? '🟠 Stock bas' : null
              return (
                <li key={p.id}>
                  <span className="top-rank">{i + 1}</span>
                  <div className="top-info">
                    <strong>{p.name}</strong>
                    <span className="top-meta">{p.saleCount} vente{p.saleCount > 1 ? 's' : ''} | Stock: {p.stock}</span>
                    {badge && <span className="top-badge">{badge}</span>}
                  </div>
                </li>
              )
            })}
            {topProducts.length === 0 && (
              <li className="empty">Aucune vente pour le moment</li>
            )}
          </ol>
        </aside>
      </div>

      {/* Today's profit footer */}
      {(() => {
        const today = new Date().toISOString().slice(0, 10)
        const todaySales = sales.filter(s => s.date && s.date.startsWith(today))
        const todayRevenue = todaySales.reduce((sum, s) => sum + s.total_price, 0)
        const todayProfit = todaySales.reduce((sum, s) => sum + s.profit, 0)
        return (
          <div className="profit-footer">
            <div>
              <span className="profit-label">📦 Versement au propriétaire</span>
              <span className="profit-value revenue">{todayRevenue.toFixed(2)} Ar</span>
            </div>
            <div>
              <span className="profit-label">💰 Bénéfice du jour</span>
              <span className="profit-value">{todayProfit.toFixed(2)} Ar</span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
