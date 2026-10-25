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
  Upload,
  Image,
  RotateCcw,
  ServerOff,
} from "lucide-react";
import { AppSettings, ModelInfo, AIProviderId, CustomApiKeys } from "../types";
import { AI_PROVIDERS } from "../data/providers";
import { StorySection } from "./StorySection";
import { BrandLogo, getStoredCustomLogo, setStoredCustomLogo } from "./BrandLogo";

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

  // Active Tab: Support (default as requested), Keys, Site Policy, or Founder Story
  const [activeTab, setActiveTab] = useState<"keys" | "support" | "privacy" | "story" | "branding">("keys");
  const [customLogoNotice, setCustomLogoNotice] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("حجم ملف الشعار كبير جداً. يرجى اختيار صورة أقل من 2 ميغابايت.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setStoredCustomLogo(dataUrl);
      setCustomLogoNotice("تم اعتماد وتطبيق شعارك الخاص بنجاح على كامل الموقع!");
      setTimeout(() => setCustomLogoNotice(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setStoredCustomLogo(null);
    setCustomLogoNotice("تمت استعادة الشعار الافتراضي للموقع بنجاح!");
    setTimeout(() => setCustomLogoNotice(null), 3000);
  };

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
  const [ticketName, setTicketName] = useState("");
  const [ticketSubject, setTicketSubject] = useState("مشكلة تقنية في تشغيل الكود");
  const [ticketContact, setTicketContact] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [isSendingTicket, setIsSendingTicket] = useState(false);

  const handleSendTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim() || !ticketContact.trim()) return;

    setIsSendingTicket(true);

    // Primary: Submit via server backend (relays to Formspree xdearyyg)
    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ticketName,
          email: ticketContact,
          subject: ticketSubject,
          message: ticketMessage,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTicketSuccess(data.ticketId || "TKT-" + Date.now().toString().slice(-6));
        setTicketMessage("");
        setTicketName("");
        setTicketContact("");
        setIsSendingTicket(false);
        return;
      }
    } catch (_) {}

    // Fallback: Direct Formspree AJAX submission from browser
    try {
      const ticketId = "TKT-" + Date.now().toString().slice(-6) + "-" + Math.floor(100 + Math.random() * 900);
      const fsRes = await fetch("https://formspree.io/f/xdearyyg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          name: ticketName || "مستخدم FGOM21 AI",
          email: ticketContact,
          subject: ticketSubject,
          message: ticketMessage,
          ticketId,
          _subject: `[FGOM21 AI Support] ${ticketSubject} — ${ticketId}`,
        }),
      });

      if (fsRes.ok) {
        setTicketSuccess(ticketId);
        setTicketMessage("");
        setTicketName("");
        setTicketContact("");
      } else {
        const errData = await fsRes.json().catch(() => ({}));
        alert(errData.error || "تعذر إرسال التذكرة إلى Formspree. يرجى التأكد من صحة البريد الإلكتروني.");
      }
    } catch (err) {
      alert("تعذر الاتصال بخدمة Formspree. تحقق من الاتصال بالإنترنت ثم أعد المحاولة.");
    } finally {
      setIsSendingTicket(false);
    }
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
      id: "branding" as const,
      label: "شعار الموقع",
      icon: Image,
      title: "تخصيص شعار وهوية المنصة",
      subtitle: "ارفع شعارك الخاص ليتم اعتماده وتطبيقه في كامل أرجاء المنصة فوراً وبسهولة",
      badge: "شعار مخصص",
      accent: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
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
    {
      id: "story" as const,
      label: "قصة التأسيس",
      icon: Sparkles,
      title: "قصة التأسيس ورؤية FGOM21 AI",
      subtitle: "قصة المطور الفردي، شغف البرمجة، ومعمارية الخصوصية المطلقة بدون قواعد بيانات مركزية",
      badge: "قصة المطور",
      accent: "text-[#00E676] bg-emerald-500/10 border-emerald-500/20",
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
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h2 className="text-sm sm:text-base font-extrabold text-neutral-100">
                  {currentTabInfo.title}
                </h2>
                <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-neutral-800 text-[#00E676] border border-emerald-500/30 shrink-0">
                  {currentTabInfo.badge}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 leading-relaxed">
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

        {/* Tab Navigation - Fully Responsive Horizontal Scrollable Container */}
        <div className="px-2 sm:px-6 py-2 border-b border-neutral-800/80 bg-neutral-950/60 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-800/90 text-xs overflow-x-auto no-scrollbar max-w-full">
            {modalTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-max shrink-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2.5 sm:px-3 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? "text-emerald-400" : "text-neutral-400"}`} />
                  <span className="whitespace-nowrap font-bold text-[10px] sm:text-xs md:text-sm leading-none">{tab.label}</span>
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

            {/* Responsive AI Providers Grid: Single column on Mobile for crystal-clear readability, 2-Column Grid on Desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3" dir="rtl">
              {AI_PROVIDERS.map((provider) => {
                const isSelected = selectedProvider === provider.id;
                const isBuiltin = provider.id === "builtin";

                const hasKeySaved =
                  isBuiltin ||
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
                    className={`text-right p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 relative cursor-pointer ${
                      isBuiltin ? "col-span-1 sm:col-span-2 shadow-xs" : "col-span-1"
                    } ${
                      isSelected
                        ? "bg-emerald-950/40 border-emerald-500/70 shadow-xs shadow-emerald-900/30"
                        : "bg-neutral-950/80 border-neutral-800/90 hover:bg-neutral-900 hover:border-neutral-700"
                    }`}
                    dir="rtl"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {renderProviderIcon(provider.icon)}
                        <span className="font-extrabold text-xs text-neutral-100 font-sans">
                          {provider.name}
                        </span>
                      </div>

                      {hasKeySaved ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00E676] font-bold flex items-center gap-1 shrink-0 border border-emerald-500/30">
                          <Check className="w-2.5 h-2.5" />
                          {isBuiltin ? "مدمج ✓" : "مفعّل"}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-sans shrink-0">
                          {provider.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed break-words text-right mt-0.5">
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
              <h3 className="font-bold text-sm text-neutral-100">نظام المراسلة والدعم الفني المباشر (24/7)</h3>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                أرسل استفسارك أو تذكرتك البرمجية مباشرة من هنا دون الخروج من المنصة. تُسجل الرسائل وتُوجه فورياً لفريق المطورين.
              </p>
            </div>
          </div>

          {/* Feature Badges Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <Send className="w-4 h-4" />
                <span>إرسال مباشر من داخل المنصة</span>
              </div>
              <span className="text-xs text-neutral-300">بدون فتح برامج إضافية أو بريد خارجي</span>
              <span className="text-[10px] text-emerald-400/80 mt-0.5">تواصل آمن ومحمي بالكامل</span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>تتبع وسرعة الاستجابة</span>
              </div>
              <span className="text-xs text-neutral-300">يتم إنشاء رقم تذكرة فريد فورياً</span>
              <span className="text-[10px] text-teal-400/80 mt-0.5">متابعة دقيقة واستجابة سريعة</span>
            </div>
          </div>

          {/* Interactive Support Ticket Submission Form */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-neutral-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>إرسال تذكرة دعم فني أو استفسار مباشر:</span>
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                مباشر
              </span>
            </div>

            {ticketSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم إرسال تذكرتك بنجاح! رقم التذكرة: <span className="font-mono text-white bg-emerald-900/60 px-2 py-0.5 rounded">{ticketSuccess}</span></span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  تم تسجيل رسالتك بنجاح في المنصة وتوجيهها مباشرة إلى الدعم. سيتم مراجعة طلبك والتواصل معك عبر بريدك الإلكتروني المدخل.
                </p>
                <button
                  type="button"
                  onClick={() => setTicketSuccess(null)}
                  className="text-[11px] text-emerald-400 font-bold hover:underline pt-1 cursor-pointer block"
                >
                  + إرسال رسالة أو تذكرة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendTicket} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-300 mb-1">الاسم الكامل:</label>
                    <input
                      type="text"
                      required
                      placeholder="اكتب اسمك الكود أو الكامل..."
                      value={ticketName}
                      onChange={(e) => setTicketName(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-300 mb-1">البريد الإلكتروني للرد عليك:</label>
                    <input
                      type="email"
                      required
                      placeholder="مثال: user@domain.com"
                      value={ticketContact}
                      onChange={(e) => setTicketContact(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-300 mb-1">نوع التذكرة / الموضوع:</label>
                    <select
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-3.5 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer text-right"
                      dir="rtl"
                    >
                      <option value="مشكلة تقنية في تشغيل الكود">مشكلة تقنية في تشغيل الكود</option>
                      <option value="استفسار حول مفاتيح الذكاء الاصطناعي">استفسار حول مفاتيح الذكاء الاصطناعي</option>
                      <option value="اقتراح ميزة أو أداة جديدة">اقتراح ميزة أو أداة جديدة</option>
                      <option value="استفسار برمجي عام">استفسار برمجي عام</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">تفاصيل الرسالة أو الاستفسار:</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="اشرح استفسارك بالتفصيل أو ضع الأكواد أو المشكلة التي واجهتك..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingTicket || !ticketMessage.trim() || !ticketContact.trim()}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-emerald-950/40"
                >
                  {isSendingTicket ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري إرسال التذكرة للمطور...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال التذكرة الآن (مباشر من المنصة)</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 3. Privacy Policy & Terms Tab */}
      {activeTab === "privacy" && (
        <div className="space-y-4 animate-in fade-in duration-150 text-xs text-neutral-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-neutral-900 border border-emerald-500/30 space-y-2">
            <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>ميثاق الخصوصية والسياسة الأمنية في FGOM21 AI 🇸🇦</span>
            </h3>
            <div className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#00E676] font-bold border border-emerald-500/30 inline-block mb-1">
              🇸🇦 منصة وبرمجة سعودية 100% | حماية سيادية تامة
            </div>
            <p className="text-neutral-400 text-xs">
              تاريخ آخر تحديث: 2026 | سياسة صارمة تحمي أمان الأكواد والملفات والمفاتيح لكل مطور ومستخدم.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3.5">
            <div>
              <h4 className="font-bold text-neutral-100 mb-1 flex items-center gap-1.5 text-xs text-emerald-400">
                <Lock className="w-3.5 h-3.5" />
                <span>1. معمارية انعدام قواعد البيانات تماماً (Zero-Database Architecture)</span>
              </h4>
              <p className="text-neutral-400 text-xs leading-relaxed">
                الموقع لا يحتوي على أي قواعد بيانات مركزية إطلاقاً لحفظ المستخدمين أو المحادثات أو الأكواد. كل شيء يبقى محلياً في متصفحك الشخصي عبر (LocalStorage) فقط ولا يغادر جهازك. انعدام قواعد البيانات = انعدام مخاطر تسريب البيانات 100%.
              </p>
            </div>

            <div className="border-t border-neutral-900 pt-3">
              <h4 className="font-bold text-neutral-100 mb-1 flex items-center gap-1.5 text-xs text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
                <span>2. انعدام تخزين الصور والملفات نهائياً ولا تجسس (Zero File Storage & Anti-Spyware)</span>
              </h4>
              <p className="text-neutral-400 text-xs leading-relaxed">
                عند رفع صور أو ملفات برمجية لتحليلها، تتم المعالجة اللحظية في الذاكرة المؤقتة للمتصفح فقط دون حفظ. لا نقوم برفع أو حفظ أي صورة أو ملف على أي خوادم تخزين، والموقع خالي 100% من أي برمجيات تجسس أو تتبع (No Spyware, No Telemetry, Zero Cookies).
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

          {/* Moved FAQ Accordion into Privacy Tab */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
            <h4 className="font-bold text-xs text-neutral-200 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>الأسئلة الشائعة والسياسة التقنية (FAQ & Policy):</span>
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

      {/* 4. Custom Branding & Logo Tab */}
      {activeTab === "branding" && (
        <div className="space-y-4 animate-in fade-in duration-150 text-xs text-neutral-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 border border-amber-500/30 space-y-2">
            <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-1.5">
              <Image className="w-4 h-4 text-amber-400" />
              <span>تخصيص شعار وهوية المنصة بالكامل</span>
            </h3>
            <p className="text-neutral-400 text-xs">
              يمكنك رفع شعارك الخاص (PNG, JPG, SVG, WebP) ليظهر فوراً في الشريط العلوي، القائمة الجانبية، شاشة البداية، وأيقونات المحادثة.
            </p>
          </div>

          {customLogoNotice && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{customLogoNotice}</span>
            </div>
          )}

          <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-5">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-700/80 shadow-inner flex flex-col items-center gap-2">
                <span className="text-[11px] text-neutral-400 font-bold">معاينة الشعار الحالي:</span>
                <BrandLogo size="xl" />
              </div>

              <div className="space-y-3 flex-1 text-center sm:text-right">
                <h4 className="font-bold text-neutral-100 text-sm">
                  اختر صورة الشعار من جهازك:
                </h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  يفضل استخدام صورة مربعة واضحة (بدقة 512x512 أو 256x256). سيتم حفظها محلياً في متصفحك وتطبيقها مباشرة على كافة أجزاء الموقع.
                </p>

                <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start pt-1">
                  <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-emerald-950 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>رفع شعار جديد من الجهاز</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs transition-colors cursor-pointer border border-neutral-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                    <span>استعادة الشعار الافتراضي</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-900 pt-3 text-[11px] text-neutral-400 space-y-1">
              <span className="font-bold text-neutral-300 block">💡 طريقة بديلة للمطورين:</span>
              <p>
                يمكنك أيضاً استبدال ملف الصورة مباشرة بوضع شعارك في مجلد المشروع باسم:
                <code className="text-emerald-400 mx-1 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 font-mono">public/logo.png</code>
                أو
                <code className="text-emerald-400 mx-1 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 font-mono">public/logo.jpg</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Founder & Platform Story Tab */}
      {activeTab === "story" && (
        <StorySection />
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

