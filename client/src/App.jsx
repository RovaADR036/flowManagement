import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Products from './pages/Products.jsx'
import Sales from './pages/Sales.jsx'
import Login from './pages/Login.jsx'
import Navbar from './components/Navbar.jsx'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('shop_token')
  return token ? children : <Navigate to="/login" replace />
}

function Layout({ children }) {
  return (
    <PrivateRoute>
      <Navbar>{children}</Navbar>
    </PrivateRoute>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/products" element={<Layout><Products /></Layout>} />
      <Route path="/sales" element={<Layout><Sales /></Layout>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
