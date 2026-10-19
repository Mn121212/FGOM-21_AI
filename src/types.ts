export interface CodeFile {
  id: string;
  name: string;
  content: string;
  size: number;
  lines: number;
  language: string;
  isImage?: boolean;
  dataUrl?: string;
  mimeType?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  modelUsed?: string;
  developerMode?: boolean;
  files?: Array<{ name: string; size: number; language: string }>;
  isStreaming?: boolean;
  error?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  developerMode: boolean;
  messages: ChatMessage[];
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  badge: string;
  description: string;
  cfModel?: string | null;
}

export type ChatFontSize = "normal" | "large" | "xlarge";

export type AIProviderId =
  | "builtin"
  | "gemini"
  | "openai"
  | "groq"
  | "deepseek"
  | "anthropic"
  | "openrouter"
  | "cloudflare";

export interface CustomApiKeys {
  gemini?: string;
  openai?: string;
  groq?: string;
  deepseek?: string;
  anthropic?: string;
  openrouter?: string;
  cloudflareToken?: string;
  cloudflareAccountId?: string;
}

export interface AppSettings {
  theme: "dark" | "light";
  developerModeDefault: boolean;
  preferredModel: string;
  selectedProvider?: AIProviderId | string;
  apiKeys?: CustomApiKeys;
  activeCustomModel?: string;
  cfAccountId?: string;
  cfApiToken?: string;
  customSystemPrompt?: string;
}

export interface ProviderDefinition {
  id: AIProviderId;
  name: string;
  badge: string;
  icon: string;
  description: string;
  keyPlaceholder: string;
  keyHelpUrl: string;
  defaultModel: string;
  availableModels: Array<{ id: string; name: string; tag?: string }>;
}
