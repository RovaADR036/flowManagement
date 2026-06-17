import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

export default function Navbar({ children }) {
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem('shop_token')
    navigate('/login', { replace: true })
  }

  return (
    <div className="layout">
      <nav className="sidebar">
        <h2 className="logo">Shop</h2>
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Dashboard
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Produits
        </NavLink>
        <NavLink to="/sales" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Ventes
        </NavLink>
        <button onClick={logout} className="nav-link logout">Déconnexion</button>
      </nav>
      <main className="main">{children}</main>
    </div>
  )
}
