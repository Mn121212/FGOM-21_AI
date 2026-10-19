import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Download,
  Code2,
  Eye,
  Terminal,
  Sparkles,
  Layers,
  FileCode,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Search,
  Settings,
  SplitSquareVertical,
  CheckCircle2,
} from "lucide-react";

interface CodeSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialHtml?: string;
  initialCss?: string;
  initialJs?: string;
  title?: string;
  onSendToChat?: (code: string) => void;
}

export type SuggestionItem = {
  label: string;
  insert: string;
  type: "tag" | "prop" | "keyword" | "function" | "snippet";
  doc: string;
};

// 💡 Intelligent VS Code Auto-complete Suggestions (IntelliSense Dictionary)
const INTELLISENSE_DICT: Record<string, SuggestionItem[]> = {
  html: [
    { label: "div", insert: "<div>\n  $0\n</div>", type: "tag", doc: "عنصر حاوية عامة (Division)" },
    { label: "button", insert: "<button class=\"btn\">$0</button>", type: "tag", doc: "زر تفاعلي قابل للنقر" },
    { label: "input", insert: "<input type=\"text\" placeholder=\"$0\" />", type: "tag", doc: "حقل إدخال نصوص" },
    { label: "span", insert: "<span>$0</span>", type: "tag", doc: "نص مضمن (Inline)" },
    { label: "p", insert: "<p>$0</p>", type: "tag", doc: "فقرة نصية (Paragraph)" },
    { label: "h1", insert: "<h1>$0</h1>", type: "tag", doc: "عنوان رئيسي كبير المستوى 1" },
    { label: "h2", insert: "<h2>$0</h2>", type: "tag", doc: "عنوان فرعي المستوى 2" },
    { label: "h3", insert: "<h3>$0</h3>", type: "tag", doc: "عنوان فرعي المستوى 3" },
    { label: "form", insert: "<form onsubmit=\"$0\">\n  \n</form>", type: "tag", doc: "نموذج إرسال بيانات" },
    { label: "img", insert: "<img src=\"$0\" alt=\"image\" />", type: "tag", doc: "عنصر صورة" },
    { label: "a", insert: "<a href=\"#\">$0</a>", type: "tag", doc: "رابط تشعبي (Hyperlink)" },
    { label: "ul", insert: "<ul>\n  <li>$0</li>\n</ul>", type: "tag", doc: "قائمة نقطية غير مرتبة" },
    { label: "canvas", insert: "<canvas id=\"canvas\" width=\"800\" height=\"600\"></canvas>", type: "tag", doc: "لوحة رسم تفاعلية (HTML5 Canvas)" },
    { label: "class", insert: "class=\"$0\"", type: "prop", doc: "خاصية الفئة لتنسيق CSS" },
    { label: "id", insert: "id=\"$0\"", type: "prop", doc: "المعرف الفريد للعنصر" },
    { label: "style", insert: "style=\"$0\"", type: "prop", doc: "تنسيق مدمج مباشر (Inline Style)" },
    { label: "onclick", insert: "onclick=\"$0()\"", type: "prop", doc: "حدث النقر على العنصر" },
    { label: "template", insert: "<div class=\"container\">\n  <header>\n    <h1>$0</h1>\n  </header>\n  <main></main>\n</div>", type: "snippet", doc: "قالب صفحة متكامل" },
  ],
  css: [
    { label: "display: flex", insert: "display: flex;\njustify-content: center;\nalign-items: center;", type: "snippet", doc: "صندوق مرن وتوسيط العناصر" },
    { label: "display: grid", insert: "display: grid;\ngrid-template-columns: repeat(auto-fit, minmax(240px, 1fr));\ngap: 1rem;", type: "snippet", doc: "شبكة متجاوبة" },
    { label: "background", insert: "background: #09090b;", type: "prop", doc: "لون أو صورة الخلفية" },
    { label: "background-color", insert: "background-color: $0;", type: "prop", doc: "لون الخلفية" },
    { label: "color", insert: "color: #10b981;", type: "prop", doc: "لون الخط والنصوص" },
    { label: "padding", insert: "padding: 1rem;", type: "prop", doc: "الهوامش الداخلية" },
    { label: "margin", insert: "margin: 0 auto;", type: "prop", doc: "الهوامش الخارجية والتوسيط" },
    { label: "border-radius", insert: "border-radius: 12px;", type: "prop", doc: "استدارة الحواف" },
    { label: "border", insert: "border: 1px solid #27272a;", type: "prop", doc: "إطار العنصر الخارجي" },
    { label: "box-shadow", insert: "box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);", type: "prop", doc: "ظل العنصر الاحترافي" },
    { label: "font-size", insert: "font-size: 1rem;", type: "prop", doc: "حجم الخط" },
    { label: "font-weight", insert: "font-weight: 700;", type: "prop", doc: "سماكة الخط (Bold)" },
    { label: "transition", insert: "transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);", type: "prop", doc: "حركة انتقالية ناعمة" },
    { label: "cursor: pointer", insert: "cursor: pointer;", type: "prop", doc: "مؤشر اليد عند التمرير" },
    { label: "animation", insert: "@keyframes pulse {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0.5; }\n}\nanimation: pulse 2s infinite;", type: "snippet", doc: "حركة أنيميشن نبضية" },
    { label: "backdrop-filter", insert: "backdrop-filter: blur(12px);\nbackground: rgba(0,0,0,0.6);", type: "snippet", doc: "تأثير الزجاج الشفاف (Glassmorphism)" },
  ],
  js: [
    { label: "function", insert: "function $0() {\n  \n}", type: "keyword", doc: "تعريف دالة برمجية قياسية" },
    { label: "const", insert: "const $0 = ;", type: "keyword", doc: "تعريف متغير ثابت" },
    { label: "let", insert: "let $0 = ;", type: "keyword", doc: "تعريف متغير قابل للتغيير" },
    { label: "console.log", insert: "console.log($0);", type: "function", doc: "طباعة مخرجات في لوحة الـ Console" },
    { label: "document.getElementById", insert: "document.getElementById(\"$0\")", type: "function", doc: "جلب عنصر عبر المعرف (ID)" },
    { label: "document.querySelector", insert: "document.querySelector(\"$0\")", type: "function", doc: "تحديد عنصر بمحدد CSS" },
    { label: "addEventListener", insert: "addEventListener(\"click\", (e) => {\n  $0\n});", type: "snippet", doc: "الاستماع لحدث النقر أو غيره" },
    { label: "fetch", insert: "fetch(\"$0\")\n  .then(res => res.json())\n  .then(data => console.log(data));", type: "snippet", doc: "طلب بيانات من واجهة API" },
    { label: "async function", insert: "async function $0() {\n  try {\n    \n  } catch (error) {\n    console.error(error);\n  }\n}", type: "snippet", doc: "دالة غير متزامنة مع معالجة الأخطاء" },
    { label: "setTimeout", insert: "setTimeout(() => {\n  $0\n}, 1000);", type: "function", doc: "تنفيذ كود بعد مؤقت زمني" },
    { label: "setInterval", insert: "setInterval(() => {\n  $0\n}, 1000);", type: "function", doc: "تنفيذ كود دوري متكرر" },
    { label: "for", insert: "for (let i = 0; i < $0; i++) {\n  \n}", type: "keyword", doc: "حلقة تكرار برمجية" },
    { label: "if / else", insert: "if ($0) {\n  \n} else {\n  \n}", type: "snippet", doc: "شرط منطقي برمجياً" },
  ],
};

const DEFAULT_FILES = [
  { id: "html", name: "index.html", lang: "html", icon: "🌐" },
  { id: "css", name: "styles.css", lang: "css", icon: "🎨" },
  { id: "js", name: "script.js", lang: "js", icon: "⚡" },
];

const INITIAL_TEMPLATES = [
  {
    id: "landing",
    name: "صفحة هبوط تقنية (Tech Hero)",
    html: `<div class="hero">
  <div class="badge">🚀 منصة FGOM21 AI</div>
  <h1>المستقبل يبدأ بكود نظيف</h1>
  <p>منصة ذكاء اصطناعي تفاعلية متكاملة للمبرمجين والمطورين العرب.</p>
  <div class="actions">
    <button onclick="showAlert()" class="btn primary">ابدأ الآن مجاناً</button>
    <button class="btn secondary">استكشف الميزات</button>
  </div>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
body { background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; direction: rtl; }
.hero { text-align: center; max-width: 600px; }
.badge { display: inline-block; padding: 6px 14px; background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 999px; color: #10b981; font-size: 13px; font-weight: bold; margin-bottom: 1.5rem; }
h1 { font-size: 2.5rem; margin-bottom: 1rem; background: linear-gradient(135deg, #fff, #9ca3af); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
p { color: #a1a1aa; line-height: 1.6; margin-bottom: 2rem; }
.actions { display: flex; gap: 1rem; justify-content: center; }
.btn { padding: 10px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; }
.btn.primary { background: #10b981; color: #000; }
.btn.primary:hover { background: #059669; }
.btn.secondary { background: #27272a; color: #fff; border: 1px solid #3f3f46; }
.btn.secondary:hover { background: #3f3f46; }`,
    js: `function showAlert() {
  console.log("تم النقر على زر البدء في استوديو FGOM21 AI!");
  alert("مرحباً بك في منصة FGOM21 AI الذكية!");
}`,
  },
  {
    id: "counter",
    name: "تطبيق عداد تفاعلي (Interactive App)",
    html: `<div class="card">
  <h2>عداد FGOM21 التفاعلي</h2>
  <div class="display" id="count">0</div>
  <div class="buttons">
    <button onclick="decrement()" class="btn danger">-1</button>
    <button onclick="reset()" class="btn neutral">تصفير</button>
    <button onclick="increment()" class="btn success">+1</button>
  </div>
  <p id="log" class="log-text">الحالة: جاهز</p>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
body { background: #0d1117; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; direction: rtl; }
.card { background: #161b22; border: 1px solid #30363d; padding: 2.5rem; border-radius: 20px; text-align: center; width: 340px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
h2 { font-size: 1.25rem; color: #8b949e; margin-bottom: 1.5rem; }
.display { font-size: 4.5rem; font-weight: 900; font-family: monospace; color: #58a6ff; margin-bottom: 1.5rem; }
.buttons { display: flex; gap: 0.75rem; justify-content: center; }
.btn { padding: 10px 18px; border-radius: 10px; font-weight: bold; border: none; cursor: pointer; transition: transform 0.1s; }
.btn:active { transform: scale(0.95); }
.btn.success { background: #238636; color: #fff; }
.btn.danger { background: #da3633; color: #fff; }
.btn.neutral { background: #30363d; color: #c9d1d9; }
.log-text { margin-top: 1.5rem; font-size: 12px; color: #8b949e; }`,
    js: `let count = 0;
const countEl = document.getElementById("count");
const logEl = document.getElementById("log");

function update() {
  countEl.innerText = count;
  logEl.innerText = "القيمة الحالية: " + count;
  console.log("Count updated to: " + count);
}

function increment() { count++; update(); }
function decrement() { count--; update(); }
function reset() { count = 0; update(); }`,
  },
];

export const CodeSandboxModal: React.FC<CodeSandboxModalProps> = ({
  isOpen,
  onClose,
  initialHtml,
  initialCss,
  initialJs,
  title = "محرر واستوديو VS Code التفاعلي (FGOM21 Code Studio)",
  onSendToChat,
}) => {
  const [activeFile, setActiveFile] = useState<"html" | "css" | "js">("html");
  const [showPreviewPane, setShowPreviewPane] = useState(true);
  const [htmlCode, setHtmlCode] = useState(initialHtml || INITIAL_TEMPLATES[0].html);
  const [cssCode, setCssCode] = useState(initialCss || INITIAL_TEMPLATES[0].css);
  const [jsCode, setJsCode] = useState(initialJs || INITIAL_TEMPLATES[0].js);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: string; message: string; time: string }>>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autorun, setAutorun] = useState(true);
  const [runKey, setRunKey] = useState(0);

  // ⚡ VS Code IntelliSense Suggestion Box State
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPos, setSuggestionPos] = useState({ top: 120, left: 160 });
  const [cursorWord, setCursorWord] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync initial props
  useEffect(() => {
    if (initialHtml !== undefined) setHtmlCode(initialHtml);
    if (initialCss !== undefined) setCssCode(initialCss);
    if (initialJs !== undefined) setJsCode(initialJs);
  }, [initialHtml, initialCss, initialJs]);

  const getCurrentCode = () => {
    if (activeFile === "html") return htmlCode;
    if (activeFile === "css") return cssCode;
    return jsCode;
  };

  const updateCurrentCode = (val: string) => {
    if (activeFile === "html") setHtmlCode(val);
    else if (activeFile === "css") setCssCode(val);
    else setJsCode(val);
    if (autorun) setRunKey((k) => k + 1);
  };

  // Combine full document
  const generateSourceDoc = () => {
    return `<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${cssCode}
  </style>
  <script>
    (function(){
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;
      function send(type, args) {
        try {
          const str = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
          window.parent.postMessage({ source: 'fgom21-sandbox', type, message: str }, '*');
        } catch(e){}
      }
      console.log = function(){ send('log', arguments); originalLog.apply(console, arguments); };
      console.warn = function(){ send('warn', arguments); originalWarn.apply(console, arguments); };
      console.error = function(){ send('error', arguments); originalError.apply(console, arguments); };
    })();
  </script>
</head>
<body>
  ${htmlCode}
  <script>
    try {
      ${jsCode}
    } catch(err) {
      console.error(err.message || String(err));
    }
  </script>
</body>
</html>`;
  };

  // Listen to iframe console messages
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.source === "fgom21-sandbox") {
        setConsoleLogs((prev) => [
          ...prev.slice(-49),
          {
            type: e.data.type || "log",
            message: e.data.message || "",
            time: new Date().toLocaleTimeString("ar-SA"),
          },
        ]);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleRun = () => {
    setConsoleLogs([]);
    setRunKey((k) => k + 1);
  };

  const handleCopyCode = () => {
    const fullCode = generateSourceDoc();
    navigator.clipboard.writeText(fullCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const fullCode = generateSourceDoc();
    const blob = new Blob([fullCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fgom21-project.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  // 🔍 Calculate IntelliSense suggestions when user types a letter
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    updateCurrentCode(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastWordMatch = textBeforeCursor.match(/([a-zA-Z0-9_\-:]+)$/);

    if (lastWordMatch && lastWordMatch[1].length >= 1) {
      const word = lastWordMatch[1].toLowerCase();
      setCursorWord(word);

      const dict = INTELLISENSE_DICT[activeFile] || [];
      const matched = dict.filter((item) =>
        item.label.toLowerCase().includes(word) || item.insert.toLowerCase().includes(word)
      );

      if (matched.length > 0) {
        setSuggestions(matched.slice(0, 7));
        setActiveSuggestionIndex(0);
        setShowSuggestions(true);

        // Approximate position inside editor
        const lines = textBeforeCursor.split("\n");
        const currentLineNum = lines.length;
        const currentCol = lines[lines.length - 1].length;
        setSuggestionPos({
          top: Math.min(currentLineNum * 20 + 40, 360),
          left: Math.min(currentCol * 8 + 80, 400),
        });
        return;
      }
    }

    setShowSuggestions(false);
  };

  // ⌨️ Handle Tab / Enter / Arrows inside Editor like real VS Code
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        insertSuggestion(suggestions[activeSuggestionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    // Standard VS Code tab indent
    if (e.key === "Tab" && !showSuggestions) {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const curVal = getCurrentCode();
      const updated = curVal.substring(0, start) + "  " + curVal.substring(end);
      updateCurrentCode(updated);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Insert completion template
  const insertSuggestion = (item: SuggestionItem) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursorPos = textarea.selectionStart;
    const curVal = getCurrentCode();
    const textBeforeCursor = curVal.slice(0, cursorPos);
    const lastWordMatch = textBeforeCursor.match(/([a-zA-Z0-9_\-:]+)$/);
    const wordLen = lastWordMatch ? lastWordMatch[1].length : 0;

    const startPos = cursorPos - wordLen;
    const cleanInsert = item.insert.replace(/\$0/g, "");
    const updated = curVal.substring(0, startPos) + cleanInsert + curVal.substring(cursorPos);
    updateCurrentCode(updated);
    setShowSuggestions(false);

    setTimeout(() => {
      textarea.focus();
      const newPos = startPos + cleanInsert.length;
      textarea.selectionStart = textarea.selectionEnd = newPos;
    }, 10);
  };

  if (!isOpen) return null;

  const currentCode = getCurrentCode();
  const currentLines = currentCode.split("\n");

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-1 sm:p-3">
      <div
        className={`bg-[#181818] border border-[#2b2b2b] rounded-xl flex flex-col shadow-2xl overflow-hidden transition-all duration-200 text-neutral-200 font-sans ${
          isFullScreen ? "w-full h-full rounded-none" : "w-full max-w-7xl h-[94vh]"
        }`}
      >
        {/* VS Code Title Bar */}
        <div className="h-9 bg-[#1e1e1e] border-b border-[#2b2b2b] px-3 flex items-center justify-between select-none shrink-0" dir="ltr">
          {/* Left: Window actions & Project Title */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block cursor-pointer hover:opacity-80" onClick={onClose} title="إغلاق" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block cursor-pointer hover:opacity-80" onClick={() => setIsFullScreen(!isFullScreen)} title="تكبير" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block cursor-pointer hover:opacity-80" onClick={handleRun} title="تشغيل" />
            </div>

            <div className="flex items-center gap-2 text-[#cccccc] font-medium text-[11px] sm:text-xs">
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-neutral-100">FGOM21 Code Studio</span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-400 hidden sm:inline">{DEFAULT_FILES.find((f) => f.id === activeFile)?.name}</span>
            </div>
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center gap-1.5" dir="rtl">
            <button
              type="button"
              onClick={handleRun}
              title="تشغيل الكود وتحديث المعاينة (F5 / Run)"
              className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>تشغيل (Run)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPreviewPane(!showPreviewPane)}
              title={showPreviewPane ? "إخفاء شاشة المعاينة" : "عرض شاشة المعاينة الحية"}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                showPreviewPane ? "bg-[#333333] text-emerald-400" : "hover:bg-[#2a2a2a] text-neutral-400"
              }`}
            >
              <SplitSquareVertical className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleCopyCode}
              title="نسخ المشروع بالكامل"
              className="p-1.5 hover:bg-[#2a2a2a] text-neutral-300 rounded transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              title="تحميل كملف HTML مستقل"
              className="p-1.5 hover:bg-[#2a2a2a] text-neutral-300 rounded transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? "تصغير" : "ملء الشاشة"}
              className="p-1.5 hover:bg-[#2a2a2a] text-neutral-300 rounded transition-colors cursor-pointer"
            >
              {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              title="إغلاق المحرر"
              className="p-1.5 hover:bg-[#c42b1c] text-neutral-300 hover:text-white rounded transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* VS Code Main Layout: Activity Bar + Explorer + Editor Tabs + Preview */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* 1. Activity Bar (Far Left Strip) */}
          <div className="w-11 bg-[#181818] border-r border-[#2b2b2b] flex flex-col items-center py-2 gap-4 shrink-0 select-none" dir="ltr">
            <button
              type="button"
              title="مستعرض الملفات (Explorer)"
              className="p-2 rounded text-[#ffffff] bg-[#2a2a2a] cursor-pointer"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowConsole(!showConsole)}
              title={`لوحة التحكم والـ Console (${consoleLogs.length})`}
              className={`p-2 rounded cursor-pointer transition-colors relative ${
                showConsole ? "bg-[#2a2a2a] text-emerald-400" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Terminal className="w-4 h-4" />
              {consoleLogs.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSendToChat) {
                  onSendToChat(`أرجو مراجعة كود هذا المشروع في FGOM21 Code Studio:\n\`\`\`html\n${generateSourceDoc()}\n\`\`\``);
                  onClose();
                }
              }}
              title="إرسال إلى مساعد FGOM21 AI لتحسين الكود"
              className="p-2 rounded text-emerald-400 hover:bg-[#2a2a2a] cursor-pointer transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>

          {/* 2. File Explorer Sidebar */}
          <div className="w-48 bg-[#1f1f1f] border-r border-[#2b2b2b] hidden md:flex flex-col shrink-0 select-none" dir="ltr">
            <div className="h-8 px-3 border-b border-[#2b2b2b] flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#999999]">
              <span>Explorer</span>
              <span className="text-[10px] text-emerald-400">FGOM21</span>
            </div>
            <div className="p-2 space-y-0.5">
              <div className="flex items-center gap-1 px-1 py-0.5 text-xs text-neutral-400 font-semibold">
                <ChevronDown className="w-3.5 h-3.5" />
                <span>WORKSPACE</span>
              </div>
              {DEFAULT_FILES.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setActiveFile(file.id as any)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                    activeFile === file.id
                      ? "bg-[#37373d] text-white font-medium"
                      : "text-[#cccccc] hover:bg-[#2a2a2d]"
                  }`}
                >
                  <span>{file.icon}</span>
                  <span className="font-mono">{file.name}</span>
                </button>
              ))}
            </div>

            {/* Quick Presets in Sidebar */}
            <div className="mt-auto p-2 border-t border-[#2b2b2b]">
              <div className="text-[10px] text-neutral-400 mb-1 px-1 font-semibold">قوالب سريعة:</div>
              <div className="space-y-1">
                {INITIAL_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setHtmlCode(tmpl.html);
                      setCssCode(tmpl.css);
                      setJsCode(tmpl.js);
                      setConsoleLogs([]);
                      setRunKey((k) => k + 1);
                    }}
                    className="w-full text-right px-2 py-1 rounded text-[11px] bg-[#252526] hover:bg-[#323233] text-neutral-300 truncate transition-colors cursor-pointer"
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Editor Area + Preview Split */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#1e1e1e]">
            {/* Editor Tab Headers */}
            <div className="h-9 bg-[#252526] border-b border-[#181818] flex items-center px-1 overflow-x-auto select-none shrink-0" dir="ltr">
              {DEFAULT_FILES.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setActiveFile(file.id as any)}
                  className={`h-full flex items-center gap-2 px-4 border-r border-[#181818] text-xs font-mono transition-colors cursor-pointer ${
                    activeFile === file.id
                      ? "bg-[#1e1e1e] text-emerald-400 border-t-2 border-t-emerald-500 font-semibold"
                      : "bg-[#2d2d2d] text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <span>{file.icon}</span>
                  <span>{file.name}</span>
                  <span className="text-[10px] text-neutral-500 ml-1">●</span>
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2 px-2 text-[11px] text-neutral-500">
                <span className="hidden sm:inline">اكتب أي حرف وسيقترح عليك الكود فوراً (IntelliSense) ⚡</span>
              </div>
            </div>

            {/* Editor Workspace & Split Preview */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#2b2b2b] relative overflow-hidden" dir="ltr">
              {/* Code Editor Panel with Line Numbers & Real Auto-Complete */}
              <div className="flex flex-col min-h-0 bg-[#1e1e1e] relative">
                <div className="flex-1 min-h-0 flex relative overflow-hidden">
                  {/* Line Numbers Column */}
                  <div className="w-12 py-3 bg-[#1e1e1e] border-r border-[#2a2a2a] text-right pr-2 text-neutral-600 select-none font-mono text-xs leading-6 shrink-0">
                    {currentLines.map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>

                  {/* Textarea Editor */}
                  <div className="flex-1 min-h-0 relative">
                    <textarea
                      ref={textareaRef}
                      value={currentCode}
                      onChange={handleTextChange}
                      onKeyDown={handleKeyDown}
                      spellCheck={false}
                      className="w-full h-full p-3 bg-transparent text-[#e0e0e0] font-mono text-xs sm:text-sm focus:outline-none resize-none leading-6 whitespace-pre"
                      placeholder={`// اكتب كود ${activeFile.toUpperCase()} هنا...\n// بمجرد كتابة حرف ستظهر لك اقتراحات الـ VS Code الذكية!`}
                    />

                    {/* 💡 Floating VS Code IntelliSense Menu */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div
                        style={{
                          top: `${suggestionPos.top}px`,
                          left: `${suggestionPos.left}px`,
                        }}
                        className="absolute z-50 w-72 bg-[#252526] border border-[#3e3e42] rounded-md shadow-2xl overflow-hidden font-mono text-xs animate-in fade-in zoom-in-95 duration-100"
                      >
                        <div className="bg-[#1f1f1f] px-2 py-1 text-[10px] text-neutral-400 flex items-center justify-between border-b border-[#333333]">
                          <span>IntelliSense Suggestions</span>
                          <span className="text-emerald-400">Tab أو Enter للإدراج</span>
                        </div>
                        <div className="max-h-48 overflow-y-auto divide-y divide-[#2d2d2d]">
                          {suggestions.map((item, idx) => (
                            <div
                              key={idx}
                              onClick={() => insertSuggestion(item)}
                              onMouseEnter={() => setActiveSuggestionIndex(idx)}
                              className={`px-2.5 py-1.5 flex items-center justify-between cursor-pointer transition-colors ${
                                activeSuggestionIndex === idx
                                  ? "bg-[#04395e] text-white"
                                  : "text-neutral-300 hover:bg-[#2a2d2e]"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span
                                  className={`text-[9px] px-1 rounded font-bold uppercase ${
                                    item.type === "tag"
                                      ? "bg-blue-500/30 text-blue-300"
                                      : item.type === "prop"
                                      ? "bg-teal-500/30 text-teal-300"
                                      : item.type === "snippet"
                                      ? "bg-purple-500/30 text-purple-300"
                                      : "bg-yellow-500/30 text-yellow-300"
                                  }`}
                                >
                                  {item.type}
                                </span>
                                <span className="font-semibold text-emerald-300 truncate">{item.label}</span>
                              </div>
                              <span className="text-[10px] text-neutral-400 font-sans truncate ml-2">
                                {item.doc}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Console Panel (if opened) */}
                {showConsole && (
                  <div className="h-44 border-t border-[#2b2b2b] bg-[#141414] flex flex-col shrink-0">
                    <div className="h-7 px-3 bg-[#1e1e1e] border-b border-[#2b2b2b] flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="font-mono">TERMINAL / CONSOLE</span>
                      <button
                        type="button"
                        onClick={() => setConsoleLogs([])}
                        className="hover:text-red-400 text-[10px] cursor-pointer"
                      >
                        مسح
                      </button>
                    </div>
                    <div className="flex-1 p-2 font-mono text-xs overflow-y-auto space-y-1">
                      {consoleLogs.length === 0 ? (
                        <div className="text-neutral-600 italic">لا توجد رسائل خطأ أو مخرجات حالياً.</div>
                      ) : (
                        consoleLogs.map((log, i) => (
                          <div
                            key={i}
                            className={`flex items-start gap-2 py-0.5 ${
                              log.type === "error"
                                ? "text-red-400"
                                : log.type === "warn"
                                ? "text-yellow-400"
                                : "text-emerald-300"
                            }`}
                          >
                            <span className="text-neutral-600 text-[10px]">{log.time}</span>
                            <span>{log.type === "error" ? "✖" : "›"}</span>
                            <span>{log.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Live Preview Panel */}
              {showPreviewPane && (
                <div className="flex flex-col min-h-0 bg-white">
                  <div className="h-7 bg-[#252526] border-b border-[#181818] px-3 flex items-center justify-between text-neutral-400 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-neutral-200 font-mono text-[11px]">Preview: http://localhost:3000</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRun}
                      title="إعادة تحميل المعاينة"
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                  <iframe
                    key={runKey}
                    ref={iframeRef}
                    title="FGOM21 Live Sandbox Preview"
                    srcDoc={generateSourceDoc()}
                    sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                    className="w-full flex-1 border-none bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* VS Code Bottom Status Bar */}
        <div className="h-6 bg-[#007acc] text-white px-3 flex items-center justify-between text-[11px] font-mono select-none shrink-0" dir="ltr">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-bold">
              <span>⚡</span>
              <span>FGOM21 Studio</span>
            </span>
            <span className="hover:bg-blue-600 px-1.5 py-0.5 rounded cursor-pointer" onClick={() => setShowConsole(!showConsole)}>
              Errors: 0  Warnings: 0
            </span>
          </div>

          <div className="flex items-center gap-3" dir="rtl">
            <span className="font-sans text-[10px]">
              {autorun ? "تحديث تلقائي مفعل ●" : "تشغيل يدوي"}
            </span>
            <span className="font-mono text-[10px]">UTF-8</span>
            <span className="font-mono text-[10px] uppercase font-bold text-emerald-200">
              {activeFile}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
