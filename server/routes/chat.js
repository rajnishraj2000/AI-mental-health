const express = require('express');
const { OpenAI } = require('openai');
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');

const router = express.Router();

const SYSTEM_PROMPT = `You are MindCare AI, a compassionate mental health support assistant.
- Listen actively and respond with empathy
- Provide evidence-based coping strategies
- Never diagnose or prescribe medication
- Use a warm, supportive, non-judgmental tone
- Keep responses concise (under 200 words)
- If someone mentions self-harm/suicide, provide crisis resources: 988 (US), iCall 9152987821 (India)
- You are NOT a replacement for professional mental health care.`;

/**
 * Intelligent topic-aware empathetic conversational engine.
 * Generates tailored psychological and somatic guidance when OpenAI key is absent.
 */
function generateConversationalReply(userMessage) {
  const text = (userMessage || '').toLowerCase();

  // 1. Crisis & Emergency Interception
  const isCrisis = /suicide|kill myself|end my life|die|self harm|hurt myself|want to die|no reason to live|hanging|overdose/i.test(text);
  if (isCrisis) {
    return `I am so sorry you are feeling this intense pain, but please know you do not have to carry this alone. Your life matters deeply, and compassionate help is ready right now:\n\n🚨 **Immediate Crisis Helplines (Free & Confidential):**\n• **US:** Call or text **988** (Suicide & Crisis Lifeline, 24/7)\n• **Crisis Text Line:** Text **HOME to 741741**\n• **India (iCall):** **9152987821** (Mon-Sat, 8 AM - 10 PM)\n• **India (Vandrevala Foundation):** **1860-2662-345** (24/7)\n• **UK:** Call **116 123** (Samaritans)\n\nPlease reach out to one of these resources or contact a trusted person immediately. You deserve care and safety. 💙`;
  }

  // 2. Sleep & Insomnia
  const isSleep = /sleep|insomnia|tired|bedtime|awake|can't sleep|cant sleep|nightmare|restless|drowsy|exhausted/i.test(text);
  if (isSleep) {
    return `I hear how exhausting it is when your body is tired but your mind refuses to switch off. Forcing sleep often creates pressure, so let's shift your nervous system into relaxation mode:\n\n🌙 **1. The 4-7-8 Somatic Relaxation**\nLie comfortably and gently:\n• Inhale quietly through your nose for **4 seconds**\n• Hold your breath gently for **7 seconds**\n• Exhale completely through your mouth with a soft whoosh for **8 seconds**\nRepeat this 4 times to slow your heart rate and signal safety to your brain.\n\n📖 **2. The 20-Minute Reset Rule**\nIf you've been lying in bed for over 20 minutes awake, get up. Move to dim light, read a few pages of a physical book, or listen to soft ambient rain until your eyelids naturally feel heavy.\n\n📝 **3. The "Brain Dump"**\nIf tomorrow's tasks or racing thoughts are spinning, write them down on a scrap paper next to your bed. Tell yourself: *"These thoughts are safely stored on paper. I don't need to hold them tonight."*\n\nGive yourself permission to just rest quietly without worrying about falling asleep immediately. 💙`;
  }

  // 3. Anxiety, Panic & Racing Thoughts
  const isAnxious = /anxious|anxiety|panic|scared|nervous|fear|heart racing|dread|freaking out|tension/i.test(text);
  if (isAnxious) {
    return `I hear you, and it's completely okay that you're feeling this right now. Anxiety is an intense surge of adrenaline, but it is temporary and you are safe in this moment.\n\nLet's do the **5-4-3-2-1 Sensory Grounding** together:\n👁️ Look around: Name **5 things you can see**\n✋ Touch: Notice **4 things you can feel** (your feet on the floor, your clothes, the air)\n👂 Listen: Name **3 distinct sounds** you hear right now\n👃 Scent: Notice **2 smells** around you\n👅 Breath: Take **1 long, slow deep breath** all the way down to your belly\n\nRelease your shoulders away from your ears and unclench your jaw. Would you like to talk through what triggered this worry, or practice another calming exercise? 🌿`;
  }

  // 4. Overwhelm, Stress & Burnout
  const isOverwhelmed = /overwhelm|stressed|stress|too much|burnout|pressure|deadline|busy|workload|can't do this/i.test(text);
  if (isOverwhelmed) {
    return `You are carrying a tremendous amount right now, and feeling overwhelmed is your mind's natural signal that you need space to breathe. You don't have to carry the whole mountain today.\n\n💡 **Let's simplify right now:**\n1. **The "Next 1 Thing" Rule:** Stop looking at the entire list. Ask yourself: *"What is the single smallest action I can take in the next 10 minutes?"*\n2. **Cognitive Offload:** Step away from all screens for just 5 minutes. Stretch your neck and drink a full glass of cool water.\n3. **Permission to Pause:** Non-urgent tasks can wait. Protecting your mental peace is what allows you to function sustainably.\n\nWhat is the one thing causing the most pressure right now? We can break it into tiny, manageable pieces together. 🕊️`;
  }

  // 5. Breathing Exercises
  const isBreathing = /breath|breathing|exercise|grounding|calm down|relax/i.test(text);
  if (isBreathing) {
    return `Let's practice **Box Breathing (Navy SEALs Technique)** together. It rapidly calms your nervous system:\n\n1. 🌬️ **Inhale** slowly through your nose for **4 counts**\n2. ⏸️ **Hold** your breath gently for **4 counts**\n3. 💨 **Exhale** steadily through your mouth for **4 counts**\n4. ⏸️ **Hold** empty for **4 counts**\n\nRepeat this cycle 4 times. Focus your entire attention on the sensation of air moving through your lungs. Notice how each exhale releases stored physical tension. How does your chest feel now? 🧘`;
  }

  // 6. Sadness, Grief, Loneliness
  const isSad = /sad|depressed|lonely|crying|cry|hopeless|alone|empty|heartbroken|down|unhappy/i.test(text);
  if (isSad) {
    return `I am sitting with you in this moment. Sadness and loneliness can feel so heavy and quiet, but your feelings are valid and you don't have to force yourself to smile or "snap out of it."\n\nSometimes the most healing thing you can do is offer yourself unconditional gentleness:\n• Wrap yourself in a warm blanket or sweater\n• Make a warm, comforting drink like chamomile or herbal tea\n• Allow yourself to rest without self-criticism\n\nIf you want to talk about what's hurting, I am here to listen with zero judgment. And if you just want quiet support, that is okay too. You are not alone. 💙`;
  }

  // 7. Physical Discomfort / Illness
  const isPhysical = /unwell|sick|stomach|headache|pain|nausea|fever|cramp|ache/i.test(text);
  if (isPhysical) {
    return `Physical discomfort takes a profound toll on your emotional energy and mood. When our body hurts or feels sick, our mental stamina naturally dips.\n\n🌿 **Somatic Care Steps:**\n• Sip warm water or ginger/peppermint tea to soothe internal tension\n• Rest in a supportive, comfortable position with a warm heating pad or blanket\n• Lower expectations for today—give your body genuine permission to heal\n\n*(Note: If severe or persistent symptoms continue, please check in with a doctor or medical professional).* I hope your body feels relief very soon. 🍵`;
  }

  // 8. Anger & Frustration
  const isAngry = /angry|mad|furious|annoyed|frustrated|irritated|pissed/i.test(text);
  if (isAngry) {
    return `Your frustration is completely valid. Anger is often a sign that our boundaries were crossed, or a situation felt deeply unfair. You don't have to suppress it—let's channel it safely:\n\n⚡ **Somatic Release:**\n• Shake out your hands and arms vigorously for 15 seconds\n• Take a brisk 10-minute walk to metabolize the adrenaline\n• Write an uncensored brain dump on paper and tear it up\n\nWhat happened that made you feel this way? I'm here to listen. 🔥`;
  }

  // 9. Positive / Joy / Gratitude
  const isPositive = /happy|grateful|good|great|excited|proud|better|relieved|awesome|joy/i.test(text);
  if (isPositive) {
    return `That is wonderful to hear! 🌟 It is so valuable to pause and consciously savor these bright moments. Taking 30 seconds to breathe in this good feeling actually helps your brain anchor positive neural pathways.\n\nWhat contributed most to this uplifting moment today? Let's celebrate it! ✨`;
  }

  // 10. Default Empathetic Response
  return `Thank you for sharing that with me. I hear you, and whatever you are navigating right now, taking a moment to express it is a courageous step toward self-awareness.\n\nTake a slow, deep breath. Unclench your jaw and let your shoulders drop. How can I best support you in this moment—would you like to explore what's on your mind, try a calming exercise, or explore a practical self-care step? 💙`;
}

router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

    await Chat.create({ user: req.userId, role: 'user', content: message });

    // Cost optimization: only send last 6 messages
    const historyDocs = await Chat.find({ user: req.userId }).sort({ createdAt: -1 }).limit(6);
    const history = historyDocs.reverse().map(doc => ({ role: doc.role, content: doc.content }));

    let reply = '';
    const apiKey = process.env.OPENAI_API_KEY;
    const hasLiveOpenAI = apiKey && !apiKey.includes('your_openai_api_key') && apiKey.startsWith('sk-');

    if (hasLiveOpenAI) {
      try {
        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
          max_tokens: 350,
          temperature: 0.7,
        });
        reply = completion.choices[0].message.content;
      } catch (aiErr) {
        console.warn('OpenAI API call failed, using conversational engine:', aiErr.message);
        reply = generateConversationalReply(message);
      }
    } else {
      reply = generateConversationalReply(message);
    }

    await Chat.create({ user: req.userId, role: 'assistant', content: reply });

    res.json({ message: reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const messages = await Chat.find({ user: req.userId }).sort({ createdAt: 1 });
    const mapped = messages.map(m => ({ id: m._id, role: m.role, content: m.content, created_at: m.createdAt }));
    res.json({ messages: mapped });
  } catch (err) {
    console.error('Chat history error:', err.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.delete('/clear', auth, async (req, res) => {
  try {
    await Chat.deleteMany({ user: req.userId });
    res.json({ success: true });
  } catch (err) {
    console.error('Chat clear error:', err.message);
    res.status(500).json({ error: 'Failed to clear chat' });
  }
});

module.exports = router;
