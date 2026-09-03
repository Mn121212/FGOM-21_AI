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

  // Key visibility toggles
  const [showKey, setShowKey] = useState(false);

  // Testing Key State
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);

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

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto text-right"
    >
      <div
        id="settings-modal"
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100">
                إعدادات الذكاء الاصطناعي والمفاتيح (API Keys)
              </h2>
              <p className="text-xs text-neutral-400">
                اختر الذكاء الاصطناعي الذي تريده وأدخل مفتاحك الخاص لتفعيله مباشرة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-sm text-neutral-300">
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
