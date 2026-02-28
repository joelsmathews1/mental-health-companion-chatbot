import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

function AppInner() {
  const { profile, loading } = useAuth();
  const [currentMode, setCurrentMode] = useState("companion");

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">◎</div>
        <p>Solace</p>
      </div>
    );
  }

  if (!profile) return <AuthPage />;

  return (
    <div className="app-layout">
      <Sidebar currentMode={currentMode} onModeChange={setCurrentMode} />
      <main className="main-content">
        <ChatWindow mode={currentMode} onModeChange={setCurrentMode} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}