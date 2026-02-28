import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── AUTH ─────────────────────────────────────────────────────

export const auth = {
  async signUp(email, password) {
    return supabase.auth.signUp({ email, password });
  },

  async signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  async getSession() {
    return supabase.auth.getSession();
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ─── USER DATA (matches MongoDB user_data) ────────────────────

export const userData = {
  async create(authId, data) {
    const { data: row, error } = await supabase
      .from("user_data")
      .insert({ auth_id: authId, ...data })
      .select()
      .single();
    if (error) throw error;
    return row;
  },

  async getByAuthId(authId) {
    const { data, error } = await supabase
      .from("user_data")
      .select("*")
      .eq("auth_id", authId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateAgentStyle(authId, agentStyle) {
    const { error } = await supabase
      .from("user_data")
      .update({ agent_style: agentStyle })
      .eq("auth_id", authId);
    if (error) throw error;
  },
};

// ─── CHAT LOGS (matches MongoDB user_chat_logs) ───────────────

export const chatLogs = {
  async getMessages(userId) {
    const { data, error } = await supabase
      .from("user_chat_logs")
      .select("messages")
      .eq("user_id", userId)
      .single();
    if (error && error.code === "PGRST116") return [];
    if (error) throw error;
    return data?.messages || [];
  },

  async appendMessage(userId, message) {
    const { data, error } = await supabase
      .from("user_chat_logs")
      .select("id, messages")
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      const { error: insertError } = await supabase
        .from("user_chat_logs")
        .insert({ user_id: userId, messages: [message] });
      if (insertError) throw insertError;
    } else {
      const updated = [...(data.messages || []), message];
      const { error: updateError } = await supabase
        .from("user_chat_logs")
        .update({ messages: updated })
        .eq("user_id", userId);
      if (updateError) throw updateError;
    }
  },

  async clear(userId) {
    const { error } = await supabase
      .from("user_chat_logs")
      .update({ messages: [] })
      .eq("user_id", userId);
    if (error) throw error;
  },
};

// ─── MEMORIES (matches MongoDB user_memories) ─────────────────

export const userMemories = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from("user_memories")
      .select("memories")
      .eq("user_id", userId)
      .single();
    if (error && error.code === "PGRST116") return [];
    if (error) throw error;
    return data?.memories || [];
  },

  async append(userId, memory) {
    const { data, error } = await supabase
      .from("user_memories")
      .select("id, memories")
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      const { error: insertError } = await supabase
        .from("user_memories")
        .insert({ user_id: userId, memories: [memory] });
      if (insertError) throw insertError;
    } else {
      const updated = [...(data.memories || []), memory];
      const { error: updateError } = await supabase
        .from("user_memories")
        .update({ memories: updated })
        .eq("user_id", userId);
      if (updateError) throw updateError;
    }
  },

  async delete(userId, memory) {
    const existing = await this.getAll(userId);
    const updated = existing.filter((m) => m !== memory);
    const { error } = await supabase
      .from("user_memories")
      .update({ memories: updated })
      .eq("user_id", userId);
    if (error) throw error;
  },
};