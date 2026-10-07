import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

export default function Dashboard() {
  const navigate = useNavigate()

  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    api.get('/decisions')
      .then(({ data }) => setDecisions(data))
      .catch(() => setError('Failed to load decisions.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this decision? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await api.delete(`/decisions/${id}`)
      setDecisions((prev) => prev.filter((d) => d._id !== id))
    } catch {
      alert('Failed to delete decision.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrap">

        {/* Page header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>My Decisions</h1>
            <p style={s.pageSubtitle}>Compare your options and let AI guide your choices</p>
          </div>
          <button className="btn btn--primary btn--lg" onClick={() => navigate('/decisions/new')}>
            + New Decision
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={s.loadingRow}>
            <span className="spinner spinner--dark" style={{ width: 20, height: 20 }} />
            <span style={s.loadingText}>Loading decisions…</span>
          </div>
        )}

        {/* Error */}
        {error && <div className="alert alert--error">{error}</div>}

        {/* Empty state */}
        {!loading && !error && decisions.length === 0 && (
          <div style={s.emptyState} className="animate-fade-slide">
            <div style={s.emptyIcon}>✦</div>
            <h2 style={s.emptyTitle}>No decisions yet</h2>
            <p style={s.emptyText}>
              Create your first decision, add your options, and let AI help you choose.
            </p>
            <button
              className="btn btn--primary btn--lg"
              onClick={() => navigate('/decisions/new')}
              style={{ marginTop: '1.5rem' }}
            >
              Create your first decision
            </button>
          </div>
        )}

        {/* Decision cards */}
        {!loading && decisions.length > 0 && (
          <div style={s.grid}>
            {decisions.map((d, idx) => (
              <div
                key={d._id}
                className="card card--hoverable animate-fade-slide"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div style={s.cardTop}>
                  <div style={s.cardMeta}>
                    <span style={s.cardDate}>{formatDate(d.createdAt)}</span>
                    {d.aiAnalysis && (
                      <span style={s.aiChip}>✦ AI analysed</span>
                    )}
                  </div>
                  <h2 style={s.cardTitle}>{d.title}</h2>
                  <p style={s.cardQuestion}>{d.question}</p>
                </div>

                <div style={s.cardFooter}>
                  <span style={s.optCount}>
                    {d.options?.length ?? 0} option{d.options?.length !== 1 ? 's' : ''}
                  </span>
                  <div style={s.cardActions}>
                    <Link
                      to={`/decisions/${d._id}`}
                      className="btn btn--outline-primary btn--sm"
                    >
                      View
                    </Link>
                    <button
                      className="btn btn--danger-ghost btn--sm"
                      onClick={() => handleDelete(d._id)}
                      disabled={deletingId === d._id}
                    >
                      {deletingId === d._id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  pageTitle: {
    fontSize: '1.625rem',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    marginBottom: '0.25rem',
  },
  pageSubtitle: {
    fontSize: '0.875rem',
    color: 'var(--color-text-2)',
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '2rem 0',
  },
  loadingText: { color: 'var(--color-text-2)', fontSize: '0.9rem' },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '4rem 2rem',
    background: 'var(--color-surface)',
    border: '1px dashed var(--color-border)',
    borderRadius: 'var(--radius-lg)',
  },
  emptyIcon: {
    fontSize: '2rem',
    color: 'var(--color-primary)',
    marginBottom: '1rem',
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: '1.125rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
  },
  emptyText: {
    fontSize: '0.875rem',
    color: 'var(--color-text-2)',
    maxWidth: '340px',
    lineHeight: 1.65,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
    gap: '1rem',
  },
  cardTop: { marginBottom: '1rem' },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  cardDate: { fontSize: '0.75rem', color: 'var(--color-text-3)' },
  aiChip: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--color-ai)',
    background: 'var(--color-ai-light)',
    border: '1px solid var(--color-ai-border)',
    borderRadius: 'var(--radius-full)',
    padding: '0.1rem 0.5rem',
    letterSpacing: '0.02em',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    marginBottom: '0.35rem',
    color: 'var(--color-text)',
  },
  cardQuestion: {
    fontSize: '0.8125rem',
    color: 'var(--color-text-2)',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '0.875rem',
    borderTop: '1px solid var(--color-border)',
  },
  optCount: {
    fontSize: '0.75rem',
    color: 'var(--color-text-3)',
    fontWeight: 500,
  },
  cardActions: { display: 'flex', gap: '0.5rem' },
}
