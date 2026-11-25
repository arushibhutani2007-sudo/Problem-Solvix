import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ThumbsUp, CheckCircle2, XCircle, Shield, MessageSquare, ExternalLink, Send, Sparkles, ArrowLeft
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProblemDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [problem, setProblem] = useState(null);
  const [solutions, setSolutions] = useState([]);
  const [externalDiscussions, setExternalDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Solution State
  const [solContent, setSolContent] = useState('');
  const [solCode, setSolCode] = useState('');
  const [solAnon, setSolAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Comment Inputs per solution
  const [commentInputs, setCommentInputs] = useState({});

  const loadProblem = async () => {
    try {
      const { data } = await api.get(`/problems/${id}`);
      setProblem(data.problem);
      setSolutions(data.solutions || []);
      setExternalDiscussions(data.externalDiscussions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblem();
  }, [id]);

  const handleSolutionSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please log in to submit a solution.');
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.post(`/solutions/${id}`, {
        content: solContent,
        code_block: solCode,
        is_anonymous: solAnon
      });
      setSolContent('');
      setSolCode('');
      await loadProblem();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Could not submit solution.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (solutionId) => {
    if (!user) return alert('Please log in to upvote helpful solutions.');
    try {
      await api.post(`/solutions/${solutionId}/vote`, { vote_type: 1 });
      await loadProblem();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOutcome = async (solutionId, outcome) => {
    if (!user) return alert('Please log in to verify whether this solution worked.');
    try {
      await api.post(`/solutions/${solutionId}/outcome`, { outcome });
      await loadProblem();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (solutionId) => {
    if (!user) return alert('Please log in to comment.');
    const body = commentInputs[solutionId];
    if (!body || !body.trim()) return;
    try {
      await api.post(`/solutions/${solutionId}/comments`, { body });
      setCommentInputs((prev) => ({ ...prev, [solutionId]: '' }));
      await loadProblem();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: 60, textAlign: 'center' }}>Loading problem thread...</div>;
  }

  if (!problem) {
    return <div className="container" style={{ padding: 60, textAlign: 'center' }}>Problem not found.</div>;
  }

  return (
    <div className="container" style={{ padding: '32px 24px 72px' }}>
      <Link to="/" className="nav-link" style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back to Knowledge Base
      </Link>

      {/* Main Problem Card */}
      <div className="glass-card" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className={`badge ${problem.status === 'Verified' ? 'badge-verified' : 'badge-open'}`}>
              {problem.status}
            </span>
            <span className="tag-pill" style={{ color: '#a78bfa' }}>{problem.category}</span>
          </div>
          <span className="badge badge-anon">
            {problem.is_anonymous && <Shield size={13} />} Posted by {problem.author_display}
          </span>
        </div>

        <h1 style={{ fontSize: '1.8rem', marginBottom: 12 }}>{problem.title}</h1>
        <p style={{ color: '#cbd5e1', whiteSpace: 'pre-line', marginBottom: 14 }}>{problem.description}</p>

        {problem.code_snippet && (
          <pre className="code-view">
            <code>{problem.code_snippet}</code>
          </pre>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          {problem.tags?.map((t) => (
            <span key={t} className="tag-pill">#{t}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(290px, 1fr)', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Community Solutions & Outcome Verification */}
        <div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: 16 }}>
            Community Solutions ({solutions.length}) — Ranked by Empirical Success Rate
          </h2>

          {solutions.map((sol, idx) => (
            <div key={sol.id} className="glass-card" style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {idx === 0 && Number(sol.success_rate) >= 70 && (
                    <span className="badge badge-verified">
                      <Sparkles size={12} /> Top Verified Fix
                    </span>
                  )}
                  <strong style={{ fontSize: '0.92rem' }}>{sol.author_display}</strong>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>({sol.author_reputation} rep)</span>
                </div>

                {/* Success Rate Pill */}
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#34d399' }}>
                    {Math.round(sol.success_rate)}% Success Rate
                  </span>
                  <span style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block' }}>
                    {sol.success_count} worked / {sol.attempt_count} attempts
                  </span>
                </div>
              </div>

              <div className="meter-track" style={{ marginBottom: 14 }}>
                <div className="meter-fill" style={{ width: `${Math.min(100, sol.success_rate)}%` }} />
              </div>

              <p style={{ color: '#e2e8f0', whiteSpace: 'pre-line', marginBottom: 12 }}>{sol.content}</p>

              {sol.code_block && (
                <pre className="code-view">
                  <code>{sol.code_block}</code>
                </pre>
              )}

              {/* Interactive Verification & Voting Controls */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => handleVote(sol.id)}
                  className={`btn btn-secondary ${sol.userVote === 1 ? 'active' : ''}`}
                  style={{ padding: '7px 14px' }}
                >
                  <ThumbsUp size={15} /> Helpful ({sol.upvotes})
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Did this fix work for you?</span>
                  <button
                    onClick={() => handleOutcome(sol.id, 'success')}
                    className={`btn btn-success ${sol.userOutcome === 'success' ? 'selected' : ''}`}
                    style={{ padding: '7px 12px', fontSize: '0.82rem' }}
                  >
                    <CheckCircle2 size={15} /> Worked ({sol.success_count})
                  </button>
                  <button
                    onClick={() => handleOutcome(sol.id, 'failure')}
                    className={`btn btn-danger ${sol.userOutcome === 'failure' ? 'selected' : ''}`}
                    style={{ padding: '7px 12px', fontSize: '0.82rem' }}
                  >
                    <XCircle size={15} /> Didn&apos;t Work ({sol.failure_count})
                  </button>
                </div>
              </div>

              {/* Threaded Comments */}
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed var(--border-subtle)' }}>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MessageSquare size={14} /> Discussion ({sol.comments?.length || 0})
                </div>
                {sol.comments?.map((c) => (
                  <div key={c.id} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 6, fontSize: '0.86rem' }}>
                    <strong style={{ color: '#c4b5fd' }}>{c.author_display}: </strong>
                    <span style={{ color: '#cbd5e1' }}>{c.body}</span>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    placeholder="Add a comment or follow-up reply..."
                    value={commentInputs[sol.id] || ''}
                    onChange={(e) => setCommentInputs((prev) => ({ ...prev, [sol.id]: e.target.value }))}
                  />
                  <button onClick={() => handleAddComment(sol.id)} className="btn btn-secondary" style={{ padding: '8px 14px' }}>
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Submit Solution Form */}
          <form onSubmit={handleSolutionSubmit} className="glass-card" style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 12 }}>Contribute a Solution</h3>
            {errorMsg && (
              <div style={{ padding: 12, borderRadius: 10, background: 'rgba(244,63,94,0.15)', color: '#fda4af', marginBottom: 12, fontSize: '0.88rem' }}>
                {errorMsg}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Explanation & Steps</label>
              <textarea
                rows={4}
                required
                className="form-control"
                placeholder="Explain the root cause and how your fix solves it..."
                value={solContent}
                onChange={(e) => setSolContent(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Code Snippet / Command (Optional)</label>
              <textarea
                rows={4}
                className="form-control code-editor"
                placeholder="// Paste working code or terminal command here..."
                value={solCode}
                onChange={(e) => setSolCode(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', color: '#cbd5e1', cursor: 'pointer' }}>
                <input type="checkbox" checked={solAnon} onChange={(e) => setSolAnon(e.target.checked)} />
                Post solution with my anonymous alias
              </label>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'Moderation Check...' : 'Publish Solution'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Sidebar: Related External Discussions */}
        <aside className="glass-card">
          <h3 style={{ fontSize: '1.05rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExternalLink size={17} color="#22d3ee" /> Related External Threads
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 14 }}>
            Auto-fetched from Stack Overflow, Reddit, and GitHub Issues for cross-reference.
          </p>

          {externalDiscussions.length === 0 ? (
            <p style={{ fontSize: '0.84rem', color: '#64748b' }}>No external threads matched right now.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {externalDiscussions.map((ext) => (
                <a
                  key={ext.id}
                  href={ext.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    display: 'block'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="badge badge-source">{ext.source}</span>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>▲ {ext.score}</span>
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 500, color: '#e2e8f0' }} dangerouslySetInnerHTML={{ __html: ext.title }} />
                </a>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
