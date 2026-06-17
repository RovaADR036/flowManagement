import React, { useEffect, useState } from 'react'
import axios from 'axios'

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

  const headers = { Authorization: 'Bearer placeholder' }
  const API = 'http://localhost:5000/api'

  const selectedProduct = products.find(p => p.id === Number(productId))

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

  // Cart totals
  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0)
  const cartProfit = cart.reduce((sum, item) => sum + item.profit, 0)

  function onQtyChange(val) {
    setQty(val)
    if (selectedProduct && val) {
      setAmount(String(Number(val) * selectedProduct.sale_price))
    } else {
      setAmount('')
    }
  }

  function onAmountChange(val) {
    setAmount(val)
    if (selectedProduct && val && selectedProduct.sale_price > 0) {
      setQty(String(Number(val) / selectedProduct.sale_price))
    } else {
      setQty('')
    }
  }

  function addToCart() {
    if (!selectedProduct || !qty || Number(qty) <= 0) return
    const q = Number(qty)
    if (q > selectedProduct.stock) { setMessage('Stock insuffisant !'); return }
    setCart([...cart, {
      product_id: selectedProduct.id,
      name: selectedProduct.name,
      unit: selectedProduct.unit,
      quantity: q,
      unit_price: selectedProduct.sale_price,
      total: Math.round(selectedProduct.sale_price * q * 100) / 100,
      profit: Math.round((selectedProduct.sale_price - selectedProduct.purchase_price) * q * 100) / 100
    }])
    setProductId('')
    setQty('')
    setAmount('')
    setMessage(null)
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
      load()
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

  return (
    <div className="page">
      <h1>Gestion des ventes</h1>

      <div className="card">
        <h3>Nouvelle vente</h3>
        <div className="row wrap">
          <div className="field-group">
            <label>Nom du client</label>
            <input placeholder="Client" value={customerName} onChange={e => setCustomerName(e.target.value)} />
          </div>
          <select value={productId} onChange={e => setProductId(e.target.value)}>
            <option value="">Sélectionner un produit</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {Number(p.sale_price).toFixed(2)} Ar/{p.unit || 'pièce'} (stock: {p.stock})
              </option>
            ))}
          </select>

          {selectedProduct && (
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
                Prix unitaire : <strong>{Number(selectedProduct.sale_price).toFixed(2)} Ar/{selectedProduct.unit || 'pièce'}</strong>
                {qty && amount && <span> | Total ligne : <strong>{Number(amount).toFixed(2)} Ar</strong></span>}
              </div>
            </>
          )}
        </div>
        <button onClick={addToCart} disabled={!qty || Number(qty) <= 0}>Ajouter au panier</button>
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
            Finaliser la vente ({cart.length} article{cart.length > 1 ? 's' : ''})
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
                  <tr>
                    <th>Date</th><th>Produit</th><th>Unité</th>
                    <th>Qté</th><th>Prix unitaire</th><th>Total</th><th>Profit</th>
                  </tr>
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
            {topProducts.map((p, i) => (
              <li key={p.id}>
                <span className="top-rank">{i + 1}</span>
                <div className="top-info">
                  <strong>{p.name}</strong>
                  <span className="top-meta">{p.saleCount} vente{p.saleCount > 1 ? 's' : ''}</span>
                </div>
              </li>
            ))}
            {topProducts.length === 0 && (
              <li className="empty">Aucune vente pour le moment</li>
            )}
          </ol>
        </aside>
      </div>
      {/* Today's profit footer */}
      {(() => {
        const today = new Date().toISOString().slice(0, 10)
        const todayProfit = sales
          .filter(s => s.date && s.date.startsWith(today))
          .reduce((sum, s) => sum + s.profit, 0)
        return (
          <div className="profit-footer">
            <span className="profit-label">💰 Bénéfice du jour</span>
            <span className="profit-value">{todayProfit.toFixed(2)} Ar</span>
          </div>
        )
      })()}
    </div>
  )
}
