import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { register, loading } = useAuth()

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [formError, setFormError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { name, email, password } = form
    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError('All fields are required.')
      return
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }
    const result = await register(name.trim(), email.trim(), password)
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

        <h1 className="auth-heading">Create your account</h1>
        <p className="auth-sub">Start making smarter decisions with AI</p>

        {formError && (
          <div className="alert alert--error" style={{ marginBottom: '1.25rem' }}>
            <span>⚠</span> {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full name</label>
            <input
              id="name"
              className="form-input"
              type="text"
              name="name"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="form-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="form-input"
              type="password"
              name="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--lg btn--full"
            disabled={loading}
            style={{ marginTop: '0.5rem' }}
          >
            {loading ? <><span className="spinner" /> Creating account…</> : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
