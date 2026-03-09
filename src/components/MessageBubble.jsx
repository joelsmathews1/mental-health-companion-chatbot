const MODE_ACCENTS = {
  therapist: { color: '#8bb8a4', label: 'Therapist' },
  coach:     { color: '#f9b96a', label: 'Coach' },
  companion: { color: '#a89ec8', label: 'Companion' },
}

export function TypingIndicator({ mode }) {
  const { color } = MODE_ACCENTS[mode] || MODE_ACCENTS.companion
  return (
    <div className="flex items-end gap-3 message-appear">
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs mb-1"
        style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}>◈</div>
      <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-sm bg-obsidian-800/80 border border-white/[0.05]">
        <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
      </div>
    </div>
  )
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const { color, label } = MODE_ACCENTS[message.mode] || MODE_ACCENTS.companion

  if (isUser) {
    return (
      <div className="flex justify-end message-appear">
        <div className="max-w-[75%]">
          <div className="px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed"
            style={{ background: 'rgba(245,158,58,0.1)', border: '1px solid rgba(245,158,58,0.15)', color: '#e8ddd0' }}>
            {message.content}
          </div>
          <p className="text-right text-[10px] text-ember-400/20 mt-1 font-mono">{fmt(message.created_at)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-3 message-appear">
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs mb-1"
        style={{ background: `${color}1a`, border: `1px solid ${color}40`, color }}>◈</div>
      <div className="max-w-[78%]">
        <p className="text-[10px] font-mono mb-1.5 tracking-wider uppercase" style={{ color: `${color}70` }}>
          Solace · {label}
        </p>
        <div className="px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed"
          style={{ background: 'rgba(20,25,33,0.9)', border: '1px solid rgba(255,255,255,0.05)', color: '#d8cec4' }}>
          {message.content.split('\n\n').map((p, i) => (
            <p key={i} className={i > 0 ? 'mt-3' : ''}>{p}</p>
          ))}
        </div>
        <p className="text-[10px] text-ember-400/20 mt-1 font-mono">{fmt(message.created_at)}</p>
      </div>
    </div>
  )
}

function fmt(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}