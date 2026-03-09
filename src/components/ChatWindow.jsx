import { useEffect, useRef, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Send, AlertCircle, Sparkles } from 'lucide-react'
import MessageBubble, { TypingIndicator } from './MessageBubble'

const CFG = {
  therapist: { label: 'Therapist', accent: '#8bb8a4', placeholder: "Share what's on your mind…" },
  coach:     { label: 'Coach',     accent: '#f9b96a', placeholder: 'What are you working towards?' },
  companion: { label: 'Companion', accent: '#a89ec8', placeholder: 'Hey, how are you feeling today?' },
}

const WELCOME = {
  therapist: "I'm here with you. This is a space with no judgment — only curiosity and care. What would feel meaningful to explore today?",
  coach:     "Ready to move forward? Let's figure out where you are, where you want to be, and take one step together. What's been on your mind?",
  companion: "Hey! Really glad you're here. How's your day actually going — not the version you tell everyone, the real one?",
}

export default function ChatWindow({ messages, isTyping, isSynthesizing, streamingContent, error, mode, onSend, profile }) {
  const [input, setInput] = useState('')
  const bottomRef   = useRef(null)
  const textareaRef = useRef(null)
  const cfg = CFG[mode]

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping, streamingContent])

  function send() {
    if (!input.trim() || isTyping) return
    onSend(input); setInput(''); textareaRef.current?.focus()
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] bg-obsidian-900/50 backdrop-blur-sm flex-shrink-0">
        <div>
          <h1 className="font-display text-xl font-light tracking-wide text-ember-100">Your conversation</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.accent }} />
            <span className="text-xs font-mono tracking-wider uppercase" style={{ color: `${cfg.accent}90` }}>
              {cfg.label} mode active
            </span>
          </div>
        </div>
        {isSynthesizing && (
          <div className="flex items-center gap-1.5 text-ember-400/50 text-xs font-mono">
            <Sparkles size={12} className="animate-pulse" /> Synthesizing memory…
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 bg-ember-glow">
        {messages.length === 0
          ? <Welcome mode={mode} profile={profile} cfg={cfg} />
          : messages.map((m) => <MessageBubble key={m.id} message={m} />)
        }

        {isTyping && !streamingContent && <TypingIndicator mode={mode} />}

        {isTyping && streamingContent && (
          <div className="flex items-end gap-3 message-appear">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs mb-1"
              style={{ background: `${cfg.accent}1a`, border: `1px solid ${cfg.accent}40`, color: cfg.accent }}>◈</div>
            <div className="max-w-[78%]">
              <p className="text-[10px] font-mono mb-1.5 tracking-wider uppercase" style={{ color: `${cfg.accent}70` }}>
                Solace · {cfg.label}
              </p>
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed"
                style={{ background: 'rgba(20,25,33,0.9)', border: '1px solid rgba(255,255,255,0.05)', color: '#d8cec4' }}>
                {streamingContent}
                <span className="inline-block w-0.5 h-4 bg-current opacity-60 ml-0.5 animate-pulse align-middle" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400/80 text-sm">
            <AlertCircle size={14} />{error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-4 pt-3 border-t border-white/[0.04] bg-obsidian-900/60 backdrop-blur-sm">
        <div className="flex items-end gap-3 rounded-2xl p-3 transition-all duration-300"
          style={{
            background: 'rgba(8,10,14,0.7)',
            border: `1px solid ${input.trim() ? `${cfg.accent}30` : 'rgba(255,255,255,0.07)'}`,
            boxShadow: input.trim() ? `0 0 0 3px ${cfg.accent}08` : 'none',
          }}>
          <TextareaAutosize
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={cfg.placeholder}
            minRows={1} maxRows={6}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-ember-100/80 placeholder-ember-400/20 leading-relaxed"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
          />
          <button onClick={send} disabled={!input.trim() || isTyping}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30"
            style={{
              background: input.trim() && !isTyping ? cfg.accent : 'rgba(255,255,255,0.06)',
              color:      input.trim() && !isTyping ? '#080a0e'  : 'rgba(255,255,255,0.3)',
            }}>
            <Send size={14} />
          </button>
        </div>
        <p className="text-center mt-2 text-[10px] text-ember-400/20 font-mono">
          Solace is an AI companion, not a licensed therapist. In crisis? Call{' '}
          <a href="tel:988" className="underline hover:text-ember-400/40 transition-colors">988</a> (US) or your local helpline.
        </p>
      </div>
    </div>
  )
}

function Welcome({ mode, profile, cfg }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-6 animate-pulse-glow"
        style={{ background: `${cfg.accent}12`, border: `1px solid ${cfg.accent}30`, color: cfg.accent }}>◈</div>
      <p className="font-display text-3xl font-light text-ember-100/80 mb-2">
        {profile ? `Hello, ${profile.name.split(' ')[0]}` : 'Hello there'}
      </p>
      <p className="text-xs font-mono tracking-widest uppercase mb-8" style={{ color: `${cfg.accent}70` }}>
        {cfg.label} · Ready to listen
      </p>
      <p className="text-sm text-ember-200/40 max-w-sm leading-relaxed italic">
        "{WELCOME[mode]}"
      </p>
    </div>
  )
}