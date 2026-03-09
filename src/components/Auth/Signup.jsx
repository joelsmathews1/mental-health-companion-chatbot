import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowRight, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react'

const STEPS = [
  { title: 'Create your account',    subtitle: 'Begin your journey with Solace' },
  { title: 'Tell us about yourself', subtitle: 'This helps Solace understand you better' },
  { title: 'Your daily patterns',    subtitle: 'So Solace can meet you where you are' },
  { title: 'Your support profile',   subtitle: 'Solace remembers what helps you' },
]

export default function SignUp({ onSwitchToLogin }) {
  const { refetchProfile } = useAuth()
  const [step,        setStep]        = useState(0)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', name: '', age: '', gender: '',
    sleep_schedule: '', triggers: '', coping_mechanisms: '',
  })

  const update = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError('') }

  function validate() {
    if (step === 0) {
      if (!form.email || !form.password) return 'Please enter your email and a password.'
      if (form.password.length < 8) return 'Password must be at least 8 characters.'
    }
    if (step === 1 && !form.name) return 'Please enter your name.'
    return null
  }

  function next() {
    const err = validate()
    if (err) return setError(err)
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else submit()
  }

  async function submit() {
    setLoading(true); setError('')
    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email: form.email, password: form.password,
      })
      if (authErr) throw authErr
      const userId = data.user?.id
      if (!userId) throw new Error('Sign up succeeded but no user ID returned.')

      const { error: profileErr } = await supabase.from('profiles').insert({
        id: userId,
        name: form.name.trim(),
        age: form.age ? parseInt(form.age, 10) : null,
        gender: form.gender || null,
        sleep_schedule: form.sleep_schedule || null,
        triggers: form.triggers || null,
        coping_mechanisms: form.coping_mechanisms || null,
      })
      if (profileErr) throw profileErr
      await refetchProfile()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
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
        </div>

        <div className="panel-inset rounded-2xl p-8">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-ember-500' : 'bg-obsidian-700'}`}
                  style={{ width: `${90 / STEPS.length}%` }} />
              ))}
            </div>
            <p className="text-xs text-ember-400/60 font-mono">Step {step + 1} of {STEPS.length}</p>
          </div>

          <div className="mb-7">
            <h2 className="font-display text-2xl font-light text-ember-100 mb-1">{STEPS[step].title}</h2>
            <p className="text-sm text-ember-300/50">{STEPS[step].subtitle}</p>
          </div>

          <div className="space-y-4">
            {step === 0 && <>
              <Field label="Email address">
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com" className="solace-input" autoFocus />
              </Field>
              <Field label="Password">
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="At least 8 characters" className="solace-input pr-10" />
                  <button type="button" onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ember-400/40 hover:text-ember-400/70 transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            </>}

            {step === 1 && <>
              <Field label="Your first name">
                <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)}
                  placeholder="What should Solace call you?" className="solace-input" autoFocus />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Age (optional)">
                  <input type="number" value={form.age} onChange={(e) => update('age', e.target.value)}
                    placeholder="e.g. 28" min="13" max="120" className="solace-input" />
                </Field>
                <Field label="Gender (optional)">
                  <select value={form.gender} onChange={(e) => update('gender', e.target.value)} className="solace-input">
                    <option value="">Prefer not to say</option>
                    <option value="woman">Woman</option>
                    <option value="man">Man</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
              </div>
            </>}

            {step === 2 && <>
              <Field label="Sleep schedule (optional)" hint="When do you usually sleep and wake?">
                <input type="text" value={form.sleep_schedule} onChange={(e) => update('sleep_schedule', e.target.value)}
                  placeholder="e.g. 11pm – 7am, irregular" className="solace-input" autoFocus />
              </Field>
              <Field label="Things that tend to trigger you (optional)" hint="Solace will be mindful of these">
                <textarea value={form.triggers} onChange={(e) => update('triggers', e.target.value)}
                  placeholder="e.g. loud criticism, crowded places, Sunday evenings..."
                  rows={3} className="solace-input resize-none" />
              </Field>
            </>}

            {step === 3 && (
              <Field label="Coping mechanisms that work for you (optional)" hint="Solace may suggest these when you're overwhelmed">
                <textarea value={form.coping_mechanisms} onChange={(e) => update('coping_mechanisms', e.target.value)}
                  placeholder="e.g. going for a walk, journaling, box breathing..."
                  rows={4} className="solace-input resize-none" autoFocus />
              </Field>
            )}
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-400/80 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>
          )}

          <div className="flex items-center justify-between mt-8">
            {step > 0
              ? <button onClick={() => setStep((s) => s - 1)} className="flex items-center gap-2 text-sm text-ember-400/50 hover:text-ember-400/80 transition-colors">
                  <ArrowLeft size={14} /> Back
                </button>
              : <button onClick={onSwitchToLogin} className="text-sm text-ember-400/50 hover:text-ember-400/80 transition-colors">
                  Sign in instead
                </button>
            }
            <button onClick={next} disabled={loading}
              className="flex items-center gap-2 bg-ember-500 hover:bg-ember-600 disabled:opacity-50 text-obsidian-950 font-medium text-sm px-6 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-ember-500/20">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Creating…</>
                : step === STEPS.length - 1 ? 'Begin with Solace'
                : <>Continue <ArrowRight size={14} /></>}
            </button>
          </div>

          {step >= 2 && (
            <p className="text-center mt-4 text-xs text-ember-400/30">All fields on this step are optional</p>
          )}
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
        .solace-input option { background: #0d1117; }
      `}</style>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-mono text-ember-400/60 mb-1.5 tracking-wider uppercase">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-ember-300/30">{hint}</p>}
    </div>
  )
}