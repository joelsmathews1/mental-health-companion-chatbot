import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { sendMessageStream, synthesizeMemory, PERSONAS } from "../services/gemini";
import { chatLogs, userMemories } from "../services/supabase";

const MEMORY_SYNTHESIS_INTERVAL = 20;

function MessageBubble({ message, isStreaming }) {
  const isUser = message.role === "user";
  return (
    <div className={`message-row ${isUser ? "message-row-user" : "message-row-ai"}`}>
      {!isUser && <div className="ai-avatar">◎</div>}
      <div className={`bubble ${isUser ? "bubble-user" : "bubble-ai"}`}>
        <p className="bubble-text">
          {message.content}
          {isStreaming && <span className="cursor-blink">▍</span>}
        </p>
      </div>
      {isUser && <div className="user-dot" />}
    </div>
  );
}

function ModeHeader({ mode }) {
  const persona = PERSONAS[mode] || PERSONAS.companion;
  return (
    <div className={`mode-header mode-header-${persona.color}`}>
      <span className="mode-header-icon">{persona.icon}</span>
      <span className="mode-header-label">{persona.label}</span>
      <span className="mode-header-divider">·</span>
      <span className="mode-header-desc">
        {mode === "therapist" && "Validation, exploration, mindfulness"}
        {mode === "coach" && "Goals, accountability, action"}
        {mode === "companion" && "Active listening, warmth, presence"}
      </span>
    </div>
  );
}

export default function ChatWindow({ mode, onModeChange }) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [memories, setMemories] = useState([]);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Load chat history and memories on mount
  useEffect(() => {
    if (!profile) return;
    loadHistory();
    loadMemories();
  }, [profile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  async function loadHistory() {
    try {
      const msgs = await chatLogs.getMessages(profile.id);
      // Convert flat string array to message objects
      const parsed = msgs.map(m => ({
        role: m.startsWith("User:") ? "user" : "model",
        content: m.replace(/^User: |^Sera: /, ""),
      }));
      setMessages(parsed);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }

  async function loadMemories() {
    try {
      const mems = await userMemories.getAll(profile.id);
      setMemories(mems);
    } catch (err) {
      console.error("Failed to load memories:", err);
    }
  }

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 160) + "px"; }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMsg = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setStreamingContent("");

    // Log user message to DB (matching Serenity format)
    try {
      await chatLogs.appendMessage(profile.id, `User: ${trimmed}`);
    } catch (err) { console.error(err); }

    // Get AI response
    let fullResponse = "";
    try {
      fullResponse = await sendMessageStream({
        message: trimmed,
        mode,
        profile,
        conversationHistory: updatedMessages,
        memories,
        onChunk: (_chunk, full) => setStreamingContent(full),
        onComplete: (text) => { setStreamingContent(""); fullResponse = text; },
      });
    } catch (err) {
      fullResponse = "I'm having a little trouble right now. Please try again.";
    }

    const aiMsg = { role: "model", content: fullResponse };
    const finalMessages = [...updatedMessages, aiMsg];
    setMessages(finalMessages);
    setStreamingContent("");
    setIsLoading(false);

    // Log AI response to DB
    try {
      await chatLogs.appendMessage(profile.id, `Sera: ${fullResponse}`);
    } catch (err) { console.error(err); }

    // Memory synthesis every N messages
    if (finalMessages.length % MEMORY_SYNTHESIS_INTERVAL === 0) {
      triggerMemorySynthesis(finalMessages);
    }
  }, [input, isLoading, messages, mode, profile, memories]);

  const triggerMemorySynthesis = async (msgs) => {
    setIsSynthesizing(true);
    try {
      const result = await synthesizeMemory(msgs, profile.name);
      if (result?.summary) {
        await userMemories.append(profile.id, result.summary);
        await loadMemories();
      }
    } catch (err) { console.error(err); }
    finally { setIsSynthesizing(false); }
  };

  const isEmpty = messages.length === 0 && !streamingContent;
  const firstName = profile?.name?.split(" ")[0] || "there";

  return (
    <div className="chat-window">
      <ModeHeader mode={mode} />
      <div className="messages-container">
        {isEmpty ? (
          <div className="empty-state">
            <div className="empty-orb" />
            <h3 className="empty-title">Hello, {firstName}</h3>
            <p className="empty-subtitle">
              {mode === "therapist" && "What's weighing on your mind today?"}
              {mode === "coach" && "What would you like to work toward today?"}
              {mode === "companion" && "How are you doing? I'm here."}
            </p>
            <div className="empty-suggestions">
              {getSuggestions(mode).map(s => (
                <button key={s} className="suggestion-chip" onClick={() => setInput(s)}>{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => <MessageBubble key={i} message={msg} isStreaming={false} />)}
            {isLoading && streamingContent && (
              <MessageBubble message={{ role: "model", content: streamingContent }} isStreaming={true} />
            )}
            {isLoading && !streamingContent && (
              <div className="message-row message-row-ai">
                <div className="ai-avatar">◎</div>
                <div className="bubble bubble-ai bubble-loading">
                  <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
                </div>
              </div>
            )}
          </>
        )}
        {isSynthesizing && (
          <div className="memory-badge">
            <span className="memory-badge-dot" /> Synthesizing memory...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind..."
            className="chat-input"
            rows={1}
            disabled={isLoading}
          />
          <button
            className={`send-btn ${input.trim() && !isLoading ? "send-btn-active" : ""}`}
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >↑</button>
        </div>
        <p className="input-hint">Shift + Enter for new line · Solace is not a replacement for professional care</p>
      </div>
    </div>
  );
}

function getSuggestions(mode) {
  const s = {
    therapist: ["I've been feeling overwhelmed lately", "I want to explore why I react this way", "I'm struggling with a relationship"],
    coach: ["Help me build a better morning routine", "I want to set a goal for this week", "I keep procrastinating on something important"],
    companion: ["I just need to talk to someone", "Today was really hard", "I'm feeling a bit lost"],
  };
  return s[mode] || s.companion;
}