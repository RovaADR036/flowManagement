import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Sales() {
  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [amount, setAmount] = useState('')
  const [lastEdited, setLastEdited] = useState(null) // 'qty' or 'amount'
  const [sales, setSales] = useState([])
  const [message, setMessage] = useState(null)

  const headers = { Authorization: 'Bearer placeholder' }
  const API = 'http://localhost:5000/api'

  const selectedProduct = products.find(p => p.id === Number(productId))

  function onQtyChange(val) {
    setQty(val)
    setLastEdited('qty')
    if (selectedProduct && val) {
      setAmount(String(Number(val) * selectedProduct.sale_price))
    } else {
      setAmount('')
    }
  }

  function onAmountChange(val) {
    setAmount(val)
    setLastEdited('amount')
    if (selectedProduct && val && selectedProduct.sale_price > 0) {
      setQty(String(Number(val) / selectedProduct.sale_price))
    } else {
      setQty('')
    }
  }

  function onProductChange(id) {
    setProductId(id)
    setQty('')
    setAmount('')
    setLastEdited(null)
  }

  async function load() {
    const resP = await axios.get(`${API}/products`, { headers })
    setProducts(resP.data)
    const resS = await axios.get(`${API}/sales`, { headers })
    setSales(resS.data)
  }

  async function recordSale() {
    if (!productId || !qty || Number(qty) <= 0) return
    try {
      await axios.post(`${API}/sales`, {
        product_id: Number(productId),
        quantity: Number(qty)
      }, { headers })
      setMessage('Vente enregistrée ✓')
      onProductChange('')
      load()
    } catch (e) {
      setMessage(e.response?.data?.error || 'Erreur lors de l\'enregistrement')
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="page">
      <h1>Gestion des ventes</h1>

      <div className="card">
        <h3>Nouvelle vente</h3>
        <div className="row wrap">
          <select value={productId} onChange={e => onProductChange(e.target.value)}>
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
                {qty && amount && <span> | Total vente : <strong>{Number(amount).toFixed(2)} Ar</strong></span>}
              </div>
            </>
          )}
        </div>
        <button onClick={recordSale} disabled={!qty || Number(qty) <= 0}>Enregistrer la vente</button>
        {message && <div className="message">{message}</div>}
      </div>

      <div className="section">
        <h2>Résumé des ventes</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th><th>Produit</th><th>Unité</th>
              <th>Qté</th><th>Prix unitaire</th><th>Total</th><th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(s => {
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
    </div>
  )
}
