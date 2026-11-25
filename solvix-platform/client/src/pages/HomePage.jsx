import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Shield, CheckCircle2, Flame, MessageSquare, Eye, ExternalLink, Sparkles, Filter
} from 'lucide-react';
import api from '../services/api';

const CATEGORIES = ['All', 'Programming', 'Academic', 'DevOps & Systems', 'Algorithms', 'Everyday Tech'];

export default function HomePage() {
  const [problems, setProblems] = useState([]);
  const [externalResults, setExternalResults] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [includeExternal, setIncludeExternal] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchProblems = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.get('/problems', {
        params: {
          q: query,
          category,
          status: statusFilter,
          includeExternal: query.trim() && includeExternal ? 'true' : 'false'
        }
      });
      setProblems(data.problems || []);
      setExternalResults(data.externalResults || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [category, statusFilter]);

  return (
    <div className="container" style={{ paddingBottom: 64 }}>
      {/* Hero Banner */}
      <section className="hero">
        <div className="hero-pill">
          <Sparkles size={14} /> Anonymous Posting + Empirical Success Verification
        </div>
        <h1>
          Stop guessing which fix works. <br />
          <span className="gradient-text">Verify solutions with real outcomes.</span>
        </h1>
        <p>
          Post technical or academic problems anonymously, search Stack Overflow, Reddit & GitHub simultaneously,
          and rank answers by real community success rates.
        </p>

        {/* Unified Search Hub */}
        <form onSubmit={fetchProblems} className="search-hub">
          <div className="search-row">
            <Search size={20} color="#94a3b8" style={{ marginLeft: 8 }} />
            <input
              type="text"
              className="search-input"
              placeholder="Search errors, algorithms, tags (e.g., postgresql pool, useEffect, docker)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Search Knowledge Base
            </button>
          </div>

          <div className="filter-bar">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={`chip ${category === cat ? 'active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#cbd5e1', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeExternal}
                  onChange={(e) => setIncludeExternal(e.target.checked)}
                />
                Merge External APIs
              </label>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="chip"
                style={{ outline: 'none' }}
              >
                <option value="All">All Statuses</option>
                <option value="Verified">Verified Only</option>
                <option value="Open">Open Problems</option>
              </select>
            </div>
          </div>
        </form>
      </section>

      {/* Federated External API Strip (if query searched) */}
      {externalResults.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ExternalLink size={19} color="#22d3ee" /> Live External Discussions (Stack Overflow, Reddit & GitHub)
            </h2>
            <span className="badge badge-source">{externalResults.length} Ranked Matches</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {externalResults.slice(0, 6).map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="glass-card"
                style={{ padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="badge badge-source">{item.source}</span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Score: {item.score} • {item.answerCount} replies
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.96rem', marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: item.title }} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {item.tags?.slice(0, 3).map((t) => (
                    <span key={t} className="tag-pill">#{t}</span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Main Knowledge Base Grid */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={19} color="#8b5cf6" /> Solvix Verified Knowledge Base
          </h2>
          <Link to="/post" className="btn btn-secondary">
            + Post New Problem
          </Link>
        </div>

        {loading ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
            Querying Knowledge Base & External APIs...
          </div>
        ) : problems.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: 48 }}>
            <h3>No matching problems in the local Knowledge Base yet</h3>
            <p style={{ color: '#94a3b8', margin: '8px 0 18px' }}>
              Be the first to post this problem anonymously and crowdsource verified solutions.
            </p>
            <Link to="/post" className="btn btn-primary">Post Problem Anonymously</Link>
          </div>
        ) : (
          <div className="problem-grid">
            {problems.map((prob) => (
              <Link key={prob.id} to={`/problems/${prob.id}`} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span className={`badge ${prob.status === 'Verified' ? 'badge-verified' : 'badge-open'}`}>
                      {prob.status === 'Verified' ? <CheckCircle2 size={13} /> : <Flame size={13} />}
                      {prob.status}
                    </span>
                    <span className="badge badge-anon">
                      {prob.is_anonymous && <Shield size={12} />}
                      {prob.author_display}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.12rem', marginBottom: 8, lineHeight: 1.35 }}>{prob.title}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 14 }}>
                    {prob.description}
                  </p>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                    <span className="tag-pill" style={{ color: '#a78bfa' }}>{prob.category}</span>
                    {prob.tags?.map((t) => (
                      <span key={t} className="tag-pill">#{t}</span>
                    ))}
                  </div>
                </div>

                <div>
                  {/* Empirical Success Rate Meter */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <span>Top Solution Success Rate</span>
                    <strong style={{ color: '#34d399' }}>{Math.round(prob.top_success_rate || 0)}%</strong>
                  </div>
                  <div className="meter-track">
                    <div className="meter-fill" style={{ width: `${Math.min(100, prob.top_success_rate || 0)}%` }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', fontSize: '0.82rem', color: '#94a3b8' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <MessageSquare size={14} /> {prob.solution_count} Solutions
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Eye size={14} /> {prob.views} Views
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
