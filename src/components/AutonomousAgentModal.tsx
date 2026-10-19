import React, { useState } from "react";
import {
  X,
  Bot,
  Sparkles,
  Play,
  CheckCircle2,
  FileCode,
  FolderCode,
  Copy,
  Check,
  Download,
  Terminal,
  ArrowRight,
  Layers,
  Cpu,
  RefreshCw,
  Eye,
} from "lucide-react";

interface AutonomousAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInSandbox: (html: string, css: string, js: string) => void;
  onSendToChat?: (text: string) => void;
}

interface AgentStep {
  id: number;
  title: string;
  status: "pending" | "running" | "completed";
  details: string;
}

interface AgentFile {
  name: string;
  language: string;
  description: string;
  content: string;
}

interface AgentResult {
  title: string;
  summary: string;
  steps: AgentStep[];
  files: AgentFile[];
  runInstructions: string;
}

const PRESET_TASKS = [
  {
    title: "تطبيق إدارة مهام كامل (Todo Kanban)",
    task: "ابنِ تطبيق إدارة مهام ومشاريع بنظام كانبان (Kanban Board) متكامل في المتصفح مع حفظ تلقائي في LocalStorage وإمكانية السحب والإفلات وتصميم داكن فخم.",
  },
  {
    title: "حاسبة مالية ومحول عملات تفاعلي",
    task: "صمم حاسبة مالية تفاعلية تحسب الفائدة والخصم ومحول عملات مع رسوم بيانية مبسطة بالـ Canvas وتصميم متجاوب.",
  },
  {
    title: "نظام مصادقة وتسجيل دخول آمن",
    task: "بناء واجهة تسجيل دخول وتسجيل حساب مع التحقق الصارم من قوة كلمة المرور، وفلترة المدخلات ضد هجمات XSS، وتوليد توكن تجريبي.",
  },
  {
    title: "لوحة تحكم إحصائيات للمبرمج (Dev Dashboard)",
    task: "صمم لوحة تحكم عصرية للمطورين تعرض بطاقات إحصائيات حية، ومؤشرات أداء، ومحول نصوص برمجية مع دعم الوضع الليلي.",
  },
];

export const AutonomousAgentModal: React.FC<AutonomousAgentModalProps> = ({
  isOpen,
  onClose,
  onOpenInSandbox,
  onSendToChat,
}) => {
  const [taskPrompt, setTaskPrompt] = useState(PRESET_TASKS[0].task);
  const [techStack, setTechStack] = useState("HTML5 / Modern CSS / Vanilla JavaScript");
  const [isRunning, setIsRunning] = useState(false);
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedFile, setCopiedFile] = useState(false);
  const [agentLog, setAgentLog] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleRunAgent = async () => {
    if (!taskPrompt.trim()) return;

    setIsRunning(true);
    setErrorMessage("");
    setAgentLog([
      "⚡ بدء تشغيل الوكيل البرمجي الذكي FGOM21 Autonomous Agent...",
      "🔍 تحليل المتطلبات البرمجية وتفكيك المهام...",
      "📐 تخطيط البنية المعمارية وهندسة الملفات...",
    ]);

    try {
      const res = await fetch("/api/agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskPrompt, techStack }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `خطأ من الوكيل (${res.status})`);
      }

      const data: AgentResult = await res.json();
      setAgentResult(data);
      setActiveFileIndex(0);
      setAgentLog((prev) => [
        ...prev,
        "✅ تم بناء الملفات البرمجية بالكامل بنجاح!",
        "🛡️ تم تطبيق معايير الأمان والتجاوب للواجهات.",
      ]);
    } catch (err: any) {
      setErrorMessage(err.message || "حدث خطأ أثناء تشغيل الوكيل.");
      setAgentLog((prev) => [...prev, `❌ خطأ: ${err.message || "فشل العملية"}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleLaunchInSandbox = () => {
    if (!agentResult?.files) return;

    let html = "";
    let css = "";
    let js = "";

    agentResult.files.forEach((f) => {
      const lower = f.name.toLowerCase();
      if (lower.endsWith(".html") || f.language === "html") html += f.content + "\n";
      else if (lower.endsWith(".css") || f.language === "css") css += f.content + "\n";
      else if (lower.endsWith(".js") || lower.endsWith(".ts") || f.language === "javascript") js += f.content + "\n";
    });

    onOpenInSandbox(html, css, js);
    onClose();
  };

  const currentFile = agentResult?.files?.[activeFileIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden w-full max-w-5xl h-[92vh]">
        {/* Modal Header */}
        <div className="h-14 border-b border-neutral-800 px-4 flex items-center justify-between bg-neutral-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <span>الوكيل البرمجي الذكي ذاتي التنفيذ (Autonomous AI Agent)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 font-mono">
                  Autonomous Builder
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

        {/* Workspace Grid */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-neutral-800">
          {/* Left Side: Task Specification */}
          <div className="flex flex-col min-h-0 bg-neutral-950 p-4 space-y-4 overflow-y-auto">
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>حدد المهمة البرمجية للوكيل:</span>
              </label>
              <p className="text-[11px] text-neutral-500">
                يقوم الوكيل بتحليل المهمة ذاتياً، وتوليد هيكل الملفات وكتابة الأكواد الكاملة بدون تدخل يدوي.
              </p>
            </div>

            <textarea
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              rows={4}
              placeholder="اكتب فكرة التطبيق أو المهمة البرمجية بالكامل بالتفصيل..."
              className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-teal-500/50 resize-none leading-relaxed"
            />

            {/* Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-neutral-400 font-medium">أفكار ومشاريع جاهزة للتنفيذ الذاتي:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_TASKS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTaskPrompt(preset.task)}
                    className="p-2 rounded-lg bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 text-right text-[11px] text-neutral-300 transition-colors hover:text-white"
                  >
                    <div className="font-bold text-teal-400 mb-0.5">{preset.title}</div>
                    <div className="text-neutral-500 line-clamp-1">{preset.task}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tech Stack Selection */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-300">التقنيات المستهدفة:</label>
              <input
                type="text"
                dir="ltr"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 font-mono focus:outline-none"
              />
            </div>

            {/* Launch Button */}
            <button
              type="button"
              disabled={isRunning || !taskPrompt.trim()}
              onClick={handleRunAgent}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-950/40 transition-all cursor-pointer"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>الوكيل يقوم بهندسة وبناء المشروع الآن...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>إطلاق الوكيل البرمجي الذاتي (Run Autonomous Agent)</span>
                </>
              )}
            </button>

            {/* Live Terminal Progress Log */}
            <div className="p-3 rounded-xl bg-black/80 border border-neutral-850 font-mono text-[11px] space-y-1" dir="ltr">
              <div className="flex items-center justify-between text-neutral-500 text-[10px] pb-1 border-b border-neutral-900">
                <span>Agent Execution Terminal</span>
                <span>{isRunning ? "Running..." : "Idle"}</span>
              </div>
              {agentLog.map((log, idx) => (
                <div key={idx} className="text-teal-300 py-0.5">
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Generated Files & Architecture */}
          <div className="flex flex-col min-h-0 bg-neutral-950">
            {errorMessage && (
              <div className="p-4 bg-red-950/50 border-b border-red-500/50 text-red-300 text-xs">
                {errorMessage}
              </div>
            )}

            {!agentResult && !isRunning && !errorMessage && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-neutral-500">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-teal-400">
                  <Bot className="w-6 h-6 opacity-60" />
                </div>
                <h3 className="text-sm font-bold text-neutral-200">الوكيل بانتظار تكليفه بالمهمة</h3>
                <p className="text-xs text-neutral-500 max-w-sm leading-relaxed">
                  اختر أحد المشاريع الجاهزة أو اكتب فكرتك واضغط "إطلاق الوكيل" ليشيد لك هيكل الملفات وكتابة الأكواد القابلة للتشغيل المباشر.
                </p>
              </div>
            )}

            {isRunning && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-950/40 border border-teal-500/40 flex items-center justify-center text-teal-400 animate-pulse">
                  <Cpu className="w-6 h-6 animate-spin" />
                </div>
                <h3 className="text-sm font-bold text-neutral-200">الوكيل يكتب الشيفرات البرمجية...</h3>
                <p className="text-xs text-neutral-400 max-w-xs">
                  توليد كود كامل خالٍ من النواقص وقابل للتشغيل الفوري في استوديو الأكواد.
                </p>
              </div>
            )}

            {agentResult && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Project Title & Sandbox Launch Bar */}
                <div className="p-3 border-b border-neutral-800 bg-neutral-900/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div>
                    <h3 className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                      <FolderCode className="w-4 h-4 text-teal-400" />
                      <span>{agentResult.title}</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLaunchInSandbox}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>تشغيل فوري في استوديو الأكواد</span>
                    </button>
                  </div>
                </div>

                {/* Steps Overview */}
                <div className="px-4 py-2 border-b border-neutral-800/80 bg-neutral-900/20 text-xs">
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {agentResult.steps.map((step) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{step.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* File Tabs */}
                <div className="h-10 border-b border-neutral-800 bg-neutral-900/40 px-3 flex items-center gap-1 overflow-x-auto shrink-0" dir="ltr">
                  {agentResult.files.map((file, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveFileIndex(idx)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                        activeFileIndex === idx
                          ? "bg-neutral-800 text-teal-400 border border-neutral-700/60 font-bold"
                          : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>{file.name}</span>
                    </button>
                  ))}
                </div>

                {/* Active File Content Viewer */}
                {currentFile && (
                  <div className="flex-1 flex flex-col min-h-0 bg-neutral-950">
                    <div className="h-8 border-b border-neutral-850 px-4 flex items-center justify-between bg-black/30 text-xs text-neutral-400">
                      <span className="font-mono" dir="ltr">{currentFile.name} ({currentFile.description})</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(currentFile.content);
                          setCopiedFile(true);
                          setTimeout(() => setCopiedFile(false), 2000);
                        }}
                        className="flex items-center gap-1 text-[11px] text-neutral-300 hover:text-white"
                      >
                        {copiedFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>نسخ الكود</span>
                      </button>
                    </div>

                    <div className="flex-1 p-4 overflow-auto bg-black/90 font-mono text-xs text-neutral-200" dir="ltr">
                      <pre className="leading-relaxed whitespace-pre-wrap">{currentFile.content}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
