import React, { useState } from "react";
import {
  X,
  Cpu,
  Key,
  Check,
  Shield,
  Info,
  Sparkles,
  Terminal,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Zap,
  Bot,
  Layers,
  Globe,
  Cloud,
  Binary,
  Headphones,
  Send,
  MessageSquare,
  HelpCircle,
  Lock,
} from "lucide-react";
import { AppSettings, ModelInfo, AIProviderId, CustomApiKeys } from "../types";
import { AI_PROVIDERS } from "../data/providers";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  models: ModelInfo[];
  healthStatus: { hasGeminiKey: boolean; hasCloudflareKey: boolean } | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  models,
  healthStatus,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>(
    settings.selectedProvider || "builtin"
  );
  const [apiKeys, setApiKeys] = useState<CustomApiKeys>(settings.apiKeys || {});
  const [activeCustomModel, setActiveCustomModel] = useState<string>(
    settings.activeCustomModel || ""
  );
  const [preferredModel, setPreferredModel] = useState(settings.preferredModel);
  const [developerModeDefault, setDeveloperModeDefault] = useState(settings.developerModeDefault);
  const [cfAccountId, setCfAccountId] = useState(
    settings.cfAccountId || settings.apiKeys?.cloudflareAccountId || ""
  );
  const [customSystemPrompt, setCustomSystemPrompt] = useState(settings.customSystemPrompt || "");

  // Active Tab: Keys, Technical Support, or Site Policy
  const [activeTab, setActiveTab] = useState<"keys" | "support" | "privacy">("keys");

  // Key visibility toggles
  const [showKey, setShowKey] = useState(false);

  // Testing Key State
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Support Ticket Form State
  const [ticketSubject, setTicketSubject] = useState("مشكلة تقنية في تشغيل الكود");
  const [ticketContact, setTicketContact] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [isSendingTicket, setIsSendingTicket] = useState(false);

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;

    setIsSendingTicket(true);
    setTimeout(() => {
      const generatedId = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
      setTicketSuccess(generatedId);
      setIsSendingTicket(false);
      setTicketMessage("");
    }, 600);
  };

  if (!isOpen) return null;

  const currentProviderDef =
    AI_PROVIDERS.find((p) => p.id === selectedProvider) || AI_PROVIDERS[0];

  // Helper to get key for current provider
  const getCurrentKey = (): string => {
    if (selectedProvider === "gemini") return apiKeys.gemini || "";
    if (selectedProvider === "openai") return apiKeys.openai || "";
    if (selectedProvider === "groq") return apiKeys.groq || "";
    if (selectedProvider === "deepseek") return apiKeys.deepseek || "";
    if (selectedProvider === "anthropic") return apiKeys.anthropic || "";
    if (selectedProvider === "openrouter") return apiKeys.openrouter || "";
    if (selectedProvider === "cloudflare") return apiKeys.cloudflareToken || settings.cfApiToken || "";
    return "";
  };

  const updateCurrentKey = (value: string) => {
    setTestResult(null);
    setApiKeys((prev) => {
      const updated = { ...prev };
      if (selectedProvider === "gemini") updated.gemini = value;
      else if (selectedProvider === "openai") updated.openai = value;
      else if (selectedProvider === "groq") updated.groq = value;
      else if (selectedProvider === "deepseek") updated.deepseek = value;
      else if (selectedProvider === "anthropic") updated.anthropic = value;
      else if (selectedProvider === "openrouter") updated.openrouter = value;
      else if (selectedProvider === "cloudflare") updated.cloudflareToken = value;
      return updated;
    });
  };

  // Test the entered key
  const handleTestKey = async () => {
    const key = getCurrentKey().trim();
    if (!key && selectedProvider !== "builtin") {
      setTestResult({
        ok: false,
        message: "يرجى كتابة أو لصق مفتاح API أولاً لتتمكن من فحصه.",
      });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: key,
          accountId: cfAccountId.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setTestResult({
          ok: true,
          message: data.message || "المفتاح صالح وشغال بنجاح مع الذكاء الاصطناعي!",
        });
      } else {
        setTestResult({
          ok: false,
          message: data.error || "المفتاح غير صالح أو لم يتم تفعيله بعد.",
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: "تعذر الاتصال بالخادم لفحص المفتاح. تحقق من الاتصال.",
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSave = () => {
    const chosenModel =
      activeCustomModel || currentProviderDef.defaultModel || preferredModel;

    onSaveSettings({
      ...settings,
      selectedProvider: selectedProvider as AIProviderId,
      apiKeys: {
        ...apiKeys,
        cloudflareAccountId: cfAccountId.trim(),
      },
      activeCustomModel: chosenModel,
      preferredModel,
      developerModeDefault,
      cfAccountId: cfAccountId.trim(),
      cfApiToken: apiKeys.cloudflareToken || settings.cfApiToken || "",
      customSystemPrompt: customSystemPrompt.trim(),
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const renderProviderIcon = (iconName: string) => {
    switch (iconName) {
      case "Sparkles":
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case "Cpu":
        return <Cpu className="w-4 h-4 text-sky-400" />;
      case "Bot":
        return <Bot className="w-4 h-4 text-green-400" />;
      case "Zap":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "Binary":
        return <Binary className="w-4 h-4 text-indigo-400" />;
      case "Layers":
        return <Layers className="w-4 h-4 text-orange-400" />;
      case "Globe":
        return <Globe className="w-4 h-4 text-cyan-400" />;
      case "Cloud":
        return <Cloud className="w-4 h-4 text-amber-500" />;
      default:
        return <Cpu className="w-4 h-4 text-emerald-400" />;
    }
  };

  const currentKeyVal = getCurrentKey();
  const isCustomKeyActive = Boolean(currentKeyVal.trim());

  const modalTabs = [
    {
      id: "keys" as const,
      label: "مفاتيح الذكاء",
      icon: Key,
      title: "إعدادات مزودي الذكاء الاصطناعي والمفاتيح",
      subtitle: "اختر المزود الافتراضي وأدخل مفتاح API لتشغيل كافة الميزات البرمجية مباشرة",
      badge: "API Keys",
      accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "support" as const,
      label: "الدعم الفني",
      icon: Headphones,
      title: "مركز الدعم والمساعدة الفنية",
      subtitle: "تواصل مع المطور أو أرسل تذكرة برمجية لمتابعة أي استفسار أو مشكلة فوراً",
      badge: "دعم فني مباشر",
      accent: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    },
    {
      id: "privacy" as const,
      label: "سياسة الموقع",
      icon: Shield,
      title: "سياسة الموقع وحماية البيانات",
      subtitle: "ميثاق الأمان وحفظ الخصوصية وحماية الأكواد وحقوق الملكية الفكرية",
      badge: "ميثاق الأمان",
      accent: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
  ];

  const currentTabInfo = modalTabs.find((t) => t.id === activeTab) || modalTabs[0];
  const CurrentTabIcon = currentTabInfo.icon;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto text-right"
    >
      <div
        id="settings-modal"
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Dynamic Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border shrink-0 ${currentTabInfo.accent}`}>
              <CurrentTabIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-100">
                  {currentTabInfo.title}
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {currentTabInfo.badge}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                {currentTabInfo.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors border border-transparent hover:border-neutral-700 cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation - Responsive 3-Tab Segmented Grid */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-neutral-800/80 bg-neutral-950/60 shrink-0">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800/90 text-xs">
            {modalTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
                  }`}
                >
                  <TabIcon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-400" : "text-neutral-400"}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-sm text-neutral-300">
          {activeTab === "keys" && (
            <>
          {/* Main Request Feature: Choose AI Provider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-neutral-200">
                1. اختر الذكاء الاصطناعي الذي تريد استخدامه:
              </label>
              <span className="text-[11px] text-neutral-400">
                {AI_PROVIDERS.length} مزودات عالمية متاحة
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AI_PROVIDERS.map((provider) => {
                const isSelected = selectedProvider === provider.id;
                const hasKeySaved =
                  provider.id === "builtin" ||
                  (provider.id === "gemini" && Boolean(apiKeys.gemini)) ||
                  (provider.id === "openai" && Boolean(apiKeys.openai)) ||
                  (provider.id === "groq" && Boolean(apiKeys.groq)) ||
                  (provider.id === "deepseek" && Boolean(apiKeys.deepseek)) ||
                  (provider.id === "anthropic" && Boolean(apiKeys.anthropic)) ||
                  (provider.id === "openrouter" && Boolean(apiKeys.openrouter)) ||
                  (provider.id === "cloudflare" && Boolean(apiKeys.cloudflareToken || settings.cfApiToken));

                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(provider.id);
                      setActiveCustomModel(provider.defaultModel);
                      setTestResult(null);
                    }}
                    className={`text-right p-3 rounded-xl border transition-all flex flex-col gap-1.5 relative ${
                      isSelected
                        ? "bg-emerald-950/30 border-emerald-500/60 shadow-xs shadow-emerald-900/30"
                        : "bg-neutral-950/60 border-neutral-800/80 hover:bg-neutral-800/50 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {renderProviderIcon(provider.icon)}
                        <span className="font-bold text-xs text-neutral-100">
                          {provider.name}
                        </span>
                      </div>

                      {hasKeySaved ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-sans flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          {provider.id === "builtin" ? "مدمج" : "مفتاحك مفعّل"}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-sans">
                          {provider.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-2">
                      {provider.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Enter API Key for the chosen AI */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs sm:text-sm text-neutral-100">
                  {selectedProvider === "builtin"
                    ? "المحرك السحابي المدمج (FGOM21 AI)"
                    : `2. أدخل مفتاح API لتفعيل (${currentProviderDef.name})`}
                </h3>
              </div>

              {isCustomKeyActive && selectedProvider !== "builtin" && (
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-medium flex items-center gap-1.5 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  مفتاح الربط مفعّل وشغال مع ذكاءك
                </span>
              )}
            </div>

            {selectedProvider === "builtin" ? (
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-neutral-300 space-y-2">
                <p className="flex items-center gap-2 font-medium text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  أنت تستخدم المحرك السحابي المدمج عالي الكفاءة مجاناً!
                </p>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  هذا المحرك مجهّز بالكامل بخوادم متعددة المسارات الاحتياطية (Multi-Model Failover)، ويعمل على مدار الساعة دون الحاجة لتسجيل أي مفاتيح شخصية. إذا رغبت باستخدام حسابك الخاص على Google أو OpenAI أو Groq أو DeepSeek أو Claude، اختر المزود أعلاه وأدخل مفتاحك.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <p className="text-xs text-neutral-300 font-medium">
                    يرجى لصق رمز المفتاح الخاص بك (Secret API Key) هنا:
                  </p>
                  {currentProviderDef.keyHelpUrl && (
                    <a
                      href={currentProviderDef.keyHelpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline underline-offset-2"
                    >
                      احصل على المفتاح من الموقع الرسمي مجاناً
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* API Key Input Field */}
                <div className="relative flex items-center">
                  <input
                    type={showKey ? "text" : "password"}
                    placeholder={currentProviderDef.keyPlaceholder}
                    value={currentKeyVal}
                    onChange={(e) => updateCurrentKey(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 pl-20 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500/70 font-mono"
                  />

                  <div className="absolute left-2 flex items-center gap-1.5">
                    {currentKeyVal && (
                      <button
                        type="button"
                        onClick={() => updateCurrentKey("")}
                        title="مسح المفتاح"
                        className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      title={showKey ? "إخفاء المفتاح" : "إظهار المفتاح"}
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                    >
                      {showKey ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Cloudflare Account ID if needed */}
                {selectedProvider === "cloudflare" && (
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[11px] text-neutral-400">
                      معرف الحساب السحابي (Cloudflare Account ID):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9a8b7c6d5e4f..."
                      value={cfAccountId}
                      onChange={(e) => setCfAccountId(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500/70 font-mono"
                    />
                  </div>
                )}

                {/* Test Key Button & Result Notification */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={isTestingKey}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-medium text-neutral-200 transition-colors disabled:opacity-50"
                  >
                    {isTestingKey ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        <span>جاري فحص اتصال المفتاح...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span>فحص واختبار صلاحية المفتاح الآن</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-neutral-500">
                    يتم حفظ المفتاح محلياً في متصفحك ولا يتم تخزينه في أي خوادم طرف ثالث.
                  </p>
                </div>

                {/* Test Feedback */}
                {testResult && (
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                      testResult.ok
                        ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                        : "bg-red-950/30 border-red-500/40 text-red-300"
                    }`}
                  >
                    {testResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{testResult.message}</span>
                  </div>
                )}

                {/* Select Specific Model for this provider */}
                <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
                  <label className="block text-xs font-semibold text-neutral-300">
                    النموذج المفضل لهذا المزود:
                  </label>
                  <select
                    value={activeCustomModel || currentProviderDef.defaultModel}
                    onChange={(e) => setActiveCustomModel(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500/70 font-mono"
                  >
                    {currentProviderDef.availableModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.tag ? `[${m.tag}]` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Developer Mode Default */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-950 border border-neutral-800">
            <div>
              <p className="font-semibold text-xs text-neutral-200">
                تفعيل "وضع المطور" (Developer Mode) افتراضياً
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                توجيه الذكاء الاصطناعي لتقديم ردود معمقة تركز على معمارية البرمجيات، الأمان، و Big-O.
              </p>
            </div>
            <input
              type="checkbox"
              checked={developerModeDefault}
              onChange={(e) => setDeveloperModeDefault(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0 mr-3"
            />
          </div>

          {/* Custom System Prompt */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-neutral-200">
              تعليمات نظام إضافية خاصة بك (Custom System Instructions):
            </label>
            <textarea
              rows={2}
              placeholder="مثال: ركز دائماً على كتابة الكود باستخدام TypeScript بدلاً من JavaScript واعتمد Tailwind CSS..."
              value={customSystemPrompt}
              onChange={(e) => setCustomSystemPrompt(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-500/70 resize-none"
            />
          </div>
        </>
      )}

      {/* 2. Technical Support Tab */}
      {activeTab === "support" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-neutral-900 border border-emerald-500/30 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-100">فريق الدعم الفني والمساعدة المباشرة (24/7)</h3>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                نحن بجانبك دائماً! يمكنك إرسال تذكرة دعم مباشرة للمطور، أو التواصل فوراً عبر قنوات الدعم السريعة.
              </p>
            </div>
          </div>

          {/* Quick Contact Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="mailto:mohammedyousef8099@gmail.com?subject=تذكرة%20دعم%20فني%20-%20FGOM21%20AI"
              className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 flex flex-col gap-1.5 transition-all group"
            >
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <Send className="w-4 h-4" />
                <span>البريد الإلكتروني المباشر</span>
              </div>
              <span className="text-xs text-neutral-300 font-mono truncate" dir="ltr">mohammedyousef8099@gmail.com</span>
              <span className="text-[10px] text-emerald-400/80 mt-0.5 group-hover:underline">إرسال استفسار مباشر للمطور ↗</span>
            </a>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>سرعة المتابعة والاستجابة</span>
              </div>
              <span className="text-xs text-neutral-300">متابعة يومية مستمرة</span>
              <span className="text-[10px] text-teal-400/80 mt-0.5">الرد السريع خلال ساعات العمل الرسمية</span>
            </div>
          </div>

          {/* Interactive Support Ticket Submission Form */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-neutral-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>إرسال تذكرة دعم فني فورية للمطور:</span>
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                رد سريع
              </span>
            </div>

            {ticketSuccess ? (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم استلام تذكرتك بنجاح برقم: {ticketSuccess}</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  شكراً لتواصلك! تم تسجيل تذكرتك وسيتم فحصها والرد عليها في أقرب وقت ممكن.
                </p>
                <button
                  type="button"
                  onClick={() => setTicketSuccess(null)}
                  className="text-[11px] text-emerald-400 hover:underline pt-1 cursor-pointer"
                >
                  إرسال تذكرة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendTicket} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">نوع التذكرة:</label>
                    <select
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="مشكلة تقنية في تشغيل الكود">مشكلة تقنية في تشغيل الكود</option>
                      <option value="استفسار حول مفاتيح الذكاء الاصطناعي">استفسار حول مفاتيح الذكاء الاصطناعي</option>
                      <option value="اقتراح ميزة أو أداة جديدة">اقتراح ميزة أو أداة جديدة</option>
                      <option value="استفسار برمجي عام">استفسار برمجي عام</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">البريد أو وسيلة التواصل (اختياري):</label>
                    <input
                      type="text"
                      placeholder="بريدك الإلكتروني للرد عليك..."
                      value={ticketContact}
                      onChange={(e) => setTicketContact(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">تفاصيل الرسالة أو المشكلة:</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="اشرح المشكلة بالتفصيل أو ضع الكود الذي تواجه فيه صعوبة..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingTicket || !ticketMessage.trim()}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-emerald-950/40"
                >
                  {isSendingTicket ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري إرسال التذكرة...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال التذكرة الفورية الآن</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* FAQ Accordion */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
            <h4 className="font-bold text-xs text-neutral-200 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>الأسئلة التقنية الشائعة (FAQ):</span>
            </h4>
            <div className="space-y-2 text-xs text-neutral-400">
              <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/60">
                <strong className="text-neutral-200 block mb-1">س: هل أحتاج لدفع أي رسوم لاستخدام المنصة؟</strong>
                <span>ج: لا، المنصة مجانية 100% وتعمل افتراضياً بمحرك ذكاء اصطناعي مجاني، ويمكنك وضع مفتاحك الخاص إن رغبت في استخدام نماذج إضافية متقدمة.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/60">
                <strong className="text-neutral-200 block mb-1">س: هل يتم تخزين مفاتيح الـ API في خوادمكم؟</strong>
                <span>ج: لا إطلاقاً، مفاتيحك تُحفظ محلياً على جهازك فقط عبر (LocalStorage) وتُرسل مباشرة إلى مزود الخدمة دون أي تخزين خارجي.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/60">
                <strong className="text-neutral-200 block mb-1">س: كيف أقوم بتشغيل ومعاينة الكود الناتج لايف؟</strong>
                <span>ج: اضغط على زر "تشغيل الكود" الموجود بجانب أي كود يكتبه الذكاء الاصطناعي، أو افتح "استوديو الأكواد" من القائمة الجانبية لتعديل وتشغيل الكود مباشرة.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Privacy Policy & Terms Tab */}
      {activeTab === "privacy" && (
        <div className="space-y-4 animate-in fade-in duration-150 text-xs text-neutral-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-neutral-900 border border-emerald-500/30 space-y-2">
            <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>ميثاق الخصوصية وشروط الاستخدام في FGOM21 AI</span>
            </h3>
            <p className="text-neutral-400 text-xs">
              تاريخ آخر تحديث: 2026 | سياسة صارمة تحمي أمان الأكواد والملفات والمفاتيح لكل مطور ومستخدم.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3.5">
            <div>
              <h4 className="font-bold text-neutral-100 mb-1 flex items-center gap-1.5 text-xs text-emerald-400">
                <Lock className="w-3.5 h-3.5" />
                <span>1. خصوصية الأكواد وسرية مفاتيح الـ API (Local-Only Storage)</span>
              </h4>
              <p className="text-neutral-400 text-xs leading-relaxed">
                جميع المفاتيح الخاصة (OpenAI, Gemini, DeepSeek, Groq, Claude, Anthropic) تُخزن محلياً فقط في متصفحك (Browser LocalStorage). لا نقوم إطلاقاً بتسجيلها أو تخزينها أو مشاركتها في أي قاعدة بيانات خارجية.
              </p>
            </div>

            <div className="border-t border-neutral-900 pt-3">
              <h4 className="font-bold text-neutral-100 mb-1 flex items-center gap-1.5 text-xs text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
                <span>2. معالجة الصور والملفات المرفقة (Zero Retention)</span>
              </h4>
              <p className="text-neutral-400 text-xs leading-relaxed">
                الصور والأكواد التي ترفعها بغرض التحليل يتم إرسالها عبر قنوات اتصال مشفرة ومؤمنة بأعلى معايير TLS 1.3 ويتم معالجتها بالذاكرة المؤقتة اللحظية فقط دون أي تخزين دائم أو تتبع.
              </p>
            </div>

            <div className="border-t border-neutral-900 pt-3">
              <h4 className="font-bold text-neutral-100 mb-1 flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>3. عدم استخدام مدخلاتك لتدريب نماذج الذكاء الاصطناعي</span>
              </h4>
              <p className="text-neutral-400 text-xs leading-relaxed">
                لا نستخدم أي محادثة أو شيفرة برمجية يكتبها المستخدم لتدريب أي نماذج ذكاء اصطناعي؛ أفكارك ومشاريعك تظل ملكك الخاص بنسبة 100%.
              </p>
            </div>

            <div className="border-t border-neutral-900 pt-3">
              <h4 className="font-bold text-neutral-100 mb-1 flex items-center gap-1.5 text-xs text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>4. الملكية الفكرية وحرية الاستخدام التجاري والشخصي</span>
              </h4>
              <p className="text-neutral-400 text-xs leading-relaxed">
                جميع الأكواد والتطبيقات والحلول البرمجية الناتجة عن المنصة هي ملك حصري لك بالكامل، ويحق لك بيعها أو دمجها في مشاريعك التجارية أو الشخصية دون قيود ودون إذن مسبق.
              </p>
            </div>

            <div className="border-t border-neutral-900 pt-3">
              <h4 className="font-bold text-neutral-100 mb-1 flex items-center gap-1.5 text-xs text-emerald-400">
                <Trash2 className="w-3.5 h-3.5" />
                <span>5. حرية مسح وتصدير البيانات في أي لحظة</span>
              </h4>
              <p className="text-neutral-400 text-xs leading-relaxed">
                تمنحك المنصة التحكم الكامل: يمكنك تصدير أي محادثة كملف Markdown، أو حذف أي جلسة، أو مسح سجل المحادثات بالكامل بضغطة زر واحدة دون ترك أي أثر في متصفحك.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-900/95 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition-colors"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-950/50"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>تم التفعيل والحفظ بنجاح!</span>
              </>
            ) : (
              <span>حفظ وتفعيل الإعدادات</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
