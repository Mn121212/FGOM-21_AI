import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Play,
  Copy,
  Check,
  Code2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Terminal,
} from "lucide-react";

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFixedCode?: (code: string) => void;
  onOpenSandboxWithCode?: (code: string) => void;
}

interface Vulnerability {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  line?: string;
  explanation: string;
  cwe?: string;
  fixRecommendation: string;
}

interface AuditResult {
  score: number;
  grade: string;
  summary: string;
  vulnerabilities: Vulnerability[];
  optimizations: string[];
  fixedCode: string;
}

const SAMPLE_CODES = [
  {
    name: "حقن SQL غير مفلتر (SQLi)",
    lang: "javascript",
    code: `// ثغرة حقن SQL واضحة بسبب دمج المدخلات مباشرة
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE user = '" + username + "' AND pass = '" + password + "'";
  const user = await db.query(query);
  
  if (user.length > 0) {
    res.json({ token: "SECRET_KEY_12345", role: user[0].role });
  } else {
    res.status(401).send("Invalid credentials");
  }
});`,
  },
  {
    name: "ثغرة XSS وتسريب مفاتيح API",
    lang: "javascript",
    code: `// ثغرة XSS مباشرة عبر innerHTML ومفتاح سري مكشوف في الكود
const GEMINI_API_SECRET = "AIzaSyD-TEST-UNSAFE-KEY-99999";

function renderComment(userInput) {
  // خطر: إدخال وسم HTML بدون تنظيف يسبب Cross-Site Scripting
  document.getElementById("comments").innerHTML += "<div class='item'>" + userInput + "</div>";
  console.log("Logged with token:", GEMINI_API_SECRET);
}`,
  },
  {
    name: "تضمين ملفات غير آمن (Path Traversal)",
    lang: "javascript",
    code: `// ثغرة قراءة ملفات النظام
app.get('/download', (req, res) => {
  const fileName = req.query.file;
  // خطر: المستخدم يستطيع إرسال ../../etc/passwd
  const filePath = path.join(__dirname, 'public', fileName);
  res.sendFile(filePath);
});`,
  },
];

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({
  isOpen,
  onClose,
  onApplyFixedCode,
  onOpenSandboxWithCode,
}) => {
  const [code, setCode] = useState(SAMPLE_CODES[0].code);
  const [language, setLanguage] = useState(SAMPLE_CODES[0].lang);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedFixed, setCopiedFixed] = useState(false);
  const [activeTab, setActiveTab] = useState<"findings" | "fixed">("findings");

  if (!isOpen) return null;

  const handleRunAudit = async () => {
    if (!code.trim()) return;
    setIsAuditing(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/security/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `خطأ من الخادم (${res.status})`);
      }
      const data: AuditResult = await res.json();
      setAuditResult(data);
      setActiveTab("findings");
    } catch (err: any) {
      setErrorMessage(err.message || "فشل إجراء الفحص الأمني. تأكد من الاتصال.");
    } finally {
      setIsAuditing(false);
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 border-emerald-500/40 bg-emerald-950/40";
    if (score >= 70) return "text-yellow-400 border-yellow-500/40 bg-yellow-950/40";
    return "text-red-400 border-red-500/40 bg-red-950/40";
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-500/50">كارثي (Critical)</span>;
      case "high":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-950 text-orange-300 border border-orange-500/50">عالي (High)</span>;
      case "medium":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-950 text-yellow-300 border border-yellow-500/50">متوسط (Medium)</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-500/50">منخفض (Low)</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden w-full max-w-5xl h-[92vh]">
        {/* Header */}
        <div className="h-14 border-b border-neutral-800 px-4 flex items-center justify-between bg-neutral-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <span>فاحص الأمان والثغرات البرمجية (AI Security & Bug Scanner)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-mono">
                  OWASP Audit
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace Grid */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-neutral-800">
          {/* Left / Top Side: Code Input */}
          <div className="flex flex-col min-h-0 bg-neutral-950">
            {/* Input Toolbar */}
            <div className="p-3 border-b border-neutral-800/80 bg-neutral-900/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 font-medium">اللغة:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="javascript">JavaScript / Node.js</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="php">PHP</option>
                  <option value="sql">SQL / Database</option>
                  <option value="html">HTML / Web</option>
                </select>
              </div>

              {/* Sample vulnerability presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[11px] text-neutral-500 hidden sm:inline">أمثلة سريعة:</span>
                {SAMPLE_CODES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCode(sample.code);
                      setLanguage(sample.lang);
                      setAuditResult(null);
                    }}
                    className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-[10px] text-neutral-300 whitespace-nowrap transition-colors"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Textarea */}
            <div className="flex-1 p-3 min-h-0 relative">
              <textarea
                dir="ltr"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// الصق كودك هنا لفحصه أمنياً وكشف الثغرات ونقاط الضعف..."
                spellCheck={false}
                className="w-full h-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 font-mono text-xs sm:text-sm focus:outline-none focus:border-red-500/50 resize-none leading-relaxed"
              />
            </div>

            {/* Run Button */}
            <div className="p-3 border-t border-neutral-800/80 bg-neutral-900/30 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-neutral-500">
                {code.split("\n").length} سطر • {code.length} حرف
              </span>
              <button
                type="button"
                disabled={isAuditing || !code.trim()}
                onClick={handleRunAudit}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
              >
                {isAuditing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري الفحص المعمق للأمان...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>بدء الفحص الأمني للكود (Audit Now)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right / Bottom Side: Audit Report & Fixed Code */}
          <div className="flex flex-col min-h-0 bg-neutral-950">
            {/* Report Header / Tabs */}
            <div className="p-3 border-b border-neutral-800/80 bg-neutral-900/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("findings")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === "findings"
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  تقرير الثغرات والنتائج ({auditResult?.vulnerabilities?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("fixed")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === "fixed"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  الكود المصحح والآمن 🛡️
                </button>
              </div>

              {auditResult && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold font-mono ${getScoreBadgeColor(
                    auditResult.score
                  )}`}
                >
                  <span>تقييم الأمان:</span>
                  <span>{auditResult.score}/100</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40">
                    Grade {auditResult.grade}
                  </span>
                </div>
              )}
            </div>

            {/* Report Content */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {!auditResult && !isAuditing && !errorMessage && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-500 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
                    <Lock className="w-6 h-6 opacity-60" />
                  </div>
                  <h3 className="text-sm font-bold text-neutral-300">لم يتم فحص الكود بعد</h3>
                  <p className="text-xs text-neutral-500 max-w-sm leading-relaxed">
                    الصق الكود البرمجي في الصندوق المقابل واضغط "بدء الفحص الأمني" للحصول على تقرير الثغرات الأمني وفق معايير OWASP مع الكود المصلح فوراً.
                  </p>
                </div>
              )}

              {isAuditing && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-400 animate-pulse">
                    <ShieldAlert className="w-6 h-6 animate-spin" />
                  </div>
                  <h3 className="text-sm font-bold text-neutral-200">جاري مسح الكود وتحليله...</h3>
                  <p className="text-xs text-neutral-400">
                    فحص الثغرات (SQL Injection, XSS, Buffer Overflow, Token Leaks) وهندسة الحلول الآمنة.
                  </p>
                </div>
              )}

              {auditResult && activeTab === "findings" && (
                <div className="space-y-4">
                  {/* Summary Box */}
                  <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs leading-relaxed text-neutral-200">
                    <p className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>الملخص التنفيذي للأمان:</span>
                    </p>
                    <p className="text-neutral-300">{auditResult.summary}</p>
                  </div>

                  {/* Vulnerabilities List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <span>الثغرات والمخاطر المكتشفة ({auditResult.vulnerabilities.length}):</span>
                    </h4>

                    {auditResult.vulnerabilities.length === 0 ? (
                      <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>تهانينا! لم يتم اكتشاف ثغرات أمنية خطيرة في هذا المقطع البرمجي.</span>
                      </div>
                    ) : (
                      auditResult.vulnerabilities.map((v, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2 hover:border-neutral-700 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-neutral-100 flex items-center gap-1.5">
                              <span>{v.title}</span>
                              {v.cwe && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                                  {v.cwe}
                                </span>
                              )}
                            </span>
                            {getSeverityBadge(v.severity)}
                          </div>

                          {v.line && (
                            <div className="text-[11px] font-mono bg-black/50 px-2 py-1 rounded text-red-300" dir="ltr">
                              الموقع: {v.line}
                            </div>
                          )}

                          <p className="text-xs text-neutral-300 leading-relaxed">{v.explanation}</p>

                          <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-300">
                            <strong>💡 طريقة المعالجة:</strong> {v.fixRecommendation}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Optimizations */}
                  {auditResult.optimizations?.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                      <h4 className="text-xs font-bold text-teal-400">⚡ نصائح الأداء وجودة الكود:</h4>
                      <ul className="list-disc list-inside text-xs text-neutral-400 space-y-1">
                        {auditResult.optimizations.map((opt, i) => (
                          <li key={i}>{opt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {auditResult && activeTab === "fixed" && (
                <div className="h-full flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>الكود المصحح والمؤمن بالكامل:</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(auditResult.fixedCode);
                          setCopiedFixed(true);
                          setTimeout(() => setCopiedFixed(false), 2000);
                        }}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 transition-colors"
                      >
                        {copiedFixed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>نسخ الكود الآمن</span>
                      </button>

                      {onApplyFixedCode && (
                        <button
                          type="button"
                          onClick={() => {
                            onApplyFixedCode(auditResult.fixedCode);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <span>تطبيق في مشروعي</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-h-[300px] bg-black/90 border border-neutral-800 rounded-xl p-3 overflow-auto" dir="ltr">
                    <pre className="text-xs font-mono text-emerald-300 leading-relaxed whitespace-pre-wrap">
                      {auditResult.fixedCode}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
