import React, { useState, useEffect, useCallback } from "react";
import { 
  X, 
  GitBranch, 
  Rocket, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle,
  Search,
  ExternalLink,
  Calendar,
  Code2,
  Sparkles,
  Loader2,
  Info,
  Database
} from "lucide-react";
import { 
  HOSTING_PROVIDERS, 
  DATABASE_PROVIDERS,
  PROVIDER_METADATA, 
  type HostingProvider, 
  type DatabaseProvider,
  type GitHubRepository,
  type ConnectedAccountDisplay
} from "../types/deployment";
import { PlatformOAuthButton } from "./PlatformOAuthButton";
import { ConnectedAccountsList } from "./ConnectedAccountsList";

type HostingFlowStep = "connect-github" | "select-repo" | "select-platform" | "review";

interface HostingPublisherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploySuccess?: () => void;
}

export const HostingPublisherModal: React.FC<HostingPublisherModalProps> = ({
  isOpen,
  onClose,
  onDeploySuccess,
}) => {
  const [step, setStep] = useState<HostingFlowStep>("connect-github");
  const [githubAccount, setGithubAccount] = useState<ConnectedAccountDisplay | null>(null);
  const [hostingAccounts, setHostingAccounts] = useState<ConnectedAccountDisplay[]>([]);
  const [databaseAccounts, setDatabaseAccounts] = useState<ConnectedAccountDisplay[]>([]);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<HostingProvider | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseProvider | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [busy, setBusy] = useState(false);

  // Load initial data
  const loadData = useCallback(async () => {
    if (!isOpen) return;
    
    setLoading(true);
    setError("");
    setNotice("");
    
    try {
      // Check for GitHub connection
      const githubRes = await fetch("/api/platform/connections?provider=github");
      if (githubRes.ok) {
        const githubData = await githubRes.json();
        if (githubData.accounts?.length > 0) {
          setGithubAccount(githubData.accounts[0]);
          setStep("select-repo");
          await loadRepositories();
        }
      }
      
      // Load hosting accounts
      const hostingRes = await fetch("/api/platform/connections/hosting");
      if (hostingRes.ok) {
        const hostingData = await hostingRes.json();
        setHostingAccounts(hostingData.accounts || []);
      }
      
      // Load database accounts
      const dbRes = await fetch("/api/platform/connections/databases");
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        setDatabaseAccounts(dbData.accounts || []);
      }
      
      // Check URL for OAuth callback redirect
      const query = new URLSearchParams(window.location.search);
      if (query.get("status") === "connected") {
        const connectedProvider = query.get("integration") as string;
        
        if (connectedProvider === "github") {
          setNotice("تم ربط حساب GitHub بنجاح!");
          window.history.replaceState({}, "", window.location.pathname);
          await loadData();
        } else if (HOSTING_PROVIDERS.includes(connectedProvider as HostingProvider)) {
          setNotice(`تم ربط حساب ${PROVIDER_METADATA[connectedProvider as HostingProvider].displayName} بنجاح!`);
          window.history.replaceState({}, "", window.location.pathname);
          await loadData();
        } else if (DATABASE_PROVIDERS.includes(connectedProvider as DatabaseProvider)) {
          setNotice(`تم ربط قاعدة البيانات ${PROVIDER_METADATA[connectedProvider as DatabaseProvider].displayName} بنجاح!`);
          window.history.replaceState({}, "", window.location.pathname);
          await loadData();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadRepositories = useCallback(async () => {
    setLoadingRepos(true);
    setError("");
    
    try {
      const response = await fetch("/api/platform/github/repositories");
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "تعذر تحميل المستودعات");
      }
      
      const data = await response.json();
      setRepositories(data.repositories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء تحميل المستودعات");
    } finally {
      setLoadingRepos(false);
    }
  }, []);

  const handleConnectGithub = useCallback(() => {
    setLoading(true);
    window.location.href = "/api/platform/oauth/github/start?redirect_to=hosting";
  }, []);

  const handleConnectPlatform = useCallback((provider: HostingProvider) => {
    setLoading(true);
    window.location.href = `/api/platform/oauth/${provider}/start?redirect_to=hosting`;
  }, []);

  const handleConnectDatabase = useCallback((provider: DatabaseProvider) => {
    setLoading(true);
    window.location.href = `/api/platform/oauth/${provider}/start?redirect_to=hosting`;
  }, []);

  const handleSelectPlatform = useCallback((platform: HostingProvider) => {
    if (hostingAccounts.some((acc) => acc.provider === platform)) {
      setSelectedPlatform(platform);
      setStep("review");
    } else {
      handleConnectPlatform(platform);
    }
  }, [hostingAccounts, handleConnectPlatform]);

  const handleDeploy = useCallback(async () => {
    if (!selectedRepo || !selectedPlatform) return;
    
    setBusy(true);
    setError("");
    setNotice("");
    
    try {
      setNotice("جاري إعداد المشروع للنشر...");
      
      // Call AI to analyze and prepare the project
      const aiResponse = await fetch("/api/agent/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: selectedRepo.fullName,
          platform: selectedPlatform,
          database: selectedDatabase,
        }),
      });
      
      if (!aiResponse.ok) {
        const data = await aiResponse.json().catch(() => ({}));
        throw new Error(data.error || "تعذر إعداد المشروع");
      }
      
      const result = await aiResponse.json();
      
      // Simulate deployment (in real implementation, this would call the actual platform API)
      setNotice(`تم إعداد مشروع ${selectedRepo.name} للنشر على ${PROVIDER_METADATA[selectedPlatform].displayName}!`);
      
      onDeploySuccess?.();
      
      // Close modal after a delay
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء عملية النشر");
    } finally {
      setBusy(false);
    }
  }, [selectedRepo, selectedPlatform, selectedDatabase, onClose, onDeploySuccess]);

  const filteredRepos = repositories.filter((repo) => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrevious = useCallback(() => {
    switch (step) {
      case "select-repo":
        setStep("connect-github");
        break;
      case "select-platform":
        setStep("select-repo");
        break;
      case "review":
        setStep("select-platform");
        break;
      default:
        break;
    }
    setError("");
    setNotice("");
  }, [step]);

  const canProceed = () => {
    switch (step) {
      case "connect-github":
        return githubAccount !== null;
      case "select-repo":
        return selectedRepo !== null;
      case "select-platform":
        return selectedPlatform !== null;
      default:
        return true;
    }
  };

  const handleNext = useCallback(() => {
    if (loading || busy) return;
    
    switch (step) {
      case "connect-github":
        if (githubAccount) {
          setStep("select-repo");
        } else {
          handleConnectGithub();
        }
        break;
      case "select-repo":
        setStep("select-platform");
        break;
      case "select-platform":
        setStep("review");
        break;
      default:
        break;
    }
    setError("");
    setNotice("");
  }, [step, loading, busy, githubAccount, handleConnectGithub]);

  if (!isOpen) return null;

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-5">
      {[
        { id: "connect-github", label: "GitHub" },
        { id: "select-repo", label: "المستودع" },
        { id: "select-platform", label: "المنصة" },
        { id: "review", label: "مراجعة" },
      ].map((s, index) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s.id
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-950/50"
                  : step > s.id
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-neutral-800 text-neutral-500"
              }`}
            >
              {step > s.id ? <Check className="w-4 h-4" /> : index + 1}
            </div>
            <span className={`text-[10px] mt-1.5 hidden sm:block ${
              step >= s.id ? "text-neutral-200" : "text-neutral-500"
            }`}>
              {s.label}
            </span>
          </div>
          {index < 3 && (
            <div
              className={`w-12 sm:w-16 h-1 mx-1 rounded-full transition-all ${
                step > s.id ? "bg-emerald-500/40" : "bg-neutral-700"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      dir="rtl"
    >
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 sm:px-7 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 shrink-0">
              <Rocket className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white truncate">نشر واستضافة المشروع</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                اربط مستودعك على GitHub واختَر منصة الاستضافة
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors shrink-0"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 space-y-4">
          {renderStepIndicator()}
          
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              <p className="text-sm text-neutral-400">جاري التحميل...</p>
            </div>
          ) : (
            <>
              {/* Step 1: Connect GitHub */}
              {step === "connect-github" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-3 text-xs leading-6 text-violet-100/80">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                    <p>
                      <strong className="text-violet-200">الخطوة الأولى:</strong> يجب ربط حساب GitHub
                      لاستheiال مستودعاتك. لن نطلب منك إدخال أي بيانات يدوياً.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-blue-400" />
                      <span>ربط حساب GitHub</span>
                    </h3>

                    {githubAccount ? (
                      <>
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
                              <span className="text-lg">🐙</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-white">حساب GitHub متصل</h4>
                              <p className="text-sm text-neutral-400">{githubAccount.label}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={handleNext}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 font-bold text-white transition-colors"
                          >
                            <span>الخطوة التالية</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleConnectGithub}
                            className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-4 py-2.5 font-bold text-neutral-200 transition-colors"
                          >
                            <span>إعادة الربط</span>
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <PlatformOAuthButton
                          provider="github"
                          isConnected={false}
                          isLoading={loading}
                          onClick={handleConnectGithub}
                          disabled={loading}
                          size="lg"
                          showDescription
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={handleConnectGithub}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 font-bold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>جاري الفتح...</span>
                              </>
                            ) : (
                              <>
                                <GitBranch className="w-4 h-4" />
                                <span>ربط بحساب GitHub الآن</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Select Repository */}
              {step === "select-repo" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-blue-400" />
                      <span>اختر مستودع GitHub</span>
                    </h3>
                    
                    <button
                      type="button"
                      onClick={loadRepositories}
                      disabled={loadingRepos}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-900/50 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {loadingRepos ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      <span>تحديث المستودعات</span>
                    </button>
                  </div>

                  {/* Repository search */}
                  <div className="relative">
                    <Search className="absolute right-3.5 top-3 h-4 w-4 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="بحث في المستودعات (بالاسم أو الوصف)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500/60"
                      dir="auto"
                    />
                  </div>

                  {/* Repository list */}
                  {filteredRepos.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-neutral-700 p-7 text-center text-sm leading-7 text-neutral-400">
                      <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-3">
                        <GitBranch className="w-5 h-5 text-neutral-500" />
                      </div>
                      <p>لم يتم العثور على أي مستودعات</p>
                      <p className="text-xs text-neutral-500 mt-2">
                        قد لا تكون لديك أي مستودعات عامة، أو أن حساب GitHub غير متصل
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {filteredRepos.map((repo) => (
                        <button
                          key={repo.id}
                          type="button"
                          onClick={() => setSelectedRepo(repo)}
                          className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border transition-all text-left ${
                            selectedRepo?.id === repo.id
                              ? "border-violet-500/40 bg-violet-500/[0.08] ring-2 ring-violet-500/20"
                              : "border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800/60 hover:border-neutral-700"
                          }`}
                          dir="ltr"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="shrink-0">
                              {repo.isPrivate ? (
                                <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center">
                                  <span className="text-xs">🔒</span>
                                </div>
                              ) : repo.ownerAvatarUrl ? (
                                <img
                                  src={repo.ownerAvatarUrl}
                                  alt={repo.owner}
                                  className="w-8 h-8 rounded-xl border border-neutral-800"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center">
                                  <GitBranch className="w-4 h-4 text-neutral-500" />
                                </div>
                              )}
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-neutral-100 truncate flex items-center gap-1">
                                <span>{repo.owner}</span>
                                <span className="text-neutral-500">/</span>
                                <span>{repo.name}</span>
                              </h4>
                              {repo.description && (
                                <p className="text-xs text-neutral-400 truncate mt-0.5">
                                  {repo.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-neutral-500">
                                {repo.language && (
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                                    <span>{repo.language}</span>
                                  </span>
                                )}
                                {repo.stars > 0 && (
                                  <span className="flex items-center gap-1">
                                    <span>⭐</span>
                                    <span>{repo.stars}</span>
                                  </span>
                                )}
                                <span>📦 {repo.defaultBranch}</span>
                                {repo.isPrivate && (
                                  <span className="text-amber-400">خاص</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {selectedRepo?.id === repo.id && (
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center shrink-0">
                              <Check className="w-4 h-4 text-emerald-400" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>الرجوع</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!selectedRepo || loading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-700 disabled:cursor-not-allowed text-white font-bold transition-colors"
                    >
                      <span>الخطوة التالية</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Select Platform */}
              {step === "select-platform" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Rocket className="h-4 w-4 text-violet-400" />
                      <span>اختر منصة الاستضافة</span>
                    </h3>
                  </div>

                  {/* Selected repository info */}
                  {selectedRepo && (
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
                          <GitBranch className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-neutral-100 truncate">
                            {selectedRepo.fullName}
                          </h4>
                          <p className="text-xs text-neutral-400 truncate">
                            الفرع: {selectedRepo.defaultBranch}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-neutral-400">
                    اختر منصة الاستضافة التي تريد نشر مشروعك عليها:
                  </p>

                  {/* Hosting platforms grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {HOSTING_PROVIDERS.map((provider) => {
                      const isConnected = hostingAccounts.some((acc) => acc.provider === provider);
                      
                      return (
                        <PlatformOAuthButton
                          key={provider}
                          provider={provider}
                          isConnected={isConnected}
                          isLoading={loading}
                          onClick={() => handleSelectPlatform(provider)}
                          disabled={loading}
                          size="md"
                          showDescription
                        />
                      );
                    })}
                  </div>

                  {/* Database connection (optional) */}
                  <div className="border-t border-neutral-800 pt-4">
                    <h4 className="font-semibold text-neutral-300 mb-3">
                      ربط قاعدة بيانات (اختياري)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {DATABASE_PROVIDERS.map((provider) => {
                        const isConnected = databaseAccounts.some((acc) => acc.provider === provider);
                        
                        return (
                          <PlatformOAuthButton
                            key={provider}
                            provider={provider}
                            isConnected={isConnected}
                            isLoading={loading}
                            onClick={() => {
                              if (isConnected) {
                                setSelectedDatabase(provider);
                              } else {
                                handleConnectDatabase(provider);
                              }
                            }}
                            disabled={loading}
                            size="sm"
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>الرجوع</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!selectedPlatform || loading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-700 disabled:cursor-not-allowed text-white font-bold transition-colors"
                    >
                      <span>مراجعة وإرسال</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Review and Deploy */}
              {step === "review" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>مراجعة الإعدادات</span>
                    </h3>
                  </div>

                  {/* Review summary */}
                  <div className="space-y-3">
                    {/* Repository */}
                    {selectedRepo && (
                      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                        <h4 className="text-xs font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
                          <GitBranch className="w-3.5 h-3.5" />
                          <span>المستودع</span>
                        </h4>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
                            <GitBranch className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-neutral-100 truncate">{selectedRepo.fullName}</p>
                            <p className="text-xs text-neutral-400">
                              الفرع: {selectedRepo.defaultBranch}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Hosting Platform */}
                    {selectedPlatform && (
                      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                        <h4 className="text-xs font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
                          <Rocket className="w-3.5 h-3.5" />
                          <span>منصة الاستضافة</span>
                        </h4>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: PROVIDER_METADATA[selectedPlatform].bgColor,
                              color: PROVIDER_METADATA[selectedPlatform].color,
                            }}
                          >
                            {PROVIDER_METADATA[selectedPlatform].emoji}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-neutral-100">
                              {PROVIDER_METADATA[selectedPlatform].displayName}
                            </p>
                            <p className="text-xs text-neutral-400">
                              {PROVIDER_METADATA[selectedPlatform].description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Database (if selected) */}
                    {selectedDatabase && (
                      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                        <h4 className="text-xs font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5" />
                          <span>قاعدة البيانات</span>
                        </h4>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: PROVIDER_METADATA[selectedDatabase].bgColor,
                              color: PROVIDER_METADATA[selectedDatabase].color,
                            }}
                          >
                            {PROVIDER_METADATA[selectedDatabase].emoji}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-neutral-100">
                              {PROVIDER_METADATA[selectedDatabase].displayName}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info banner */}
                  <div className="flex items-start gap-2 rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-3 text-xs leading-6 text-violet-100/80">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                    <p>
                      ستقوم المنصة الآن بتحليل مشروعك باستخدام الذكاء الاصطناعي وإعداد ملفات الإعداد
                      اللازم للنشر على {selectedPlatform && PROVIDER_METADATA[selectedPlatform].displayName}.
                      لن يستغرق هذا أكثر من بضع ثوانٍ.
                    </p>
                  </div>

                  {/* Deploy button */}
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleDeploy}
                      disabled={busy || !selectedRepo || !selectedPlatform}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700 disabled:cursor-not-allowed px-6 py-3 font-bold text-white text-lg transition-all disabled:scale-100"
                    >
                      {busy ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>جاري الإعداد...</span>
                        </>
                      ) : (
                        <>
                          <Rocket className="w-5 h-5" />
                          <span>نشر المشروع الآن</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>الرجوع</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Status Messages */}
        {(notice || error) && (
          <div
            role={error ? "alert" : "status"}
            className={`mx-5 mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm leading-6 ${
              error
                ? "border-red-500/20 bg-red-500/[0.06] text-red-200"
                : "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200"
            }`}
          >
            {error ? (
              <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
            ) : (
              <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
            )}
            <span>{error || notice}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostingPublisherModal;
