import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ShieldCheck, AlertTriangle, Send } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PostProblemPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [category, setCategory] = useState('Programming');
  const [tags, setTags] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/problems', {
        title,
        description,
        code_snippet: codeSnippet,
        category,
        tags,
        is_anonymous: isAnonymous
      });
      navigate(`/problems/${data.problem.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to publish problem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 820, padding: '36px 24px 72px' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <ShieldCheck size={24} color="#a78bfa" />
          <h1 style={{ fontSize: '1.7rem' }}>Post a Problem to the Knowledge Base</h1>
        </div>
        <p style={{ color: '#94a3b8', marginBottom: 24 }}>
          Every submission passes through Solvix&apos;s automated moderation filter before indexing.
        </p>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, background: 'rgba(244,63,94,0.16)', border: '1px solid rgba(244,63,94,0.4)', color: '#fda4af', marginBottom: 18 }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Anonymity Switch */}
          <div className="form-group">
            <label className="anon-toggle">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Shield size={22} color="#a78bfa" />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.96rem' }}>
                    Anonymous Identity Mode {isAnonymous ? '(Enabled)' : '(Public Username)'}
                  </strong>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    {isAnonymous
                      ? `Published publicly as "${user?.anonymous_alias || 'AnonymousAlias'}" while privately tracked in your dashboard.`
                      : `Published publicly under your username "${user?.username}".`}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                style={{ width: 20, height: 20 }}
              />
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Problem Title *</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g., JWT refresh token race condition in React Axios interceptor"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Programming">Programming</option>
                <option value="Academic">Academic</option>
                <option value="DevOps & Systems">DevOps & Systems</option>
                <option value="Algorithms">Algorithms</option>
                <option value="Everyday Tech">Everyday Tech</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input
                type="text"
                className="form-control"
                placeholder="react, postgresql, jwt, debugging"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description & What You Tried *</label>
            <textarea
              rows={5}
              required
              className="form-control"
              placeholder="Describe the issue, expected vs actual behavior, and environment details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Code Snippet / Error Log (Optional)</label>
            <textarea
              rows={5}
              className="form-control code-editor"
              placeholder="// Paste reproducible code or stack trace..."
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
            />
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', padding: 14 }}>
            <Send size={17} /> {submitting ? 'Running Moderation & Publishing...' : 'Publish to Solvix Knowledge Base'}
          </button>
        </form>
      </div>
    </div>
  );
}
