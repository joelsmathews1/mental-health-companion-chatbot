import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function Login({ onSwitchToSignUp }) {
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (err) {
      setError(err.message || 'Unable to sign in. Check your credentials.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-obsidian-950 bg-obsidian-mesh flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-ember-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3">
            <span className="text-ember-400 text-3xl">◈</span>
            <span className="font-display text-4xl font-light tracking-widest text-ember-300">Solace</span>
          </div>
          <p className="mt-3 text-sm text-ember-400/40 italic">Welcome back</p>
        </div>

        <div className="panel-inset rounded-2xl p-8">
          <h2 className="font-display text-2xl font-light text-ember-100 mb-6">Sign in to Solace</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-ember-400/60 mb-1.5 tracking-wider uppercase">Email</label>
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }}
                placeholder="you@example.com" required className="solace-input" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-mono text-ember-400/60 mb-1.5 tracking-wider uppercase">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="Your password" required className="solace-input pr-10" />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ember-400/40 hover:text-ember-400/70 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400/80 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>
            )}

            <div className="pt-2">
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-ember-500 hover:bg-ember-600 disabled:opacity-50 text-obsidian-950 font-medium text-sm px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-ember-500/20">
                {loading ? <><Loader2 size={14} className="animate-spin" /> Signing in…</> : 'Enter Solace'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button onClick={onSwitchToSignUp} className="text-sm text-ember-400/50 hover:text-ember-400/80 transition-colors">
              New here? Create your account
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .solace-input {
          width: 100%; background: rgba(8,10,14,0.6);
          border: 1px solid rgba(245,158,58,0.15); border-radius: 0.75rem;
          padding: 0.625rem 0.875rem; color: #e8ddd0;
          font-family: 'Source Serif 4', Georgia, serif; font-size: 0.875rem;
          transition: border-color 0.2s, box-shadow 0.2s; outline: none;
        }
        .solace-input::placeholder { color: rgba(232,221,208,0.25); }
        .solace-input:focus { border-color: rgba(245,158,58,0.4); box-shadow: 0 0 0 3px rgba(245,158,58,0.08); }
      `}</style>
    </div>
  )
}