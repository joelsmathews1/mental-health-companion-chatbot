import { useState } from "react";
import { auth, userData } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { setProfile } = useAuth();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [sleep, setSleep] = useState("");
  const [triggers, setTriggers] = useState("");
  const [coping, setCoping] = useState("");
  const [agentStyle, setAgentStyle] = useState("Companion");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = credentials, 2 = profile

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    setLoading(true);
    setError("");
    try {
      const { data, error: signUpError } = await auth.signUp(email, password);
      if (signUpError) throw signUpError;

      const saved = await userData.create(data.user.id, {
        name, email, age, gender, sleep, triggers, coping,
        agent_style: agentStyle,
      });
      setProfile(saved);
    } catch (err) {
      setError(err.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data, error: signInError } = await auth.signIn(email, password);
      if (signInError) throw signInError;
      const profile = await userData.getByAuthId(data.user.id);
      setProfile(profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-mark">◎</span>
          <span className="logo-text">Solace</span>
        </div>

        {isSignUp ? (
          <form onSubmit={handleSignUp} className="auth-form">
            <h2 className="auth-title">{step === 1 ? "Begin your journey" : "Tell us about you"}</h2>
            <p className="auth-subtitle">{step === 1 ? "A space to breathe, reflect, and grow." : "Help Solace understand you better."}</p>

            {step === 1 && (
              <>
                <div className="field-group">
                  <label className="field-label">Email<span className="required">*</span></label>
                  <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="field-group">
                  <label className="field-label">Password<span className="required">*</span></label>
                  <input className="field-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="field-group">
                  <label className="field-label">Name<span className="required">*</span></label>
                  <input className="field-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="What should we call you?" required />
                </div>
                <div className="two-col">
                  <div className="field-group">
                    <label className="field-label">Age</label>
                    <input className="field-input" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 25" />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Gender</label>
                    <select className="field-input" value={gender} onChange={e => setGender(e.target.value)}>
                      <option value="">Select...</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Non-binary</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">Sleep Schedule</label>
                  <input className="field-input" type="text" value={sleep} onChange={e => setSleep(e.target.value)} placeholder="e.g. 11PM - 7AM" />
                </div>
                <div className="field-group">
                  <label className="field-label">Triggers</label>
                  <input className="field-input" type="text" value={triggers} onChange={e => setTriggers(e.target.value)} placeholder="e.g. work stress, social anxiety" />
                </div>
                <div className="field-group">
                  <label className="field-label">Coping Mechanisms</label>
                  <input className="field-input" type="text" value={coping} onChange={e => setCoping(e.target.value)} placeholder="e.g. music, walking, journaling" />
                </div>
                <div className="field-group">
                  <label className="field-label">Companion Style</label>
                  <div className="gender-options">
                    {["Therapist", "Coach", "Companion"].map(s => (
                      <button key={s} type="button"
                        className={`gender-btn ${agentStyle === s ? "selected" : ""}`}
                        onClick={() => setAgentStyle(s)}>
                        {s === "Therapist" ? "🌿 Therapist" : s === "Coach" ? "⚡ Coach" : "☕ Companion"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Setting up..." : step === 1 ? "Continue →" : "Enter Solace →"}
            </button>
            {step === 2 && (
              <button type="button" className="auth-toggle" onClick={() => setStep(1)}>← Back</button>
            )}
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="auth-form">
            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-subtitle">Your companion is waiting.</p>
            <div className="field-group">
              <label className="field-label">Email</label>
              <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <input className="field-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        )}

        <button className="auth-toggle" onClick={() => { setIsSignUp(!isSignUp); setError(""); setStep(1); }}>
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
        </button>
      </div>
    </div>
  );
}