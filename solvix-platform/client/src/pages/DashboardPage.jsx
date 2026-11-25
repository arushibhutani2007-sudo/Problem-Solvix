import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Award, CheckCircle2, FileQuestion, Lightbulb, History, ArrowUpRight
} from 'lucide-react';
import api from '../services/api';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="container" style={{ padding: 60, textAlign: 'center' }}>Loading personal analytics...</div>;
  }

  if (!data) {
    return <div className="container" style={{ padding: 60, textAlign: 'center' }}>Unable to load dashboard.</div>;
  }

  const { profile, stats, myProblems, mySolutions, myOutcomes, activityHistory } = data;

  return (
    <div className="container" style={{ padding: '32px 24px 72px' }}>
      {/* Profile Header */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <span className="badge badge-anon" style={{ marginBottom: 8 }}>
            <Shield size={13} /> Private Alias: {profile.anonymous_alias}
          </span>
          <h1 style={{ fontSize: '1.8rem' }}>Welcome back, {profile.username}</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Your centralized problem-solving ledger, empirical outcome verifications, and anonymous posts.
          </p>
        </div>
        <Link to="/post" className="btn btn-primary">
          + Post New Problem
        </Link>
      </div>

      {/* Bento KPI Grid */}
      <div className="bento-stats">
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.86rem' }}>
            <span>Reputation Score</span>
            <Award size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 6 }}>{stats.reputation}</div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.86rem' }}>
            <span>Problems Posted</span>
            <FileQuestion size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 6 }}>{stats.problemsPosted}</div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.86rem' }}>
            <span>Solutions Contributed</span>
            <Lightbulb size={18} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 6 }}>{stats.solutionsContributed}</div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.86rem' }}>
            <span>Avg Solution Success</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 6, color: '#34d399' }}>
            {stats.avgSolutionSuccessRate}%
          </div>
        </div>
      </div>

      {/* Two Column History & Contributions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 22 }}>
        {/* My Problems */}
        <div className="glass-card">
          <h3 style={{ marginBottom: 14 }}>My Posted Problems ({myProblems.length})</h3>
          {myProblems.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>You haven&apos;t posted any problems yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myProblems.map((p) => (
                <Link key={p.id} to={`/problems/${p.id}`} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{p.title}</div>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {p.is_anonymous ? 'Anonymous' : 'Public'} • {p.solution_count} solutions
                    </span>
                  </div>
                  <ArrowUpRight size={16} color="#a78bfa" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Solutions I Tested & Verified */}
        <div className="glass-card">
          <h3 style={{ marginBottom: 14 }}>Solutions I Verified ({myOutcomes.length})</h3>
          {myOutcomes.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Mark solutions as Worked / Didn&apos;t Work to build your verification log.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myOutcomes.map((o) => (
                <Link key={o.id} to={`/problems/${o.problem_id}`} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className={`badge ${o.outcome === 'success' ? 'badge-verified' : 'badge-open'}`}>
                      Marked: {o.outcome.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#34d399' }}>Global Rate: {Math.round(o.success_rate)}%</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{o.problem_title}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Timeline */}
        <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={18} color="#22d3ee" /> Activity History Timeline
          </h3>
          {activityHistory.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No activity recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activityHistory.map((act) => (
                <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', fontSize: '0.88rem' }}>
                  <div>
                    <span className="tag-pill" style={{ marginRight: 10, color: '#22d3ee' }}>{act.action_type}</span>
                    <span>{act.problem_title || 'Platform Action'}</span>
                  </div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                    {new Date(act.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
