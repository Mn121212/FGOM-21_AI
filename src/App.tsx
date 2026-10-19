import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Send,
  Loader2,
  StopCircle,
  FileCode,
  ShieldAlert,
  ArrowDown,
  Sparkles,
  Info,
  Key,
} from "lucide-react";
import {
  ChatMessage as ChatMessageType,
  ChatSession,
  CodeFile,
  ModelInfo,
  AppSettings,
  ChatFontSize,
} from "./types";
import {
  loadSessions,
  saveSessions,
  getCurrentSessionId,
  setCurrentSessionId,
  loadSettings,
  saveSettings,
  exportSessionMarkdown,
} from "./utils/storage";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { ChatMessage } from "./components/ChatMessage";
import { FileUploadArea } from "./components/FileUploadArea";
import { FileViewerModal } from "./components/FileViewerModal";
import { PromptSuggestions } from "./components/PromptSuggestions";
import { SettingsModal } from "./components/SettingsModal";
import { CodeSandboxModal } from "./components/CodeSandboxModal";
import { AutonomousAgentModal } from "./components/AutonomousAgentModal";
import { SecurityAuditModal } from "./components/SecurityAuditModal";
import { GitHubInspectorModal } from "./components/GitHubInspectorModal";
import { SplashScreen } from "./components/SplashScreen";
import { OnboardingGuideModal } from "./components/OnboardingGuideModal";
import { AI_PROVIDERS } from "./data/providers";

const DEFAULT_MODELS: ModelInfo[] = [
  {
    id: "llama-3.1-8b",
    name: "Llama 3.1 8B",
    provider: "Cloudflare Workers AI",
    badge: "الأساسي / مجاني وسريع",
    description: "نموذج ميتا فائق السرعة والمثالي لحل المسائل البرمجية اليومية وكتابة الدوال بسرعة.",
  },
  {
    id: "qwen-2.5-coder",
    name: "Qwen 2.5 Coder",
    provider: "Alibaba Cloud / Cloudflare",
    badge: "متخصص الأكواد",
    description: "نموذج استثنائي في كتابة الشيفرات المعقدة، اختبارات الوحدة، وإعادة الهيكلة.",
  },
  {
    id: "mistral-7b",
    name: "Mistral 7B",
    provider: "Mistral AI",
    badge: "منطق دقيق",
    description: "نموذج ذو كفاءة ومنطق حسابي قوي في الخوارزميات وتحسين الأداء.",
  },
  {
    id: "kimi-code",
    name: "Kimi Code",
    provider: "Moonshot AI",
    badge: "مشاريع وسياق ضخم",
    description: "مخصص للمشاريع الكبيرة وتتبع تدفق البيانات وتحليل الملفات المتعددة.",
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "Google",
    badge: "أداء فائق واستقرار",
    description: "أحدث نماذج جوجل السريعة مع دقة تحليل عالية واستيعاب للملفات الكبيرة.",
  },
];

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [currentSessionId, setCurrentSessionIdState] = useState<string | null>(() =>
    getCurrentSessionId()
  );
  const [settings, setAppSettings] = useState<AppSettings>(() => loadSettings());
  const [models, setModels] = useState<ModelInfo[]>(DEFAULT_MODELS);
  const [activeModel, setActiveModel] = useState<string>(
    () => settings.preferredModel || "llama-3.1-8b"
  );
  const [developerMode, setDeveloperMode] = useState<boolean>(
    () => settings.developerModeDefault
  );
  const [fontSize, setFontSize] = useState<ChatFontSize>(() => {
    const saved = localStorage.getItem("fgom21_chat_font_size");
    if (saved === "normal" || saved === "large" || saved === "xlarge") {
      return saved as ChatFontSize;
    }
    return "large"; // Default to comfortable, large font size for clear reading
  });

  const handleFontSizeChange = (size: ChatFontSize) => {
    setFontSize(size);
    localStorage.setItem("fgom21_chat_font_size", size);
  };

  const [inputPrompt, setInputPrompt] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<CodeFile[]>([]);
  const [previewModalFile, setPreviewModalFile] = useState<CodeFile | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // ⚡ 4 Core Feature Modals State:
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [sandboxInitialCode, setSandboxInitialCode] = useState<{ html?: string; css?: string; js?: string }>({});
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem("fgom21_splash_viewed");
    } catch (_) {
      return false;
    }
  });

  const [healthStatus, setHealthStatus] = useState<{
    hasGeminiKey: boolean;
    hasCloudflareKey: boolean;
  } | null>(null);

  // Auto-launch platform guide for first-time visitors
  useEffect(() => {
    try {
      const guideSeen = localStorage.getItem("fgom21_guide_seen");
      if (!guideSeen) {
        const timer = setTimeout(() => {
          setGuideModalOpen(true);
        }, 2200);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, []);

  // List of AI keys that the user has entered in settings
  const enteredAIKeys = useMemo(() => {
    const list: {
      providerId: string;
      providerName: string;
      keyMask: string;
      isCurrent: boolean;
    }[] = [];

    const selectedProv = settings.selectedProvider || "builtin";

    if (settings.apiKeys?.gemini?.trim()) {
      const k = settings.apiKeys.gemini.trim();
      list.push({
        providerId: "gemini",
        providerName: "Google Gemini",
        keyMask: k.length > 8 ? `${k.slice(0, 5)}...${k.slice(-4)}` : "••••••••",
        isCurrent: selectedProv === "gemini",
      });
    }
    if (settings.apiKeys?.openai?.trim()) {
      const k = settings.apiKeys.openai.trim();
      list.push({
        providerId: "openai",
        providerName: "OpenAI (ChatGPT)",
        keyMask: k.length > 8 ? `${k.slice(0, 6)}...${k.slice(-4)}` : "••••••••",
        isCurrent: selectedProv === "openai",
      });
    }
    if (settings.apiKeys?.groq?.trim()) {
      const k = settings.apiKeys.groq.trim();
      list.push({
        providerId: "groq",
        providerName: "Groq",
        keyMask: k.length > 8 ? `${k.slice(0, 4)}...${k.slice(-4)}` : "••••••••",
        isCurrent: selectedProv === "groq",
      });
    }
    if (settings.apiKeys?.deepseek?.trim()) {
      const k = settings.apiKeys.deepseek.trim();
      list.push({
        providerId: "deepseek",
        providerName: "DeepSeek AI",
        keyMask: k.length > 8 ? `${k.slice(0, 4)}...${k.slice(-4)}` : "••••••••",
        isCurrent: selectedProv === "deepseek",
      });
    }
    if (settings.apiKeys?.anthropic?.trim()) {
      const k = settings.apiKeys.anthropic.trim();
      list.push({
        providerId: "anthropic",
        providerName: "Anthropic Claude",
        keyMask: k.length > 8 ? `${k.slice(0, 6)}...${k.slice(-4)}` : "••••••••",
        isCurrent: selectedProv === "anthropic",
      });
    }
    if (settings.apiKeys?.openrouter?.trim()) {
      const k = settings.apiKeys.openrouter.trim();
      list.push({
        providerId: "openrouter",
        providerName: "OpenRouter",
        keyMask: k.length > 8 ? `${k.slice(0, 7)}...${k.slice(-4)}` : "••••••••",
        isCurrent: selectedProv === "openrouter",
      });
    }
    const cfToken = (settings.apiKeys?.cloudflareToken || settings.cfApiToken || "").trim();
    if (cfToken) {
      list.push({
        providerId: "cloudflare",
        providerName: "Cloudflare Workers AI",
        keyMask: cfToken.length > 8 ? `${cfToken.slice(0, 4)}...${cfToken.slice(-4)}` : "••••••••",
        isCurrent: selectedProv === "cloudflare",
      });
    }

    return list;
  }, [settings.apiKeys, settings.cfApiToken, settings.selectedProvider]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync sessions to LocalStorage
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // Sync current session id to LocalStorage
  useEffect(() => {
    setCurrentSessionId(currentSessionId);
  }, [currentSessionId]);

  // Fetch backend models and health on mount
  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        if (data?.models && Array.isArray(data.models)) {
          setModels(data.models);
        }
      })
      .catch((err) => console.warn("Could not fetch models:", err));

    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setHealthStatus({
          hasGeminiKey: Boolean(data?.hasGeminiKey),
          hasCloudflareKey: Boolean(data?.hasCloudflareKey),
        });
      })
      .catch((err) => console.warn("Could not check health:", err))
      .finally(() => {
        setTimeout(() => setIsInitialLoading(false), 900);
      });
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        220
      )}px`;
    }
  }, [inputPrompt]);

  // Current session
  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // Scroll to bottom helper
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages.length, isLoading]);

  // Create new session
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: "محادثة برمجية جديدة",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: activeModel,
      developerMode,
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionIdState(newSession.id);
    setUploadedFiles([]);
    setInputPrompt("");
    if (textareaRef.current) textareaRef.current.focus();
  };

  // Delete a session
  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (currentSessionId === id) {
        setCurrentSessionIdState(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  };

  // Rename a session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  // Clear all sessions
  const handleClearAllSessions = () => {
    setSessions([]);
    setCurrentSessionIdState(null);
  };

  // Clear current chat
  const handleClearCurrentChat = () => {
    if (!currentSessionId) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === currentSessionId ? { ...s, messages: [] } : s))
    );
    setUploadedFiles([]);
  };

  // Save Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    saveSettings(newSettings);
    setActiveModel(newSettings.preferredModel);
    setDeveloperMode(newSettings.developerModeDefault);
  };

  // Send message
  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend && uploadedFiles.length === 0) return;
    if (isLoading) return;

    // Get or create active session
    let targetSessionId = currentSessionId;
    let targetSession = sessions.find((s) => s.id === targetSessionId);

    if (!targetSession) {
      const newSession: ChatSession = {
        id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: promptToSend.substring(0, 32) || "تحليل ملفات المشروع",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: activeModel,
        developerMode,
        messages: [],
      };
      setSessions((prev) => [newSession, ...prev]);
      targetSessionId = newSession.id;
      setCurrentSessionIdState(newSession.id);
      targetSession = newSession;
    } else if (targetSession.messages.length === 0 && targetSession.title === "محادثة برمجية جديدة") {
      // Auto-title from first user message
      const smartTitle = promptToSend.substring(0, 36) || "تحليل مشروع برمجي";
      handleRenameSession(targetSession.id, smartTitle);
    }

    const currentFiles = [...uploadedFiles];
    const userMessage: ChatMessageType = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: promptToSend || `تحليل ${currentFiles.length} ملفات برمجية مرفقة للمشروع.`,
      timestamp: Date.now(),
      files: currentFiles.map((f) => ({
        name: f.name,
        size: f.size,
        language: f.language,
      })),
    };

    const assistantMessageId = `msg-${Date.now()}-assistant`;
    const initialAssistantMessage: ChatMessageType = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      modelUsed: models.find((m) => m.id === activeModel)?.name || "Llama 3.1 8B",
      developerMode,
      isStreaming: true,
    };

    // Update session with new user message & empty streaming assistant message
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === targetSessionId) {
          return {
            ...s,
            updatedAt: Date.now(),
            messages: [...s.messages, userMessage, initialAssistantMessage],
          };
        }
        return s;
      })
    );

    setInputPrompt("");
    setUploadedFiles([]); // Clear attached files for next message
    setIsLoading(true);

    // Prepare payload for backend
    const conversationMessages = [
      ...(targetSession?.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: userMessage.content },
    ];

    abortControllerRef.current = new AbortController();

    try {
      // Resolve active provider and custom API key from user settings
      const currentProvider = settings.selectedProvider || "builtin";
      let currentCustomKey = "";
      if (currentProvider === "gemini") currentCustomKey = settings.apiKeys?.gemini || "";
      else if (currentProvider === "openai") currentCustomKey = settings.apiKeys?.openai || "";
      else if (currentProvider === "groq") currentCustomKey = settings.apiKeys?.groq || "";
      else if (currentProvider === "deepseek") currentCustomKey = settings.apiKeys?.deepseek || "";
      else if (currentProvider === "anthropic") currentCustomKey = settings.apiKeys?.anthropic || "";
      else if (currentProvider === "openrouter") currentCustomKey = settings.apiKeys?.openrouter || "";
      else if (currentProvider === "cloudflare") currentCustomKey = settings.apiKeys?.cloudflareToken || settings.cfApiToken || "";

      // Try streaming endpoint
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationMessages,
          model: activeModel,
          developerMode,
          provider: currentProvider,
          apiKey: currentCustomKey,
          customModel: settings.activeCustomModel || "",
          cfAccountId: settings.cfAccountId || settings.apiKeys?.cloudflareAccountId || "",
          files: currentFiles.map((f) => ({
            name: f.name,
            content: f.content,
            size: f.size,
            type: f.language,
            isImage: f.isImage,
            dataUrl: f.dataUrl,
            mimeType: f.mimeType,
          })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        let errDetails = "";
        try {
          const errJson = await response.json();
          errDetails = errJson.error || "";
        } catch (_) {}
        throw new Error(errDetails || `خطأ في استجابة الخادم (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let hasReceivedError = false;
      let finalModelName = "";

      // ✍️ Smooth Typewriter Character Queue (حرف حرف بسلاسة واحترافية)
      const charQueue: string[] = [];
      let displayedContent = "";
      let isNetworkStreamDone = false;
      let typewriterTimer: any = null;

      const finishTypingPromise = new Promise<void>((resolve) => {
        typewriterTimer = setInterval(() => {
          if (abortControllerRef.current?.signal.aborted) {
            clearInterval(typewriterTimer);
            resolve();
            return;
          }

          if (charQueue.length > 0) {
            // Write letter-by-letter smoothly. Dynamically adapt if queue has a burst
            const takeCount = charQueue.length > 120 ? 5 : charQueue.length > 40 ? 2 : 1;
            const nextLetters = charQueue.splice(0, takeCount).join("");
            displayedContent += nextLetters;

            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === targetSessionId) {
                  return {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMessageId
                        ? {
                            ...m,
                            content: displayedContent,
                            isStreaming: true,
                            modelUsed: finalModelName || m.modelUsed,
                          }
                        : m
                    ),
                  };
                }
                return s;
              })
            );

            // Auto-scroll seamlessly with the typed characters
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
          } else if (isNetworkStreamDone) {
            clearInterval(typewriterTimer);
            resolve();
          }
        }, 16); // ~60fps smooth letter-by-letter typewriter pace
      });

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const dataStr = trimmed.slice(5).trim();
          if (dataStr === "[DONE]") {
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              displayedContent = `⚠️ ${parsed.error}`;
              charQueue.length = 0;
              hasReceivedError = true;
              break;
            }
            if (parsed.text) {
              if (parsed.modelUsed) finalModelName = parsed.modelUsed;
              // Push characters into typewriter queue for natural smooth typing
              for (let i = 0; i < parsed.text.length; i++) {
                charQueue.push(parsed.text[i]);
              }
            }
          } catch (e) {
            // non-json chunk
          }
        }

        if (hasReceivedError) {
          break;
        }
      }

      // Mark network stream done and wait for remaining queued characters to type out smoothly
      isNetworkStreamDone = true;
      await finishTypingPromise;

      // Mark streaming as completed
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === targetSessionId) {
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content:
                        displayedContent ||
                        "تمت معالجة الطلب ولكن لم يتم إرجاع نص كافٍ.",
                      isStreaming: false,
                      error: hasReceivedError,
                      modelUsed: finalModelName || m.modelUsed,
                    }
                  : m
              ),
            };
          }
          return s;
        })
      );
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Chat generation stopped by user.");
      } else {
        console.error("Chat error:", err);
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === targetSessionId) {
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: `⚠️ عذراً، حدث خطأ أثناء معالجة الطلب: ${
                          err?.message || "يرجى المحاولة مجدداً."
                        }`,
                        isStreaming: false,
                        error: true,
                      }
                    : m
                ),
              };
            }
            return s;
          })
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Instant analyze for uploaded files
  const handleInstantAnalyze = () => {
    if (uploadedFiles.length === 0) return;
    const prompt = `قم بإجراء تدقيق وتحليل معماري فوري (Full Project Architecture & Security Audit) للملفات البرمجية المرفقة (${uploadedFiles.length} ملفات)، مع بيان نقاط القوة والضعف وأي ثغرات أمنية وحلول عملية.`;
    handleSendMessage(prompt);
  };

  // Regenerate last assistant response
  const handleRegenerate = () => {
    if (!currentSession || messages.length === 0 || isLoading) return;
    const lastUserIndex = messages.map((m) => m.role).lastIndexOf("user");
    if (lastUserIndex === -1) return;

    const lastUserMsg = messages[lastUserIndex];
    // Remove all messages after lastUserIndex
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            messages: s.messages.slice(0, lastUserIndex),
          };
        }
        return s;
      })
    );

    setTimeout(() => {
      handleSendMessage(lastUserMsg.content);
    }, 50);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans relative" dir="rtl">
      {/* Sidebar with Chat Sessions */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => setCurrentSessionIdState(id)}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onClearAllSessions={handleClearAllSessions}
        onOpenSettings={() => setSettingsModalOpen(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSandbox={() => setSandboxOpen(true)}
        onOpenAgent={() => setAgentModalOpen(true)}
        onOpenSecurity={() => setSecurityModalOpen(true)}
        onOpenGitHub={() => setGithubModalOpen(true)}
        onOpenGuide={() => setGuideModalOpen(true)}
      />

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-neutral-950">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
          models={models}
          selectedModel={activeModel}
          onSelectModel={(modelId) => setActiveModel(modelId)}
          developerMode={developerMode}
          onToggleDeveloperMode={() => setDeveloperMode(!developerMode)}
          chatTitle={currentSession?.title || "محادثة برمجية جديدة"}
          onExportMarkdown={() => currentSession && exportSessionMarkdown(currentSession)}
          onClearChat={handleClearCurrentChat}
          hasMessages={messages.length > 0}
          fontSize={fontSize}
          onChangeFontSize={handleFontSizeChange}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenGuide={() => setGuideModalOpen(true)}
          activeProviderName={
            AI_PROVIDERS.find((p) => p.id === settings.selectedProvider)?.name || "المحرك المدمج"
          }
          hasCustomKey={Boolean(
            (settings.selectedProvider === "gemini" && settings.apiKeys?.gemini) ||
            (settings.selectedProvider === "openai" && settings.apiKeys?.openai) ||
            (settings.selectedProvider === "groq" && settings.apiKeys?.groq) ||
            (settings.selectedProvider === "deepseek" && settings.apiKeys?.deepseek) ||
            (settings.selectedProvider === "anthropic" && settings.apiKeys?.anthropic) ||
            (settings.selectedProvider === "openrouter" && settings.apiKeys?.openrouter) ||
            (settings.selectedProvider === "cloudflare" && (settings.apiKeys?.cloudflareToken || settings.cfApiToken))
          )}
        />

        {/* Developer Mode Banner Notification */}
        {developerMode && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span>
                <strong>وضع المطور مفعّل:</strong> ستحصل على إجابات معمقة تركز على التصميم المعماري (Clean Architecture)، التدقيق الأمني (Security Audit)، وحساب تعقيد الـ Big-O.
              </span>
            </div>
          </div>
        )}

        {/* Chat Messages or Prompt Suggestions */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="min-h-full flex flex-col justify-center py-8">
              <PromptSuggestions
                onSelectPrompt={(prompt) => {
                  setInputPrompt(prompt);
                  textareaRef.current?.focus();
                }}
              />
            </div>
          ) : (
            <div className="divide-y divide-neutral-900 pb-8">
              {messages.map((message, idx) => {
                const isLast = idx === messages.length - 1;
                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    fontSize={fontSize}
                    onRunInSandbox={(code, lang) => {
                      if (lang === "css") {
                        setSandboxInitialCode({ html: `<div class="card">اختبار تنسيق CSS</div>`, css: code, js: "" });
                      } else if (lang === "javascript" || lang === "js" || lang === "ts") {
                        setSandboxInitialCode({
                          html: `<div id="app"></div>`,
                          css: `body { background: #0a0a0a; color: #fff; font-family: sans-serif; padding: 2rem; direction: rtl; }`,
                          js: code,
                        });
                      } else {
                        setSandboxInitialCode({ html: code, css: "", js: "" });
                      }
                      setSandboxOpen(true);
                    }}
                    onAuditSecurity={() => {
                      setSecurityModalOpen(true);
                    }}
                    onRegenerate={
                      isLast && message.role === "assistant" && !isLoading
                        ? handleRegenerate
                        : undefined
                    }
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input & File Upload Area */}
        <div className="border-t border-neutral-800 bg-neutral-950/95 p-4 sm:p-5 shrink-0">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* File Upload Zone / Attached Files */}
            <FileUploadArea
              files={uploadedFiles}
              onFilesChange={setUploadedFiles}
              onPreviewFile={(f) => setPreviewModalFile(f)}
              onInstantAnalyze={handleInstantAnalyze}
              disabled={isLoading}
            />

            {/* Input Box */}
            <div className="relative rounded-2xl border border-neutral-800 bg-neutral-900/90 focus-within:border-emerald-500/80 shadow-lg transition-all">
              <textarea
                ref={textareaRef}
                id="chat-input-textarea"
                rows={1}
                placeholder={
                  developerMode
                    ? "اكتب استفسارك البرمجي (وضع المطور نشط: تحليل أمني، معماري، كفاءة)..."
                    : "اطرح سؤالك البرمجي، اطلب كتابة كود، أو الصق دوال لتحليلها..."
                }
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                className={`w-full bg-transparent px-4 pr-4 pl-14 text-neutral-100 placeholder-neutral-500 focus:outline-none resize-none leading-relaxed transition-all ${
                  fontSize === "xlarge"
                    ? "text-lg sm:text-xl py-4"
                    : fontSize === "large"
                    ? "text-base sm:text-lg py-3.5"
                    : "text-sm sm:text-base py-3"
                }`}
              />

              {/* Action Buttons inside Textarea */}
              <div className="absolute left-2.5 bottom-2.5 flex items-center gap-1.5" dir="ltr">
                {isLoading ? (
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 transition-all flex items-center gap-1 text-xs"
                    title="إيقاف التوليد"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span className="hidden sm:inline font-sans">إيقاف</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    id="send-message-btn"
                    onClick={() => handleSendMessage()}
                    disabled={!inputPrompt.trim() && uploadedFiles.length === 0}
                    className={`p-2 rounded-xl transition-all ${
                      inputPrompt.trim() || uploadedFiles.length > 0
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50 cursor-pointer"
                        : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                    }`}
                    title="إرسال (Enter)"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Display Active Model and registered API Key ONLY if the user entered an AI key */}
            {enteredAIKeys.length > 0 && (
              <div className="flex flex-col gap-1.5 text-[11px] text-neutral-500 px-1 font-mono">
                <div className="flex items-center gap-2 flex-wrap font-sans">
                  <span>
                    النموذج النشط:{" "}
                    <strong className="text-neutral-200">
                      {models.find((m) => m.id === activeModel)?.name || activeModel}
                    </strong>
                  </span>
                </div>

                {/* Directly under Active Model: Display the entered AI API Key */}
                <div className="flex items-center gap-2 flex-wrap pt-0.5 font-sans">
                  <span className="text-neutral-400 flex items-center gap-1 text-[11px]">
                    <Key className="w-3 h-3 text-emerald-400 shrink-0" />
                    مفتاح الذكاء الاصطناعي المسجل:
                  </span>
                  {enteredAIKeys.map((item) => (
                    <span
                      key={item.providerId}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] transition-all ${
                        item.isCurrent
                          ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-medium shadow-sm shadow-emerald-950/40"
                          : "bg-neutral-900/90 border-neutral-800 text-neutral-400"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.isCurrent ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"
                        }`}
                      />
                      <span className="font-sans">{item.providerName}:</span>
                      <code className="font-mono text-[10px] px-1 py-0.5 bg-black/40 rounded text-neutral-200 dir-ltr">
                        {item.keyMask}
                      </code>
                      {item.isCurrent ? (
                        <span className="text-emerald-400 text-[10px] font-bold mr-0.5">
                          (المفعّل الآن ✓)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            handleSaveSettings({
                              ...settings,
                              selectedProvider: item.providerId,
                            });
                          }}
                          className="text-[10px] text-neutral-400 hover:text-emerald-300 underline cursor-pointer mr-0.5"
                          title="تفعيل هذا المفتاح والمزود"
                        >
                          تفعيل
                        </button>
                      )}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSettingsModalOpen(true)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer font-sans mr-1"
                    title="إدارة مفاتيح الذكاء الاصطناعي"
                  >
                    إدارة أو تغيير ⚙️
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* File Content Preview Modal */}
      <FileViewerModal
        file={previewModalFile}
        onClose={() => setPreviewModalFile(null)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        models={models}
        healthStatus={healthStatus}
      />

      {/* 1. ⚡ Live Code Sandbox & VS Code Runner Studio (Option 1) */}
      <CodeSandboxModal
        isOpen={sandboxOpen}
        onClose={() => setSandboxOpen(false)}
        initialHtml={sandboxInitialCode.html}
        initialCss={sandboxInitialCode.css}
        initialJs={sandboxInitialCode.js}
        onSendToChat={(prompt) => {
          handleSendMessage(prompt);
        }}
      />

      {/* 2. 🤖 Autonomous AI Coding Agent Modal */}
      <AutonomousAgentModal
        isOpen={agentModalOpen}
        onClose={() => setAgentModalOpen(false)}
        onOpenInSandbox={(html, css, js) => {
          setSandboxInitialCode({ html, css, js });
          setSandboxOpen(true);
        }}
        onSendToChat={(prompt) => {
          handleSendMessage(prompt);
        }}
      />

      {/* 3. 🛡️ AI Security Audit & Bug Scanner Modal */}
      <SecurityAuditModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        onApplyFixedCode={(code) => {
          setInputPrompt((prev) => (prev ? `${prev}\n\n${code}` : code));
        }}
        onOpenSandboxWithCode={(code) => {
          setSandboxInitialCode({ html: code });
          setSandboxOpen(true);
        }}
      />

      {/* 4. 🐙 GitHub Repository Inspector & Chat Modal */}
      <GitHubInspectorModal
        isOpen={githubModalOpen}
        onClose={() => setGithubModalOpen(false)}
        onStartRepoChat={(repo, prompt) => {
          handleSendMessage(prompt);
        }}
      />

      {/* 5. 🧭 Onboarding Guide Modal (Explaining What Every Button Does) */}
      <OnboardingGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        onOpenSandbox={() => setSandboxOpen(true)}
        onOpenAgent={() => setAgentModalOpen(true)}
        onOpenSecurity={() => setSecurityModalOpen(true)}
        onOpenGitHub={() => setGithubModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      {/* 6. 🚀 Cyber Splash Screen Loader */}
      {showSplash && (
        <SplashScreen
          onFinish={() => {
            setShowSplash(false);
            try {
              sessionStorage.setItem("fgom21_splash_viewed", "true");
            } catch (_) {}
          }}
        />
      )}
    </div>
  );
}
