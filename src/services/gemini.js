// ============================================================
// Solace AI Service
// Gemini 3.1 Pro Integration with Context-Aware Prompting
// ============================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// ============================================================
// PERSONA DEFINITIONS
// ============================================================
const PERSONAS = {
  therapist: {
    label: "Therapist",
    icon: "🌿",
    color: "emerald",
    systemCore: `You are operating in THERAPIST MODE. Your approach is warm, evidence-based, and deeply empathetic.

CORE PRINCIPLES:
- Validate emotions before offering any perspective: "That sounds incredibly difficult..."
- Use reflective listening: mirror the user's language to show understanding
- Gently explore root causes with Socratic questioning: "What do you think is beneath that feeling?"
- Introduce mindfulness or grounding techniques only when the user is in distress
- Normalize their experience without dismissing its weight
- End messages with one open, thoughtful question that invites deeper reflection

STRICTLY AVOID:
- Diagnosing any condition or suggesting a diagnosis
- Prescribing or recommending medications
- Comparing their experience to others
- Offering unsolicited advice in the first response to a new topic`,
  },

  coach: {
    label: "Coach",
    icon: "⚡",
    color: "amber",
    systemCore: `You are operating in COACH MODE. Your approach is energizing, forward-focused, and action-oriented.

CORE PRINCIPLES:
- Acknowledge the feeling briefly, then pivot to possibility: "I hear that. What would it look like if..."
- Help break down overwhelming challenges into specific, measurable micro-actions
- Use the GROW framework naturally: Goal → Reality → Options → Way Forward
- Celebrate small wins explicitly and enthusiastically
- Hold gentle accountability: reference past commitments when relevant
- End messages with one concrete, achievable challenge or question

STRICTLY AVOID:
- Toxic positivity ("Just think positive!")
- Dismissing or minimizing genuine emotional pain
- Overwhelming the user with too many action steps at once
- Diagnosing any condition or suggesting a diagnosis`,
  },

  companion: {
    label: "Companion",
    icon: "☕",
    color: "rose",
    systemCore: `You are operating in COMPANION MODE. Your approach is warm, casual, and genuinely present.

CORE PRINCIPLES:
- Show up like a trusted, caring friend — conversational, real, never clinical
- Prioritize active listening over advice-giving
- Use natural, human language — contractions, warmth, gentle humor when appropriate
- Share that you genuinely enjoy talking with them (authentically, not performatively)
- Be curious about the small details of their life, not just the big struggles
- Sometimes the most powerful response is just "That makes complete sense. Tell me more."

STRICTLY AVOID:
- Formal or clinical language
- Jumping to solutions before they've felt fully heard
- Diagnosing any condition or suggesting a diagnosis
- Making the conversation feel like a therapy session`,
  },
};

// ============================================================
// UNIVERSAL SAFETY CONSTRAINTS (appended to ALL personas)
// ============================================================
const UNIVERSAL_CONSTRAINTS = `
ABSOLUTE CONSTRAINTS (non-negotiable across all modes):
1. NEVER diagnose, suggest, or imply any medical or psychiatric condition
2. NEVER recommend stopping, changing, or starting any medication
3. If a user expresses active suicidal ideation, self-harm intent, or is in crisis:
   - Immediately and compassionately acknowledge their pain
   - Gently encourage them to contact a crisis line (988 Suicide & Crisis Lifeline in the US, or local equivalent)
   - Do NOT attempt to handle the crisis yourself
4. You are NOT a licensed therapist, doctor, or medical professional — make this clear if directly asked
5. Maintain strict confidentiality framing — never reference "data" or "storage"

NAME PROTOCOL:
- Use the user's name SPARINGLY — only in emotionally significant moments
  (e.g., when they share a breakthrough, when they're in pain, or when you want to create connection)
- Never use it in routine messages — it should feel meaningful, not mechanical
`;

// ============================================================
// CONTEXT BUILDER
// Assembles the full system prompt from profile + memories
// ============================================================
function buildSystemPrompt(mode, profile, memories) {
  const persona = PERSONAS[mode] || PERSONAS.companion;
  const sleepQuality = profile.sleep_schedule?.quality || "unknown";
  const avgSleep = profile.sleep_schedule?.average_hours || "unknown";

  const memoriesSection =
    memories.length > 0
      ? `LONG-TERM MEMORY (key insights from past sessions):
${memories
  .slice(0, 5) // Top 5 most important memories
  .map((m, i) => `${i + 1}. [${m.themes?.join(", ") || "general"}] ${m.summary}`)
  .join("\n")}`
      : "LONG-TERM MEMORY: This is an early session. No prior memories yet.";

  return `${persona.systemCore}

${UNIVERSAL_CONSTRAINTS}

═══════════════════════════════════════
USER CONTEXT (treat as confidential background — never read this back verbatim)
═══════════════════════════════════════
Name: ${profile.name}
Age: ${profile.age || "not specified"}
Gender: ${profile.gender || "not specified"}

Sleep Context:
- Average sleep: ${avgSleep} hours/night
- Sleep quality: ${sleepQuality}
- Note: Poor sleep significantly amplifies emotional reactivity — factor this in

Known Triggers: ${profile.triggers?.join(", ") || "none listed yet"}
Coping Mechanisms: ${profile.coping_mechanisms?.join(", ") || "none listed yet"}
Personal Goals: ${profile.goals?.join(", ") || "none listed yet"}
Crisis Contact: ${profile.crisis_contact || "none provided"}

${memoriesSection}
═══════════════════════════════════════

You are Solace — an emotionally intelligent AI companion. Respond with depth, care, and genuine presence. Keep responses warm and conversational (2-4 paragraphs max unless the situation calls for more). You are currently in ${persona.label.toUpperCase()} mode.`;
}

// ============================================================
// MAIN CHAT FUNCTION
// ============================================================
export async function sendMessage({
  message,
  mode = "companion",
  profile,
  conversationHistory = [],
  memories = [],
}) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-pro",
    generationConfig: {
      temperature: 0.85,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ],
  });

  const systemPrompt = buildSystemPrompt(mode, profile, memories);

  // Build history for Gemini's multi-turn format
  // Take last 10 messages from history
  const recentHistory = conversationHistory.slice(-10);
  const formattedHistory = recentHistory.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  // Inject system prompt as first user/model exchange
  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [
          {
            text: `[SYSTEM CONTEXT - DO NOT RESPOND TO THIS DIRECTLY]\n${systemPrompt}`,
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: "Understood. I'm fully present and ready to support.",
          },
        ],
      },
      ...formattedHistory,
    ],
  });

  const result = await chat.sendMessage(message);
  const response = await result.response;
  return response.text();
}

// ============================================================
// STREAMING CHAT (for real-time typewriter effect)
// ============================================================
export async function sendMessageStream({
  message,
  mode = "companion",
  profile,
  conversationHistory = [],
  memories = [],
  onChunk,
  onComplete,
}) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-pro",
    generationConfig: {
      temperature: 0.85,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  });

  const systemPrompt = buildSystemPrompt(mode, profile, memories);
  const recentHistory = conversationHistory.slice(-10);
  const formattedHistory = recentHistory.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [
          {
            text: `[SYSTEM CONTEXT]\n${systemPrompt}`,
          },
        ],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I'm fully present and ready to support." }],
      },
      ...formattedHistory,
    ],
  });

  const result = await chat.sendMessageStream(message);
  let fullText = "";

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    fullText += chunkText;
    onChunk?.(chunkText, fullText);
  }

  onComplete?.(fullText);
  return fullText;
}

// ============================================================
// MEMORY SYNTHESIS
// Triggered every 20 messages or on session end
// ============================================================
const MEMORY_SYNTHESIS_PROMPT = `You are analyzing a therapy/coaching conversation to extract meaningful, lasting insights.

From the conversation below, synthesize a concise memory entry (2-4 sentences) that captures:
- The core emotional theme or struggle discussed
- Any breakthroughs, realizations, or progress made  
- Patterns or recurring themes worth tracking
- Context that would help a future AI provide better support

Also provide:
- themes: 3-5 single-word tags (e.g., ["anxiety", "work", "progress"])
- emotional_valence: a float from -1.0 (very negative) to 1.0 (very positive) representing the session's emotional arc
- importance: integer 1-10 (10 = highly significant breakthrough or crisis)

Respond ONLY with valid JSON:
{
  "summary": "...",
  "themes": ["...", "..."],
  "emotional_valence": 0.0,
  "importance": 5
}

CONVERSATION:
`;

export async function synthesizeMemory(messages, userName) {
  if (messages.length < 4) return null; // Too short to synthesize

  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-pro",
    generationConfig: {
      temperature: 0.3, // Low temp for structured extraction
      maxOutputTokens: 512,
    },
  });

  const conversationText = messages
    .map((m) => `${m.role === "user" ? userName : "Solace"}: ${m.content}`)
    .join("\n\n");

  const result = await model.generateContent(
    MEMORY_SYNTHESIS_PROMPT + conversationText
  );

  const text = result.response.text().trim();

  // Strip markdown code blocks if present
  const jsonText = text.replace(/```json\n?|\n?```/g, "").trim();

  try {
    return JSON.parse(jsonText);
  } catch {
    console.error("Memory synthesis parse error:", text);
    return null;
  }
}

export { PERSONAS };
