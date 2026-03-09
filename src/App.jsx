import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import SignUp from './components/Auth/SignUp'
import Login from './components/Auth/Login'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import { useChat } from './hooks/useChat'

function AuthGate() {
  const [showSignUp, setShowSignUp] = useState(true)
  return showSignUp
    ? <SignUp onSwitchToLogin={() => setShowSignUp(false)} />
    : <Login onSwitchToSignUp={() => setShowSignUp(true)} />
}

function MainApp() {
  const { user, profile } = useAuth()
  const chat = useChat({ user, profile })

  return (
    <div className="flex h-screen overflow-hidden bg-obsidian-950">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-ember-500/4 blur-3xl rounded-full" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-lavender-500/3 blur-3xl rounded-full" />
      </div>
      <div className="relative z-10 flex w-full h-full">
        <Sidebar
          mode={chat.mode}
          onModeChange={chat.setMode}
          memories={chat.memories}
          messageCount={chat.messageCount}
        />
        <main className="flex-1 flex flex-col min-w-0">
          <ChatWindow
            messages={chat.messages}
            isTyping={chat.isTyping}
            isSynthesizing={chat.isSynthesizing}
            streamingContent={chat.streamingContent}
            error={chat.error}
            mode={chat.mode}
            onSend={chat.sendUserMessage}
            profile={profile}
          />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-ember-400 text-4xl animate-pulse">◈</span>
          <p className="text-ember-400/30 font-mono text-xs tracking-widest">SOLACE</p>
        </div>
      </div>
    )
  }

  return session ? <MainApp /> : <AuthGate />
}