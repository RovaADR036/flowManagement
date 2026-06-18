import React, { useEffect, useState } from 'react'
import axios from 'axios'

const UNITS = ['pièce', 'litre', 'mètre', 'kg', 'gramme', 'boîte', 'pack', 'sachet', 'carton', 'heure', 'jour', 'mois', 'service', 'portion']

export default function Products() {
  const [products, setProducts] = useState([])
  const [newProd, setNewProd] = useState({ name: '', unit: 'pièce', purchase_price: '', sale_price: '', stock: '', min_stock: '5' })
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [addStockId, setAddStockId] = useState(null)
  const [addStockQty, setAddStockQty] = useState('')

  const headers = { Authorization: 'Bearer placeholder' }
  const API = 'http://localhost:5000/api'

  async function load() {
    const res = await axios.get(`${API}/products`, { headers })
    setProducts(res.data)
  }

  async function addProduct() {
    if (!newProd.name) { setError('Nom requis'); return }
    await axios.post(`${API}/products`, newProd, { headers })
    setNewProd({ name: '', unit: 'pièce', purchase_price: '', sale_price: '', stock: '', min_stock: '5' })
    setError(null)
    load()
  }

  async function deleteProduct(id) {
    await axios.delete(`${API}/products/${id}`, { headers })
    load()
  }

  function startEdit(p) {
    setEditingId(p.id)
    setEditForm({
      name: p.name, unit: p.unit,
      purchase_price: String(p.purchase_price), sale_price: String(p.sale_price),
      stock: String(p.stock), min_stock: String(p.min_stock ?? 5)
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
  }

  async function saveEdit(id) {
    await axios.put(`${API}/products/${id}`, editForm, { headers })
    setEditingId(null)
    setEditForm({})
    load()
  }

  async function addStock(id) {
    if (!addStockQty || Number(addStockQty) <= 0) return
    const p = products.find(p => p.id === id)
    const newStock = Number(p.stock) + Number(addStockQty)
    await axios.put(`${API}/products/${id}`, { stock: newStock }, { headers })
    setAddStockId(null)
    setAddStockQty('')
    load()
  }

  useEffect(() => { load() }, [])

  function UnitSelect({ value, onChange }) {
    const isCustom = value && !UNITS.includes(value)
    return (
      <span className="unit-group">
        <select value={isCustom ? 'autre' : value} onChange={e => onChange(e.target.value === 'autre' ? '' : e.target.value)}>
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          <option value="autre">Autre…</option>
        </select>
        {isCustom && <input placeholder="Unité perso" value={value} onChange={e => onChange(e.target.value)} />}
      </span>
    )
  }

  function StockAlert({ stock, min }) {
    if (stock <= 0) return <span className="badge badge-danger">Rupture</span>
    if (stock <= min) return <span className="badge badge-warning">Stock bas</span>
    return null
  }

  return (
    <div className="page">
      <h1>Gestion des produits</h1>

      <div className="card form-card">
        <h3>Ajouter un produit</h3>
        {error && <div className="error">{error}</div>}
        <div className="row wrap">
          <input placeholder="Nom" value={newProd.name} onChange={e => setNewProd({ ...newProd, name: e.target.value })} />
          <UnitSelect value={newProd.unit} onChange={v => setNewProd({ ...newProd, unit: v })} />
          <input placeholder="Prix achat" type="number" step="0.01" value={newProd.purchase_price} onChange={e => setNewProd({ ...newProd, purchase_price: e.target.value })} />
          <input placeholder="Prix vente" type="number" step="0.01" value={newProd.sale_price} onChange={e => setNewProd({ ...newProd, sale_price: e.target.value })} />
          <input placeholder="Stock" type="number" value={newProd.stock} onChange={e => setNewProd({ ...newProd, stock: e.target.value })} />
          <input placeholder="Stock min" type="number" title="Alerte en dessous de ce stock" value={newProd.min_stock} onChange={e => setNewProd({ ...newProd, min_stock: e.target.value })} />
          <button onClick={addProduct}>Ajouter</button>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Nom</th><th>Unité</th><th>Prix achat</th><th>Prix vente</th>
            <th>Stock</th><th>Stock min</th><th>Vendus</th><th>Bénéfice/unité</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className={p.stock <= (p.min_stock || 5) ? 'row-warning' : ''}>
              {editingId === p.id ? (
                <>
                  <td><input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></td>
                  <td><UnitSelect value={editForm.unit} onChange={v => setEditForm({ ...editForm, unit: v })} /></td>
                  <td><input type="number" step="0.01" value={editForm.purchase_price} onChange={e => setEditForm({ ...editForm, purchase_price: e.target.value })} /></td>
                  <td><input type="number" step="0.01" value={editForm.sale_price} onChange={e => setEditForm({ ...editForm, sale_price: e.target.value })} /></td>
                  <td><input type="number" value={editForm.stock} onChange={e => setEditForm({ ...editForm, stock: e.target.value })} /></td>
                  <td><input type="number" value={editForm.min_stock ?? 5} onChange={e => setEditForm({ ...editForm, min_stock: e.target.value })} /></td>
                  <td>{p.sold}</td>
                  <td>{(Number(editForm.sale_price) - Number(editForm.purchase_price)).toFixed(2)} Ar</td>
                  <td>
                    <button onClick={() => saveEdit(p.id)}>Sauvegarder</button>
                    <button className="btn-secondary" onClick={cancelEdit}>Annuler</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{p.name}</td>
                  <td>{p.unit || 'pièce'}</td>
                  <td>{Number(p.purchase_price).toFixed(2)} Ar</td>
                  <td>{Number(p.sale_price).toFixed(2)} Ar</td>
                  <td>
                    {p.stock}
                    <StockAlert stock={p.stock} min={p.min_stock ?? 5} />
                  </td>
                  <td>{p.min_stock ?? 5}</td>
                  <td>{p.sold}</td>
                  <td>{(p.sale_price - p.purchase_price).toFixed(2)} Ar</td>
                  <td>
                    <div className="action-group">
                      <button onClick={() => startEdit(p)}>Modifier</button>
                      <button className="btn-danger" onClick={() => deleteProduct(p.id)}>Supprimer</button>
                      {addStockId === p.id ? (
                        <span className="add-stock">
                          <input type="number" min="1" value={addStockQty} onChange={e => setAddStockQty(e.target.value)} placeholder="Qté" />
                          <button className="btn-success" onClick={() => addStock(p.id)}>OK</button>
                          <button className="btn-secondary" onClick={() => { setAddStockId(null); setAddStockQty('') }}>X</button>
                        </span>
                      ) : (
                        <button className="btn-stock" onClick={() => { setAddStockId(p.id); setAddStockQty('') }}>Stock +</button>
                      )}
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
