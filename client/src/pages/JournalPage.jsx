import { useState, useEffect } from 'react';
import { api } from '../api';

const PROMPT_IDEAS = [
  { icon: '🌿', label: 'Body Check-in', prompt: 'Right now, my body is feeling…' },
  { icon: '🌧️', label: 'Venting & Tension', prompt: 'What has been weighing heavily on my mind today is…' },
  { icon: '✨', label: 'Gratitude & Joy', prompt: 'One small thing that made me smile or feel grateful today was…' },
  { icon: '💭', label: 'Unfiltered Thoughts', prompt: 'If I could speak completely freely without judgment, I would say…' },
];

function parseAnalysis(raw) {
  if (!raw) return null;
  const emotionsMatch = raw.match(/\*\*Emotions:\*\*\s*(.+)/i);
  const sentimentMatch = raw.match(/\*\*Sentiment:\*\*\s*(.+)/i);
  const reflectionMatch = raw.match(/\*\*Reflection:\*\*\s*([\s\S]+?)(?=\*\*Suggestion:|$)/i);
  const suggestionMatch = raw.match(/\*\*Suggestion:\*\*\s*([\s\S]+)/i);

  if (emotionsMatch || reflectionMatch || suggestionMatch) {
    return {
      emotions: emotionsMatch ? emotionsMatch[1].trim() : '',
      sentiment: sentimentMatch ? sentimentMatch[1].trim() : '',
      reflection: reflectionMatch ? reflectionMatch[1].trim() : '',
      suggestion: suggestionMatch ? suggestionMatch[1].trim() : '',
      isStructured: true,
      raw,
    };
  }
  return { isStructured: false, raw };
}

export default function JournalPage() {
  const [text, setText] = useState('');
  const [entries, setEntries] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewEntry, setViewEntry] = useState(null);
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const d = await api.get('/journal');
      const list = d.entries || [];
      setEntries(list);
      // Automatically select latest entry if none currently selected
      if (list.length > 0 && !viewEntry) {
        setViewEntry(list[0]);
      }
    } catch (err) {
      console.warn('Failed to load journal entries:', err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const analyze = async () => {
    if (text.trim().length < 10) return;
    setLoading(true);
    setSubmitting(true);
    try {
      const data = await api.post('/journal', { content: text });
      const newEntry = {
        id: data.id,
        content: text,
        sentiment: data.sentiment,
        ai_analysis: data.aiAnalysis || data.ai_analysis,
        created_at: data.created_at || new Date().toISOString(),
      };
      setAnalysis(newEntry.ai_analysis);
      setViewEntry(newEntry);
      setText('');
      await load();
    } catch (err) {
      alert(err.message || 'Failed to analyze journal entry.');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this journal entry?')) return;
    try {
      await api.delete(`/journal/${id}`);
      setEntries(prev => {
        const next = prev.filter(item => item.id !== id);
        if (viewEntry?.id === id) {
          setViewEntry(next[0] || null);
          setAnalysis(null);
        }
        return next;
      });
    } catch (err) {
      alert('Failed to delete entry');
    }
  };

  const currentAnalysisRaw = analysis || viewEntry?.ai_analysis;
  const parsed = parseAnalysis(currentAnalysisRaw);

  const getSentimentBadge = (sentiment) => {
    const s = (sentiment || '').toLowerCase();
    if (s.includes('positive')) {
      return <span className="journal-badge badge-positive">✨ Positive</span>;
    }
    if (s.includes('negative') || s.includes('needs care') || s.includes('unwell')) {
      return <span className="journal-badge badge-needs-care">❤️‍🩹 Needs Care</span>;
    }
    return <span className="journal-badge badge-neutral">🌿 Neutral / Balanced</span>;
  };

  const filteredEntries = entries.filter(e => {
    const matchesSearch = !searchQuery || e.content.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterSentiment === 'all') return true;
    if (filterSentiment === 'positive') return (e.sentiment || '').toLowerCase().includes('positive');
    if (filterSentiment === 'negative') return (e.sentiment || '').toLowerCase().includes('negative') || (e.sentiment || '').toLowerCase().includes('needs care');
    if (filterSentiment === 'neutral') return (e.sentiment || '').toLowerCase().includes('neutral');
    return true;
  });

  return (
    <div className="page fade-in">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span>AI Mood Journal</span>
              <span className="journal-header-pill">Mindful Space</span>
            </h1>
            <p className="text-muted" style={{ marginTop: '0.3rem', fontSize: '0.95rem' }}>
              Express your feelings safely. MindCare AI provides compassionate reflections and gentle self-care guidance.
            </p>
          </div>
          <div className="journal-stats-pills">
            <div className="stat-pill">
              <span className="stat-pill-label">Total Entries</span>
              <span className="stat-pill-value">{entries.length}</span>
            </div>
            {entries.length > 0 && (
              <div className="stat-pill">
                <span className="stat-pill-label">Latest Vibe</span>
                <span className="stat-pill-value" style={{ textTransform: 'capitalize' }}>
                  {entries[0].sentiment === 'negative' ? 'Needs Care' : entries[0].sentiment || 'Reflective'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Prompt Starters */}
      <div className="journal-prompts-bar">
        <span className="prompts-label">Need inspiration?</span>
        <div className="prompts-chips">
          {PROMPT_IDEAS.map((item, idx) => (
            <button
              key={idx}
              className="prompt-chip-btn"
              onClick={() => setText(prev => prev ? `${prev}\n\n${item.prompt} ` : `${item.prompt} `)}
              type="button"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="journal-grid">
        {/* Left Column: Write Card */}
        <div className="glass-card journal-write-card">
          <div className="card-header-row">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✍️</span>
              <span>New Journal Entry</span>
            </h3>
            {text.length > 0 && (
              <button
                type="button"
                className="btn-text-subtle"
                onClick={() => setText('')}
                title="Clear text"
              >
                Clear
              </button>
            )}
          </div>

          <textarea
            className="journal-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write about what happened, how your body feels, anxieties, or any thoughts on your mind… (Min 10 characters)"
            rows={7}
          />

          <div className="journal-action-bar">
            <div className="char-counter">
              <span className={text.trim().length >= 10 ? 'char-valid' : 'char-dim'}>
                {text.trim().length} chars
              </span>
              {text.trim().length < 10 && (
                <span className="char-hint">(min 10 to analyze)</span>
              )}
            </div>

            <button
              className="btn btn-primary btn-analyze-pulse"
              onClick={analyze}
              disabled={loading || text.trim().length < 10}
            >
              {loading ? (
                <>
                  <div className="btn-spinner" />
                  <span>Reflecting with AI…</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Analyze with AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Insights Card */}
        <div className="glass-card journal-insights-card">
          <div className="card-header-row">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🤖</span>
              <span>AI Emotional Insights</span>
            </h3>
            {viewEntry && (
              <span className="entry-active-tag">
                Viewing Entry
              </span>
            )}
          </div>

          {loading ? (
            <div className="journal-loading-state">
              <div className="ai-pulse-orb" />
              <h4>MindCare AI is listening…</h4>
              <p className="text-muted">Analyzing emotional cues, somatic signals, and preparing self-care support.</p>
            </div>
          ) : parsed ? (
            <div className="journal-insights-content">
              {/* Header with Date and Badge */}
              <div className="insights-meta-banner">
                <div className="insights-meta-date">
                  📅 {new Date(viewEntry?.created_at || Date.now()).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div>{getSentimentBadge(parsed.sentiment || viewEntry?.sentiment)}</div>
              </div>

              {/* Original Entry Excerpt */}
              {viewEntry?.content && (
                <div className="insights-quote-card">
                  <div className="quote-label">Your Journal Words:</div>
                  <div className="quote-body">"{viewEntry.content}"</div>
                </div>
              )}

              {parsed.isStructured ? (
                <div className="insights-sections">
                  {/* Emotions Detected */}
                  {parsed.emotions && (
                    <div className="insight-block block-emotions">
                      <div className="block-title">
                        <span>🏷️</span>
                        <span>Emotions Detected</span>
                      </div>
                      <div className="emotion-tags-wrap">
                        {parsed.emotions.split(',').map((emo, idx) => (
                          <span key={idx} className="emotion-pill">
                            {emo.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compassionate Reflection */}
                  {parsed.reflection && (
                    <div className="insight-block block-reflection">
                      <div className="block-title">
                        <span>🪞</span>
                        <span>Empathetic Reflection</span>
                      </div>
                      <p className="block-text">{parsed.reflection}</p>
                    </div>
                  )}

                  {/* Gentle Self-Care Suggestion */}
                  {parsed.suggestion && (
                    <div className="insight-block block-suggestion">
                      <div className="block-title">
                        <span>💡</span>
                        <span>Recommended Self-Care Step</span>
                      </div>
                      <p className="block-text suggestion-highlight">{parsed.suggestion}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="analysis-text"
                  dangerouslySetInnerHTML={{
                    __html: (parsed.raw || '')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br />')
                  }}
                />
              )}

              {/* Action buttons inside insights */}
              {viewEntry?.id && (
                <div className="insights-footer-actions">
                  <button
                    type="button"
                    className="btn-danger-outline"
                    onClick={(e) => handleDelete(viewEntry.id, e)}
                  >
                    🗑️ Delete Entry
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-subtle"
                    onClick={() => {
                      setViewEntry(null);
                      setAnalysis(null);
                    }}
                  >
                    Close View
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-insights-state">
              <div className="empty-icon-bubble">💭</div>
              <h4>No Entry Selected</h4>
              <p className="text-muted">
                Write a new entry on the left or click on any past entry below to reveal compassionate AI emotional insights.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Full-Width: Past Entries Card */}
        <div className="glass-card journal-history-card">
          <div className="history-header-flex">
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📚</span>
                <span>Past Reflections</span>
                <span className="entries-count-badge">{filteredEntries.length}</span>
              </h3>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Click any entry to view its detailed AI reflection and self-care tips.
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="history-filters-bar">
              <div className="sentiment-filters">
                <button
                  type="button"
                  className={`filter-btn ${filterSentiment === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterSentiment('all')}
                >
                  All ({entries.length})
                </button>
                <button
                  type="button"
                  className={`filter-btn ${filterSentiment === 'positive' ? 'active' : ''}`}
                  onClick={() => setFilterSentiment('positive')}
                >
                  ✨ Positive
                </button>
                <button
                  type="button"
                  className={`filter-btn ${filterSentiment === 'negative' ? 'active' : ''}`}
                  onClick={() => setFilterSentiment('negative')}
                >
                  ❤️‍🩹 Needs Care
                </button>
                <button
                  type="button"
                  className={`filter-btn ${filterSentiment === 'neutral' ? 'active' : ''}`}
                  onClick={() => setFilterSentiment('neutral')}
                >
                  🌿 Neutral
                </button>
              </div>

              {entries.length > 3 && (
                <div className="history-search-wrap">
                  <input
                    type="text"
                    className="history-search-input"
                    placeholder="Search entries…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setSearchQuery('')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="journal-empty-prompt">
              <div className="empty-book-icon">📖</div>
              <h4>Your journal is empty</h4>
              <p className="text-muted">
                Begin by writing your first thoughts in the box above. Even one sentence can be a powerful release.
              </p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="journal-empty-prompt">
              <p className="text-muted">No journal entries match your selected filter.</p>
              <button
                type="button"
                className="btn-text-subtle"
                onClick={() => { setFilterSentiment('all'); setSearchQuery(''); }}
                style={{ marginTop: '0.5rem' }}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="journal-cards-grid">
              {filteredEntries.map((e) => {
                const isSelected = viewEntry?.id === e.id;
                return (
                  <div
                    key={e.id}
                    className={`journal-entry-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setViewEntry(e);
                      setAnalysis(null);
                    }}
                  >
                    <div className="entry-card-header">
                      <div className="entry-card-date">
                        <span>🗓️</span>
                        <span>
                          {new Date(e.created_at).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="entry-card-actions">
                        {getSentimentBadge(e.sentiment)}
                        <button
                          type="button"
                          className="entry-card-delete"
                          onClick={(evt) => handleDelete(e.id, evt)}
                          title="Delete entry"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="entry-card-content">
                      {e.content}
                    </div>

                    <div className="entry-card-footer">
                      <span className="view-insights-hint">
                        {isSelected ? '● Currently Viewing' : 'Click to inspect insights →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
