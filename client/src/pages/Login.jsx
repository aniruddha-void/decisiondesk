import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login, loading } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [formError, setFormError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { email, password } = form
    if (!email.trim() || !password.trim()) {
      setFormError('Email and password are required.')
      return
    }
    const result = await login(email.trim(), password)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setFormError(result.message)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-logo">
          <span className="auth-logo__dot" />
          <span className="auth-logo__text">DecisionDesk</span>
        </div>

        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-sub">Sign in to your account to continue</p>

        {formError && (
          <div className="alert alert--error" style={{ marginBottom: '1.25rem' }}>
            <span>⚠</span> {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="form-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="form-input"
              type="password"
              name="password"
              placeholder="Your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--lg btn--full"
            disabled={loading}
            style={{ marginTop: '0.5rem' }}
          >
            {loading ? <><span className="spinner" /> Signing in…</> : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  )
}
