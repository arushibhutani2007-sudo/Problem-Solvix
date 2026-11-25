import React, { useState } from 'react';
import { Globe, Search, ExternalLink, CheckCircle2, MessageSquare } from 'lucide-react';
import api from '../services/api';

export default function ExternalExplorerPage() {
  const [query, setQuery] = useState('');
  const [sources, setSources] = useState({
    stackoverflow: true,
    reddit: true,
    github: true
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const toggleSource = (key) => {
    setSources((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const activeSources = Object.keys(sources).filter((k) => sources[k]);
    if (activeSources.length === 0) return alert('Select at least one external source.');

    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get('/problems/external/search', {
        params: { q: query, sources: activeSources.join(',') }
      });
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '36px 24px 72px' }}>
      <div style={{ textAlign: 'center', maxWidth: 740, margin: '0 auto 28px' }}>
        <div className="hero-pill">
          <Globe size={14} /> Multi-Platform API Aggregator
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: 10 }}>
          Federated Solution Search Engine
        </h1>
        <p style={{ color: '#94a3b8' }}>
          Query Stack Exchange, Reddit, and GitHub Issues in parallel. Solvix merges and ranks threads by
          community score, answer count, and resolution status.
        </p>
      </div>

      <form onSubmit={handleSearch} className="search-hub">
        <div className="search-row">
          <Search size={20} color="#22d3ee" style={{ marginLeft: 8 }} />
          <input
            type="text"
            className="search-input"
            placeholder="Enter technical query (e.g., CORS policy blocked Express React Vite)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Fetching APIs...' : 'Query All Sources'}
          </button>
        </div>

        <div className="filter-bar">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { key: 'stackoverflow', label: 'Stack Overflow API' },
              { key: 'reddit', label: 'Reddit Data API' },
              { key: 'github', label: 'GitHub REST API' }
            ].map((s) => (
              <button
                type="button"
                key={s.key}
                onClick={() => toggleSource(s.key)}
                className={`chip ${sources[s.key] ? 'active' : ''}`}
              >
                {sources[s.key] ? '✓ ' : '+ '}
                {s.label}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Sorted by Solvix Relevance Rank
          </span>
        </div>
      </form>

      {loading && (
        <div className="glass-card" style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
          Querying external endpoints concurrently and ranking results...
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: 48 }}>
          No external discussions found for &ldquo;{query}&rdquo;. Try broader technical keywords.
        </div>
      )}

      <div className="problem-grid">
        {results.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="glass-card"
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className="badge badge-source">{item.source}</span>
                {item.isAnswered && (
                  <span className="badge badge-verified">
                    <CheckCircle2 size={12} /> Resolved / Answered
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '1.05rem', marginBottom: 10 }} dangerouslySetInnerHTML={{ __html: item.title }} />

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {item.tags?.slice(0, 4).map((t) => (
                  <span key={t} className="tag-pill">#{t}</span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border-subtle)', fontSize: '0.82rem', color: '#94a3b8' }}>
              <span>▲ {item.score} • <MessageSquare size={13} style={{ verticalAlign: 'middle' }} /> {item.answerCount}</span>
              <span style={{ color: '#22d3ee', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Open Source <ExternalLink size={13} />
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
