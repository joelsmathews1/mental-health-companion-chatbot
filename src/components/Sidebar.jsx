// src/components/Sidebar.jsx
import { useState } from 'react'
import { LogOut, Brain, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { PERSONAS } from '../services/aiService'
import clsx from 'clsx'

const MODE_CONFIG = {
  therapist: {
    label: 'Therapist',
    icon: '◈',
    description: 'Validates, explores roots, offers mindfulness',
    accent: '#8bb8a4',
    accentBg: 'rgba(107, 158, 140, 0.08)',
    accentBorder: 'rgba(107, 158, 140, 0.25)',
  },
  coach: {
    label: 'Coach',
    icon: '◎',
    description: 'Goal-oriented, action-focused, accountability',
    accent: '#f9b96a',
    accentBg: 'rgba(249, 185, 106, 0.08)',
    accentBorder: 'rgba(249, 185, 106, 0.25)',
  },
  companion: {
    label: 'Companion',
    icon: '○',
    description: 'Casual, warm, active listening',
    accent: '#a89ec8',
    accentBg: 'rgba(168, 158, 200, 0.08)',
    accentBorder: 'rgba(168, 158, 200, 0.25)',
  },
}

export default function Sidebar({ mode, onModeChange, memories, messageCount }) {
  const { profile, signOut } = useAuth()
  const [memoriesExpanded, setMemoriesExpanded] = useState(false)
  const currentMode = MODE_CONFIG[mode]

  const messagesToNextSynthesis = 20 - (messageCount % 20)

  return (
    <aside className="w-72 flex-shrink-0 flex flex-col h-full sidebar-glow bg-obsidian-900 border-r border-white/[0.04]">
      {/* Logo */}
      <div className="px-6 pt-7 pb-5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <span className="text-ember-400 text-xl">◈</span>
          <span className="font-display text-2xl font-light tracking-widest text-ember-300">
            Solace
          </span>
        </div>
        {profile && (
          <p className="mt-2 text-xs text-ember-400/40 font-body italic">
            Good to have you back, {profile.name.split(' ')[0]}
          </p>
        )}
      </div>

      {/* Mode Switcher */}
      <div className="px-4 py-5 border-b border-white/[0.04]">
        <p className="px-2 mb-3 text-xs font-mono text-ember-400/40 tracking-widest uppercase">
          Mode
        </p>
        <div className="space-y-1.5">
          {Object.entries(MODE_CONFIG).map(([key, cfg]) => {
            const isActive = mode === key
            return (
              <button
                key={key}
                onClick={() => onModeChange(key)}
                className="w-full flex items-start gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-left group"
                style={{
                  background: isActive ? cfg.accentBg : 'transparent',
                  border: `1px solid ${isActive ? cfg.accentBorder : 'transparent'}`,
                }}
              >
                <span
                  className="text-lg mt-0.5 leading-none flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ color: isActive ? cfg.accent : 'rgba(232,221,208,0.3)' }}
                >
                  {cfg.icon}
                </span>
                <div>
                  <p
                    className="text-sm font-body font-medium transition-colors duration-200"
                    style={{ color: isActive ? cfg.accent : 'rgba(232,221,208,0.55)' }}
                  >
                    {cfg.label}
                  </p>
                  <p
                    className="text-xs mt-0.5 leading-tight transition-colors duration-200"
                    style={{ color: isActive ? `${cfg.accent}99` : 'rgba(232,221,208,0.25)' }}
                  >
                    {cfg.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Long-term Memories */}
      <div className="px-4 py-4 border-b border-white/[0.04] flex-1 overflow-hidden flex flex-col">
        <button
          onClick={() => setMemoriesExpanded((v) => !v)}
          className="flex items-center justify-between w-full px-2 mb-2 group"
        >
          <div className="flex items-center gap-2">
            <Brain size={12} className="text-ember-400/50" />
            <span className="text-xs font-mono text-ember-400/40 tracking-widest uppercase">
              Memories
            </span>
            {memories.length > 0 && (
              <span className="text-xs bg-ember-500/15 text-ember-400/70 px-1.5 py-0.5 rounded-full font-mono">
                {memories.length}
              </span>
            )}
          </div>
          {memories.length > 0 && (
            memoriesExpanded
              ? <ChevronUp size={12} className="text-ember-400/30" />
              : <ChevronDown size={12} className="text-ember-400/30" />
          )}
        </button>

        {memories.length === 0 ? (
          <p className="px-2 text-xs text-ember-400/25 italic leading-relaxed">
            Solace will begin building memories as you chat. They appear here after each session.
          </p>
        ) : (
          <div className={clsx('overflow-y-auto space-y-2 transition-all', memoriesExpanded ? 'max-h-64' : 'max-h-20')}>
            {memories.map((m, i) => (
              <div
                key={m.id}
                className="px-3 py-2.5 rounded-lg bg-obsidian-800/60 border border-white/[0.04]"
              >
                <p className="text-xs text-ember-200/50 leading-relaxed line-clamp-3">
                  {m.summary}
                </p>
                {m.emotional_tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {m.emotional_tags.split(',').slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono text-ember-400/40 bg-ember-500/8 border border-ember-500/15 px-1.5 py-0.5 rounded-full"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Memory synthesis progress */}
        {messageCount > 0 && (
          <div className="mt-3 px-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={10} className="text-ember-400/30" />
              <p className="text-[10px] font-mono text-ember-400/25 uppercase tracking-wider">
                Next synthesis in {messagesToNextSynthesis} msg{messagesToNextSynthesis !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="h-0.5 rounded-full bg-obsidian-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-ember-500/40 transition-all duration-500"
                style={{ width: `${((messageCount % 20) / 20) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Profile & Sign Out */}
      <div className="px-4 py-4">
        {profile && (
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-obsidian-800/40 border border-white/[0.04]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-ember-500/20 border border-ember-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-ember-300 font-display">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ember-200/70 font-body truncate">{profile.name}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="text-ember-400/30 hover:text-ember-400/70 transition-colors ml-2 flex-shrink-0"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}