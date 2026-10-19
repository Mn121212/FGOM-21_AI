import React, { useState } from "react";
import {
  X,
  GitBranch,
  Star,
  GitFork,
  AlertCircle,
  FileText,
  FolderTree,
  ExternalLink,
  Search,
  Sparkles,
  Shield,
  BookOpen,
  ArrowRight,
  Check,
  Copy,
  RefreshCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface GitHubInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRepoChat: (repoInfo: any, prompt: string) => void;
}

interface RepoData {
  name: string;
  fullName: string;
  owner: string;
  avatarUrl?: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  language: string;
  license: string;
  htmlUrl: string;
  updatedAt: string;
  readme: string;
  files: Array<{ name: string; path: string; type: string; size: number }>;
}

export const GitHubInspectorModal: React.FC<GitHubInspectorModalProps> = ({
  isOpen,
  onClose,
  onStartRepoChat,
}) => {
  const [repoInput, setRepoInput] = useState("mohammedyousef8099/FGOM21-AI");
  const [isLoading, setIsLoading] = useState(false);
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"readme" | "files">("readme");
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const handleInspect = async (targetRepo?: string) => {
    const query = (targetRepo || repoInput).trim();
    if (!query) return;

    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/github/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: query }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `خطأ في الاتصال (${res.status})`);
      }

      setRepoData(data.repo);
    } catch (err: any) {
      setErrorMessage(err.message || "تعذر جلب بيانات المستودع من GitHub.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPromptToChat = (actionType: "general" | "security" | "readme" | "architecture") => {
    if (!repoData) return;

    let prompt = "";
    if (actionType === "security") {
      prompt = `أريد فحصاً أمنياً شاملاً لمستودع (${repoData.fullName}) على GitHub.\nملفات المستودع:\n${repoData.files.map(f => f.name).join(", ")}\nيرجى فحص المخاطر الأمنية وتحديثات الحزم.`;
    } else if (actionType === "readme") {
      prompt = `قم بتوليد وتحسين ملف README.md احترافي باللغة العربية والإنجليزية لمستودع (${repoData.fullName})، مع إضافة الشارات والتعليمات.`;
    } else if (actionType === "architecture") {
      prompt = `قم بتحليل معماري لهيكل المشروع (${repoData.fullName}) واقتراح أفضل الممارسات البرمجية لتطويره.`;
    } else {
      prompt = `لدي مستودع (${repoData.fullName}) على GitHub بلغة (${repoData.language})، وأرغب في مناقشته وتطويره معك.`;
    }

    onStartRepoChat(repoData, prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden w-full max-w-5xl h-[92vh]">
        {/* Modal Header */}
        <div className="h-14 border-b border-neutral-800 px-4 flex items-center justify-between bg-neutral-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <span>مستكشف ومحلل مستودعات GitHub (Repo Inspector & Chat)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-mono">
                  Live GitHub API
                </span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Presets */}
        <div className="p-3 border-b border-neutral-800/80 bg-neutral-900/30 space-y-2 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleInspect();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-neutral-500" />
              <input
                type="text"
                dir="ltr"
                placeholder="رابط المستودع أو اسم المستخدم/المشروع (مثال: mohammedyousef8099/FGOM21-AI)"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500/60 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !repoInput.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">جاري الفحص...</span>
                </>
              ) : (
                <>
                  <GitBranch className="w-4 h-4" />
                  <span>فحص المستودع</span>
                </>
              )}
            </button>
          </form>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-500 text-[11px]">مستودعات شائعة:</span>
            <button
              type="button"
              onClick={() => {
                setRepoInput("mohammedyousef8099/FGOM21-AI");
                handleInspect("mohammedyousef8099/FGOM21-AI");
              }}
              className="px-2.5 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-blue-400 hover:text-blue-300 text-[11px] font-mono transition-colors"
            >
              mohammedyousef8099/FGOM21-AI ⚡
            </button>
            <button
              type="button"
              onClick={() => {
                setRepoInput("facebook/react");
                handleInspect("facebook/react");
              }}
              className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-[11px] font-mono transition-colors"
            >
              facebook/react
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!repoData && !isLoading && !errorMessage && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
                <GitBranch className="w-6 h-6 opacity-60 text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-neutral-200">أدخل رابط أي مستودع على GitHub</h3>
              <p className="text-xs text-neutral-500 max-w-sm leading-relaxed">
                يقوم النظام بالاتصال بـ GitHub وجلب ملفات المشروع والـ README لتتمكن من فحص أمانه، وتوليد وثائق برمجية، ومناقشة تفاصيل الكود بالذكاء الاصطناعي.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-xs text-neutral-400">جاري الاتصال بـ GitHub API وقراءة بيانات المستودع...</p>
            </div>
          )}

          {repoData && (
            <div className="space-y-4">
              {/* Repo Overview Card */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {repoData.avatarUrl && (
                      <img
                        src={repoData.avatarUrl}
                        alt={repoData.owner}
                        className="w-10 h-10 rounded-xl border border-neutral-800"
                      />
                    )}
                    <div>
                      <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2 font-mono" dir="ltr">
                        <span>{repoData.fullName}</span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">{repoData.description}</p>
                    </div>
                  </div>

                  <a
                    href={repoData.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
                  >
                    <span>فتح في GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-neutral-800/80 text-xs text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{repoData.stars} نجمة</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GitFork className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{repoData.forks} تفرع (Fork)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{repoData.openIssues} قضايا مفتوحة</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="font-mono">{repoData.language}</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono">
                    الفرع الأساسي: {repoData.defaultBranch}
                  </div>
                </div>
              </div>

              {/* AI Quick Actions Bar */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/40 via-neutral-900 to-emerald-950/40 border border-blue-500/20 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>إجراءات الذكاء الاصطناعي الذكية على المستودع:</span>
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendPromptToChat("architecture")}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-xs text-neutral-200 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>تحليل المعمارية</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendPromptToChat("security")}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-xs text-red-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-red-400" />
                    <span>فحص أمان المستودع</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendPromptToChat("readme")}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-xs text-emerald-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>توليد README احترافي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendPromptToChat("general")}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>محادثة حول هذا المستودع</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tabs for README / Files */}
              <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950">
                <div className="h-10 border-b border-neutral-800 bg-neutral-900/60 px-4 flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("readme")}
                    className={`flex items-center gap-1.5 font-semibold transition-colors h-full border-b-2 ${
                      activeTab === "readme"
                        ? "border-blue-500 text-blue-400"
                        : "border-transparent text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>وثيقة README.md</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("files")}
                    className={`flex items-center gap-1.5 font-semibold transition-colors h-full border-b-2 ${
                      activeTab === "files"
                        ? "border-blue-500 text-blue-400"
                        : "border-transparent text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>ملفات المستودع ({repoData.files.length})</span>
                  </button>
                </div>

                <div className="p-4 max-h-[400px] overflow-y-auto">
                  {activeTab === "readme" && (
                    <div className="prose prose-invert prose-sm max-w-none text-right">
                      {repoData.readme ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{repoData.readme}</ReactMarkdown>
                      ) : (
                        <div className="text-neutral-500 italic py-6 text-center">
                          لا يوجد ملف README.md في هذا المستودع. انقر بالأعلى على "توليد README احترافي" لإنشاء واحد فوراً!
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "files" && (
                    <div className="space-y-1.5 font-mono text-xs" dir="ltr">
                      {repoData.files.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/60 border border-neutral-850 hover:bg-neutral-850 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {file.type === "dir" ? (
                              <FolderTree className="w-4 h-4 text-yellow-400" />
                            ) : (
                              <FileText className="w-4 h-4 text-blue-400" />
                            )}
                            <span className="text-neutral-200">{file.name}</span>
                          </div>
                          <span className="text-[11px] text-neutral-500">
                            {file.type === "dir" ? "مجلد" : `${Math.round(file.size / 1024)} KB`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
