import { useState } from 'react';
import { api } from '../api';

const OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
];

const PHQ9 = {
  name: 'PHQ-9 (Depression)',
  questions: [
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
    'Trouble falling or staying asleep, or sleeping too much',
    'Feeling tired or having little energy',
    'Poor appetite or overeating',
    'Feeling bad about yourself — or that you are a failure',
    'Trouble concentrating on things',
    'Moving or speaking slowly, or being fidgety and restless',
    'Thoughts that you would be better off dead, or of hurting yourself',
  ],
  maxScore: 27,
  severity: (s) => s <= 4 ? 'Minimal' : s <= 9 ? 'Mild' : s <= 14 ? 'Moderate' : s <= 19 ? 'Moderately Severe' : 'Severe',
};

const GAD7 = {
  name: 'GAD-7 (Anxiety)',
  questions: [
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    'Being so restless that it is hard to sit still',
    'Becoming easily annoyed or irritable',
    'Feeling afraid, as if something awful might happen',
  ],
  maxScore: 21,
  severity: (s) => s <= 4 ? 'Minimal' : s <= 9 ? 'Mild' : s <= 14 ? 'Moderate' : 'Severe',
};

const severityClass = (s) => {
  const l = s.toLowerCase();
  return l.includes('minimal') ? 'sev-minimal' : l.includes('mild') ? 'sev-mild' : l.includes('moderately') ? 'sev-mod-severe' : l.includes('moderate') ? 'sev-moderate' : 'sev-severe';
};

export default function AssessmentPage() {
  const [test, setTest] = useState(PHQ9);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectAnswer = (qi, val) => setAnswers({ ...answers, [qi]: val });

  const submit = async () => {
    if (Object.keys(answers).length < test.questions.length) return alert('Please answer all questions');
    const score = Object.values(answers).reduce((a, b) => a + b, 0);
    const severity = test.severity(score);
    setLoading(true);
    try {
      const data = await api.post('/assessment', { type: test.name, score, maxScore: test.maxScore, severity });
      setResult({ score, severity, maxScore: test.maxScore, aiAnalysis: data.aiAnalysis });
    } catch (err) {
      setResult({ score, severity, maxScore: test.maxScore, aiAnalysis: 'AI analysis unavailable.' });
    }
    setLoading(false);
  };

  const retake = () => { setResult(null); setAnswers({}); };
  const switchTest = (t) => { setTest(t); setAnswers({}); setResult(null); };

  const formatAI = (text) => {
    if (!text) return '';
    return text
      .replace(/^###\s+(.+)$/gm, '<h4 class="assessment-section-title">$1</h4>')
      .replace(/^\s*-\s+(.+)$/gm, '<li class="assessment-tip-item">$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '<br />')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>Mental Health Assessment</h1>
        <p className="text-muted">Take a validated self-assessment to gain insights into your mental well-being.</p>
      </div>

      <div className="assessment-tabs">
        <button className={`tab-btn ${test === PHQ9 ? 'active' : ''}`} onClick={() => switchTest(PHQ9)}>PHQ-9 (Depression)</button>
        <button className={`tab-btn ${test === GAD7 ? 'active' : ''}`} onClick={() => switchTest(GAD7)}>GAD-7 (Anxiety)</button>
      </div>

      {!result ? (
        <>
          <div className="glass-card" style={{ marginBottom: '1rem' }}>
            <p>📝 Answer each question based on how often you've been bothered over the <strong>last 2 weeks</strong>.</p>
          </div>
          {test.questions.map((q, i) => (
            <div className="question-card" key={i}>
              <div className="question-text">{i + 1}. {q}</div>
              <div className="question-options">
                {OPTIONS.map(o => (
                  <button key={o.value} className={`option-btn ${answers[i] === o.value ? 'selected' : ''}`} onClick={() => selectAnswer(i, o.value)}>{o.label}</button>
                ))}
              </div>
            </div>
          ))}
          <button className="btn btn-primary btn-lg btn-block" onClick={submit} disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Analyzing…' : 'Submit & Get AI Analysis'}
          </button>
        </>
      ) : (
        <div className="glass-card fade-in">
          <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>📊 Your Results</h3>
          <div className="score-display">{result.score} / {result.maxScore}</div>
          <div className={`severity-badge ${severityClass(result.severity)}`}>{result.severity}</div>
          <div className="score-bar-wrap">
            <div className="score-bar" style={{ width: `${(result.score / result.maxScore) * 100}%`, background: severityClass(result.severity).includes('minimal') ? 'var(--secondary)' : severityClass(result.severity).includes('mild') ? 'var(--primary)' : severityClass(result.severity).includes('severe') ? 'var(--danger)' : '#ffa500' }} />
          </div>
          <div className="ai-analysis-result">
            <h4>🤖 AI Analysis</h4>
            <div className="analysis-text" dangerouslySetInnerHTML={{ __html: formatAI(result.aiAnalysis) }} />
          </div>
          <button className="btn btn-outline" onClick={retake} style={{ marginTop: '1.5rem' }}>Retake Assessment</button>
        </div>
      )}
    </div>
  );
}
