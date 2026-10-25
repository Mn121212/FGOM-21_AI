import React from "react";
import {
  ArrowDown,
  BookOpen,
  CheckSquare,
  CloudUpload,
  Database,
  Layers,
  Network,
  Repeat,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";

interface PromptSuggestionsProps {
  onSelectPrompt: (prompt: string) => void;
  onOpenDeploymentPath: (path: "hosting" | "database") => void;
  onOpenFlowMap: () => void;
}

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  onSelectPrompt,
  onOpenDeploymentPath,
  onOpenFlowMap,
}) => {
  const suggestions = [
    {
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      accent: "hover:border-amber-500/40 hover:shadow-amber-950/20",
      iconBackground: "bg-amber-500/10 group-hover:bg-amber-500/15",
      title: "مراجعة كود وتحسين الأداء",
      desc: "تحليل كود معين، تقليل استهلاك الذاكرة، وتسريع المعالجة الزمنية Big-O.",
      prompt: "أريدك أن تراجع هذا الكود البرمجي وتقترح تحسينات لأدائه من حيث السرعة واستهلاك الذاكرة (Big-O)، مع شرح الأسباب باللغة العربية:",
    },
    {
      icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
      accent: "hover:border-red-500/40 hover:shadow-red-950/20",
      iconBackground: "bg-red-500/10 group-hover:bg-red-500/15",
      title: "تدقيق أمني وفحص الثغرات",
      desc: "فحص أمان الشيفرة بحثاً عن ثغرات OWASP و SQL Injection والتحقق من المدخلات.",
      prompt: "قم بإجراء فحص وتدقيق أمني (Security Audit) شامل للكود المرفق، واكتشف أي ثغرات محتملة مع تقديم الحل البرمجي الآمن لتفاديها:",
    },
    {
      icon: <Layers className="w-4 h-4 text-emerald-400" />,
      accent: "hover:border-emerald-500/40 hover:shadow-emerald-950/20",
      iconBackground: "bg-emerald-500/10 group-hover:bg-emerald-500/15",
      title: "معمارية المشروع وهيكلة النظام",
      desc: "تصميم طبقات التطبيق وفق مبادئ Clean Architecture و SOLID.",
      prompt: "ساعدني في تصميم معمارية برمجية احترافية لتطبيق (Architecture Design) تتبع مبادئ SOLID و Clean Code مع تحديد هيكل المجلدات والطبقات:",
    },
    {
      icon: <CheckSquare className="w-4 h-4 text-blue-400" />,
      accent: "hover:border-blue-500/40 hover:shadow-blue-950/20",
      iconBackground: "bg-blue-500/10 group-hover:bg-blue-500/15",
      title: "كتابة اختبارات Unit Tests",
      desc: "توليد حالات اختبار شاملة تغطي الحالات الحدية (Edge Cases) باستخدام إطار الاختبار المناسب.",
      prompt: "اكتب مجموعة متكاملة من اختبارات الوحدة (Unit Tests) لهذا الكود مع تغطية كافة الحالات الحدية (Edge Cases) والتعامل مع الأخطاء:",
    },
    {
      icon: <BookOpen className="w-4 h-4 text-purple-400" />,
      accent: "hover:border-purple-500/40 hover:shadow-purple-950/20",
      iconBackground: "bg-purple-500/10 group-hover:bg-purple-500/15",
      title: "شرح تفصيلي للمفاهيم البرمجية",
      desc: "تبسيط كود معقد أو خوارزمية صعبة خطوة بخطوة مع أمثلة ورسوم بيانية.",
      prompt: "اشرح لي خطوة بخطوة كيف تعمل هذه الخوارزمية مع تفكيك كل دالة ومتغير بلغة عربية مبسطة وأمثلة واقعية:",
    },
    {
      icon: <Repeat className="w-4 h-4 text-cyan-400" />,
      accent: "hover:border-cyan-500/40 hover:shadow-cyan-950/20",
      iconBackground: "bg-cyan-500/10 group-hover:bg-cyan-500/15",
      title: "تحويل الكود إلى لغة أخرى",
      desc: "إعادة كتابة الكود من لغة إلى لغة مع الحفاظ على الأداء والأسلوب المعياري.",
      prompt: "قم بتحويل هذا الكود البرمجي إلى لغة برمجية حديثة مع مراعاة أفضل ممارسات تلك اللغة (Idiomatic Code):",
    },
    {
      icon: <CloudUpload className="w-4 h-4 text-violet-400" />,
      accent: "hover:border-violet-500/40 hover:shadow-violet-950/20",
      iconBackground: "bg-violet-500/10 group-hover:bg-violet-500/15",
      title: "نشر واستضافة المشاريع",
      desc: "أضف مشاريع GitHub متعددة، واربط حسابات الاستضافة لإدارة تجهيز النشر من مكان واحد.",
      path: "hosting" as const,
    },
    {
      icon: <Database className="w-4 h-4 text-teal-400" />,
      accent: "hover:border-teal-500/40 hover:shadow-teal-950/20",
      iconBackground: "bg-teal-500/10 group-hover:bg-teal-500/15",
      title: "إنشاء وربط قواعد البيانات",
      desc: "جهّز مسار ربط قواعد مشروعك بخدمات مثل Supabase وNeon وPlanetScale وTurso.",
      path: "database" as const,
    },
    {
      icon: <Network className="w-4 h-4 text-indigo-400" />,
      accent: "hover:border-indigo-500/40 hover:shadow-indigo-950/20",
      iconBackground: "bg-indigo-500/10 group-hover:bg-indigo-500/15",
      title: "خريطة تفاعلية لكيفية عمل الموقع",
      desc: "اكتب فكرة موقعك وحوّلها إلى مخطط تفاعلي يشرح رحلة المستخدم وتدفق النظام من البداية إلى النهاية.",
      flowMap: true,
    },
  ];

  return (
    <section className="mx-auto my-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8 2xl:px-10" dir="rtl" aria-labelledby="welcome-heading">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-8">
        <div className="space-y-3 text-right">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1 text-xs font-semibold text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            مساحة عمل ذكية للمطورين
          </div>
          <h2 id="welcome-heading" className="text-2xl font-bold tracking-tight text-neutral-100 sm:text-3xl">
            مرحباً بك في <span className="text-emerald-400">FGOM21 AI</span>
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-neutral-400 sm:text-base">
            اختر مساراً للبدء، أو ارفع ملفاتك واكتب طلبك مباشرة. ستتم إضافة قالب المهمة إلى المحرر لتعديله قبل الإرسال.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-xs text-neutral-400">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-neutral-800 text-emerald-300">
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span><strong className="text-neutral-200">٩</strong> مسارات جاهزة</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 2xl:gap-4">
        {suggestions.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => {
              if ("flowMap" in item) {
                onOpenFlowMap();
              } else if ("path" in item) {
                onOpenDeploymentPath(item.path);
              } else {
                onSelectPrompt(item.prompt);
              }
            }}
            className={`group flex min-h-36 flex-col rounded-2xl border border-neutral-800/90 bg-neutral-900/55 p-4 text-right text-neutral-200 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:p-5 2xl:min-h-40 ${item.accent}`}
          >
            <div className="mb-3 flex w-full min-w-0 items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.04] transition-colors ${item.iconBackground}`}>
                {item.icon}
              </div>
              <div className="min-w-0 flex-1 break-words text-sm font-bold leading-6 text-neutral-100 transition-colors group-hover:text-white sm:text-base">
                {item.title}
              </div>
            </div>
            <p className="mb-4 text-xs leading-6 text-neutral-400 sm:text-sm">
              {item.desc}
            </p>
            <span className="mt-auto flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition-colors group-hover:text-emerald-300">
              {"path" in item || "flowMap" in item ? "افتح هذا المسار" : "أضف القالب إلى المحرر"}
              <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
