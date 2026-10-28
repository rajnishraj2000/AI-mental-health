const express = require('express');
const { OpenAI } = require('openai');
const Journal = require('../models/Journal');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * Intelligent fallback analyzer when OpenAI key is absent or rate-limited.
 * Provides compassionate, tailored psychological and somatic reflection.
 */
function generateEmpatheticAnalysis(text) {
  const lower = text.toLowerCase();

  // Pattern detection
  const isPhysical = /unwell|sick|stomach|headache|migraine|pain|nausea|fever|cramp|dizzy|vomit|ache|body|exhaust|fatigue|sleep/i.test(lower);
  const isAnxious = /anxious|anxiety|worried|worry|stress|stressed|panic|overwhelm|nervous|scared|fear|dread|pressure|deadline|racing/i.test(lower);
  const isSad = /sad|lonely|depressed|depression|crying|cry|empty|hopeless|heartbroken|hurts|down|alone|isolated|worthless|grief/i.test(lower);
  const isAngry = /angry|mad|frustrated|frustration|annoyed|furious|irritated|hate|resent|betray/i.test(lower);
  const isPositive = /happy|grateful|gratitude|great|awesome|excited|proud|love|blessed|peaceful|calm|hopeful|good|better|joy|celebrate|relief/i.test(lower);

  let emotions = '🌱 Reflective, 💭 Processing';
  let sentiment = 'neutral';
  let reflection = 'Thank you for putting your thoughts into words. Giving honest voice to your internal experiences is a vital step toward mental clarity.';
  let suggestion = 'Take 5 minutes away from screens, stretch your neck and shoulders, and drink a glass of water.';

  if (isPhysical) {
    emotions = '🩺 Physical Discomfort, 🌧️ Low Energy, 🛋️ Body Fatigue';
    sentiment = 'negative';
    reflection = 'It sounds like your body is going through a tough spell right now, and physical discomfort can deeply drain your emotional reserves. Honoring what your body is signaling and easing your expectations today is the kindest path forward.';
    suggestion = 'Sip warm water or herbal tea (ginger or peppermint), rest in a comfortable position with a warm heating pad, and give yourself full permission to slow down. If symptoms persist, please consult a medical professional.';
  } else if (isAnxious) {
    emotions = '⚡ Overwhelmed, 🌪️ Anxious, 🫧 Racing Thoughts';
    sentiment = 'negative';
    reflection = 'You are navigating a lot of mental weight right now, and feeling tension is a natural response when expectations or worries feel heavy. You do not have to solve everything in this exact hour—taking it one breath at a time is enough.';
    suggestion = 'Practice the 4-7-8 breathing exercise: Inhale through your nose for 4 seconds, hold for 7 seconds, and exhale slowly through your mouth for 8 seconds. Repeat 3 times to ground your nervous system.';
  } else if (isSad) {
    emotions = '🌧️ Heavy-Hearted, 🕊️ Vulnerable, 💙 Solitary';
    sentiment = 'negative';
    reflection = 'I hear the sadness in your words, and your feelings deserve tender space and zero judgment. It is okay not to be okay right now; resting your heart is productive self-care.';
    suggestion = 'Wrap yourself in a soft blanket, put on calming instrumental music or ambient rain sounds, and consider sharing a brief text with someone you trust.';
  } else if (isAngry) {
    emotions = '🔥 Frustrated, ⚡ Irritated, 🛡️ Defensive';
    sentiment = 'negative';
    reflection = 'Your frustration is valid—anger often arises when our boundaries feel crossed or situations feel deeply unfair. Acknowledging this fire without judging yourself is healthy.';
    suggestion = 'Try somatic release: Shake out your hands, take a brisk 10-minute walk, or write an uncensored brain dump on scratch paper and discard it.';
  } else if (isPositive) {
    emotions = '✨ Joyful, 💖 Grateful, 🌟 Grounded';
    sentiment = 'positive';
    reflection = 'It is so uplifting to read this positive moment in your day. Celebrating and anchoring these uplifting moments trains our minds to cultivate resilience and hope.';
    suggestion = 'Close your eyes for 30 seconds, smile softly, and consciously breathe in this good feeling so your memory holds onto it.';
  }

  return {
    sentiment,
    aiAnalysis: `**Emotions:** ${emotions}\n**Sentiment:** ${sentiment === 'positive' ? 'Positive' : sentiment === 'negative' ? 'Needs Care' : 'Neutral'}\n**Reflection:** ${reflection}\n**Suggestion:** ${suggestion}`
  };
}

router.post('/', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length < 10) {
      return res.status(400).json({ error: 'Please write at least 10 characters so AI can provide meaningful insights.' });
    }

    let aiAnalysis = '';
    let sentiment = 'neutral';
    const apiKey = process.env.OPENAI_API_KEY;
    const hasLiveOpenAI = apiKey && !apiKey.includes('your_openai_api_key') && apiKey.startsWith('sk-');

    if (hasLiveOpenAI) {
      try {
        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a warm, compassionate mental health and wellness journal coach. Provide empathetic, psychologically grounded reflection. Keep formatting clean with **Emotions:**, **Sentiment:**, **Reflection:**, and **Suggestion:**.' },
            { role: 'user', content: `Analyze this journal entry with care:\n"${content.slice(0, 800)}"\n\nRespond strictly with:\n**Emotions:** (2-3 emotions with emojis)\n**Sentiment:** (Positive, Neutral, or Needs Care)\n**Reflection:** (2-3 warm, validating sentences)\n**Suggestion:** (1 actionable, gentle self-care tip)\n\nKeep under 140 words.` },
          ],
          max_tokens: 280,
          temperature: 0.7,
        });

        aiAnalysis = completion.choices[0].message.content;
        const lower = aiAnalysis.toLowerCase();
        if (lower.includes('sentiment: positive') || lower.includes('**sentiment:** positive')) sentiment = 'positive';
        else if (lower.includes('sentiment: needs care') || lower.includes('sentiment: negative') || lower.includes('**sentiment:** negative')) sentiment = 'negative';
      } catch (aiErr) {
        console.warn('OpenAI error, falling back to local empathy engine:', aiErr.message);
        const fallback = generateEmpatheticAnalysis(content);
        aiAnalysis = fallback.aiAnalysis;
        sentiment = fallback.sentiment;
      }
    } else {
      const fallback = generateEmpatheticAnalysis(content);
      aiAnalysis = fallback.aiAnalysis;
      sentiment = fallback.sentiment;
    }

    const entry = await Journal.create({
      user: req.userId,
      content,
      sentiment,
      aiAnalysis
    });

    res.json({
      id: entry._id,
      content: entry.content,
      sentiment: entry.sentiment,
      aiAnalysis: entry.aiAnalysis,
      ai_analysis: entry.aiAnalysis,
      created_at: entry.createdAt
    });
  } catch (err) {
    console.error('Journal error:', err.message);
    res.status(500).json({ error: 'Failed to save entry' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const docs = await Journal.find({ user: req.userId }).sort({ createdAt: -1 }).limit(50);
    const entries = docs.map(d => {
      let analysis = d.aiAnalysis;
      let sentiment = d.sentiment || 'neutral';
      // Auto-heal any stale or missing analysis from previous runs
      if (!analysis || analysis.includes('unavailable') || analysis.trim().length === 0) {
        const healed = generateEmpatheticAnalysis(d.content);
        analysis = healed.aiAnalysis;
        sentiment = healed.sentiment;
      }
      return {
        id: d._id,
        content: d.content,
        sentiment,
        ai_analysis: analysis,
        created_at: d.createdAt
      };
    });
    res.json({ entries });
  } catch (err) {
    console.error('Journal fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch journals' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Journal.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!deleted) return res.status(404).json({ error: 'Entry not found' });
    res.json({ success: true, message: 'Journal entry removed' });
  } catch (err) {
    console.error('Journal delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

module.exports = router;
