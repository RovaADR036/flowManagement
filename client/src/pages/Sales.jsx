import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Sales() {
  const [products, setProducts] = useState([])
  const [qty, setQty] = useState(1)
  const [productId, setProductId] = useState('')
  const [sales, setSales] = useState([])
  const [message, setMessage] = useState(null)

  const headers = { Authorization: 'Bearer placeholder' }
  const API = 'http://localhost:5000/api'

  async function load() {
    const resP = await axios.get(`${API}/products`, { headers })
    setProducts(resP.data)
    const resS = await axios.get(`${API}/sales`, { headers })
    setSales(resS.data)
  }

  async function recordSale() {
    if (!productId) return
    const payload = { product_id: Number(productId), quantity: Number(qty) }
    try {
      await axios.post(`${API}/sales`, payload, { headers })
      setMessage('Vente enregistrée')
      load()
    } catch (e) {
      setMessage('Erreur lors de l\'enregistrement')
    }
  }

  useEffect(() => { load() }, [])

  function productLabel(p) {
    return `${p.name} — ${p.sale_price} €${p.unit ? '/' + p.unit : ''} (stock: ${p.stock})`
  }

  return (
    <div className="page">
      <h1>Gestion des ventes</h1>
      <div className="card">
        <h3>Nouvelle vente</h3>
        <div className="row wrap">
          <select value={productId} onChange={e => setProductId(e.target.value)}>
            <option value="">Sélectionner un produit</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{productLabel(p)}</option>
            ))}
          </select>
          <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
          <button onClick={recordSale}>Enregistrer la vente</button>
        </div>
        {message && <div className="message">{message}</div>}
      </div>
      <div className="section">
        <h2>Résumé des ventes</h2>
        <table className="table">
          <thead><tr><th>Date</th><th>Produit</th><th>Unité</th><th>Qté</th><th>Total</th><th>Profit</th></tr></thead>
          <tbody>
            {sales.map(s => {
              const prod = products.find(p => p.id === s.product_id) || {}
              return (
                <tr key={s.id}>
                  <td>{new Date(s.date).toLocaleDateString('fr-FR')}</td>
                  <td>{prod.name}</td>
                  <td>{prod.unit || 'pièce'}</td>
                  <td>{s.quantity}</td>
                  <td>{s.total_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                  <td>{s.profit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
