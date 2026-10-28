const express = require('express');
const { OpenAI } = require('openai');
const Assessment = require('../models/Assessment');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * Clinically-informed empathetic interpretation engine for PHQ-9 & GAD-7.
 * Provides detailed, supportive, and actionable guidance without diagnosing.
 */
function generateAssessmentAnalysis(type, score, maxScore, severity) {
  const isPHQ9 = type.toLowerCase().includes('phq') || type.toLowerCase().includes('depression');
  const isGAD7 = type.toLowerCase().includes('gad') || type.toLowerCase().includes('anxiety');
  const sevLower = severity.toLowerCase();

  let overview = '';
  let tips = [];
  let professionalNote = '';

  if (isPHQ9) {
    if (sevLower.includes('minimal')) {
      overview = `Your score of **${score}/${maxScore}** indicates **Minimal or No Depressive Symptoms**. This suggests that over the past two weeks, you have generally maintained emotional stability and healthy interest in daily activities. It is normal to experience temporary emotional dips, but your overall baseline appears resilient.`;
      tips = [
        '**Maintain Daily Routines:** Continue consistent sleep habits, physical movement, and social connections that support your emotional energy.',
        '**Practice Proactive Journaling:** Use your journal to capture moments of gratitude and recognize what fuels your mental peace.',
        '**Check in Regularly:** Life circumstances fluctuate; retaking this assessment periodically helps maintain proactive self-awareness.'
      ];
      professionalNote = 'While your current symptoms are minimal, remember that seeking mentorship, therapy, or personal development guidance is always beneficial at any stage of wellness.';
    } else if (sevLower.includes('mild')) {
      overview = `Your score of **${score}/${maxScore}** falls within the **Mild Depressive Symptoms** range. You may be noticing occasional fatigue, mild changes in sleep or motivation, or feeling temporarily down. Recognizing these early subtle shifts is a strength, as proactive adjustments can prevent them from deepening.`;
      tips = [
        '**Behavioral Activation:** Choose one small enjoyable activity each day (a short walk, cooking a favorite meal, listening to calming music), even when motivation feels sluggish.',
        '**Break Tasks into Micro-Steps:** When to-do lists feel heavy, focus only on the very next 10-minute task rather than the whole mountain.',
        '**Prioritize Restful Sleep:** Maintain a fixed wind-down hour away from screens to support healthy neurological recovery.'
      ];
      professionalNote = 'If these feelings persist for more than several weeks or begin impacting your relationships and work, talking with a counselor or physician can provide valuable personalized tools.';
    } else if (sevLower.includes('moderate')) {
      overview = `Your score of **${score}/${maxScore}** reflects **Moderate Depressive Symptoms**. You are likely experiencing noticeable difficulty with energy, focus, sleep, or mood that is making your regular day-to-day responsibilities feel challenging. Your feelings are valid, and you do not have to navigate this burden alone.`;
      tips = [
        '**Gentle Self-Compassion:** Avoid self-criticism about lower productivity. Treat yourself with the same kindness you would extend to a friend recovering from an illness.',
        '**Reach Out to a Trusted Ally:** Share how you are honestly feeling with a close family member or friend—isolation often amplifies depressive weight.',
        '**Establish Micro-Boundaries:** Give yourself permission to pause non-essential commitments and protect your emotional reserves.'
      ];
      professionalNote = '👉 **Recommended Next Step:** We strongly encourage consulting a licensed mental health professional, doctor, or therapist. Evidence-based therapies (such as CBT) are highly effective in treating moderate symptoms.';
    } else {
      overview = `Your score of **${score}/${maxScore}** indicates **${severity} Symptoms**. You are carrying significant emotional weight right now, and simple daily tasks may feel overwhelming or exhausting. Please know that having these symptoms is not a personal failure, and effective, caring help is available.`;
      tips = [
        '**Focus on Today Only:** Strip away all expectations except basic self-care: eating a nourishing meal, drinking water, and resting.',
        '**Avoid Isolation:** Connect with someone you trust, or lean on safe support communities.',
        '**Create a Safety Plan:** Keep emergency helpline contacts visible and handy whenever emotional waves feel too intense.'
      ];
      professionalNote = '⚠️ **Immediate Professional Support Recommended:** Please reach out to a healthcare provider, psychologist, or psychiatrist for a comprehensive assessment. If you are experiencing thoughts of self-harm or need urgent support, call or text **988 (US)**, or **9152987821 (iCall India)**. You deserve caring, confidential support.';
    }
  } else {
    // GAD-7 Anxiety
    if (sevLower.includes('minimal')) {
      overview = `Your score of **${score}/${maxScore}** indicates **Minimal or Normal Anxiety Levels**. You appear to be managing daily stressors and uncertainties effectively without significant physiological or mental tension.`;
      tips = [
        '**Keep Healthy Stress Buffers:** Regular physical exercise, mindful pauses, and engaging hobbies keep your nervous system balanced.',
        '**Mindful Breathwork:** Incorporate short 2-minute breath checks throughout busy workdays to maintain calmness.',
        '**Boundary Awareness:** Continue practicing healthy limits around workloads and social commitments.'
      ];
      professionalNote = 'Maintaining proactive lifestyle habits is the best protection against situational stress spikes.';
    } else if (sevLower.includes('mild')) {
      overview = `Your score of **${score}/${maxScore}** corresponds to **Mild Anxiety**. You might be experiencing occasional restlessness, tension, or a busy, racing mind when dealing with deadlines and responsibilities.`;
      tips = [
        '**5-4-3-2-1 Sensory Grounding:** Whenever tension spikes, name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste to bring your brain back to the present.',
        '**Limit Stimulants:** Reduce late-afternoon caffeine, energy drinks, and intense news/social media consumption.',
        '**Scheduled Worry Window:** Dedicate 10 minutes in the late afternoon to write down all worries on paper, then close the notebook.'
      ];
      professionalNote = 'Mild anxiety responds very well to mindfulness, lifestyle adjustments, and stress management coaching.';
    } else if (sevLower.includes('moderate')) {
      overview = `Your score of **${score}/${maxScore}** reflects **Moderate Anxiety**. You are likely dealing with persistent worry, muscle tension, trouble relaxing, or feeling frequently on edge. This degree of anxiety can be mentally exhausting and physically draining.`;
      tips = [
        '**4-7-8 Parasympathetic Reset:** Inhale slowly through your nose for 4 seconds, hold gently for 7, and exhale steadily through your mouth for 8 seconds. Repeat 4 cycles.',
        '**Progressive Muscle Relaxation:** Systematically clench and release muscle groups from your toes to your face to release stored somatic tension.',
        '**Identify Cognitive Triggers:** Notice if you are falling into "catastrophizing" (assuming worst-case scenarios) and gently question whether other outcomes are possible.'
      ];
      professionalNote = '👉 **Recommended Support:** Speaking with a licensed cognitive behavioral therapist (CBT) or healthcare provider can equip you with proven tools to regain control over anxious thoughts.';
    } else {
      overview = `Your score of **${score}/${maxScore}** indicates **Severe Anxiety**. You are experiencing intense, persistent anxiety that may include physical symptoms (racing heart, sleep disturbance, gastrointestinal distress) and significant difficulty unwinding. You do not have to endure this intense distress alone.`;
      tips = [
        '**Prioritize Nervous System Safety:** When panic or intense worry hits, place one hand on your chest and one on your abdomen, breathing slowly into your belly.',
        '**Reduce Sensory Input:** Dim bright lights, step into a quieter room, or listen to calming binaural ambient sounds.',
        '**Lean on Your Support Network:** Inform someone close to you that you are navigating high anxiety so they can offer comforting presence.'
      ];
      professionalNote = '⚠️ **Professional Evaluation Advised:** High anxiety levels are very treatable with professional clinical support, counseling, and medical guidance. If feelings become overwhelming, reach out to **988 (US)** or **9152987821 (iCall India)** for immediate confidential support.';
    }
  }

  const tipsFormatted = tips.map(t => `- ${t}`).join('\n');
  return `### 📋 Clinical Overview\n${overview}\n\n### 💡 Recommended Coping Strategies\n${tipsFormatted}\n\n### 🤝 Guidance & Support\n${professionalNote}\n\n*(Note: This digital assessment is an educational screening tool and does not constitute a formal medical diagnosis).*`;
}

router.post('/', auth, async (req, res) => {
  try {
    const { type, score, maxScore, severity } = req.body;
    if (!type || score == null || !severity) {
      return res.status(400).json({ error: 'Missing assessment fields' });
    }

    let aiAnalysis = '';
    const apiKey = process.env.OPENAI_API_KEY;
    const hasLiveOpenAI = apiKey && !apiKey.includes('your_openai_api_key') && apiKey.startsWith('sk-');

    if (hasLiveOpenAI) {
      try {
        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a warm, compassionate mental health clinician assistant. Never diagnose. Provide a supportive, evidence-based interpretation with clinical overview, 3 actionable coping tips, and guidance on professional help. Use clean markdown formatting.'
            },
            {
              role: 'user',
              content: `User completed assessment: ${type}. Score: ${score}/${maxScore}, Severity: ${severity}.\n\nProvide:\n### 📋 Clinical Overview\n(2-3 sentences explaining what this score reflects)\n\n### 💡 Recommended Coping Strategies\n(3 bullet points with actionable self-care techniques)\n\n### 🤝 Guidance & Support\n(Recommendation regarding professional consultation or helplines)\n\nKeep under 200 words.`
            },
          ],
          max_tokens: 350,
          temperature: 0.7,
        });
        aiAnalysis = completion.choices[0].message.content;
      } catch (aiErr) {
        console.warn('OpenAI call failed, using clinical assessment engine:', aiErr.message);
        aiAnalysis = generateAssessmentAnalysis(type, score, maxScore, severity);
      }
    } else {
      aiAnalysis = generateAssessmentAnalysis(type, score, maxScore, severity);
    }

    const assessment = await Assessment.create({
      user: req.userId,
      type,
      score,
      maxScore,
      severity,
      aiAnalysis
    });

    res.json({
      id: assessment._id,
      aiAnalysis,
      ai_analysis: aiAnalysis,
      score: assessment.score,
      maxScore: assessment.maxScore,
      severity: assessment.severity
    });
  } catch (err) {
    console.error('Assessment error:', err.message);
    res.status(500).json({ error: 'Failed to save assessment' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const docs = await Assessment.find({ user: req.userId }).sort({ createdAt: -1 });
    const assessments = docs.map(d => {
      let analysis = d.aiAnalysis;
      if (!analysis || analysis.includes('unavailable') || analysis.trim().length === 0) {
        analysis = generateAssessmentAnalysis(d.type, d.score, d.maxScore, d.severity);
      }
      return {
        id: d._id,
        type: d.type,
        score: d.score,
        max_score: d.maxScore,
        severity: d.severity,
        ai_analysis: analysis,
        created_at: d.createdAt
      };
    });
    res.json({ assessments });
  } catch (err) {
    console.error('Assessment history error:', err.message);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

module.exports = router;
