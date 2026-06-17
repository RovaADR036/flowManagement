import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('admin@shop.com')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    try {
      const res = await axios.post('http://localhost:5000/api/login', { email, password })
      const token = res.data.token
      localStorage.setItem('shop_token', token)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="login-page">
      <form onSubmit={onSubmit} className="card login-card">
        <h2>Connexion</h2>
        {error && <div className="error">{error}</div>}
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Mot de passe</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit">Se connecter</button>
      </form>
    </div>
  )
}
