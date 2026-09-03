import { ChatSession, AppSettings } from "../types";

const SESSIONS_KEY = "fgom21_ai_sessions_v1";
const SETTINGS_KEY = "fgom21_ai_settings_v1";
const CURRENT_ID_KEY = "fgom21_ai_current_session_id";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  developerModeDefault: false,
  preferredModel: "llama-3.1-8b",
  selectedProvider: "builtin",
  apiKeys: {},
  activeCustomModel: "",
};

export function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse sessions from localStorage:", err);
    return [];
  }
}

export function saveSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error("Failed to save sessions to localStorage:", err);
  }
}

export function getCurrentSessionId(): string | null {
  return localStorage.getItem(CURRENT_ID_KEY);
}

export function setCurrentSessionId(id: string | null): void {
  if (id) {
    localStorage.setItem(CURRENT_ID_KEY, id);
  } else {
    localStorage.removeItem(CURRENT_ID_KEY);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save settings:", err);
  }
}

export function exportSessionMarkdown(session: ChatSession): void {
  let md = `# ${session.title}\n\n`;
  md += `> تاريخ المحادثة: ${new Date(session.createdAt).toLocaleString("ar-SA")}\n`;
  md += `> النموذج: ${session.model} | وضع المطور: ${session.developerMode ? "مفعّل" : "معطّل"}\n\n---\n\n`;

  session.messages.forEach((msg) => {
    const sender = msg.role === "user" ? "👤 المستخدم" : "🤖 FGOM21 AI";
    md += `### ${sender} (${new Date(msg.timestamp).toLocaleTimeString("ar-SA")})\n\n`;
    if (msg.files && msg.files.length > 0) {
      md += `*الملفات المرفقة: ${msg.files.map((f) => f.name).join(", ")}*\n\n`;
    }
    md += `${msg.content}\n\n---\n\n`;
  });

  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${session.title.replace(/\s+/g, "_")}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSessionJSON(session: ChatSession): void {
  const data = JSON.stringify(session, null, 2);
  const blob = new Blob([data], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${session.title.replace(/\s+/g, "_")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
