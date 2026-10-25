import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, FileCode2, FolderUp, Globe2, Loader2, Rocket, ShieldCheck } from "lucide-react";
import { readProjectUpload, type ProjectUploadFile } from "../utils/projectFiles";

interface PublishedSite {
  siteId: string;
  name: string;
  url: string;
  analyticsKey?: string;
  visits?: number | null;
  warning?: string;
}

const STORAGE_KEY = "fgom21_published_sites";
const NETLIFY_TOKEN_URL = "https://app.netlify.com/user/applications#personal-access-tokens";
const STATIC_EXTENSIONS = new Set([
  "html", "htm", "css", "js", "mjs", "cjs", "json", "svg", "png", "jpg", "jpeg",
  "webp", "avif", "gif", "ico", "woff", "woff2", "ttf", "otf", "txt", "xml",
  "webmanifest", "pdf", "mp4", "mp3", "webm", "wasm", "map",
]);

function readSavedSites(): PublishedSite[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((site): site is PublishedSite =>
      Boolean(
        site &&
        typeof site === "object" &&
        typeof site.siteId === "string" &&
        typeof site.url === "string" &&
        site.url.startsWith("https://")
      )
    );
  } catch {
    return [];
  }
}

export const StaticSiteDeploymentPanel: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [netlifyToken, setNetlifyToken] = useState("");
  const [showNetlifyToken, setShowNetlifyToken] = useState(false);
  const [files, setFiles] = useState<ProjectUploadFile[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sites, setSites] = useState<PublishedSite[]>(readSavedSites);
  const [activeSiteId, setActiveSiteId] = useState("");
  const [analytics, setAnalytics] = useState<{ name: string; url: string; visits: number; createdAt: string } | null>(null);
  const [analyticsBusy, setAnalyticsBusy] = useState(false);
  const [netlifyConfigured, setNetlifyConfigured] = useState<boolean | null>(null);
  const [publicUrlConfigured, setPublicUrlConfigured] = useState<boolean | null>(null);
  const [publicStats, setPublicStats] = useState<{
    siteCount: number;
    totalVisits: number;
    sites: Array<{ siteId: string; name: string; url: string; visits: number; createdAt: string }>;
  } | null>(null);
  const [publicStatsError, setPublicStatsError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/hosting/config")
      .then(async (response) => {
        if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
          throw new Error("تعذر قراءة إعدادات الاستضافة من خادم FGOM21.");
        }
        return await response.json() as { netlifyConfigured?: boolean; publicUrlConfigured?: boolean };
      })
      .then((config) => {
        if (!active) return;
        setNetlifyConfigured(Boolean(config.netlifyConfigured));
        setPublicUrlConfigured(Boolean(config.publicUrlConfigured));
      })
      .catch(() => {
        if (!active) return;
        setNetlifyConfigured(false);
        setPublicUrlConfigured(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/hosting/analytics/public")
      .then(async (response) => {
        if (!response.ok) throw new Error("تعذر تحميل الإحصاءات العامة.");
        return await response.json() as {
          stats?: {
            siteCount?: number;
            totalVisits?: number;
            sites?: Array<{ siteId: string; name: string; url: string; visits: number; createdAt: string }>;
          };
          error?: string;
        };
      })
      .then((result) => {
        if (!active) return;
        if (
          !result.stats ||
          typeof result.stats.siteCount !== "number" ||
          typeof result.stats.totalVisits !== "number" ||
          !Number.isSafeInteger(result.stats.siteCount) ||
          !Number.isSafeInteger(result.stats.totalVisits) ||
          !Array.isArray(result.stats.sites)
        ) {
          throw new Error(result.error || "استجابة الإحصاءات العامة غير صالحة.");
        }
        setPublicStats({
          siteCount: result.stats.siteCount,
          totalVisits: result.stats.totalVisits,
          sites: result.stats.sites,
        });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setPublicStatsError(cause instanceof Error ? cause.message : "تعذر تحميل الإحصاءات العامة.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
    } catch {
      setError("تعذر حفظ قائمة المواقع ومفتاح لوحة الزيارات في هذا المتصفح. نزّل المفتاح أو احتفظ به قبل الإغلاق.");
    }
  }, [sites]);

  const validFiles = files.every((file) => STATIC_EXTENSIONS.has(file.path.split("/").pop()?.split(".").pop()?.toLowerCase() || ""));
  const hasEntry = files.some((file) => file.path === "index.html" || file.path === "index.htm");
  const hasNetlifyCredential = netlifyToken.trim().length >= 20 || netlifyConfigured === true;
  const ready = name.trim().length >= 2 && files.length > 0 && validFiles && hasEntry && hasNetlifyCredential;

  const selectFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setError("");
    setNotice("");
    try {
      const uploadedFiles = await readProjectUpload(fileList, { includeBuildArtifacts: true });
      const rootIndex = uploadedFiles.some((file) => file.path === "index.html" || file.path === "index.htm");
      if (rootIndex) {
        setFiles(uploadedFiles);
        return;
      }
      const candidates = uploadedFiles.filter((file) => /(?:^|\/)index\.html?$/i.test(file.path));
      const candidate = candidates.length === 1 ? candidates[0] : null;
      const prefix = candidate?.path.replace(/index\.html?$/i, "").replace(/\/$/, "") || "";
      if (prefix && uploadedFiles.every((file) => file.path.startsWith(`${prefix}/`))) {
        setFiles(uploadedFiles.map((file) => ({ ...file, path: file.path.slice(prefix.length + 1) })));
        return;
      }
      setFiles(uploadedFiles);
    } catch (cause) {
      setFiles([]);
      setError(cause instanceof Error ? cause.message : "تعذر قراءة ملفات الموقع.");
    }
  };

  const deploy = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (netlifyToken.trim() && window.location.protocol !== "https:" && !isLocalDevelopment) {
      setError("للحفاظ على أمان مفتاح Netlify، افتح FGOM21 عبر اتصال HTTPS ثم أعد المحاولة.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/hosting/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), files, token: netlifyToken.trim() }),
      });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("الخادم الحالي لا يدعم نشر الملفات. أوقف النسخة القديمة ثم شغّل أحدث خادم FGOM21 عبر npm run dev، ولا تستخدم npm run preview.");
      }
      const result = await response.json() as PublishedSite & { error?: string };
      if (!response.ok) throw new Error(result.error || `تعذر النشر (${response.status}).`);
      if (!result.url || !result.url.startsWith("https://")) throw new Error("لم يرجع Netlify رابط HTTPS مؤكداً.");
      if (result.analyticsKey) {
        setSites((current) => [{ ...result }, ...current.filter((site) => site.siteId !== result.siteId)]);
        setActiveSiteId(result.siteId);
        setAnalytics({ name: result.name, url: result.url, visits: result.visits || 0, createdAt: new Date().toISOString() });
      } else {
        setSites((current) => [{ ...result }, ...current.filter((site) => site.siteId !== result.siteId)]);
      }
      setNetlifyToken("");
      setShowNetlifyToken(false);
      setNotice(result.warning || "تم رفع المشروع إلى Netlify بنجاح. الرابط مباشر وقابل للمشاركة.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إكمال النشر.");
    } finally {
      setBusy(false);
    }
  };

  const loadAnalytics = async (siteId: string) => {
    setActiveSiteId(siteId);
    setAnalytics(null);
    setError("");
    const site = sites.find((item) => item.siteId === siteId);
    if (!site?.analyticsKey) {
      setError("لا يوجد مفتاح لوحة محفوظ لهذا النشر. احتفظ بمفتاح لوحة الزيارات وقت النشر.");
      return;
    }
    setAnalyticsBusy(true);
    try {
      const response = await fetch(`/api/hosting/analytics/dashboard/${encodeURIComponent(siteId)}`, {
        headers: { "x-dashboard-key": site.analyticsKey },
      });
      const result = await response.json() as { site?: { name: string; url: string; visits: number; createdAt: string }; error?: string };
      if (!response.ok || !result.site) throw new Error(result.error || "تعذر تحميل إحصاءات الزيارات.");
      setAnalytics(result.site);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحميل الإحصاءات.");
    } finally {
      setAnalyticsBusy(false);
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-l from-violet-500/[0.10] to-cyan-500/[0.04] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-200"><Rocket className="h-5 w-5" /></div><div><h3 className="font-bold text-white">نشر واستضافة عبر Netlify</h3><p className="mt-1 text-sm leading-6 text-neutral-300">ارفع ملفات الموقع وسيستخدم خادم FGOM21 مفتاح Netlify الخاص بك لنشره وإرجاع رابطه.</p></div></div>
          <a href={NETLIFY_TOKEN_URL} target="_blank" rel="noreferrer" className="rounded-full border border-violet-400/25 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-500/10">إنشاء مفتاح Netlify</a>
        </div>
      </div>
      {publicUrlConfigured === false && <div role="status" className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs leading-5 text-amber-100">النشر يعمل، لكن لوحة الزيارات تحتاج إعداد رابط FGOM21 العام على الخادم.</div>}
      <section aria-label="إحصاءات عامة" className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4">
        <div className="mb-3 flex items-center gap-2"><Globe2 className="h-4 w-4 text-cyan-300" /><h3 className="text-sm font-semibold text-white">إحصاءات عامة للجميع</h3></div>
        {publicStats ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-3"><p className="text-2xl font-bold text-cyan-200">{publicStats.siteCount}</p><p className="mt-1 text-xs text-neutral-400">مواقع منشورة</p></div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-3"><p className="text-2xl font-bold text-emerald-200">{publicStats.totalVisits}</p><p className="mt-1 text-xs text-neutral-400">إجمالي الزيارات المسجلة</p></div>
          </div>
        ) : publicStatsError ? (
          <p role="status" className="text-xs text-amber-200">{publicStatsError}</p>
        ) : (
          <p className="text-xs text-neutral-400">جارٍ تحميل الإحصاءات العامة...</p>
        )}
        {publicStats && publicStats.sites.length > 0 && <div className="mt-4 space-y-2">
          <h4 className="text-xs font-semibold text-neutral-300">إحصاءات كل موقع منشور</h4>
          {publicStats.sites.map((site) => <div key={site.siteId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950/50 p-3">
            <div className="min-w-0 flex-1">
              <a href={site.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium text-cyan-200 hover:underline">{site.name}</a>
              <span className="block truncate text-xs text-neutral-500" dir="ltr">{site.url}</span>
            </div>
            <div className="shrink-0 text-left"><span className="block text-lg font-bold text-emerald-200">{site.visits}</span><span className="text-[11px] text-neutral-500">زيارة</span></div>
          </div>)}
        </div>}
        <p className="mt-3 text-xs leading-5 text-neutral-500">أسماء المواقع وروابطها وأعداد زياراتها ظاهرة للجميع. مفاتيح لوحة التحكم لا تُعرض ضمن الإحصاءات العامة.</p>
      </section>
      <div className="grid gap-3 sm:grid-cols-3">
        {[["المواقع المنشورة", String(sites.length), Globe2, "text-cyan-300"], ["الملفات المحددة", String(files.length), FileCode2, "text-violet-300"], ["عداد الزيارات", publicUrlConfigured === true ? "مفعّل" : publicUrlConfigured === false ? "يحتاج إعداداً" : "جارٍ التحقق", ShieldCheck, publicUrlConfigured === true ? "text-emerald-300" : "text-amber-300"]].map(([label, value, Icon, tone]) => { const ItemIcon = Icon as typeof Globe2; return <div key={label as string} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4"><ItemIcon className={`mb-3 h-5 w-5 ${tone}`} /><p className="text-xl font-bold text-white">{value as string}</p><p className="mt-1 text-xs text-neutral-400">{label as string}</p></div>; })}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <form onSubmit={(event) => void deploy(event)} className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 sm:p-5">
          <div><h3 className="font-bold text-white">ارفع الموقع وخذ رابطه</h3><p className="mt-1 text-xs leading-6 text-neutral-400">يدعم الموقع الثابت الجاهز، مثل HTML/CSS/JavaScript والصور مع index.html في المجلد الرئيسي. لا يشغّل هذا المسار مشاريع backend.</p></div>
          <label className="block space-y-1.5 text-sm text-neutral-300">اسم الموقع<input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="مثال: متجري الإلكتروني" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-white outline-none focus:border-violet-400" /></label>
          <label className="block space-y-1.5 text-sm text-neutral-300">
            مفتاح Netlify الشخصي
            <span className="block text-xs leading-5 text-neutral-500">أدخله وقت النشر فقط. لا يُحفظ في المتصفح أو قاعدة البيانات، ويُمسح من الحقل بعد نجاح النشر.</span>
            <span className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-950 px-3 focus-within:border-violet-400">
              <input
                type={showNetlifyToken ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                value={netlifyToken}
                onChange={(event) => setNetlifyToken(event.target.value)}
                maxLength={500}
                placeholder={netlifyConfigured ? "اختياري — يستخدم مفتاح المنصة عند تركه فارغاً" : "الصق مفتاح Netlify هنا"}
                className="min-w-0 flex-1 bg-transparent py-2.5 text-left text-white outline-none"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowNetlifyToken((visible) => !visible)}
                className="rounded-lg p-1.5 text-neutral-400 hover:text-white"
                aria-label={showNetlifyToken ? "إخفاء المفتاح" : "إظهار المفتاح"}
              >
                {showNetlifyToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
            <a href={NETLIFY_TOKEN_URL} target="_blank" rel="noreferrer" className="inline-block text-xs text-violet-300 hover:text-violet-200">إنشاء مفتاح Netlify الشخصي</a>
          </label>
          <input ref={inputRef} className="hidden" type="file" multiple accept=".zip,.html,.htm,.css,.js,.mjs,.json,.svg,.png,.jpg,.jpeg,.webp,.avif,.gif,.ico,.woff,.woff2,.ttf,.otf,.txt,.xml,.webmanifest,.pdf,.mp4,.mp3,.webm,.wasm,.map" onChange={(event) => void selectFiles(event.target.files)} />
          <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center rounded-2xl border border-dashed border-neutral-700 bg-neutral-950/60 px-4 py-7 text-center transition hover:border-violet-400/60"><FolderUp className="mb-2 h-6 w-6 text-violet-300" /><span className="font-semibold text-neutral-200">اختاري ملفات الموقع أو ملف ZIP</span><span className="mt-1 text-xs text-neutral-500">بحد أقصى 100 ملف و15 ميغابايت</span></button>
          {files.length > 0 && <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3"><div className="mb-2 flex justify-between text-xs font-semibold text-neutral-200"><span>الملفات المحددة ({files.length})</span><button type="button" onClick={() => { setFiles([]); setError(""); }} className="text-neutral-500 hover:text-red-300">إزالة الكل</button></div><div className="max-h-28 space-y-1 overflow-y-auto text-xs text-neutral-400" dir="ltr">{files.slice(0, 12).map((file) => <div key={file.path} className="truncate">{file.path}</div>)}</div></div>}
          {files.length > 0 && !hasEntry && <p className="flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs text-amber-100"><AlertCircle className="h-4 w-4 shrink-0" />أضف index.html في المجلد الرئيسي أو ارفع ZIP يحتوي عليه.</p>}
          {files.length > 0 && !validFiles && <p className="flex gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 text-xs text-red-200"><AlertCircle className="h-4 w-4 shrink-0" />الموقع يحتوي نوع ملف لا يدعمه النشر الثابت.</p>}
          <button disabled={!ready || busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}{busy ? "جارٍ رفع الملفات وتشغيل الموقع..." : "شغّل الموقع واحصل على رابطه"}</button>
          <p className="text-xs leading-5 text-neutral-500">{netlifyConfigured ? "سيستخدم النشر مفتاح Netlify المضبوط على الخادم، أو المفتاح الذي أدخلته هنا. يظهر رابط الموقع بعد تأكيد اكتمال الرفع." : "أدخل مفتاح Netlify الشخصي في الخانة أعلاه؛ يُرسل للخادم وقت النشر فقط ولا يُحفظ. يظهر رابط الموقع بعد تأكيد اكتمال الرفع."}</p>
          {notice && <p className="flex gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-xs text-emerald-100"><CheckCircle2 className="h-4 w-4 shrink-0" />{notice}</p>}
          {error && <p role="alert" className="flex gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 text-xs text-red-200"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
        </form>
        <aside className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 sm:p-5">
          <h3 className="font-bold text-white">المواقع ولوحة الزيارات</h3>
          {sites.length === 0 && <p className="text-xs leading-6 text-neutral-500">المواقع المنشورة ستظهر هنا مع رابط المشاركة وعدد الزيارات.</p>}
          {sites.map((site) => <div key={site.siteId} className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-950/50 p-3">
            <p className="truncate text-sm font-semibold text-neutral-200">{site.name}</p>
            <a href={site.url} target="_blank" rel="noreferrer" className="block truncate text-xs text-cyan-300 hover:underline" dir="ltr">{site.url}</a>
            <button type="button" disabled={analyticsBusy} onClick={() => void loadAnalytics(site.siteId)} className="w-full rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-900 disabled:opacity-50">{analyticsBusy && activeSiteId === site.siteId ? "جارٍ التحميل..." : "عرض لوحة الزيارات"}</button>
          </div>)}
          {analytics && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3"><p className="text-xs text-neutral-300">زيارات الصفحة الإجمالية</p><p className="my-1 text-3xl font-bold text-emerald-200">{analytics.visits}</p><p className="text-xs text-neutral-500">تسجيلات إجمالية غير فريدة منذ النشر</p></div>}
          <p className="border-t border-neutral-800 pt-3 text-xs leading-5 text-neutral-500">تُعدّ الزيارة مرة لكل جلسة تبويب دون حفظ عنوان IP. تعتمد استمرارية الإحصاءات على حفظ مجلد .data في مساحة تخزين دائمة على الخادم.</p>
        </aside>
      </div>
    </div>
  );
};
