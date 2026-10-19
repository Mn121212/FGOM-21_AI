import React, { useEffect, useState } from "react";
import { Terminal, Cpu, Sparkles, CheckCircle2, ShieldCheck, Code2 } from "lucide-react";

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(10);
  const [currentStep, setCurrentStep] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const steps = [
    "تهيئة بيئة البرمجة الذكية وتطوير الواجهات...",
    "فحص محركات الذكاء الاصطناعي وربط الموديلات البرمجية...",
    "تحميل استوديو VS Code والمحرر الذكي والأدوات المتقدمة...",
    "اكتمل تجهيز المنصة بنجاح! مرحباً بك في FGOM21 AI",
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(40);
      setCurrentStep(1);
    }, 350);

    const timer2 = setTimeout(() => {
      setProgress(75);
      setCurrentStep(2);
    }, 750);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setCurrentStep(3);
    }, 1150);

    const timer4 = setTimeout(() => {
      setIsFadingOut(true);
    }, 1500);

    const timer5 = setTimeout(() => {
      onFinish();
    }, 1850);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [onFinish]);

  return (
    <div
      dir="rtl"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950 text-neutral-100 transition-opacity duration-300 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-right">
        {/* Brand Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-0.5 shadow-2xl shadow-emerald-950 flex items-center justify-center animate-pulse">
            <div className="w-full h-full bg-neutral-950 rounded-[22px] flex items-center justify-center text-emerald-400">
              <Terminal className="w-10 h-10" />
            </div>
          </div>
          <div className="absolute -bottom-1 -left-1 p-1 rounded-full bg-emerald-500 text-neutral-950">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold font-mono tracking-wider text-neutral-100 mb-1">
          FGOM21 AI
        </h1>
        <p className="text-xs text-neutral-400 mb-8 font-sans">
          المنصة الذكية المتكاملة لهندسة البرمجيات وتطوير الأكواد
        </p>

        {/* Loading Progress Bar */}
        <div className="w-full bg-neutral-900 border border-neutral-800 rounded-full h-2 overflow-hidden mb-3 p-0.5 shadow-inner">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Text & Percentage */}
        <div className="w-full flex items-center justify-between text-[11px] text-neutral-400 mb-6">
          <span className="truncate max-w-[280px] font-sans text-emerald-300">
            {steps[currentStep]}
          </span>
          <span className="font-mono text-neutral-500 font-bold">{progress}%</span>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center gap-2 text-[10px] text-neutral-500">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800">
            <Code2 className="w-3 h-3 text-emerald-400" />
            <span>استوديو أكواد حية</span>
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800">
            <Cpu className="w-3 h-3 text-teal-400" />
            <span>وكيل ذاتي</span>
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            <span>فحص أمني</span>
          </span>
        </div>

        {/* Skip button if user doesn't want to wait */}
        <button
          type="button"
          onClick={() => {
            setIsFadingOut(true);
            setTimeout(onFinish, 200);
          }}
          className="mt-8 text-xs text-neutral-500 hover:text-neutral-300 underline cursor-pointer"
        >
          تخطي شاشة التحميل والدخول المباشر
        </button>
      </div>
    </div>
  );
};
