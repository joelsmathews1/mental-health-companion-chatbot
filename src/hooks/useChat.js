// src/hooks/useChat.js
// ─────────────────────────────────────────────────────────────
// Central chat state management hook.
// Handles:
//  - Loading/saving messages to Supabase
//  - Streaming AI responses via Groq (Llama 3.3 70B)
//  - Memory synthesis trigger logic
//  - Session ID management
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { sendMessage, synthesizeMemory } from '../services/aiService'

const MESSAGES_PER_PAGE = 30
const HISTORY_WINDOW = 10   // messages sent as context to AI
const SYNTHESIS_EVERY = 20  // trigger memory synthesis every N messages

export function useChat({ user, profile }) {
  const [messages, setMessages] = useState([])
  const [memories, setMemories] = useState([])
  const [mode, setMode] = useState('companion')
  const [isTyping, setIsTyping] = useState(false)
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [error, setError] = useState(null)
  const [streamingContent, setStreamingContent] = useState('')

  // Stable session ID for this browser session
  const sessionId = useRef(crypto.randomUUID())
  // Track message count for synthesis trigger
  const messagesSinceLastSynthesis = useRef(0)

  // Load existing messages and memories on mount
  useEffect(() => {
    if (!user) return
    loadMessages()
    loadMemories()
  }, [user])

  async function loadMessages() {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(MESSAGES_PER_PAGE)

    if (error) {
      console.error('Error loading messages:', error)
      return
    }
    setMessages((data || []).reverse())
  }

  async function loadMemories() {
    const { data, error } = await supabase
      .from('long_term_memories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error loading memories:', error)
      return
    }
    setMemories(data || [])
  }

  // ─────────────────────────────────────────────────────────────
  // SEND MESSAGE
  // ─────────────────────────────────────────────────────────────
  const sendUserMessage = useCallback(async (content) => {
    if (!content.trim() || isTyping) return
    setError(null)

    const now = new Date().toISOString()
    const userMsg = {
      id: crypto.randomUUID(),
      user_id: user.id,
      role: 'user',
      content: content.trim(),
      mode,
      session_id: sessionId.current,
      created_at: now,
    }

    // Optimistically add user message to UI
    setMessages((prev) => [...prev, userMsg])

    // Persist user message to Supabase
    const { error: insertError } = await supabase
      .from('conversations')
      .insert(userMsg)
    if (insertError) console.error('Failed to save user message:', insertError)

    // Build context for AI
    const recentMessages = [...messages.slice(-HISTORY_WINDOW), userMsg]
    const historyForAI = recentMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }))
    // Remove the last user message from history — it's sent as the new message
    const historyWithoutLast = historyForAI.slice(0, -1)

    // Start streaming AI response
    setIsTyping(true)
    setStreamingContent('')

    let fullResponse = ''
    try {
      fullResponse = await sendMessage({
        userMessage: content.trim(),
        mode,
        profile,
        history: historyWithoutLast,
        memories,
        onChunk: (chunk) => {
          fullResponse += chunk  // track locally too
          setStreamingContent((prev) => prev + chunk)
        },
      })
    } catch (err) {
      setError(err.message)
      setIsTyping(false)
      setStreamingContent('')
      return
    }

    setIsTyping(false)
    setStreamingContent('')

    // Build and save assistant message
    const assistantMsg = {
      id: crypto.randomUUID(),
      user_id: user.id,
      role: 'assistant',
      content: fullResponse,
      mode,
      session_id: sessionId.current,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, assistantMsg])

    const { error: assistantInsertError } = await supabase
      .from('conversations')
      .insert(assistantMsg)
    if (assistantInsertError) console.error('Failed to save assistant message:', assistantInsertError)

    // Check if we should synthesize memory
    messagesSinceLastSynthesis.current += 2 // user + assistant
    if (messagesSinceLastSynthesis.current >= SYNTHESIS_EVERY) {
      messagesSinceLastSynthesis.current = 0
      triggerMemorySynthesis([...messages, userMsg, assistantMsg])
    }
  }, [messages, memories, mode, profile, user, isTyping])

  // ─────────────────────────────────────────────────────────────
  // MEMORY SYNTHESIS
  // Can be called automatically or on session end
  // ─────────────────────────────────────────────────────────────
  async function triggerMemorySynthesis(messagesToSynthesize) {
    if (!profile || !messagesToSynthesize || messagesToSynthesize.length < 4) return
    setIsSynthesizing(true)

    try {
      // Only synthesize from the current session's messages
      const sessionMessages = messagesToSynthesize.filter(
        (m) => m.session_id === sessionId.current
      )
      if (sessionMessages.length < 4) return

      const { summary, emotional_tags } = await synthesizeMemory(
        sessionMessages,
        profile.name
      )

      const newMemory = {
        user_id: user.id,
        summary,
        emotional_tags,
        session_id: sessionId.current,
      }

      const { data, error } = await supabase
        .from('long_term_memories')
        .insert(newMemory)
        .select()
        .single()

      if (!error && data) {
        setMemories((prev) => [data, ...prev].slice(0, 10))
      }
    } catch (err) {
      console.error('Memory synthesis failed:', err)
    } finally {
      setIsSynthesizing(false)
    }
  }

  // Allow external call (e.g., when user closes the tab or manually triggers)
  const endSession = useCallback(() => {
    triggerMemorySynthesis(messages)
  }, [messages, profile])

  return {
    messages,
    memories,
    mode,
    setMode,
    isTyping,
    isSynthesizing,
    streamingContent,
    error,
    sendUserMessage,
    endSession,
    messageCount: messages.length,
  }
}