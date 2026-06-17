import React, { useEffect, useState } from 'react'
import axios from 'axios'

function Card({ title, value }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="card-value">{value ?? '-'}</div>
    </div>
  )
}

export default function Dashboard() {
  const [filters, setFilters] = useState({ range: 'today', start: '', end: '' })
  const [data, setData] = useState(null)

  function getDateParams() {
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    switch (filters.range) {
      case 'today':
        return { start: today, end: today }
      case 'yesterday': {
        const d = new Date(now)
        d.setDate(d.getDate() - 1)
        const y = d.toISOString().slice(0, 10)
        return { start: y, end: y }
      }
      case 'week': {
        const d = new Date(now)
        d.setDate(d.getDate() - d.getDay())
        const start = d.toISOString().slice(0, 10)
        return { start, end: today }
      }
      case 'specific':
        return { start: filters.start || today, end: filters.end || today }
      default:
        return {}
    }
  }

  async function fetchData() {
    const params = getDateParams()
    const res = await axios.get('http://localhost:5000/api/dashboard', {
      headers: { Authorization: 'Bearer placeholder' },
      params
    })
    setData(res.data)
  }

  useEffect(() => { fetchData() }, [filters])

  function fmt(amount) {
    if (amount == null) return '-'
    return Number(amount).toLocaleString('fr-FR') + ' Ar'
  }

  return (
    <div className="dashboard">
      <h1>Tableau de bord</h1>
      <div className="filters">
        <select value={filters.range} onChange={e => setFilters({ ...filters, range: e.target.value })}>
          <option value="today">Aujourd'hui</option>
          <option value="yesterday">Hier</option>
          <option value="week">Cette semaine</option>
          <option value="specific">Date(s) spécifique(s)</option>
        </select>
        {filters.range === 'specific' && (
          <div className="date-range">
            <input type="date" value={filters.start} onChange={e => setFilters({ ...filters, start: e.target.value })} />
            <input type="date" value={filters.end} onChange={e => setFilters({ ...filters, end: e.target.value })} />
          </div>
        )}
      </div>
      <div className="cards">
        <Card title="Ventes totales" value={fmt(data?.totalSales)} />
        <Card title="Bénéfice total" value={fmt(data?.totalProfit)} />
        <Card title="Valeur du stock" value={fmt(data?.stockValue)} />
        <Card title="Coûts (ventes - bénéfice)" value={fmt(data?.costIndicator)} />
        <Card title="Produits vendus" value={data?.totalSoldUnits ?? 0} />
      </div>
      <div className="section">
        <h2>Ventes récentes</h2>
        {data?.recentSales?.length ? (
          <table className="table">
            <thead><tr><th>Date</th><th>Produit</th><th>Qté</th><th>Total</th><th>Profit</th></tr></thead>
            <tbody>
              {data.recentSales.map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.date).toLocaleDateString('fr-FR')}</td>
                  <td>{s.product_name}</td>
                  <td>{s.quantity}</td>
                  <td>{fmt(s.total_price)}</td>
                  <td>{fmt(s.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Aucune vente récente.</p>
        )}
      </div>
    </div>
  )
}
