import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'

const emptyOption = () => ({ name: '', description: '', price: '', pros: '', cons: '' })

export default function NewDecision() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState([emptyOption(), emptyOption()])
  const [priorities, setPriorities] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const updateOption = (index, field, value) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)))
  }
  const addOption = () => {
    if (options.length < 4) setOptions((prev) => [...prev, emptyOption()])
  }
  const removeOption = (index) => {
    if (options.length > 2) setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) { setError('Decision title is required.'); return }
    if (!question.trim()) { setError('Decision question is required.'); return }
    for (let i = 0; i < options.length; i++) {
      if (!options[i].name.trim()) {
        setError(`Option ${i + 1} needs a name.`)
        return
      }
    }

    const payload = {
      title: title.trim(),
      question: question.trim(),
      priorities: priorities.split(',').map((p) => p.trim()).filter(Boolean),
      options: options.map((o) => ({
        name: o.name.trim(),
        description: o.description.trim(),
        price: o.price !== '' ? Number(o.price) : null,
        pros: o.pros.split(',').map((p) => p.trim()).filter(Boolean),
        cons: o.cons.split(',').map((c) => c.trim()).filter(Boolean),
      })),
    }

    setSubmitting(true)
    try {
      const { data } = await api.post('/decisions', payload)
      navigate(`/decisions/${data._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create decision.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrap" style={{ maxWidth: 700 }}>

        {/* Page header */}
        <div style={s.pageHeader}>
          <Link to="/dashboard" style={s.backLink}>← Back to Dashboard</Link>
          <div>
            <h1 style={s.pageTitle}>New Decision</h1>
            <p style={s.pageSubtitle}>Define your options and priorities — then let AI help you decide</p>
          </div>
        </div>

        {error && (
          <div className="alert alert--error" style={{ marginBottom: '1.5rem' }}>
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Section: Decision Details ── */}
          <div style={s.formSection}>
            <p className="section-hd">Decision Details</p>
            <div className="card">
              <div className="form-group">
                <label className="form-label" htmlFor="title">
                  Title <span style={s.required}>*</span>
                </label>
                <input
                  id="title"
                  className="form-input"
                  placeholder="e.g. Which laptop to buy?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="question">
                  Question <span style={s.required}>*</span>
                </label>
                <textarea
                  id="question"
                  className="form-textarea"
                  placeholder="Describe what you are trying to decide and any important context…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* ── Section: Options ── */}
          <div style={s.formSection}>
            <div style={s.sectionRow}>
              <p className="section-hd" style={{ margin: 0 }}>
                Options ({options.length} / 4) <span style={s.required}>*</span>
              </p>
              {options.length < 4 && (
                <button type="button" className="btn btn--outline-primary btn--sm" onClick={addOption}>
                  + Add option
                </button>
              )}
            </div>

            <div style={s.optionsStack}>
              {options.map((opt, i) => (
                <div key={i} className="card animate-fade-slide" style={{ animationDelay: `${i * 30}ms` }}>
                  <div style={s.optionCardHeader}>
                    <div style={s.optionBadge}>Option {i + 1}</div>
                    {options.length > 2 && (
                      <button
                        type="button"
                        className="btn btn--danger-ghost btn--sm"
                        onClick={() => removeOption(i)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Name <span style={s.required}>*</span>
                    </label>
                    <input
                      className="form-input"
                      placeholder="e.g. MacBook Air"
                      value={opt.name}
                      onChange={(e) => updateOption(i, 'name', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input
                      className="form-input"
                      placeholder="Brief description"
                      value={opt.description}
                      onChange={(e) => updateOption(i, 'description', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price (optional)</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      placeholder="e.g. 1299"
                      value={opt.price}
                      onChange={(e) => updateOption(i, 'price', e.target.value)}
                      style={{ maxWidth: 160 }}
                    />
                  </div>

                  <div className="pro-con-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: 'var(--color-success)' }}>
                        Pros
                      </label>
                      <input
                        className="form-input"
                        placeholder="e.g. Lightweight, Good battery"
                        value={opt.pros}
                        onChange={(e) => updateOption(i, 'pros', e.target.value)}
                      />
                      <span style={s.hint}>Comma-separated</span>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: 'var(--color-danger)' }}>
                        Cons
                      </label>
                      <input
                        className="form-input"
                        placeholder="e.g. Expensive, Limited ports"
                        value={opt.cons}
                        onChange={(e) => updateOption(i, 'cons', e.target.value)}
                      />
                      <span style={s.hint}>Comma-separated</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Section: Priorities ── */}
          <div style={s.formSection}>
            <p className="section-hd">Priorities</p>
            <div className="card">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="priorities">
                  What matters most to you?
                </label>
                <input
                  id="priorities"
                  className="form-input"
                  placeholder="e.g. price, performance, portability"
                  value={priorities}
                  onChange={(e) => setPriorities(e.target.value)}
                />
                <span style={s.hint}>
                  Comma-separated — the AI will use these to weigh your options
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--lg btn--full"
            disabled={submitting}
          >
            {submitting
              ? <><span className="spinner" /> Creating decision…</>
              : 'Create Decision'}
          </button>
        </form>
      </div>
    </div>
  )
}

const s = {
  pageHeader: { marginBottom: '2rem' },
  backLink: {
    fontSize: '0.8125rem',
    color: 'var(--color-text-2)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginBottom: '0.75rem',
    textDecoration: 'none',
    transition: 'color var(--transition)',
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    marginBottom: '0.25rem',
  },
  pageSubtitle: { fontSize: '0.875rem', color: 'var(--color-text-2)' },
  formSection: { marginBottom: '1.75rem' },
  sectionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  required: { color: 'var(--color-danger)', fontWeight: 400 },
  optionsStack: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  optionCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--color-border)',
  },
  optionBadge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--color-primary)',
    background: 'var(--color-primary-light)',
    padding: '0.2rem 0.65rem',
    borderRadius: 'var(--radius-full)',
  },
  /* proConGrid moved to CSS class .pro-con-grid in index.css */
  hint: {
    fontSize: '0.7rem',
    color: 'var(--color-text-3)',
    marginTop: '0.2rem',
    display: 'block',
  },
}
