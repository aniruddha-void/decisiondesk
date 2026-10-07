import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'

// ── Animated score bar ────────────────────────────────────────
function ScoreBar({ score, highlight }) {
  const barRef = useRef(null)
  useEffect(() => {
    const el = barRef.current
    if (!el) return
    // Start at 0, animate to actual width
    el.style.width = '0%'
    const id = setTimeout(() => {
      el.style.width = `${score}%`
    }, 60)
    return () => clearTimeout(id)
  }, [score])

  const color = highlight
    ? 'var(--color-ai)'
    : score >= 75
    ? 'var(--color-success)'
    : score >= 50
    ? 'var(--color-primary)'
    : '#f59e0b'

  return (
    <div style={sb.track}>
      <div
        ref={barRef}
        style={{
          height: '100%',
          borderRadius: 'var(--radius-full)',
          background: color,
          transition: 'width 0.7s cubic-bezier(.4,0,.2,1)',
          width: 0,
        }}
      />
    </div>
  )
}
const sb = {
  track: {
    height: 8,
    background: 'var(--color-surface-2)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
    flex: 1,
  },
}

const parseAnalysis = (raw) => {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

export default function DecisionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [decision, setDecision] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')
  const [analysis, setAnalysis] = useState(null)

  useEffect(() => {
    api.get(`/decisions/${id}`)
      .then(({ data }) => {
        setDecision(data)
        setAnalysis(parseAnalysis(data.aiAnalysis))
      })
      .catch((err) => setError(err.response?.status === 404 ? 'Decision not found.' : 'Failed to load decision.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!window.confirm('Delete this decision? This cannot be undone.')) return
    setDeleting(true)
    try {
      await api.delete(`/decisions/${id}`)
      navigate('/dashboard')
    } catch {
      alert('Failed to delete decision.')
      setDeleting(false)
    }
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setAnalyzeError('')
    try {
      const { data } = await api.post(`/decisions/${id}/analyze`)
      setAnalysis(parseAnalysis(data.aiAnalysis))
      setDecision((prev) => ({ ...prev, recommendedOption: data.recommendedOption }))
    } catch (err) {
      setAnalyzeError(err.response?.data?.message || 'AI analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) return (
    <div className="page-container">
      <Navbar />
      <div style={s.centerState}>
        <span className="spinner spinner--dark" style={{ width: 24, height: 24 }} />
        <span style={{ color: 'var(--color-text-2)', fontSize: '0.9rem' }}>Loading decision…</span>
      </div>
    </div>
  )

  if (error) return (
    <div className="page-container">
      <Navbar />
      <div style={s.centerState}>
        <p style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>{error}</p>
        <Link to="/dashboard" className="btn btn--ghost">← Back to Dashboard</Link>
      </div>
    </div>
  )

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrap animate-fade-slide">

        {/* ── Header ── */}
        <div style={s.pageHeader}>
          <Link to="/dashboard" style={s.backLink}>← Dashboard</Link>
          <div style={s.titleRow}>
            <div style={{ flex: 1 }}>
              <h1 style={s.pageTitle}>{decision.title}</h1>
              <p style={s.pageMeta}>Created {formatDate(decision.createdAt)}</p>
            </div>
            <button
              className="btn btn--danger-ghost btn--sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>

        {/* ── Question ── */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <p className="section-hd">Question</p>
          <p style={s.questionText}>{decision.question}</p>
        </div>

        {/* ── Priorities ── */}
        {decision.priorities?.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <p className="section-hd">Priorities</p>
            <div className="tag-row">
              {decision.priorities.map((p, i) => (
                <span key={i} className="tag">{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── Options ── */}
        <div style={{ marginBottom: '2rem' }}>
          <p className="section-hd">Options ({decision.options.length})</p>
          <div className="option-grid">
            {decision.options.map((opt, i) => (
              <div key={opt._id || i} className="card">
                <div style={s.optionHeader}>
                  <span style={s.optionIndex}>{i + 1}</span>
                  <h3 style={s.optionName}>{opt.name}</h3>
                </div>

                {opt.description && (
                  <p style={s.optionDesc}>{opt.description}</p>
                )}

                {opt.price != null && (
                  <p style={s.priceTag}>₹{Number(opt.price).toLocaleString('en-IN')}</p>
                )}

                <div style={s.proConRow}>
                  {opt.pros?.length > 0 && (
                    <div style={s.proConCol}>
                      <p style={s.proConLabel} className="section-hd">Pros</p>
                      <ul>
                        {opt.pros.map((p, pi) => (
                          <li key={pi} style={s.proItem}>
                            <span style={s.bullet}>+</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {opt.cons?.length > 0 && (
                    <div style={s.proConCol}>
                      <p style={s.conLabel} className="section-hd">Cons</p>
                      <ul>
                        {opt.cons.map((c, ci) => (
                          <li key={ci} style={s.conItem}>
                            <span style={s.conBullet}>−</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI Analysis ── */}
        <div className="ai-container">
          <div style={s.aiSectionHeader}>
            <div>
              <p className="section-hd" style={{ marginBottom: '0.2rem' }}>AI Decision Analysis</p>
              <p style={s.aiHeaderSub}>
                {analysis ? 'Analysis complete — re-run to refresh.' : 'Let Gemini AI compare your options.'}
              </p>
            </div>
            <button
              className="btn btn--ai"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing
                ? <><span className="spinner" /> Analyzing…</>
                : analysis ? '↻ Re-analyze' : '✦ Analyze with AI'
              }
            </button>
          </div>

          {analyzeError && (
            <div className="alert alert--error" style={{ margin: '1rem 0' }}>
              <span>⚠</span> {analyzeError}
            </div>
          )}

          {analyzing && (
            <div style={s.analyzingState}>
              <div style={s.analyzingDots}>
                <span style={{ ...s.dot, animationDelay: '0ms' }} />
                <span style={{ ...s.dot, animationDelay: '150ms' }} />
                <span style={{ ...s.dot, animationDelay: '300ms' }} />
              </div>
              <p style={s.analyzingText}>Gemini is comparing your options…</p>
            </div>
          )}

          {!analyzing && !analysis && !analyzeError && (
            <div style={s.aiPlaceholder}>
              <p style={s.aiPlaceholderText}>
                Click <strong>Analyze with AI</strong> to receive a structured analysis — recommendation, strengths, weaknesses, and priority alignment — powered by Google Gemini.
              </p>
            </div>
          )}

          {!analyzing && analysis && (
            <div className="animate-fade-slide">
              {/* Recommendation banner */}
              <div className="card card--success" style={{ marginBottom: '1.25rem' }}>
                <p className="section-hd" style={{ color: 'var(--color-success)', marginBottom: '0.35rem' }}>
                  ✓ Recommended
                </p>
                <p style={s.recValue}>{analysis.recommendation}</p>
                <p style={s.recSummary}>{analysis.summary}</p>
              </div>

              {/* Decision Scores */}
              {analysis.scores?.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }} className="animate-fade-slide">
                  <p className="section-hd">Decision Scores</p>
                  <div className="card">
                    <p style={s.scoreDisclaimer}>
                      Scores are AI estimates based on the information and priorities you provided.
                    </p>

                    {/* Sort highest score first */}
                    {[...analysis.scores]
                      .sort((a, b) => b.score - a.score)
                      .map((entry, i) => {
                        const isTop = i === 0
                        return (
                          <div
                            key={entry.option}
                            style={{
                              ...s.scoreRow,
                              borderTop: i === 0 ? 'none' : '1px solid var(--color-border)',
                              paddingTop: i === 0 ? 0 : '1rem',
                              marginTop: i === 0 ? 0 : '1rem',
                            }}
                          >
                            {/* Option name + overall score */}
                            <div style={s.scoreHeader}>
                              <span style={isTop ? s.scoreNameTop : s.scoreName}>
                                {isTop && <span style={s.topBadge}>↑ Top</span>}
                                {entry.option}
                              </span>
                              <span style={isTop ? s.scoreNumTop : s.scoreNum}>
                                {entry.score} <span style={s.scoreOf}>/ 100</span>
                              </span>
                            </div>

                            {/* Overall bar */}
                            <div style={s.barRow}>
                              <ScoreBar score={entry.score} highlight={isTop} />
                            </div>

                            {/* Per-priority scores */}
                            {entry.priorityScores?.length > 0 && (
                              <div style={s.priorityScoreGrid}>
                                {entry.priorityScores.map((ps) => (
                                  <div key={ps.priority} style={s.priorityScoreRow}>
                                    <span style={s.priorityLabel}>{ps.priority}</span>
                                    <div style={s.priorityBarWrap}>
                                      <ScoreBar score={ps.score} highlight={false} />
                                    </div>
                                    <span style={s.priorityScoreNum}>{ps.score}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Reasoning */}
              {analysis.reasoning?.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p className="section-hd">Key Reasoning</p>
                  <div className="card">
                    <ol style={s.reasoningList}>
                      {analysis.reasoning.map((r, i) => (
                        <li key={i} style={s.reasoningItem}>
                          <span style={s.reasoningNum}>{i + 1}</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {/* Per-option comparison */}
              {analysis.comparison?.length > 0 && (
                <div>
                  <p className="section-hd">Option Comparison</p>
                  <div className="comp-grid">
                    {analysis.comparison.map((item, i) => {
                      const isRec = item.option === analysis.recommendation
                      return (
                        <div
                          key={i}
                          className={isRec ? 'card card--highlighted' : 'card'}
                        >
                          <div style={s.compCardHeader}>
                            <h4 style={s.compName}>{item.option}</h4>
                            {isRec && (
                              <span style={s.recBadge}>✓ Recommended</span>
                            )}
                          </div>

                          <p style={s.priorityAlignText}>{item.priorityAlignment}</p>

                          {item.strengths?.length > 0 && (
                            <div style={{ marginTop: '0.75rem' }}>
                              <p className="section-hd" style={{ color: 'var(--color-success)' }}>Strengths</p>
                              <ul>
                                {item.strengths.map((str, si) => (
                                  <li key={si} style={s.proItem}>
                                    <span style={s.bullet}>+</span> {str}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {item.weaknesses?.length > 0 && (
                            <div style={{ marginTop: '0.75rem' }}>
                              <p className="section-hd" style={{ color: 'var(--color-danger)' }}>Weaknesses</p>
                              <ul>
                                {item.weaknesses.map((w, wi) => (
                                  <li key={wi} style={s.conItem}>
                                    <span style={s.conBullet}>−</span> {w}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  centerState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    minHeight: '50vh',
  },
  pageHeader: { marginBottom: '1.75rem' },
  backLink: {
    fontSize: '0.8125rem',
    color: 'var(--color-text-2)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginBottom: '0.75rem',
    textDecoration: 'none',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  pageTitle: {
    fontSize: '1.625rem',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    marginBottom: '0.25rem',
  },
  pageMeta: { fontSize: '0.8rem', color: 'var(--color-text-3)' },
  questionText: { fontSize: '0.9375rem', color: 'var(--color-text-2)', lineHeight: 1.7 },
  optionGrid: {}, /* moved to .option-grid CSS class */
  optionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    marginBottom: '0.75rem',
    paddingBottom: '0.625rem',
    borderBottom: '1px solid var(--color-border)',
  },
  optionIndex: {
    width: 24,
    height: 24,
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-primary-light)',
    color: 'var(--color-primary)',
    fontSize: '0.75rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionName: { fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)' },
  optionDesc: { fontSize: '0.8125rem', color: 'var(--color-text-2)', marginBottom: '0.5rem', lineHeight: 1.5 },
  priceTag: {
    display: 'inline-block',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--color-text)',
    background: 'var(--color-surface-2)',
    padding: '0.2rem 0.65rem',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '0.75rem',
  },
  proConRow: { display: 'flex', flexDirection: 'column', gap: '0.625rem' },
  proConCol: {},
  proConLabel: { color: 'var(--color-success)' },
  conLabel: { color: 'var(--color-danger)' },
  proItem: {
    fontSize: '0.8125rem',
    color: 'var(--color-success)',
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.375rem',
    marginBottom: '0.25rem',
    lineHeight: 1.4,
  },
  conItem: {
    fontSize: '0.8125rem',
    color: 'var(--color-danger)',
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.375rem',
    marginBottom: '0.25rem',
    lineHeight: 1.4,
  },
  bullet: { fontWeight: 700, flexShrink: 0, color: 'var(--color-success)' },
  conBullet: { fontWeight: 700, flexShrink: 0, color: 'var(--color-danger)' },
  // AI section (base styles moved to .ai-container CSS class)
  aiSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid var(--color-ai-border)',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
  },
  aiHeaderSub: {
    fontSize: '0.8125rem',
    color: 'var(--color-text-2)',
  },
  analyzingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '2rem 0',
  },
  analyzingDots: { display: 'flex', gap: '0.375rem' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-ai)',
    animation: 'pulse 1.2s ease-in-out infinite',
    display: 'inline-block',
  },
  analyzingText: { fontSize: '0.875rem', color: 'var(--color-text-2)' },
  aiPlaceholder: {
    background: 'var(--color-ai-light)',
    borderRadius: 'var(--radius-md)',
    padding: '1.25rem',
  },
  aiPlaceholderText: {
    fontSize: '0.875rem',
    color: 'var(--color-text-2)',
    lineHeight: 1.65,
  },
  recValue: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--color-text)',
    letterSpacing: '-0.02em',
    marginBottom: '0.5rem',
  },
  recSummary: {
    fontSize: '0.875rem',
    color: 'var(--color-text-2)',
    lineHeight: 1.65,
  },
  reasoningList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
    paddingLeft: 0,
    listStyle: 'none',
  },
  reasoningItem: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'baseline',
    fontSize: '0.875rem',
    color: 'var(--color-text)',
    lineHeight: 1.55,
  },
  reasoningNum: {
    flexShrink: 0,
    width: 20,
    height: 20,
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-primary-light)',
    color: 'var(--color-primary)',
    fontSize: '0.7rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compGrid: {}, /* moved to .comp-grid CSS class */
  compCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
    gap: '0.5rem',
  },
  compName: { fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)' },
  recBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    background: 'var(--color-ai)',
    color: '#fff',
    padding: '0.15rem 0.5rem',
    borderRadius: 'var(--radius-full)',
    whiteSpace: 'nowrap',
  },
  priorityAlignText: {
    fontSize: '0.8rem',
    color: 'var(--color-text-2)',
    fontStyle: 'italic',
    lineHeight: 1.55,
    marginBottom: '0.5rem',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '0.625rem',
  },
  // Score section
  scoreDisclaimer: {
    fontSize: '0.75rem',
    color: 'var(--color-text-3)',
    marginBottom: '1.25rem',
    fontStyle: 'italic',
  },
  scoreRow: {},
  scoreHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
    gap: '0.5rem',
  },
  scoreName: { fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.4rem' },
  scoreNameTop: { fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.4rem' },
  scoreNum: { fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-2)', flexShrink: 0 },
  scoreNumTop: { fontSize: '1rem', fontWeight: 700, color: 'var(--color-ai)', flexShrink: 0 },
  scoreOf: { fontWeight: 400, color: 'var(--color-text-3)', fontSize: '0.75rem' },
  topBadge: {
    fontSize: '0.65rem',
    fontWeight: 700,
    background: 'var(--color-ai-light)',
    color: 'var(--color-ai)',
    border: '1px solid var(--color-ai-border)',
    borderRadius: 'var(--radius-full)',
    padding: '0.1rem 0.45rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  priorityScoreGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  priorityScoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
  },
  priorityLabel: {
    fontSize: '0.75rem',
    color: 'var(--color-text-2)',
    width: 110,
    flexShrink: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  priorityBarWrap: { flex: 1 },
  priorityScoreNum: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--color-text-2)',
    width: 24,
    textAlign: 'right',
    flexShrink: 0,
  },
}
