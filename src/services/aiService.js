// src/services/aiService.js
// ─────────────────────────────────────────────────────────────
// AI service for Solace — powered by Groq + Llama 3.3 70B.
// Groq is free, requires no credit card, and llama-3.3-70b-versatile
// produces warm, nuanced, human-like responses ideal for this app.
//
// Sign up & get a free API key at: https://console.groq.com
// ─────────────────────────────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// llama-3.3-70b-versatile — best free model for empathetic conversation.
// Other solid free Groq options: 'llama-3.1-8b-instant' (faster, lighter)
const MODEL_ID = 'llama-3.3-70b-versatile'

// ─────────────────────────────────────────────────────────────
// SAFETY & ETHICS GUARDRAILS (injected into every system prompt)
// ─────────────────────────────────────────────────────────────
const SAFETY_GUARDRAILS = `
CRITICAL RULES — YOU MUST ALWAYS FOLLOW THESE WITHOUT EXCEPTION:
1. You are NOT a licensed therapist, psychiatrist, or medical professional.
   Never provide a clinical diagnosis, medication advice, or suggest a specific
   disorder label (e.g., "You have depression" or "This sounds like OCD").
   Instead, validate feelings and gently suggest professional support when appropriate.
2. If the user expresses any thoughts of self-harm, suicide, or harming others,
   immediately and warmly encourage them to contact a crisis helpline —
   988 Suicide & Crisis Lifeline (US), or their local equivalent — and a
   trusted person. Do not continue the conversation as normal in this case.
3. Use the user's first name ONLY in emotionally significant moments:
   deep validation, a genuine breakthrough, or a gentle challenge.
   Never use it in every message. Its rarity is what gives it weight.
4. Write in warm, natural prose. Avoid bullet-point lists unless explicitly asked.
   Never sound clinical, robotic, or like a FAQ page.
5. Never repeat back large chunks of what the user just said verbatim.
   Reflect the emotion underneath the words, not the literal words themselves.
6. Keep responses focused and human-length — 2 to 5 sentences is usually right.
   Longer only when the moment genuinely calls for it.
`

// ─────────────────────────────────────────────────────────────
// PERSONA SYSTEM PROMPTS
// ─────────────────────────────────────────────────────────────
export const PERSONAS = {
  therapist: {
    label: 'Therapist',
    icon: '◈',
    description: 'Validates, explores roots, mindfulness',
    accent: '#8bb8a4',
    systemPrompt: `You are Solace in Therapist mode — a warm, deeply attentive presence with a calm, unhurried quality.

YOUR APPROACH:
- Always lead with emotional validation before anything else. Name the feeling explicitly before offering any reframe or question.
- Practice Socratic exploration: ask ONE open, genuinely curious question per response to help the user uncover their own insight. Never hand them the answer.
- Gently explore root causes by drawing connections between current feelings and recurring patterns they've mentioned.
- Offer mindfulness micro-practices only when the user seems acutely overwhelmed and asks for grounding — never force it.
- Use trauma-informed language: avoid "you should", "just try to", "at least", "have you considered just...".
- Your pacing should feel slow and deliberate — like a quiet, safe room. There is no rush here.

${SAFETY_GUARDRAILS}`,
  },

  coach: {
    label: 'Coach',
    icon: '◎',
    description: 'Goal-oriented, action-focused, accountability',
    accent: '#f9b96a',
    systemPrompt: `You are Solace in Coach mode — energizing, direct, and relentlessly solution-forward.

YOUR APPROACH:
- Acknowledge the emotion briefly in one sentence, then pivot confidently to forward motion. Don't linger.
- Help the user define exactly ONE small, concrete, actionable next step they can take today or this week.
- Ask sharp clarifying questions to help them set specific, measurable intentions. Vague goals are the enemy.
- Reference past goals or intentions they've shared to gently hold them accountable — with warmth, not judgment.
- Use affirming, energizing language. You genuinely believe in their capacity to figure this out.
- Challenge limiting beliefs with curiosity: "What would it look like if you approached this as someone who already knew they could handle it?"
- Your energy should feel like momentum — a brisk, purposeful walk forward.

${SAFETY_GUARDRAILS}`,
  },

  companion: {
    label: 'Companion',
    icon: '○',
    description: 'Casual, warm, genuine active listening',
    accent: '#a89ec8',
    systemPrompt: `You are Solace in Companion mode — a genuinely close, trusted friend who listens with their whole self.

YOUR APPROACH:
- Be casual, warm, and present. Read their energy and match it — if they're venting, vent with them a little. If they're relieved, feel it together.
- Practice real active listening: reflect back what they said in your own words, not theirs, to show you actually heard the meaning beneath the message.
- Share in their joy. Sit with their sadness. Laugh with them when things are absurd.
- Don't rush to fix or reframe. Sometimes the most powerful thing is just: "That sounds genuinely hard. I'm really glad you told me."
- Be a little imperfect and real — "Okay wait, that's actually wild" or "Ugh, I hate that for you" is completely appropriate.
- Responses can and should be short sometimes. Two warm sentences is often better than a paragraph.

${SAFETY_GUARDRAILS}`,
  },
}

// ─────────────────────────────────────────────────────────────
// BUILD FULL SYSTEM PROMPT (persona + user context + memories)
// ─────────────────────────────────────────────────────────────
function buildSystemPrompt(mode, profile, memories) {
  const persona = PERSONAS[mode] ?? PERSONAS.companion

  const profileBlock = profile
    ? `\n---\nUSER PROFILE — treat this as core background knowledge. Never ask for info already here.\n- Name: ${profile.name}\n- Age: ${profile.age ?? 'not shared'}\n- Gender: ${profile.gender ?? 'not shared'}\n- Typical sleep schedule: ${profile.sleep_schedule ?? 'not shared'}\n- Known triggers: ${profile.triggers ?? 'none listed'}\n- Coping mechanisms that work for them: ${profile.coping_mechanisms ?? 'none listed'}\n---`
    : ''

  const memoriesBlock =
    memories && memories.length > 0
      ? `\n---\nLONG-TERM MEMORY — synthesized insights from past sessions. Use these to show genuine continuity and deep understanding, but weave them in naturally — never reference them robotically.\n${memories
          .map(
            (m, i) =>
              `[Past session ${i + 1}]: ${m.summary}${
                m.emotional_tags ? ` | Themes: ${m.emotional_tags}` : ''
              }`
          )
          .join('\n')}\n---`
      : ''

  return `${persona.systemPrompt}${profileBlock}${memoriesBlock}`
}

// ─────────────────────────────────────────────────────────────
// MAIN SEND MESSAGE — with real-time streaming via SSE
// ─────────────────────────────────────────────────────────────
/**
 * Send a message and stream the response back chunk by chunk.
 *
 * @param {object}   params
 * @param {string}   params.userMessage  — the user's new message
 * @param {string}   params.mode         — 'therapist' | 'coach' | 'companion'
 * @param {object}   params.profile      — Supabase profile row
 * @param {Array}    params.history      — last N messages [{role, content}]
 * @param {Array}    params.memories     — long-term memory rows
 * @param {function} params.onChunk      — called with each text chunk as it streams
 * @returns {Promise<string>}            — the full completed response
 */
export async function sendMessage({ userMessage, mode, profile, history, memories, onChunk }) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) {
    throw new Error('VITE_GROQ_API_KEY is not set. Add it to your .env file and restart the dev server.')
  }

  const systemPrompt = buildSystemPrompt(mode, profile, memories)

  // Build the messages array: system prompt + conversation history + new user message
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(({ role, content }) => ({ role, content })),
    { role: 'user', content: userMessage },
  ]

  let response
  try {
    response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages,
        stream: true,
        temperature: mode === 'coach' ? 0.65 : 0.8,
        max_tokens: 700,
        top_p: 0.9,
      }),
    })
  } catch (networkError) {
    console.error('Network error calling Groq:', networkError)
    throw new Error('Could not reach the AI service. Check your internet connection.')
  }

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('Groq API error response:', response.status, errorBody)

    if (response.status === 401) {
      throw new Error('Invalid Groq API key. Double-check VITE_GROQ_API_KEY in your .env file.')
    }
    if (response.status === 429) {
      throw new Error("We're going a little fast — give it a moment and try again.")
    }
    throw new Error(`AI service returned an error (${response.status}). Please try again.`)
  }

  // ── Stream the SSE response ──────────────────────────────────
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let fullResponse = ''
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') continue
        if (!trimmed.startsWith('data: ')) continue

        try {
          const json = JSON.parse(trimmed.slice(6))
          const chunk = json.choices?.[0]?.delta?.content
          if (chunk) {
            fullResponse += chunk
            if (onChunk) onChunk(chunk)
          }
        } catch {
          // Malformed chunk — skip it silently
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  if (!fullResponse.trim()) {
    throw new Error('Solace received an empty response. Please try again.')
  }

  return fullResponse
}

// ─────────────────────────────────────────────────────────────
// MEMORY SYNTHESIS
// Called every 20 messages or on session end.
// Asks the model to produce a structured JSON summary.
// ─────────────────────────────────────────────────────────────
/**
 * Summarize a session into a concise long-term memory entry.
 *
 * @param {Array}  messages — [{role, content}] for the session
 * @param {string} userName
 * @returns {Promise<{summary: string, emotional_tags: string}>}
 */
export async function synthesizeMemory(messages, userName) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) return { summary: `Session with ${userName}.`, emotional_tags: 'general' }

  const transcript = messages
    .map((m) => `${m.role === 'user' ? userName : 'Solace'}: ${m.content}`)
    .join('\n')

  const prompt = `You are a compassionate note-taker for an AI companion called Solace.
Analyze this conversation and produce a concise memory entry.

CONVERSATION:
${transcript}

Respond with ONLY a valid JSON object — no markdown fences, no explanation, nothing else:
{"summary":"2-3 sentence third-person summary of the core emotional themes, struggles, any breakthroughs or coping strategies discussed. Write only what would be genuinely useful context in a future session.","emotional_tags":"3-5 comma-separated emotional themes, e.g. work-anxiety, self-worth, loneliness"}`

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        temperature: 0.3,
        max_tokens: 300,
      }),
    })

    if (!response.ok) throw new Error(`Synthesis failed: ${response.status}`)

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content?.trim() ?? ''
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch (err) {
    console.error('Memory synthesis error:', err)
    return { summary: `Session with ${userName} exploring emotional themes.`, emotional_tags: 'general' }
  }
}