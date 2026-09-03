import React from "react";
import { ShieldAlert, Zap, BookOpen, Repeat, CheckSquare, Layers } from "lucide-react";

interface PromptSuggestionsProps {
  onSelectPrompt: (prompt: string) => void;
}

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ onSelectPrompt }) => {
  const suggestions = [
    {
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      title: "مراجعة كود وتحسين الأداء",
      desc: "تحليل كود معين، تقليل استهلاك الذاكرة، وتسريع المعالجة الزمنية Big-O.",
      prompt: "أريدك أن تراجع هذا الكود البرمجي وتقترح تحسينات لأدائه من حيث السرعة واستهلاك الذاكرة (Big-O)، مع شرح الأسباب باللغة العربية:",
    },
    {
      icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
      title: "تدقيق أمني وفحص الثغرات",
      desc: "فحص أمان الشيفرة بحثاً عن ثغرات OWASP و SQL Injection والتحقق من المدخلات.",
      prompt: "قم بإجراء فحص وتدقيق أمني (Security Audit) شامل للكود المرفق، واكتشف أي ثغرات محتملة مع تقديم الحل البرمجي الآمن لتفاديها:",
    },
    {
      icon: <Layers className="w-4 h-4 text-emerald-400" />,
      title: "معمارية المشروع وهيكلة النظام",
      desc: "تصميم طبقات التطبيق وفق مبادئ Clean Architecture و SOLID.",
      prompt: "ساعدني في تصميم معمارية برمجية احترافية لتطبيق (Architecture Design) تتبع مبادئ SOLID و Clean Code مع تحديد هيكل المجلدات والطبقات:",
    },
    {
      icon: <CheckSquare className="w-4 h-4 text-blue-400" />,
      title: "كتابة اختبارات Unit Tests",
      desc: "توليد حالات اختبار شاملة تغطي الحالات الحدية (Edge Cases) باستخدام إطار الاختبار المناسب.",
      prompt: "اكتب مجموعة متكاملة من اختبارات الوحدة (Unit Tests) لهذا الكود مع تغطية كافة الحالات الحدية (Edge Cases) والتعامل مع الأخطاء:",
    },
    {
      icon: <BookOpen className="w-4 h-4 text-purple-400" />,
      title: "شرح تفصيلي للمفاهيم البرمجية",
      desc: "تبسيط كود معقد أو خوارزمية صعبة خطوة بخطوة مع أمثلة ورسوم بيانية.",
      prompt: "اشرح لي خطوة بخطوة كيف تعمل هذه الخوارزمية مع تفكيك كل دالة ومتغير بلغة عربية مبسطة وأمثلة واقعية:",
    },
    {
      icon: <Repeat className="w-4 h-4 text-cyan-400" />,
      title: "تحويل الكود إلى لغة أخرى",
      desc: "إعادة كتابة الكود من لغة إلى لغة مع الحفاظ على الأداء والأسلوب المعياري.",
      prompt: "قم بتحويل هذا الكود البرمجي إلى لغة برمجية حديثة مع مراعاة أفضل ممارسات تلك اللغة (Idiomatic Code):",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4" dir="rtl">
      <div className="text-right mb-6 space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100 text-right">
          مرحباً بك في <span className="text-emerald-400">FGOM21 AI</span>
        </h2>
        <p className="text-base text-neutral-300 max-w-2xl text-right leading-relaxed">
          المساعد البرمجي الذكي المتقدم المصمم لخدمة المبرمجين العرب. ارفع ملفاتك أو اختر إحدى المهام البرمجية للبدء.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className="flex flex-col text-right p-4 rounded-xl bg-neutral-900/70 hover:bg-neutral-800/90 border border-neutral-800/80 hover:border-emerald-500/50 transition-all group text-neutral-200 cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-lg bg-neutral-800 group-hover:bg-neutral-700/80 transition-colors">
                {item.icon}
              </div>
              <span className="font-bold text-sm sm:text-base text-neutral-100 group-hover:text-emerald-300 transition-colors">
                {item.title}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 leading-relaxed">
              {item.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
