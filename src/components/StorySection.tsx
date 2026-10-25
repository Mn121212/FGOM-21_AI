import React from "react";
import {
  Sparkles,
  Lock,
  Cpu,
  Code2,
  ShieldCheck,
  ServerOff,
  Terminal,
  Globe2,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";

export const StorySection: React.FC = () => {
  return (
    <div className="space-y-5 text-right animate-in fade-in duration-200" dir="rtl">
      {/* Header Banner with Saudi Pride Badge */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-teal-950/50 to-neutral-900 border border-emerald-500/40 space-y-3 relative overflow-hidden shadow-lg shadow-emerald-950/30">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-500/20 text-[#00E676] font-bold text-sm">
              🇸🇦
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#00E676] border border-emerald-500/30 flex items-center gap-1.5">
              <span>مشروع سعودي 100%</span>
              <span className="text-[10px] text-neutral-400 font-normal">| فخر الصناعة البرمجية الوطنية</span>
            </span>
          </div>
          <span className="font-mono text-xs text-neutral-400 font-extrabold">FGOM21 AI Origin & Mission</span>
        </div>

        <h3 className="text-base sm:text-lg font-extrabold text-neutral-100">
          قصة التأسيس: من شغف تطوير الويب والهواية السيبرانية إلى استوديو ذكاء اصطناعي سيادي
        </h3>
        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-3xl">
          انطلقت منصة <strong className="text-emerald-400">FGOM21 AI</strong> من فكرة فردية ورؤية تقنية طموحة على أرض <strong className="text-emerald-400">المملكة العربية السعودية 🇸🇦</strong>، تهدف إلى تمكين المطور العربي من امتلاك أحدث أدوات الذكاء الاصطناعي وهندسة البرمجيات وتشغيل الأكواد الحية، مع حماية غير مسبوقة تضمن انعدام التتبع وحفظ الأسرار البرمجية.
        </p>
      </div>

      {/* Grid of Story Cards (2 columns on Desktop, 1 on Mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">

        {/* Card 1: تخصص تطوير الويب والشغف السيبراني */}
        <div className="p-4 rounded-2xl bg-[#121214] border border-neutral-800 hover:border-emerald-500/40 transition-all space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#00E676] font-bold text-xs sm:text-sm">
              <Code2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>1. تخصص تطوير الويب وشغف الأمن السيبراني</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              تأسست المنصة بمبادرة ذاتية من المطور <strong>محمد يوسف</strong>، المتخصص في <strong>هندسة وبرمجة تطوير الويب (Full-Stack Web Development)</strong> والشغوف كـ <strong>هاوي وباحث في الأمن السيبراني وحماية النظم (Cybersecurity Enthusiast)</strong>. هذا المزيج الفريد ألهم تصميم بيئة برمجية سريعة، نظيفة، ومحصنة أمنياً تلبي احتياجات المبرمج المحترف والهاوي على حد سواء.
            </p>
          </div>
          <div className="text-[10px] text-emerald-400/90 font-mono pt-2 border-t border-neutral-900 flex items-center justify-between">
            <span>• هندسة الويب وتطوير الواجهات والأنظمة</span>
            <span>🛡️ فكر دفاعي سيبراني</span>
          </div>
        </div>

        {/* Card 2: معمارية الخصوصية وانعدام قواعد البيانات تماماً */}
        <div className="p-4 rounded-2xl bg-[#121214] border border-neutral-800 hover:border-emerald-500/40 transition-all space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-xs sm:text-sm">
              <ServerOff className="w-4 h-4 shrink-0 text-teal-400" />
              <span>2. معمارية انعدام قواعد البيانات (Zero-Database)</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              الموقع <strong>لا يحتوي على أي قواعد بيانات مركزية إطلاقاً</strong> ولا يمتلك أي سيرفر لتخزين بيانات المستخدمين. محادثاتك، مفاتيحك، وأكوادك تُحفظ محلياً فقط داخل جهازك عبر (LocalStorage). <strong>انعدام تام لقواعد البيانات = انعدام مخاطر تسريب البيانات</strong>.
            </p>
          </div>
          <div className="text-[10px] text-teal-400/90 font-mono pt-2 border-t border-neutral-900">
            • 100% Client-Side Storage • No Remote DB
          </div>
        </div>

        {/* Card 3: انعدام تخزين الصور والملفات ومبدأ منع التجسس */}
        <div className="p-4 rounded-2xl bg-[#121214] border border-neutral-800 hover:border-emerald-500/40 transition-all space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>3. لا تخزين للصور والملفات ولا تجسس (Zero Spyware)</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              عند رفع أي ملف أو صورة أو كود برمجى، تتم المعالجة في الذاكرة المؤقتة اللحظية (In-Memory Processing) داخل متصفحك أو عبر اتصال مشفر ينتهي بانتهاء الطلب. <strong>لا نحتفظ بنسخة من أي صورة أو ملف، ولا نستخدم أي أدوات تجسس أو تتبع أو إعلانات مخفية</strong>.
            </p>
          </div>
          <div className="text-[10px] text-cyan-400/90 font-mono pt-2 border-t border-neutral-900">
            • Zero Retention • No File Storage • Anti-Spyware
          </div>
        </div>

        {/* Card 4: تشغيل الأكواد الحية بمكتبات حقيقية ونماذج متعددة */}
        <div className="p-4 rounded-2xl bg-[#121214] border border-neutral-800 hover:border-emerald-500/40 transition-all space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
              <Cpu className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>4. تشغيل حقيقي للأكواد وحزم NPM ومحركات عالمية</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              توفير استوديو تشغيل حي متكامل يحاكي بيئة VS Code مع دعم استيراد وتثبيت حزم <strong>NPM الحقيقية</strong>، تشغيل <strong>React وNode.js</strong> داخل المتصفح، والربط مع أقوى محركات الذكاء الاصطناعي (Gemini, Claude, DeepSeek, OpenAI) دون الحاجة لخوادم وسيطة.
            </p>
          </div>
          <div className="text-[10px] text-emerald-400/90 font-mono pt-2 border-t border-neutral-900">
            • Live Browser Sandbox • NPM Imports • Multi-Engine AI
          </div>
        </div>

      </div>

      {/* Founder Signature & National Identity Footer */}
      <div className="p-4 rounded-2xl bg-[#161618] border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right shadow-inner">
        <div className="flex items-center gap-3">
          <BrandLogo size="md" />
          <div>
            <div className="font-extrabold text-xs text-neutral-100 flex items-center gap-1.5 justify-center sm:justify-start">
              <span>المؤسس والمطور الرئيسي</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-[#00E676] font-bold border border-emerald-500/30">
                FGOM21 Founder
              </span>
            </div>
            <p className="text-[11px] text-neutral-300 mt-0.5">
              <strong>محمد يوسف (Mohammed Yousef)</strong> — مبرمج ومطور ويب شامل | هاوي وباحث أمن سيبراني 🇸🇦
            </p>
          </div>
        </div>

        <div className="text-[11px] sm:text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl font-mono flex items-center gap-1.5 justify-center">
          <span>🇸🇦 فخر البرمجة السعودية — FGOM21 AI</span>
        </div>
      </div>
    </div>
  );
};
