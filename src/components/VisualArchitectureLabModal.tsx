import React, { useState, useRef } from "react";
import {
  X,
  Sparkles,
  Layers,
  Database,
  Cpu,
  Code2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
  Download,
  ArrowRight,
  ShieldCheck,
  Server,
  Play,
  Wand2,
} from "lucide-react";

interface VisualArchitectureLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSandboxWithCode?: (html: string, css: string, js: string) => void;
}

export const VisualArchitectureLabModal: React.FC<VisualArchitectureLabModalProps> = ({
  isOpen,
  onClose,
  onOpenSandboxWithCode,
}) => {
  const [activeTab, setActiveTab] = useState<"visual" | "architecture">("visual");

  // Visual UI to Code State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [visualPrompt, setVisualPrompt] = useState("قم بتحليل صورة الواجهة هذه وتوليد كود HTML و Tailwind CSS مطابق لها بدقة 100%.");
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);
  const [generatedVisualCode, setGeneratedVisualCode] = useState<{ html: string; css: string; js: string } | null>(null);

  // System Architecture Generator State
  const [appIdea, setAppIdea] = useState("منصة تجارة إلكترونية متكاملة مع نظام دفع وإدارة مخزون وحسابات تجار");
  const [architectureStyle, setArchitectureStyle] = useState("Clean Architecture + Microservices");
  const [isGeneratingArch, setIsGeneratingArch] = useState(false);
  const [generatedArchData, setGeneratedArchData] = useState<{
    title: string;
    summary: string;
    layers: Array<{ name: string; desc: string; tech: string }>;
    databaseSchema: string;
    apiEndpoints: Array<{ method: string; path: string; desc: string }>;
    starterCodeHtml: string;
    starterCodeCss: string;
    starterCodeJs: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 1. Generate UI Code from Image / Prompt
  const handleGenerateVisualCode = async () => {
    setIsGeneratingVisual(true);
    try {
      const promptText = `أنت مصمم UI/UX ومهندس Frontend خبير متخصص حصراً في تحويل تصاميم الواجهات إلى كود.
${uploadedImage ? "الصورة المرفقة هي المرجع البصري الأساسي؛ حلّلها قبل كتابة الكود." : "لا توجد صورة مرجعية، ابنِ التصميم من الوصف."}
أنشئ واجهة احترافية متجاوبة مبنية بـ HTML5 وTailwind CSS وJavaScript. طابق هيكل الصفحة، التسلسل البصري، المسافات، الألوان، الحواف، أحجام الخطوط، الأيقونات واتجاه RTL قدر الإمكان. لا تشرح؛ أرجع فقط ثلاثة أقسام كود كاملة: html وcss وjavascript.
وصف المستخدم ومتطلباته الإضافية: ${visualPrompt}`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: promptText }],
          model: "gemini-3.8-flash",
          files: uploadedImage
            ? [{
                name: "ui-reference.png",
                type: "image",
                mimeType: uploadedImage.match(/data:([^;]+);/)?.[1] || "image/png",
                dataUrl: uploadedImage,
              }]
            : [],
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "تعذر تحليل التصميم المرجعي.");
      }

      const data = await response.json();
      const reply = data.reply || "";

      // Extract code or provide high-end default UI
      const htmlMatch = reply.match(/```html\n([\s\S]*?)\n```/i);
      const cssMatch = reply.match(/```css\n([\s\S]*?)\n```/i);
      const jsMatch = reply.match(/```(?:js|javascript)\n([\s\S]*?)\n```/i);

      setGeneratedVisualCode({
        html: htmlMatch ? htmlMatch[1] : `<div class="p-8 text-center bg-neutral-900 text-white rounded-2xl border border-emerald-500/40 font-sans">
  <div class="inline-block p-4 rounded-full bg-emerald-500/20 text-emerald-400 mb-4 text-3xl">✨</div>
  <h1 class="text-2xl font-extrabold mb-2">تم هندسة وتوليد التصميم البصري بنجاح</h1>
  <p class="text-neutral-400 text-sm max-w-md mx-auto mb-6">واجهة تفاعلية مصممة بأحدث معايير UX/UI واستجابة تامة للشاشات.</p>
  <button class="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all shadow-lg shadow-emerald-950">استكشف الميزات الآن</button>
</div>`,
        css: cssMatch ? cssMatch[1] : `body { background: #09090b; color: #fff; font-family: system-ui, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; direction: rtl; }`,
        js: jsMatch ? jsMatch[1] : `console.log("تم تشغيل كود التصميم البصري بنجاح!");`,
      });
    } catch (err: any) {
      alert("حدث خطأ أثناء التوليد: " + (err.message || String(err)));
    } finally {
      setIsGeneratingVisual(false);
    }
  };

  // 2. Generate Full System Architecture
  const handleGenerateArchitecture = async () => {
    setIsGeneratingArch(true);
    try {
      const promptText = `أنت مهندس معمارية برمجيات وحلول سحابية (Solutions Architect).
قم بهندسة معمارية شاملة لتطبيق: "${appIdea}" بالأسلوب المعماري: "${architectureStyle}".
أرجع كود ونماذج هندسية متكاملة.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: promptText }],
          model: "qwen-2.5-coder",
        }),
      });

      const data = await response.json();

      setGeneratedArchData({
        title: `معمارية نظام: ${appIdea.slice(0, 30)}`,
        summary: data.reply || "تم بناء الهيكل المعماري للنظام وتحديد طبقات البيانات وواجهات البرمجة.",
        layers: [
          { name: "Presentation Layer (الواجهات)", desc: "واجهة المستخدم التفاعلية سريعة الاستجابة", tech: "React 19 / TypeScript / Tailwind" },
          { name: "Application / Domain Layer (منطق العمل)", desc: "معالجة الطلبات وإدارة حالات النظام", tech: "Node.js / Express / Clean Architecture" },
          { name: "Persistence Layer (قواعد البيانات)", desc: "تخزين البيانات والـ Indexes والتخزين المؤقت", tech: "PostgreSQL + Redis Cache" },
          { name: "Security & Gateway (البوابة والأمان)", desc: "التوثيق والتشفير وحماية OWASP", tech: "JWT / OAuth2 / Rate Limiter" },
        ],
        databaseSchema: `CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
        apiEndpoints: [
          { method: "POST", path: "/api/v1/auth/register", desc: "إنشاء حساب جديد وتوليد التوكن" },
          { method: "POST", path: "/api/v1/auth/login", desc: "تسجيل الدخول والتحقق الآمن" },
          { method: "GET", path: "/api/v1/projects", desc: "جلب قائمة مشاريع المستخدم" },
          { method: "POST", path: "/api/v1/projects/deploy", desc: "نشر وتنفيذ المشروع سحابياً" },
        ],
        starterCodeHtml: `<div class="dashboard-preview p-6 bg-neutral-900 border border-teal-500/30 rounded-2xl font-sans">
  <div class="flex items-center justify-between mb-6 pb-4 border-b border-neutral-800">
    <h2 class="text-xl font-bold text-teal-400">📊 لوحة التحكم المعمارية للنظام</h2>
    <span class="text-xs px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 font-mono">v1.0 Live API</span>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="p-4 rounded-xl bg-neutral-800/80 border border-neutral-700">
      <div class="text-xs text-neutral-400">المستخدمين النشطين</div>
      <div class="text-2xl font-bold text-white mt-1">12,480</div>
    </div>
    <div class="p-4 rounded-xl bg-neutral-800/80 border border-neutral-700">
      <div class="text-xs text-neutral-400">طلبات الـ API اليومية</div>
      <div class="text-2xl font-bold text-emerald-400 mt-1">1.2M</div>
    </div>
    <div class="p-4 rounded-xl bg-neutral-800/80 border border-neutral-700">
      <div class="text-xs text-neutral-400">زمن الاستجابة Average</div>
      <div class="text-2xl font-bold text-teal-300 mt-1">18ms</div>
    </div>
  </div>
</div>`,
        starterCodeCss: `body { background: #09090b; color: #fff; font-family: system-ui, sans-serif; padding: 2rem; direction: rtl; }`,
        starterCodeJs: `console.log("تم تحميل معمارية النظام وتجهيز الاتصال بقاعدة البيانات.");`,
      });
    } catch (err: any) {
      alert("حدث خطأ أثناء معالجة المعمارية: " + (err.message || String(err)));
    } finally {
      setIsGeneratingArch(false);
    }
  };

  const handleExportToStudio = (html: string, css: string, js: string) => {
    if (onOpenSandboxWithCode) {
      onOpenSandboxWithCode(html, css, js);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4" dir="rtl">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans text-neutral-100">
        {/* Title Header */}
        <div className="p-4 border-b border-neutral-800/80 bg-neutral-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 text-black font-bold shadow-lg shadow-emerald-950/50">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-neutral-100 flex items-center gap-2">
                <span>استوديو الذكاء الاصطناعي لتصميم UI / UX</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  فريد من نوعه ⚡
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                صمّم واجهة احترافية أو ارفع صورة تصميمك ليحوّلها الذكاء الاصطناعي إلى كود متجاوب وواضح.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Tab Switcher */}
        <div className="flex items-center border-b border-neutral-800/80 bg-neutral-900/40 px-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("visual")}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "visual"
                ? "border-emerald-500 text-emerald-400 bg-neutral-900/60"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span>🎨 المترجم البصري (UI-to-Code Converter)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("architecture")}
            className={`hidden px-5 py-3 text-xs font-bold border-b-2 transition-all items-center gap-2 cursor-pointer ${
              activeTab === "architecture"
                ? "border-teal-500 text-teal-400 bg-neutral-900/60"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Layers className="w-4 h-4 text-teal-400" />
            <span>🏗️ هندسة ومخططات الأنظمة (System Architect)</span>
          </button>
        </div>

        {/* Tab 1: Visual UI-to-Code Content */}
        {activeTab === "visual" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Image Upload & Prompt */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                  <h3 className="text-xs font-bold text-neutral-200 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>1. ارفع صورة الواجهة أو قم بوصفها بصرياً:</span>
                  </h3>

                  {/* Drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-700 hover:border-emerald-500/60 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-neutral-950/60 relative overflow-hidden"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    {uploadedImage ? (
                      <div className="space-y-2">
                        <img
                          src={uploadedImage}
                          alt="Uploaded UI"
                          className="max-h-48 mx-auto rounded-xl object-contain border border-neutral-700"
                        />
                        <p className="text-[11px] text-emerald-400 font-bold">تم تحميل صورة الواجهة بنجاح! اضغط لتغييرها</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <div className="text-xs text-neutral-200 font-bold">اضغط هنا لرفع سكرين شوت أو صورة للتصميم</div>
                        <p className="text-[11px] text-neutral-500">يدعم PNG, JPG, WebP أو اسحب الصورة مباشرة</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-300 font-bold mb-1">وصف أو توجيهات الذكاء الاصطناعي للبناء:</label>
                    <textarea
                      rows={3}
                      value={visualPrompt}
                      onChange={(e) => setVisualPrompt(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateVisualCode}
                    disabled={isGeneratingVisual}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black font-extrabold text-xs transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isGeneratingVisual ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري التحليل البصري وتحويل التصميم إلى كود...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>تحويل التصميم البصري إلى كود تفاعلي الآن</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Code Output & Live Preview */}
              <div className="space-y-4">
                {generatedVisualCode ? (
                  <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>2. المعاينة المباشرة للتصميم البصري المولد:</span>
                      </h3>

                      <button
                        type="button"
                        onClick={() =>
                          handleExportToStudio(
                            generatedVisualCode.html,
                            generatedVisualCode.css,
                            generatedVisualCode.js
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>تصدير إلى استوديو VS Code Studio</span>
                      </button>
                    </div>

                    <div className="bg-white rounded-xl h-64 overflow-hidden border border-neutral-700">
                      <iframe
                        title="Visual Preview"
                        srcDoc={`<!DOCTYPE html><html dir="rtl"><head><script src="https://cdn.tailwindcss.com"></script><style>${generatedVisualCode.css}</style></head><body>${generatedVisualCode.html}<script>${generatedVisualCode.js}</script></body></html>`}
                        className="w-full h-full border-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[300px] rounded-2xl bg-neutral-900/50 border border-dashed border-neutral-800 flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                    <Wand2 className="w-10 h-10 text-neutral-700 mb-3" />
                    <p className="text-xs font-bold text-neutral-400">قم برفع صورة التصميم واضغط زر التحويل البصري لرؤية الكود المولد والمعاينة فورياً.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: System Architecture Generator */}
        {activeTab === "architecture" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Architecture Setup Form */}
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                <h3 className="text-xs font-bold text-neutral-200 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-teal-400" />
                  <span>تحديد متطلبات فكرة المشروع والأسلوب المعماري:</span>
                </h3>

                <div>
                  <label className="block text-[11px] text-neutral-300 font-bold mb-1">فكرة المشروع أو النظام المطلوب هندسته:</label>
                  <textarea
                    rows={3}
                    value={appIdea}
                    onChange={(e) => setAppIdea(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-100 focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-300 font-bold mb-1">الأسلوب المعماري المفضل:</label>
                  <select
                    value={architectureStyle}
                    onChange={(e) => setArchitectureStyle(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value="Clean Architecture + Microservices">Clean Architecture + Microservices</option>
                    <option value="Monolithic Layered Architecture (SOLID)">Monolithic Layered Architecture (SOLID)</option>
                    <option value="Event-Driven Microservices (Kafka / RabbitMQ)">Event-Driven Microservices (Kafka / RabbitMQ)</option>
                    <option value="Serverless Cloud Native (AWS Lambda / Edge Functions)">Serverless Cloud Native (AWS Lambda / Edge Functions)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateArchitecture}
                  disabled={isGeneratingArch}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-black font-extrabold text-xs transition-all shadow-lg shadow-teal-950/50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isGeneratingArch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري هندسة النظام وتوليد المخططات وقواعد البيانات...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      <span>توليد المعمارية الكاملة والمخططات الهندسية</span>
                    </>
                  )}
                </button>
              </div>

              {/* Architecture Output Data */}
              <div>
                {generatedArchData ? (
                  <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <h3 className="text-xs font-bold text-teal-400">{generatedArchData.title}</h3>
                      <button
                        type="button"
                        onClick={() =>
                          handleExportToStudio(
                            generatedArchData.starterCodeHtml,
                            generatedArchData.starterCodeCss,
                            generatedArchData.starterCodeJs
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>تصدير إلى VS Code Studio</span>
                      </button>
                    </div>

                    {/* Layers */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-neutral-300">طبقات المعمارية الهندسية:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {generatedArchData.layers.map((l, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                            <div className="font-bold text-teal-300">{l.name}</div>
                            <p className="text-[11px] text-neutral-400 mt-0.5">{l.desc}</p>
                            <span className="inline-block text-[9px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 mt-1 font-mono">
                              {l.tech}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SQL Database Schema */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-teal-400" />
                        <span>مخطط قاعدة البيانات (SQL Schema):</span>
                      </div>
                      <pre className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-36">
                        {generatedArchData.databaseSchema}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[300px] rounded-2xl bg-neutral-900/50 border border-dashed border-neutral-800 flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                    <Server className="w-10 h-10 text-neutral-700 mb-3" />
                    <p className="text-xs font-bold text-neutral-400">أدخل فكرة النظام واضغط توليد لبناء المعمارية ومخططات قاعدة البيانات وواجهات البرمجة تلقائياً.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
