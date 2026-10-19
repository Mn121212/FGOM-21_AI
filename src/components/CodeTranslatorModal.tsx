import React, { useState } from "react";
import {
  X,
  Languages,
  ArrowLeftRight,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Code2,
  FileCode,
} from "lucide-react";

interface CodeTranslatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string) => void;
}

const SUPPORTED_LANGUAGES = [
  { id: "python", name: "Python 🐍" },
  { id: "javascript", name: "JavaScript ⚡" },
  { id: "typescript", name: "TypeScript 🔷" },
  { id: "php", name: "PHP 🐘" },
  { id: "cpp", name: "C++ ⚙️" },
  { id: "csharp", name: "C# 🎯" },
  { id: "java", name: "Java ☕" },
  { id: "go", name: "Go 🐹" },
  { id: "rust", name: "Rust 🦀" },
  { id: "sql", name: "SQL 🗄️" },
  { id: "ruby", name: "Ruby 💎" },
  { id: "swift", name: "Swift 🍎" },
];

const SAMPLE_TRANSLATION_SNIPPETS: Record<string, string> = {
  python: `# كود بايثون: فلترة وتصنيف الأرقام والبيانات
def process_data(items, threshold=50):
    filtered = [x * 2 for x in items if x > threshold]
    summary = {
        "count": len(filtered),
        "total": sum(filtered),
        "status": "success" if filtered else "empty"
    }
    return summary

print(process_data([10, 60, 85, 30, 95]))`,
  javascript: `// كود جافاسكريبت: فلترة وتصنيف الأرقام
function processData(items, threshold = 50) {
  const filtered = items.filter(x => x > threshold).map(x => x * 2);
  const total = filtered.reduce((acc, curr) => acc + curr, 0);
  return {
    count: filtered.length,
    total: total,
    status: filtered.length > 0 ? "success" : "empty"
  };
}

console.log(processData([10, 60, 85, 30, 95]));`,
};

export const CodeTranslatorModal: React.FC<CodeTranslatorModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [sourceLang, setSourceLang] = useState("python");
  const [targetLang, setTargetLang] = useState("typescript");
  const [sourceCode, setSourceCode] = useState(SAMPLE_TRANSLATION_SNIPPETS.python);
  const [translatedCode, setTranslatedCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSwap = () => {
    const tempLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempLang);
    if (translatedCode) {
      setSourceCode(translatedCode);
      setTranslatedCode("");
      setExplanation("");
    }
  };

  const handleTranslate = async () => {
    if (!sourceCode.trim()) return;

    setIsTranslating(true);
    setTranslatedCode("");
    setExplanation("");

    try {
      const prompt = `أنت مترجم وخبير هندسة برمجيات في FGOM21 AI.
مهمتك: تحويل هذا الكود من لغة (${sourceLang}) إلى لغة (${targetLang}) بدقة متناهية وبأفضل الممارسات (Idiomatic & Clean Code).

الكود المصدر:
\`\`\`${sourceLang}
${sourceCode}
\`\`\`

المطلوب إرجاع رد بصيغة JSON فقط بهذا التنسيق وبدون أي نصوص إضافية:
{
  "translatedCode": "الكود المترجم بالكامل هنا",
  "explanation": "شرح موجز بالعربي حول الفروقات بين اللغتين وكيف تم التحويل"
}`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model: "gemini-3.8-flash",
          developerMode: true,
        }),
      });

      const data = await res.json();
      let text = data.reply || "";
      if (text.startsWith("```json")) text = text.slice(7);
      if (text.startsWith("```")) text = text.slice(3);
      if (text.endsWith("```")) text = text.slice(0, -3);
      text = text.trim();

      try {
        const parsed = JSON.parse(text);
        setTranslatedCode(parsed.translatedCode || "");
        setExplanation(parsed.explanation || "");
      } catch {
        setTranslatedCode(data.reply || "");
      }
    } catch (err: any) {
      setTranslatedCode("// حدث خطأ أثناء الترجمة. يرجى إعادة المحاولة.");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 text-right" dir="rtl">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden w-full max-w-5xl h-[92vh]">
        {/* Header */}
        <div className="h-14 border-b border-neutral-800 px-4 bg-neutral-900/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <span>مترجم ومحول الأكواد الفوري (AI Code Translator)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono">
                  Multi-Language
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

        {/* Toolbar: Language Selectors & Swap Button */}
        <div className="p-3 border-b border-neutral-800/80 bg-neutral-900/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-neutral-400">من:</span>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500/60"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleSwap}
              title="عكس اللغات"
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>

            <span className="text-xs text-neutral-400">إلى:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-emerald-300 font-semibold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500/60"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isTranslating || !sourceCode.trim()}
              onClick={handleTranslate}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer"
            >
              {isTranslating ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري التحويل...</span>
                </>
              ) : (
                <>
                  <Languages className="w-3.5 h-3.5" />
                  <span>ترجمة الكود الآن (Convert)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Workspace: Source Code vs Translated Code */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-neutral-800 bg-neutral-950">
          {/* Source Code Panel */}
          <div className="flex flex-col min-h-0 bg-neutral-950">
            <div className="h-8 border-b border-neutral-850 px-4 bg-neutral-900/30 flex items-center justify-between text-xs text-neutral-400">
              <span className="font-mono" dir="ltr">Original: {sourceLang.toUpperCase()}</span>
              <span>{sourceCode.split("\n").length} سطر</span>
            </div>
            <textarea
              dir="ltr"
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              placeholder="// الصق كودك هنا لتحويله للغة الأخرى..."
              spellCheck={false}
              className="w-full flex-1 p-4 bg-neutral-950 text-neutral-200 font-mono text-xs sm:text-sm focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Translated Code Panel */}
          <div className="flex flex-col min-h-0 bg-neutral-950">
            <div className="h-8 border-b border-neutral-850 px-4 bg-neutral-900/30 flex items-center justify-between text-xs text-neutral-400">
              <span className="font-mono text-emerald-400 font-semibold" dir="ltr">
                Converted: {targetLang.toUpperCase()}
              </span>
              {translatedCode && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(translatedCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 text-[11px] text-neutral-300 hover:text-white"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>نسخ الكود</span>
                </button>
              )}
            </div>

            <div className="flex-1 p-4 overflow-auto font-mono text-xs sm:text-sm leading-relaxed" dir="ltr">
              {translatedCode ? (
                <pre className="text-emerald-300 whitespace-pre-wrap">{translatedCode}</pre>
              ) : isTranslating ? (
                <div className="h-full flex items-center justify-center text-neutral-500 font-sans text-xs">
                  جاري إعادة كتابة المنطق البرمجي وتكييفه مع لغة {targetLang}...
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-600 font-sans text-xs italic">
                  اختر اللغات واضغط "ترجمة الكود الآن" لترى الكود المكافئ هنا...
                </div>
              )}
            </div>

            {explanation && (
              <div className="p-3 border-t border-neutral-850 bg-neutral-900/40 text-xs text-neutral-300 font-sans leading-relaxed">
                <span className="font-bold text-emerald-400 ml-1">💡 ملاحظات التحويل:</span>
                {explanation}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="h-11 border-t border-neutral-800 px-4 bg-neutral-900/60 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <span>⚡ تحويل دقيق للمفاهيم والدوال مع مراعاة خصائص كل لغة برمجية.</span>
          {onSendToChat && translatedCode && (
            <button
              type="button"
              onClick={() => {
                onSendToChat(`أرجو مراجعة هذا الكود المحول إلى ${targetLang}:\n\`\`\`${targetLang}\n${translatedCode}\n\`\`\``);
                onClose();
              }}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
            >
              <span>متابعة الشرح في المحادثة</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
