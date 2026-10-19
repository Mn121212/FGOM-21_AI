import React, { useState } from "react";
import {
  X,
  Compass,
  Plus,
  Play,
  Bot,
  ShieldAlert,
  GitBranch,
  Terminal,
  Paperclip,
  Key,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface OnboardingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSandbox?: () => void;
  onOpenAgent?: () => void;
  onOpenSecurity?: () => void;
  onOpenGitHub?: () => void;
  onOpenSettings?: () => void;
}

export const OnboardingGuideModal: React.FC<OnboardingGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenSandbox,
  onOpenAgent,
  onOpenSecurity,
  onOpenGitHub,
  onOpenSettings,
}) => {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const guideItems = [
    {
      id: "new-chat",
      title: "1. زر 'محادثة برمجية جديدة'",
      icon: Plus,
      color: "emerald",
      badge: "البداية السريعة",
      description:
        "يبدأ لك جلسة عمل برمجية نظيفة وجديدة بالكامل. يمكنك من خلاله مناقشة فكرة تطبيق جديدة أو البدء في كتابة مشروع من الصفر دون تداخل مع الجلسات السابقة.",
      tip: "تُحفظ جميع محادثاتك تلقائياً في القائمة الجانبية للرجوع إليها في أي وقت.",
    },
    {
      id: "sandbox",
      title: "2. زر 'استوديو الأكواد الحية' (Code Studio & Sandbox)",
      icon: Play,
      color: "emerald",
      badge: "تشغيل ومعاينة حية",
      description:
        "بيئة تطوير كاملة تحاكي VS Code مع ميزة الإكمال التلقائي الذكي (IntelliSense) بمجرد كتابة حرف واحد. تتيح لك كتابة HTML وCSS وJavaScript ومعاينتها حية في نفس اللحظة مع متصفح ونافذة Console تفاعلية.",
      actionLabel: "تجربة استوديو الأكواد الآن",
      action: () => {
        onClose();
        onOpenSandbox?.();
      },
      tip: "يمكنك تشغيل أي كود يكتبه لك الذكاء الاصطناعي في الشات بضغطة زر واحدة بجانب الكود!",
    },
    {
      id: "agent",
      title: "3. زر 'الوكيل الذاتي' (Autonomous AI Agent)",
      icon: Bot,
      color: "teal",
      badge: "بناء مشاريع ذاتية",
      description:
        "وكيل برمجي ذاتي التفكير؛ فقط اكتب له فكرة تطبيقك أو اختر من المشاريع الجاهزة، وسيقوم بتفكيك المتطلبات، وهندسة البنية التحتية، وتوليد كامل الملفات البرمجية الجاهزة للتشغيل.",
      actionLabel: "فتح الوكيل الذاتي الآن",
      action: () => {
        onClose();
        onOpenAgent?.();
      },
      tip: "الملفات الناتجة يمكن نقلها إلى استوديو الأكواد وتشغيلها مباشرة أمامك بنقرة زر.",
    },
    {
      id: "security",
      title: "4. زر 'فاحص الأمان وجودة الأكواد' (Security Audit)",
      icon: ShieldAlert,
      color: "red",
      badge: "حماية ومعايير OWASP",
      description:
        "فاحص أمن سيبراني متقدم؛ الصق فيه أي كود لديك ليكتشف الثغرات الأمنية الخطيرة وحقن SQL وXSS وضعف التشفير، ويعطيك تقييماً دقيقاً مع الكود الآمن المصحح فوراً.",
      actionLabel: "فتح فاحص الأمان",
      action: () => {
        onClose();
        onOpenSecurity?.();
      },
      tip: "بإمكانك فحص أمان أي كود يكتبه لك الذكاء الاصطناعي في المحادثة عبر زر 'فحص الأمان' بجانبه.",
    },
    {
      id: "github",
      title: "5. زر 'مستودع GitHub' (Repo Inspector)",
      icon: GitBranch,
      color: "blue",
      badge: "تحليل المستودعات",
      description:
        "يقرأ أي رابط لمستودع مفتوح على GitHub، يستعرض شجرة الملفات، ووثيقة README، وإحصائيات النجوم والتفرعات، مع إمكانية فحص أمان المستودع ومناقشة تفاصيله مع الذكاء الاصطناعي.",
      actionLabel: "فتح مستودع GitHub",
      action: () => {
        onClose();
        onOpenGitHub?.();
      },
      tip: "جرب فحص مستودعك الخاص أو أي مشروع عالمي ترغب بفهم هيكليته.",
    },
    {
      id: "devmode",
      title: "6. زر 'وضع المطور (Developer Mode)'",
      icon: Terminal,
      color: "amber",
      badge: "كود نقي ومباشر",
      description:
        "عند تفعيل هذا الزر في الشريط العلوي، يركز الذكاء الاصطناعي على كتابة الأكواد البرمجية فقط بأعلى دقة دون إطالة أو مقدمات نصية غير ضرورية، وهو مثالي للمبرمجين أثناء كتابة المشاريع الكبيرة.",
      tip: "يمكنك تشغيله وإيقافه في أي ثانية من الشريط العلوي بجانب اختيار النموذج.",
    },
    {
      id: "files",
      title: "7. زر 'إرفاق الملفات والصور' (Vision & Multi-Files)",
      icon: Paperclip,
      color: "purple",
      badge: "تحليل بصري وملفات",
      description:
        "يتيح لك رفع ملفات برمجية كاملة لقراءتها وتحليلها، أو رفع صورة لواجهة أو تطبيق (UI Mockup) ليقوم الذكاء الاصطناعي برؤيتها وتحويلها إلى كود كامل ومتجاوب.",
      tip: "يدعم رفع صور PNG/JPG/WebP والأكواد البرمجية لجميع لغات البرمجة.",
    },
    {
      id: "settings",
      title: "8. زر 'الإعدادات والدعم الفني وسياسة الخصوصية'",
      icon: Key,
      color: "neutral",
      badge: "تخصيص كامل ودعم 24/7",
      description:
        "من خلاله يمكنك ربط مفاتيح API الخاصة بك (OpenAI, Gemini, DeepSeek, Groq, Claude)، كما تجد فيه قسماً مخصصاً للدعم الفني المباشر للتواصل مع المطور، وسياسة الخصوصية والشروط.",
      actionLabel: "فتح الإعدادات",
      action: () => {
        onClose();
        onOpenSettings?.();
      },
      tip: "مفاتيحك تحفظ محلياً فقط في متصفحك ولا يتم مشاركتها أبداً.",
    },
  ];

  const current = guideItems[activeStep];
  const CurrentIcon = current.icon;

  const handleFinish = () => {
    try {
      localStorage.setItem("fgom21_guide_seen", "true");
    } catch (_) {}
    onClose();
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs text-right"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <span>دليل أزرار المنصة (Platform Guide)</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                  {activeStep + 1} من {guideItems.length}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                تعرف على وظيفة كل زر رئيسي في المنصة لتحقيق أقصى استفادة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-neutral-950/40 border-b border-neutral-800/80 overflow-x-auto">
          {guideItems.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`flex-1 h-1.5 rounded-full transition-all cursor-pointer ${
                activeStep === idx
                  ? "bg-emerald-500"
                  : idx < activeStep
                  ? "bg-emerald-500/40"
                  : "bg-neutral-800"
              }`}
              title={item.title}
            />
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-emerald-400 shrink-0 shadow-inner">
              <CurrentIcon className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-neutral-100">{current.title}</h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-medium">
                  {current.badge}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                {current.description}
              </p>
            </div>
          </div>

          {/* Practical Tip */}
          <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-300 leading-relaxed">
              <strong className="text-emerald-400 font-semibold">نصيحة عملية: </strong>
              {current.tip}
            </div>
          </div>

          {/* Direct Try Action Button */}
          {current.action && current.actionLabel && (
            <div className="pt-1">
              <button
                type="button"
                onClick={current.action}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs text-emerald-400 font-bold transition-colors cursor-pointer"
              >
                <span>{current.actionLabel}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Nav Controls */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 disabled:opacity-40 text-xs text-neutral-200 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <button
              type="button"
              disabled={activeStep === guideItems.length - 1}
              onClick={() => setActiveStep((prev) => Math.min(guideItems.length - 1, prev + 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 disabled:opacity-40 text-xs text-neutral-200 transition-colors cursor-pointer"
            >
              <span>التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-950/50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>فهمت، ابدأ العمل في المنصة!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
