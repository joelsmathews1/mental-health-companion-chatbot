import { useAuth } from "../context/AuthContext";
import { auth, userData } from "../services/supabase";
import { PERSONAS } from "../services/gemini";
import { useState } from "react";

export default function Sidebar({ currentMode, onModeChange }) {
  const { profile, setProfile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await auth.signOut();
    setProfile(null);
  };

  const handleModeChange = async (mode) => {
    onModeChange(mode);
    // Persist preference to user_data table
    try {
      await userData.updateAgentStyle(profile.auth_id || profile.id, mode.charAt(0).toUpperCase() + mode.slice(1));
    } catch (err) { console.error(err); }
  };

  const initials = profile?.name
    ? profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-logo">
            <span className="sidebar-logo-mark">◎</span>
            <span className="sidebar-logo-text">Solace</span>
          </div>
        )}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="mode-section">
            <p className="sidebar-section-label">Mode</p>
            <div className="mode-switcher">
              {Object.entries(PERSONAS).map(([key, persona]) => (
                <button
                  key={key}
                  className={`mode-btn mode-btn-${persona.color} ${currentMode === key ? "mode-btn-active" : ""}`}
                  onClick={() => handleModeChange(key)}
                >
                  <span className="mode-icon">{persona.icon}</span>
                  <div className="mode-info">
                    <span className="mode-name">{persona.label}</span>
                    <span className="mode-desc">
                      {key === "therapist" && "Deep exploration"}
                      {key === "coach" && "Action & goals"}
                      {key === "companion" && "Warm presence"}
                    </span>
                  </div>
                  {currentMode === key && <span className="mode-active-dot" />}
                </button>
              ))}
            </div>
          </div>

          {profile && (
            <div className="mode-section" style={{ marginTop: "auto" }}>
              <p className="sidebar-section-label">Your Context</p>
              <div style={{ padding: "0 12px", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.8 }}>
                {profile.sleep && <div>🌙 {profile.sleep}</div>}
                {profile.triggers && <div>⚡ {profile.triggers.slice(0, 40)}{profile.triggers.length > 40 ? "..." : ""}</div>}
                {profile.coping && <div>🌿 {profile.coping.slice(0, 40)}{profile.coping.length > 40 ? "..." : ""}</div>}
              </div>
            </div>
          )}
        </>
      )}

      <div className="sidebar-footer">
        {!collapsed ? (
          <>
            <div className="user-info">
              <div className="user-avatar">{initials}</div>
              <div className="user-details">
                <span className="user-name">{profile?.name}</span>
                <span className="user-mode">{PERSONAS[currentMode]?.icon} {PERSONAS[currentMode]?.label}</span>
              </div>
            </div>
            <button className="signout-btn" onClick={handleSignOut} title="Sign out">⏻</button>
          </>
        ) : (
          <div className="user-avatar-sm">{initials}</div>
        )}
      </div>
    </aside>
  );
}