import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  ExternalLink,
  Github,
  Loader2,
  LockKeyhole,
  Plus,
  Rocket,
  Server,
  Trash2,
  X,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";
import type { AppSettings } from "../types";
import { StaticSiteDeploymentPanel } from "./StaticSiteDeploymentPanel";
import { ProjectDatabaseAssistant } from "./ProjectDatabaseAssistant";

type ProviderId =
  | "github"
  | "railway"
  | "render"
  | "flyio"
  | "vercel"
  | "netlify"
  | "supabase"
  | "neon"
  | "planetscale"
  | "turso";

type OAuthProvider = "github" | "vercel" | "supabase";

interface ProviderConnection {
  id: string;
  provider: ProviderId;
  label: string;
  created_at: string;
}

interface DeploymentProject {
  id: string;
  name: string;
  repository_url: string;
  branch: string;
  created_at: string;
}

interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  url: string;
  branch: string;
  isPrivate: boolean;
}

async function readApiJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      "الخادم أعاد صفحة HTML بدل استجابة API. تحقق من تشغيل خادم FGOM21 ونشر مسارات /api."
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("استجابة الخادم غير صالحة. أعد المحاولة بعد تحديث الصفحة.");
  }
}

const hostingProviders: Array<{ id: ProviderId; name: string; href: string }> = [
  { id: "railway", name: "Railway", href: "https://railway.com/account/tokens" },
  { id: "render", name: "Render", href: "https://dashboard.render.com/u/settings" },
  { id: "flyio", name: "Fly.io", href: "https://fly.io/user/personal_access_tokens" },
  { id: "vercel", name: "Vercel", href: "https://vercel.com/account/settings/tokens" },
  { id: "netlify", name: "Netlify", href: "https://app.netlify.com/user/applications#personal-access-tokens" },
];

const databaseProviders: Array<{ id: ProviderId; name: string; href: string }> = [
  { id: "supabase", name: "Supabase", href: "https://supabase.com/dashboard/account/tokens" },
  { id: "neon", name: "Neon", href: "https://console.neon.tech/app/settings/api-keys" },
  { id: "planetscale", name: "PlanetScale", href: "https://app.planetscale.com/" },
  { id: "turso", name: "Turso", href: "https://turso.tech/app/settings/tokens" },
];

const githubProvider = {
  id: "github" as const,
  name: "GitHub",
  href: "https://github.com/settings/personal-access-tokens",
};

interface DeploymentHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPath?: "hosting" | "database" | "accounts";
  settings: AppSettings;
  model: string;
  onOpenSettings: () => void;
}

export const DeploymentHubModal: React.FC<DeploymentHubModalProps> = ({
  isOpen,
  onClose,
  initialPath = "hosting",
  settings,
  model,
  onOpenSettings,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authConfigured, setAuthConfigured] = useState(false);
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [projects, setProjects] = useState<DeploymentProject[]>([]);
  const [githubRepositories, setGithubRepositories] = useState<GitHubRepository[]>([]);
  const [activeTab, setActiveTab] = useState<"projects" | "connections">("projects");
  const [workspaceMode, setWorkspaceMode] = useState<"hosting" | "assistant" | "accounts">("hosting");
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [projectName, setProjectName] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [provider, setProvider] = useState<ProviderId>("github");
  const [connectionLabel, setConnectionLabel] = useState("");
  const [providerSecret, setProviderSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingGithubRepositories, setLoadingGithubRepositories] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const getAccessToken = useCallback(async () => {
    if (!isSupabaseConfigured) return null;
    const { data } = await getSupabaseClient().auth.getSession();
    return data.session?.access_token || null;
  }, []);

  const requestApi = useCallback(
    async <T,>(url: string, init: RequestInit = {}): Promise<T> => {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("سجّل الدخول أولاً.");
      const response = await fetch(url, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          ...init.headers,
        },
      });
      const result =
        response.status === 204
          ? null
          : await readApiJson<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(
          typeof result?.error === "string" ? result.error : "تعذر إكمال الطلب."
        );
      }
      return result as T;
    },
    [getAccessToken]
  );

  const loadWorkspace = useCallback(async () => {
    if (!session) return;
    setLoadingData(true);
    setErrorMessage("");
    try {
      const [connectionResult, projectResult] = await Promise.all([
        requestApi<{ connections: ProviderConnection[] }>("/api/platform/connections"),
        requestApi<{ projects: DeploymentProject[] }>("/api/platform/projects"),
      ]);
      setConnections(connectionResult.connections);
      setProjects(projectResult.projects);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "تعذر تحميل مساحة النشر.");
    } finally {
      setLoadingData(false);
    }
  }, [requestApi, session]);

  const loadGithubRepositories = async () => {
    setLoadingGithubRepositories(true);
    setErrorMessage("");
    try {
      const result = await requestApi<{ repositories: GitHubRepository[] }>(
        "/api/platform/github/repositories"
      );
      setGithubRepositories(result.repositories);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "تعذر تحميل مستودعات GitHub.");
    } finally {
      setLoadingGithubRepositories(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialPath === "hosting" ? "projects" : "connections");
    setWorkspaceMode(initialPath === "database" ? "assistant" : initialPath === "accounts" ? "accounts" : "hosting");
    setProvider(initialPath === "database" || initialPath === "accounts" ? "supabase" : "railway");
    setNotice("");
    setErrorMessage("");

    const callbackQuery = new URLSearchParams(window.location.search);
    const connectionStatus = callbackQuery.get("status");
    if (connectionStatus === "connected") {
      setNotice("تم ربط الحساب بنجاح. أصبح بإمكان المنصة استخدام الصلاحية التي وافقت عليها فقط.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (connectionStatus === "error") {
      setErrorMessage(callbackQuery.get("message") || "تعذر إكمال ربط الحساب.");
      window.history.replaceState({}, "", window.location.pathname);
    }

    let unsubscribe = () => {};
    if (isSupabaseConfigured) {
      const client = getSupabaseClient();
      client.auth.getSession().then(({ data }) => setSession(data.session));
      const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    }

    if (!isSupabaseConfigured) {
      setAuthConfigured(false);
      return () => unsubscribe();
    }

    fetch("/api/platform/config")
      .then(async (response) => {
        if (!response.ok) throw new Error("تعذر التحقق من إعداد مساحة النشر.");
        return readApiJson<{ authConfigured: boolean; storageConfigured: boolean }>(response);
      })
      .then((config) => setAuthConfigured(Boolean(config.authConfigured && config.storageConfigured)))
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : "تعذر التحقق من الإعداد.");
      });

    return () => unsubscribe();
  }, [initialPath, isOpen]);

  useEffect(() => {
    if (session && authConfigured) void loadWorkspace();
  }, [authConfigured, loadWorkspace, session]);

  if (!isOpen) return null;

  // Keep the publishing workspace useful before Supabase and a hosting
  // provider are connected. The panel stages only safe static-site files and
  // never claims that a public URL exists before an actual deployment.
  const submitAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");
    setNotice("");
    try {
      const client = getSupabaseClient();
      const result =
        authMode === "sign-in"
          ? await client.auth.signInWithPassword({ email: email.trim(), password })
          : await client.auth.signUp({ email: email.trim(), password });
      if (result.error) throw result.error;
      if (authMode === "sign-up" && !result.data.session) {
        setNotice("تم إنشاء الحساب. راجع بريدك لتأكيده ثم سجّل الدخول.");
      } else {
        setSession(result.data.session);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "تعذر إكمال تسجيل الدخول.");
    } finally {
      setBusy(false);
    }
  };

  const saveProject = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");
    setNotice("");
    try {
      const result = await requestApi<{ project: DeploymentProject }>("/api/platform/projects", {
        method: "POST",
        body: JSON.stringify({ name: projectName, repositoryUrl, branch }),
      });
      setProjects((current) => [result.project, ...current]);
      setProjectName("");
      setRepositoryUrl("");
      setBranch("main");
      setNotice("تمت إضافة المشروع إلى مساحتك.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "تعذر إضافة المشروع.");
    } finally {
      setBusy(false);
    }
  };

  const saveConnection = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");
    setNotice("");
    try {
      const result = await requestApi<{ connection: ProviderConnection }>("/api/platform/connections", {
        method: "POST",
        body: JSON.stringify({
          provider,
          label: connectionLabel,
          secret: providerSecret,
        }),
      });
      setConnections((current) => [
        result.connection,
        ...current.filter(
          (connection) =>
            connection.id !== result.connection.id &&
            !(connection.provider === provider && connection.label === connectionLabel.trim())
        ),
      ]);
      setConnectionLabel("");
      setProviderSecret("");
      setNotice("تم حفظ بيانات الربط مشفّرة على الخادم.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "تعذر حفظ بيانات الربط.");
    } finally {
      setBusy(false);
    }
  };

  const startOAuthConnection = async (nextProvider: OAuthProvider) => {
    setBusy(true);
    setErrorMessage("");
    setNotice("");
    try {
      const result = await requestApi<{ authorizationUrl: string }>(
        `/api/platform/oauth/${nextProvider}/start`,
        { method: "POST" }
      );
      window.location.assign(result.authorizationUrl);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "تعذر فتح صفحة تسجيل الدخول للخدمة."
      );
      setBusy(false);
    }
  };

  const removeConnection = async (connectionId: string) => {
    setBusy(true);
    setErrorMessage("");
    try {
      await requestApi(`/api/platform/connections/${connectionId}`, { method: "DELETE" });
      setConnections((current) => current.filter((connection) => connection.id !== connectionId));
      setNotice("تم حذف الربط وبياناته المشفّرة.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "تعذر حذف الربط.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) setErrorMessage(error.message);
    else {
      setSession(null);
      setConnections([]);
      setProjects([]);
      setNotice("");
    }
    setBusy(false);
  };

  const selectedProvider = [githubProvider, ...hostingProviders, ...databaseProviders].find(
    (item) => item.id === provider
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6" dir="rtl">
      <section className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">مساحة النشر والمشاريع</h2>
              <p className="text-xs text-neutral-400">أدر مستودعاتك واربط خدمات الاستضافة وقواعد البيانات</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
          <nav className="mb-5 flex flex-wrap gap-2 border-b border-neutral-800 pb-3">
            <button type="button" onClick={() => setWorkspaceMode("hosting")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${workspaceMode === "hosting" ? "bg-violet-500/15 text-violet-200" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"}`}>نشر واستضافة المشاريع</button>
            <button type="button" onClick={() => setWorkspaceMode("assistant")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${workspaceMode === "assistant" ? "bg-cyan-500/15 text-cyan-200" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"}`}>مساعد قواعد البيانات</button>
            <button type="button" onClick={() => setWorkspaceMode("accounts")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${workspaceMode === "accounts" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"}`}>حسابات ومشاريع GitHub</button>
          </nav>
          {workspaceMode === "hosting" ? (
            <StaticSiteDeploymentPanel />
          ) : workspaceMode === "assistant" ? (
            <ProjectDatabaseAssistant settings={settings} model={model} onOpenSettings={onOpenSettings} />
          ) : (
          <>
          {!authConfigured || !isSupabaseConfigured ? (
            <div className="mx-auto max-w-2xl rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5 text-right">
              <div className="mb-3 flex items-center gap-2 text-amber-300">
                <AlertCircle className="h-5 w-5" />
                <h3 className="font-bold">يلزم تهيئة المنصة قبل تسجيل المستخدمين</h3>
              </div>
              <p className="text-sm leading-7 text-neutral-300">
                هذا القسم اختياري ويتطلب إعداد Supabase Auth وقاعدة بيانات المنصة حتى تعمل مساحة الحسابات وGitHub.
                مسارا النشر ومساعد قواعد البيانات يعملان دون تسجيل دخول المنصة. لا تضع مفتاح الخدمة أو مفتاح التشفير
                في متغير يبدأ بـ <code className="text-amber-200">VITE_</code>.
              </p>
            </div>
          ) : !session ? (
            <form onSubmit={submitAuth} className="mx-auto max-w-md space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 sm:p-7">
              <div className="text-right">
                <h3 className="text-xl font-bold text-white">
                  {authMode === "sign-in" ? "تسجيل الدخول" : "إنشاء حساب"}
                </h3>
                <p className="mt-1 text-sm text-neutral-400">لكل مستخدم مساحة مستقلة لمشاريعه وربوطه.</p>
              </div>
              <label className="block space-y-1.5 text-sm text-neutral-300">
                البريد الإلكتروني
                <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-white outline-none focus:border-violet-400" />
              </label>
              <label className="block space-y-1.5 text-sm text-neutral-300">
                كلمة المرور
                <input type="password" required minLength={8} autoComplete={authMode === "sign-in" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-white outline-none focus:border-violet-400" />
              </label>
              <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-bold text-white transition hover:bg-violet-500 disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {authMode === "sign-in" ? "دخول آمن" : "إنشاء الحساب"}
              </button>
              <button type="button" onClick={() => setAuthMode(authMode === "sign-in" ? "sign-up" : "sign-in")} className="w-full text-center text-sm text-violet-300 hover:text-violet-200">
                {authMode === "sign-in" ? "ليس لديك حساب؟ أنشئ حساباً" : "لديك حساب بالفعل؟ سجّل الدخول"}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3 text-xs leading-6 text-amber-100/90">
                <AlertCircle className="mt-1 h-4 w-4 shrink-0 text-amber-300" />
                <p>
                  هذه المساحة لإدارة مشاريع GitHub وحسابات الخدمات. استخدم تبويب النشر لرفع موقعك الثابت إلى Netlify،
                  وتبويب مساعد قواعد البيانات لتحليل ملفات مشروعك وتجهيز التعديلات.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="flex items-center gap-2 text-sm text-neutral-300">
                  <LockKeyhole className="h-4 w-4 text-emerald-400" />
                  <span>مسجّل الدخول: <bdi className="text-white">{session.user.email}</bdi></span>
                </div>
                <button type="button" onClick={signOut} disabled={busy} className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 disabled:opacity-50">تسجيل الخروج</button>
              </div>

              <div className="flex gap-2 border-b border-neutral-800">
                <button type="button" onClick={() => setActiveTab("projects")} className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold ${activeTab === "projects" ? "border-violet-400 text-violet-200" : "border-transparent text-neutral-400 hover:text-white"}`}>
                  <Server className="h-4 w-4" /> مشاريعي ({projects.length})
                </button>
                <button type="button" onClick={() => setActiveTab("connections")} className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold ${activeTab === "connections" ? "border-violet-400 text-violet-200" : "border-transparent text-neutral-400 hover:text-white"}`}>
                  <Database className="h-4 w-4" /> الحسابات المرتبطة ({connections.length})
                </button>
              </div>

              {activeTab === "projects" ? (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white">مشاريع GitHub</h3>
                      {loadingData && <Loader2 className="h-4 w-4 animate-spin text-violet-300" />}
                    </div>
                    {projects.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-neutral-700 p-7 text-center text-sm leading-7 text-neutral-400">
                        أضف مستودع GitHub للبدء. تقدر إدارة أكثر من مشروع من نفس المساحة.
                      </div>
                    ) : projects.map((project) => (
                      <article key={project.id} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="truncate font-bold text-white">{project.name}</h4>
                            <a href={project.repository_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-violet-300 hover:text-violet-200">
                              <Github className="h-3.5 w-3.5 shrink-0" /> {project.repository_url}
                            </a>
                          </div>
                          <span className="shrink-0 rounded-lg bg-neutral-800 px-2 py-1 text-xs text-neutral-300" dir="ltr">{project.branch}</span>
                        </div>
                      </article>
                    ))}
                  </div>

                  <form onSubmit={saveProject} className="h-fit space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
                    <h3 className="flex items-center gap-2 font-bold text-white"><Plus className="h-4 w-4 text-violet-300" /> إضافة مشروع</h3>
                    <label className="block space-y-1 text-xs text-neutral-400">
                      اسم المشروع
                      <input required maxLength={100} value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="مثال: متجري الإلكتروني" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400" />
                    </label>
                    <label className="block space-y-1 text-xs text-neutral-400">
                      رابط مستودع GitHub
                      <input required type="url" value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/owner/repository" dir="ltr" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-left text-sm text-white outline-none focus:border-violet-400" />
                    </label>
                    <label className="block space-y-1 text-xs text-neutral-400">
                      الفرع
                      <input required maxLength={120} value={branch} onChange={(event) => setBranch(event.target.value)} placeholder="main" dir="ltr" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-left text-sm text-white outline-none focus:border-violet-400" />
                    </label>
                    <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2.5 text-sm font-bold text-violet-200 hover:bg-violet-500/20 disabled:opacity-50">
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />} حفظ المشروع
                    </button>
                  </form>
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
                  <div className="space-y-3">
                    <h3 className="font-bold text-white">الخدمات المتاحة</h3>
                    {[{ title: "استضافة التطبيقات", items: hostingProviders }, { title: "قواعد البيانات", items: databaseProviders }, { title: "مصدر الشيفرة", items: [githubProvider] }].map((group) => (
                      <div key={group.title} className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
                        <h4 className="mb-3 text-xs font-bold text-neutral-400">{group.title}</h4>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map((item) => {
                            const connected = connections.some((connection) => connection.provider === item.id);
                            return (
                              <button key={item.id} type="button" onClick={() => {
                                if (item.id === "github" || item.id === "vercel" || item.id === "supabase") {
                                  void startOAuthConnection(item.id);
                                } else {
                                  setNotice("سيتم تفعيل ربط هذه الخدمة عبر OAuth عند إضافة واجهة API الخاصة بها.");
                                }
                              }} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${connected ? "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-200" : "border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-violet-500/40"}`}>
                                {connected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                                {item.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <p className="rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-3 text-xs leading-6 text-blue-100/80">
                      يتم حفظ بيانات الربط مشفّرة على الخادم. لا نعرض الرمز بعد حفظه، ويمكنك حذف أي ربط من القائمة.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] p-4 text-right">
                      <h3 className="font-bold text-white">اربط حسابك بتسجيل الدخول</h3>
                      <p className="mt-2 text-xs leading-6 text-neutral-300">
                        اختر GitHub أو Vercel أو Supabase من الخدمات. ستنتقل إلى الصفحة الرسمية للخدمة، تسجّل الدخول بنفسك وتوافق على الصلاحيات. لا نطلب منك لصق أي رمز API.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(["github", "vercel", "supabase"] as OAuthProvider[]).map((oauthProvider) => (
                          <button
                            key={oauthProvider}
                            type="button"
                            disabled={busy}
                            onClick={() => void startOAuthConnection(oauthProvider)}
                            className="rounded-xl border border-violet-400/30 bg-neutral-950 px-3 py-2 text-xs font-bold text-violet-200 hover:bg-violet-500/10 disabled:opacity-50"
                          >
                            تسجيل الدخول إلى {oauthProvider === "github" ? "GitHub" : oauthProvider === "vercel" ? "Vercel" : "Supabase"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={saveConnection} className="hidden">
                      <h3 className="font-bold text-white">ربط حساب خدمة</h3>
                      <label className="block space-y-1 text-xs text-neutral-400">
                        الخدمة
                        <select value={provider} onChange={(event) => setProvider(event.target.value as ProviderId)} className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white">
                          {[{ title: "GitHub", items: [githubProvider] }, { title: "الاستضافة", items: hostingProviders }, { title: "قواعد البيانات", items: databaseProviders }].map((group) => (
                            <optgroup key={group.title} label={group.title}>
                              {group.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </optgroup>
                          ))}
                        </select>
                      </label>
                      <label className="block space-y-1 text-xs text-neutral-400">
                        اسم للتعرّف على الربط
                        <input required maxLength={80} value={connectionLabel} onChange={(event) => setConnectionLabel(event.target.value)} placeholder="مثال: حسابي الشخصي" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400" />
                      </label>
                      <label className="block space-y-1 text-xs text-neutral-400">
                        رمز الربط السري
                        <input required type="password" autoComplete="new-password" minLength={12} maxLength={8192} value={providerSecret} onChange={(event) => setProviderSecret(event.target.value)} placeholder="الصق الرمز هنا — لن يظهر بعد الحفظ" dir="ltr" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-left text-sm text-white outline-none focus:border-violet-400" />
                      </label>
                      {selectedProvider && (
                        <a href={selectedProvider.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200">
                          كيفية إنشاء رمز {selectedProvider.name} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-50">
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />} حفظ الربط بشكل مشفّر
                      </button>
                    </form>
                    <div className="space-y-2">
                      {connections.map((connection) => (
                        <div key={connection.id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-neutral-200">{connection.label}</p>
                            <p className="text-xs text-neutral-500">{connection.provider}</p>
                          </div>
                          <button type="button" onClick={() => void removeConnection(connection.id)} disabled={busy} aria-label={`حذف ربط ${connection.label}`} className="rounded-lg p-2 text-neutral-500 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {(notice || errorMessage) && (
            <div role={errorMessage ? "alert" : "status"} className={`mt-5 flex items-start gap-2 rounded-xl border p-3 text-sm leading-6 ${errorMessage ? "border-red-500/20 bg-red-500/[0.06] text-red-200" : "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200"}`}>
              {errorMessage ? <AlertCircle className="mt-1 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />}
              <span>{errorMessage || notice}</span>
            </div>
          )}
          </>
          )}
        </div>
      </section>
    </div>
  );
};
