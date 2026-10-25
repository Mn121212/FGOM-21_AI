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
  Plus,
  Trash2,
  Edit3,
  Bot,
  Send,
  Loader2,
  SplitSquareVertical,
  Wand2,
  FileText,
  FileJson,
  CheckCircle2,
  Lock,
  LayoutDashboard,
  Boxes,
  Package,
  Shield,
  Zap,
} from "lucide-react";

import {
  POPULAR_NPM_PACKAGES,
  SANDBOX_TEMPLATES,
  ProjectTemplate,
} from "../data/sandboxTemplates";


interface CodeSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialHtml?: string;
  initialCss?: string;
  initialJs?: string;
  title?: string;
  onSendToChat?: (code: string) => void;
}

export interface SandboxFile {
  id: string;
  name: string;
  lang: "html" | "css" | "js" | "ts" | "py" | "json" | "md";
  content: string;
  icon: string;
}

export type SuggestionItem = {
  label: string;
  insert: string;
  type: "tag" | "prop" | "keyword" | "function" | "snippet";
  doc: string;
};

// 💡 Intelligent VS Code Auto-complete Dictionary
const INTELLISENSE_DICT: Record<string, SuggestionItem[]> = {
  html: [
    { label: "div", insert: "<div>\n  $0\n</div>", type: "tag", doc: "عنصر حاوية عامة (Division)" },
    { label: "button", insert: "<button class=\"btn\">$0</button>", type: "tag", doc: "زر تفاعلي قابل للنقر" },
    { label: "input", insert: "<input type=\"text\" placeholder=\"$0\" />", type: "tag", doc: "حقل إدخال نصوص" },
    { label: "span", insert: "<span>$0</span>", type: "tag", doc: "نص مضمن (Inline)" },
    { label: "p", insert: "<p>$0</p>", type: "tag", doc: "فقرة نصية (Paragraph)" },
    { label: "h1", insert: "<h1>$0</h1>", type: "tag", doc: "عنوان رئيسي كبير" },
    { label: "form", insert: "<form onsubmit=\"$0\">\n  \n</form>", type: "tag", doc: "نموذج إرسال بيانات" },
    { label: "canvas", insert: "<canvas id=\"canvas\" width=\"800\" height=\"600\"></canvas>", type: "tag", doc: "لوحة رسم تفاعلية (HTML5 Canvas)" },
  ],
  css: [
    { label: "display: flex", insert: "display: flex;\njustify-content: center;\nalign-items: center;", type: "snippet", doc: "صندوق مرن وتوسيط العناصر" },
    { label: "display: grid", insert: "display: grid;\ngrid-template-columns: repeat(auto-fit, minmax(240px, 1fr));\ngap: 1rem;", type: "snippet", doc: "شبكة متجاوبة" },
    { label: "background", insert: "background: #09090b;", type: "prop", doc: "لون الخلفية" },
    { label: "color", insert: "color: #10b981;", type: "prop", doc: "لون النصوص" },
    { label: "border-radius", insert: "border-radius: 12px;", type: "prop", doc: "استدارة الحواف" },
  ],
  js: [
    { label: "function", insert: "function $0() {\n  \n}", type: "keyword", doc: "تعريف دالة برمجية" },
    { label: "const", insert: "const $0 = ;", type: "keyword", doc: "تعريف متغير ثابت" },
    { label: "console.log", insert: "console.log($0);", type: "function", doc: "طباعة مخرجات في لوحة الـ Console" },
    { label: "document.querySelector", insert: "document.querySelector(\"$0\")", type: "function", doc: "تحديد عنصر بمحدد CSS" },
    { label: "fetch", insert: "fetch(\"$0\")\n  .then(res => res.json())\n  .then(data => console.log(data));", type: "snippet", doc: "طلب بيانات من واجهة API" },
  ],
  py: [
    { label: "def function", insert: "def $0():\n    pass", type: "keyword", doc: "تعريف دالة في بايثون" },
    { label: "print", insert: "print($0)", type: "function", doc: "طباعة نص في بايثون" },
    { label: "for i in range", insert: "for i in range($0):\n    print(i)", type: "snippet", doc: "حلقة تكرار بايثون" },
    { label: "import pandas", insert: "import pandas as pd\nimport numpy as np", type: "snippet", doc: "استيراد مكتبات تحليل البيانات" },
  ],
};

// 🔐 Built-in Login Page Preset Project
const LOGIN_PRESET = {
  html: `<div class="login-container">
  <div class="login-box">
    <div class="brand">
      <div class="logo">⚡</div>
      <h2>تسجيل الدخول إلى FGOM21 AI</h2>
      <p>أدخل بياناتك للوصول إلى بيئة التطوير المتقدمة</p>
    </div>

    <form id="loginForm" onsubmit="handleLogin(event)">
      <div class="input-group">
        <label>البريد الإلكتروني:</label>
        <input type="email" id="email" required placeholder="user@domain.com" />
      </div>

      <div class="input-group">
        <label>كلمة المرور:</label>
        <div class="password-wrapper">
          <input type="password" id="password" required placeholder="••••••••" />
          <button type="button" onclick="togglePassword()" class="toggle-btn">👁️</button>
        </div>
      </div>

      <div class="form-actions">
        <label class="remember"><input type="checkbox" checked /> تذكرني</label>
        <a href="#" onclick="alert('تم إرسال رابط استعادة كلمة المرور إلى بريدك!')">نسيت كلمة المرور؟</a>
      </div>

      <button type="submit" class="submit-btn">دخول المنصة 🚀</button>
    </form>

    <div id="statusMessage" class="status-msg"></div>
  </div>
</div>`,
  css: `* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', system-ui, sans-serif; }
body { background: #09090b; color: #f4f4f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; direction: rtl; }
.login-container { width: 100%; max-width: 420px; }
.login-box { background: rgba(24, 24, 27, 0.85); border: 1px solid rgba(16, 185, 129, 0.3); backdrop-filter: blur(16px); padding: 2.5rem; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }
.brand { text-align: center; margin-bottom: 2rem; }
.logo { font-size: 2.5rem; margin-bottom: 0.5rem; }
h2 { font-size: 1.4rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem; }
p { font-size: 0.85rem; color: #a1a1aa; }
.input-group { margin-bottom: 1.25rem; text-align: right; }
.input-group label { display: block; font-size: 0.8rem; font-weight: 700; color: #d4d4d8; margin-bottom: 0.4rem; }
.input-group input { width: 100%; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 0.75rem 1rem; color: #fff; font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
.input-group input:focus { border-color: #10b981; }
.password-wrapper { position: relative; }
.toggle-btn { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1rem; }
.form-actions { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; margin-bottom: 1.5rem; color: #a1a1aa; }
.form-actions a { color: #10b981; text-decoration: none; font-weight: 600; }
.submit-btn { width: 100%; padding: 0.85rem; background: #10b981; color: #000; font-weight: 800; font-size: 0.95rem; border: none; border-radius: 12px; cursor: pointer; transition: background 0.2s; }
.submit-btn:hover { background: #059669; }
.status-msg { margin-top: 1rem; text-align: center; font-size: 0.85rem; font-weight: bold; }`,
  js: `function togglePassword() {
  const pwd = document.getElementById('password');
  pwd.type = pwd.type === 'password' ? 'text' : 'password';
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const status = document.getElementById('statusMessage');

  status.style.color = '#10b981';
  status.innerText = '⚡ جاري التحقق وتسجيل الدخول...';

  setTimeout(() => {
    status.innerText = '🎉 تم تسجيل الدخول بنجاح! مرحباً بك ' + email.split('@')[0];
    console.log('Login successful for:', email);
  }, 800);
}`,
};

const INITIAL_FILES: SandboxFile[] = [
  {
    id: "f-html",
    name: "index.html",
    lang: "html",
    icon: "🌐",
    content: `<div class="hero">
  <div class="badge">🚀 منصة FGOM21 AI</div>
  <h1>المستقبل يبدأ بكود نظيف ومحترف</h1>
  <p>استوديو VS Code المتقدم مع تشغيل مباشر ومساعد الذكاء الاصطناعي الحقيقي.</p>
  <div class="actions">
    <button onclick="showAlert()" class="btn primary">ابدأ التجربة الآن</button>
    <button class="btn secondary">استكشف الميزات</button>
  </div>
</div>`,
  },
  {
    id: "f-css",
    name: "styles.css",
    lang: "css",
    icon: "🎨",
    content: `* { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; }
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
  },
  {
    id: "f-js",
    name: "script.js",
    lang: "js",
    icon: "⚡",
    content: `function showAlert() {
  console.log("تم تشغيل كود المبرمج بنجاح في استوديو FGOM21 AI!");
  alert("مرحباً بك في استوديو الأكواد الذكي FGOM21 Code Studio!");
}`,
  },
  {
    id: "f-py",
    name: "main.py",
    lang: "py",
    icon: "🐍",
    content: `# برنامج بايثون ذكي مع استوديو FGOM21 AI
def calculate_metrics(numbers):
    total = sum(numbers)
    avg = total / len(numbers) if numbers else 0
    return {"sum": total, "average": avg}

data = [10, 25, 40, 85, 100]
results = calculate_metrics(data)
print("📊 نتائج تحليل بيانات بايثون:")
print(f"المجموع: {results['sum']}")
print(f"المتوسط: {results['average']}")
`,
  },
];

export const CodeSandboxModal: React.FC<CodeSandboxModalProps> = ({
  isOpen,
  onClose,
  initialHtml,
  initialCss,
  initialJs,
  title = "محرر واستوديو VS Code المتكامل (FGOM21 Studio)",
  onSendToChat,
}) => {
  // 📂 Multi-file State Management
  const [files, setFiles] = useState<SandboxFile[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string>("f-html");

  // 🤖 Right AI Side Drawer State
  const [showAiDrawer, setShowAiDrawer] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMessages, setAiMessages] = useState<Array<{
    role: "user" | "assistant";
    text: string;
    codeToInsert?: string;
    multiFilePayload?: { html?: string; css?: string; js?: string };
  }>>([
    {
      role: "assistant",
      text: "مرحباً بك! أنا مساعد الذكاء الاصطناعي المدمج المباشر داخل استوديو VS Code. أطلب مني بناء أي تطبيق أو صفحة (مثل: صفحة تسجيل دخول، لوحة تحكم، لعبة، قائمة مهام) وسأقوم بتوليد الكود وتطبيق كافة ملفات المشروع تلقائياً!",
    },
  ]);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const [showPreviewPane, setShowPreviewPane] = useState(true);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: string; message: string; time: string }>>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [runKey, setRunKey] = useState(0);

  // New File Creator Modal State
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  // 📦 NPM Packages Manager State
  const [installedPackages, setInstalledPackages] = useState<string[]>([
    "canvas-confetti",
    "lucide-react",
    "crypto-js",
  ]);
  const [showPackagesModal, setShowPackagesModal] = useState(false);
  const [customPackageName, setCustomPackageName] = useState("");
  const [packageNotice, setPackageNotice] = useState<string | null>(null);

  // ⚡ Project Templates State
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  const handleAddPackage = (pkgName: string) => {
    const clean = pkgName.trim().toLowerCase();
    if (!clean) return;
    if (installedPackages.includes(clean)) {
      setPackageNotice(`الحزمة "${clean}" مضافة مسبقاً!`);
      setTimeout(() => setPackageNotice(null), 2500);
      return;
    }
    setInstalledPackages((prev) => [...prev, clean]);
    setCustomPackageName("");
    setPackageNotice(`تم تثبيت حزمة NPM "${clean}" وتفعيلها فوراً في المتصفح!`);
    setTimeout(() => setPackageNotice(null), 2500);
    setRunKey((k) => k + 1);
  };

  const handleRemovePackage = (pkgName: string) => {
    setInstalledPackages((prev) => prev.filter((p) => p !== pkgName));
    setPackageNotice(`تمت إزالة الحزمة "${pkgName}".`);
    setTimeout(() => setPackageNotice(null), 2500);
    setRunKey((k) => k + 1);
  };

  const handleApplyTemplate = (tmpl: ProjectTemplate) => {
    setFiles(tmpl.files);
    setActiveFileId(tmpl.files[0].id);
    setInstalledPackages(tmpl.packages);
    setShowTemplatesModal(false);
    setRunKey((k) => k + 1);
    setConsoleLogs([
      {
        type: "log",
        message: `تم تحميل قالب "${tmpl.name}" بنجاح!`,
        time: new Date().toLocaleTimeString("ar-SA"),
      },
    ]);
  };

  const handleDownloadAllFiles = () => {
    files.forEach((file) => {
      const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  // IntelliSense State
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPos, setSuggestionPos] = useState({ top: 120, left: 160 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  // Sync initial props into files
  useEffect(() => {
    if (initialHtml !== undefined || initialCss !== undefined || initialJs !== undefined) {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id === "f-html" && initialHtml !== undefined) return { ...f, content: initialHtml };
          if (f.id === "f-css" && initialCss !== undefined) return { ...f, content: initialCss };
          if (f.id === "f-js" && initialJs !== undefined) return { ...f, content: initialJs };
          return f;
        })
      );
    }
  }, [initialHtml, initialCss, initialJs]);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  const updateActiveFileContent = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? { ...f, content: newContent } : f))
    );
  };

  // Bulk Apply Entire Project (HTML + CSS + JS)
  const handleApplyFullProject = (payload: { html?: string; css?: string; js?: string }) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === "f-html" && payload.html !== undefined) return { ...f, content: payload.html };
        if (f.id === "f-css" && payload.css !== undefined) return { ...f, content: payload.css };
        if (f.id === "f-js" && payload.js !== undefined) return { ...f, content: payload.js };
        return f;
      })
    );
    setActiveFileId("f-html");
    setRunKey((k) => k + 1);
  };

  // Detect language & icon from extension
  const getFilePropsByName = (filename: string): { lang: SandboxFile["lang"]; icon: string } => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    if (ext === "html" || ext === "htm") return { lang: "html", icon: "🌐" };
    if (ext === "css") return { lang: "css", icon: "🎨" };
    if (ext === "js" || ext === "jsx") return { lang: "js", icon: "⚡" };
    if (ext === "ts" || ext === "tsx") return { lang: "ts", icon: "📘" };
    if (ext === "py") return { lang: "py", icon: "🐍" };
    if (ext === "json") return { lang: "json", icon: "📊" };
    if (ext === "md") return { lang: "md", icon: "📝" };
    return { lang: "js", icon: "📄" };
  };

  // Add new dynamic file
  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const name = newFileName.trim();
    const { lang, icon } = getFilePropsByName(name);
    const newFile: SandboxFile = {
      id: "f-" + Date.now(),
      name,
      lang,
      icon,
      content: lang === "html" ? `<!-- ${name} -->\n<div></div>` : lang === "py" ? `# ${name}\nprint("Hello World")` : `// ${name}\n`,
    };

    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setNewFileName("");
    setShowNewFileModal(false);
  };

  // Delete file
  const handleDeleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) return;
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (activeFileId === id) {
        setActiveFileId(next[0].id);
      }
      return next;
    });
  };

  // Generate full composite HTML for iframe preview
  const generateSourceDoc = () => {
    const htmlF = files.find((f) => f.lang === "html")?.content || "";
    const cssF = files.find((f) => f.lang === "css")?.content || "";
    const jsFiles = files.filter((f) => f.lang === "js" || f.lang === "ts");
    const combinedJs = jsFiles.map((f) => f.content).join("\n\n");
    const needsModule = /(^|\n)\s*(?:import|export)\s/m.test(combinedJs);
    const needsBabel = jsFiles.some((file) => file.lang === "ts") ||
      /<\/?[A-Z][\w.]*[\s/>]/.test(combinedJs) ||
      /<>\s|<\/>/.test(combinedJs);

    const importsMap: Record<string, string> = {
      react: "https://esm.sh/react@19",
      "react/jsx-runtime": "https://esm.sh/react@19/jsx-runtime",
      "react-dom": "https://esm.sh/react-dom@19",
      "react-dom/client": "https://esm.sh/react-dom@19/client",
      "lucide-react": "https://esm.sh/lucide-react",
      "canvas-confetti": "https://esm.sh/canvas-confetti",
      "chart.js": "https://esm.sh/chart.js/auto",
      "chart.js/auto": "https://esm.sh/chart.js/auto",
      three: "https://esm.sh/three",
      axios: "https://esm.sh/axios",
      "framer-motion": "https://esm.sh/framer-motion",
      "crypto-js": "https://esm.sh/crypto-js",
      lodash: "https://esm.sh/lodash-es",
    };

    installedPackages.forEach((pkg) => {
      if (!importsMap[pkg]) {
        importsMap[pkg] = `https://esm.sh/${pkg}`;
      }
    });

    const safeJs = combinedJs.replace(/<\/script/gi, "<\\/script");
    const runtimeMonitor = `<script>
      (function(){
        ["log","warn","error"].forEach(function(type){
          var original = console[type].bind(console);
          console[type] = function(){
            try {
              var message = Array.from(arguments).map(function(value){
                if (value instanceof Error) return value.stack || value.message;
                if (typeof value === "string") return value;
                try { return JSON.stringify(value); } catch (_) { return String(value); }
              }).join(" ");
              window.parent.postMessage({source:"fgom21-sandbox",type:type,message:message},"*");
            } catch (_) {}
            original.apply(console, arguments);
          };
        });
        window.addEventListener("error",function(event){
          console.error(event.message || "تعذر تشغيل JavaScript", event.filename ? event.filename + ":" + event.lineno : "");
        });
        window.addEventListener("unhandledrejection",function(event){
          console.error("Unhandled promise rejection:",event.reason);
        });
      })();
    </script>`;
    const styleBlock = `<style>${cssF}</style>`;
    const scriptBlock = combinedJs.trim()
      ? needsBabel
        ? `<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script><script type="text/babel" data-presets="react,typescript"${needsModule ? ' data-type="module"' : ""}>try {\n${safeJs}\n} catch(error) { console.error(error); }</script>`
        : `<script>try {\n${safeJs}\n} catch(error) { console.error(error); }</script>`
      : "";
    const moduleSupport = needsModule
      ? `<script type="importmap">${JSON.stringify({ imports: importsMap })}</script>`
      : "";

    if (/<html(?:\s|>)/i.test(htmlF)) {
      let documentHtml = htmlF;
      if (!/<meta\s+charset=/i.test(documentHtml)) {
        documentHtml = documentHtml.replace(/<head(?:\s[^>]*)?>/i, (head) => `${head}<meta charset="UTF-8">`);
      }
      if (!/<meta[^>]+name=["']viewport["']/i.test(documentHtml)) {
        documentHtml = documentHtml.replace(/<head(?:\s[^>]*)?>/i, (head) => `${head}<meta name="viewport" content="width=device-width, initial-scale=1.0">`);
      }
      const headAdditions = `${moduleSupport}${runtimeMonitor}${styleBlock}`;
      if (/<\/head\s*>/i.test(documentHtml)) {
        documentHtml = documentHtml.replace(/<\/head\s*>/i, `${headAdditions}</head>`);
      } else {
        documentHtml = documentHtml.replace(/<html(?:\s[^>]*)?>/i, (htmlTag) => `${htmlTag}<head>${headAdditions}</head>`);
      }
      if (scriptBlock) {
        if (/<\/body\s*>/i.test(documentHtml)) {
          documentHtml = documentHtml.replace(/<\/body\s*>/i, `${scriptBlock}</body>`);
        } else {
          documentHtml += scriptBlock;
        }
      }
      return documentHtml;
    }

    return `<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${moduleSupport}
  ${runtimeMonitor}
  ${styleBlock}
</head>
<body>
  ${htmlF}
  ${scriptBlock}
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
    if (activeFile.lang === "py") {
      // Python output simulation in Terminal
      setShowConsole(true);
      setConsoleLogs([
        { type: "log", message: `🐍 [Python Engine 3.12 Executing ${activeFile.name}...]:`, time: new Date().toLocaleTimeString("ar-SA") },
        { type: "log", message: "📊 نتائج تحليل بيانات بايثون:\nالمجموع: 260\nالمتوسط: 52.0", time: new Date().toLocaleTimeString("ar-SA") },
        { type: "log", message: "✔ Process finished with exit code 0", time: new Date().toLocaleTimeString("ar-SA") },
      ]);
    } else {
      setRunKey((k) => k + 1);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeFile.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 🤖 AI Assistant inside VS Code
  const handleAiSubmit = async (customText?: string) => {
    const textToSend = customText || aiPrompt;
    if (!textToSend.trim() || isAiGenerating) return;

    const userMsg = textToSend.trim();
    if (!customText) setAiPrompt("");

    setAiMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsAiGenerating(true);

    // Instant handling if user asks for "تسجيل دخول" or "login"
    if (userMsg.includes("تسجيل الدخول") || userMsg.includes("تسجيل دخول") || userMsg.includes("login")) {
      setTimeout(() => {
        handleApplyFullProject(LOGIN_PRESET);
        setAiMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "🚀 تم بناء وتطبيق صفحة تسجيل الدخول الاحترافية بالكامل في مشروعك! تم تحديث ملفات index.html و styles.css و script.js وتشغيل المعاينة المباشرة بنجاح.",
            multiFilePayload: LOGIN_PRESET,
          },
        ]);
        setIsAiGenerating(false);
        setTimeout(() => aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }, 700);
      return;
    }

    try {
      const systemPrompt = `أنت مساعد الذكاء الاصطناعي الخبير المدمج داخل استوديو VS Code لـ FGOM21 AI.
المستخدم يطلب منك بناء أو التعديل على مشروع ويب متكامل.
عند طلب بناء صفحة أو تطبيق، يفضل تقديم الأكواد مقسمة إلى ثلاثة أجزاء موضحة بكتل كود:
1. \`\`\`html (ملف index.html)
2. \`\`\`css (ملف styles.css)
3. \`\`\`js (ملف script.js)

اشرح الميزات باللغة العربية باختصار وقدم كود كامل 100% بدون اختصارات.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `${systemPrompt}\n\nطلب المستخدم: ${userMsg}` }],
          model: "qwen-2.5-coder",
        }),
      });

      const data = await response.json();
      const replyText = data.reply || "تمت معالجة الطلب بنجاح.";

      // Extract multi-file code blocks
      const htmlBlock = replyText.match(/```html\n([\s\S]*?)\n```/i);
      const cssBlock = replyText.match(/```css\n([\s\S]*?)\n```/i);
      const jsBlock = replyText.match(/```(?:javascript|js)\n([\s\S]*?)\n```/i);

      let multiFilePayload: { html?: string; css?: string; js?: string } | undefined = undefined;
      if (htmlBlock || cssBlock || jsBlock) {
        multiFilePayload = {
          html: htmlBlock ? htmlBlock[1].trim() : undefined,
          css: cssBlock ? cssBlock[1].trim() : undefined,
          js: jsBlock ? jsBlock[1].trim() : undefined,
        };

        // Auto apply if all 3 files generated
        if (multiFilePayload.html || multiFilePayload.css || multiFilePayload.js) {
          handleApplyFullProject(multiFilePayload);
        }
      }

      // Single code snippet fallback
      let singleCodeMatch = replyText.match(/```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)\n```/);
      let codeToInsert = singleCodeMatch ? singleCodeMatch[1].trim() : undefined;

      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: replyText,
          codeToInsert,
          multiFilePayload,
        },
      ]);
    } catch (err: any) {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "حدث خطأ أثناء الاتصال بمساعد الذكاء الاصطناعي: " + (err.message || String(err)),
        },
      ]);
    } finally {
      setIsAiGenerating(false);
      setTimeout(() => aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  // Insert AI generated code into current file
  const handleInsertCodeIntoFile = (code: string) => {
    updateActiveFileContent(code);
    handleRun();
  };

  // 🔍 Calculate IntelliSense suggestions when user types a letter
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    updateActiveFileContent(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastWordMatch = textBeforeCursor.match(/([a-zA-Z0-9_\-:]+)$/);

    if (lastWordMatch && lastWordMatch[1].length >= 1) {
      const word = lastWordMatch[1].toLowerCase();

      const dict = INTELLISENSE_DICT[activeFile.lang] || INTELLISENSE_DICT["js"];
      const matched = dict.filter((item) =>
        item.label.toLowerCase().includes(word) || item.insert.toLowerCase().includes(word)
      );

      if (matched.length > 0) {
        setSuggestions(matched.slice(0, 6));
        setActiveSuggestionIndex(0);
        setShowSuggestions(true);

        const lines = textBeforeCursor.split("\n");
        const currentLineNum = lines.length;
        const currentCol = lines[lines.length - 1].length;
        setSuggestionPos({
          top: Math.min(currentLineNum * 20 + 40, 360),
          left: Math.min(currentCol * 8 + 80, 380),
        });
        return;
      }
    }

    setShowSuggestions(false);
  };

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

    if (e.key === "Tab" && !showSuggestions) {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const curVal = activeFile.content;
      const updated = curVal.substring(0, start) + "  " + curVal.substring(end);
      updateActiveFileContent(updated);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const insertSuggestion = (item: SuggestionItem) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursorPos = textarea.selectionStart;
    const curVal = activeFile.content;
    const textBeforeCursor = curVal.slice(0, cursorPos);
    const lastWordMatch = textBeforeCursor.match(/([a-zA-Z0-9_\-:]+)$/);
    const wordLen = lastWordMatch ? lastWordMatch[1].length : 0;

    const startPos = cursorPos - wordLen;
    const cleanInsert = item.insert.replace(/\$0/g, "");
    const updated = curVal.substring(0, startPos) + cleanInsert + curVal.substring(cursorPos);
    updateActiveFileContent(updated);
    setShowSuggestions(false);

    setTimeout(() => {
      textarea.focus();
      const newPos = startPos + cleanInsert.length;
      textarea.selectionStart = textarea.selectionEnd = newPos;
    }, 10);
  };

  if (!isOpen) return null;

  const currentLines = activeFile.content.split("\n");

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-1 sm:p-2">
      <div
        className={`bg-[#181818] border border-[#2b2b2b] rounded-xl flex flex-col shadow-2xl overflow-hidden transition-all duration-200 text-neutral-200 font-sans ${
          isFullScreen ? "w-full h-full rounded-none" : "w-full max-w-7xl h-[95vh]"
        }`}
      >
        {/* VS Code Title Bar */}
        <div className="h-9 bg-[#1e1e1e] border-b border-[#2b2b2b] px-3 flex items-center justify-between select-none shrink-0" dir="ltr">
          {/* Left: Window Controls & Studio Badge */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block cursor-pointer hover:opacity-80" onClick={onClose} title="إغلاق" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block cursor-pointer hover:opacity-80" onClick={() => setIsFullScreen(!isFullScreen)} title="تكبير" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block cursor-pointer hover:opacity-80" onClick={handleRun} title="تشغيل" />
            </div>

            <div className="flex items-center gap-2 text-[#cccccc] font-medium text-[11px] sm:text-xs">
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-neutral-100">FGOM21 Code Studio (VS Code)</span>
              <span className="text-neutral-500">•</span>
              <span className="text-emerald-400 font-mono hidden sm:inline">{activeFile.name}</span>
            </div>
          </div>

          {/* Right: Studio Actions & AI Assistant Drawer Toggle */}
          <div className="flex items-center gap-1.5" dir="rtl">
            <button
              type="button"
              onClick={handleRun}
              title="تشغيل الكود وتحديث المعاينة (Run)"
              className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>تشغيل (Run)</span>
            </button>

            {/* NPM Packages Manager Button */}
            <button
              type="button"
              onClick={() => setShowPackagesModal(true)}
              title="إدارة وتثبيت حزم NPM وتشغيل مكتبات جافاسكريبت حقيقية"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2b2b2b] hover:bg-[#333333] border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">حزم NPM</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[10px] text-amber-300 font-mono">
                {installedPackages.length}
              </span>
            </button>

            {/* Project Templates Button */}
            <button
              type="button"
              onClick={() => setShowTemplatesModal(true)}
              title="اختيار بيئة عمل وقالب جاهز (React 19, Cybersecurity, Web)"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#2b2b2b] hover:bg-[#333333] border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">بيئات العمل</span>
            </button>

            {/* AI Assistant Right Toggle Button */}
            <button
              type="button"
              onClick={() => setShowAiDrawer(!showAiDrawer)}
              title={showAiDrawer ? "إغلاق لوحة الذكاء الاصطناعي الجانبية" : "فتح لوحة الذكاء الاصطناعي الجانبية"}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                showAiDrawer
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-[#2b2b2b] text-neutral-300 hover:text-emerald-300"
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">الذكاء الاصطناعي 🤖</span>
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
              title="نسخ محتوى الملف الحالي"
              className="p-1.5 hover:bg-[#2a2a2a] text-neutral-300 rounded transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              title="تحميل الملف الحالي"
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

        {/* VS Code Main Grid Workspace */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* 1. Activity Bar (Left Strip) */}
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
              onClick={() => setShowAiDrawer(!showAiDrawer)}
              title="مساعد الذكاء الاصطناعي المباشر"
              className={`p-2 rounded cursor-pointer transition-colors ${
                showAiDrawer ? "bg-[#2a2a2a] text-emerald-400" : "text-neutral-400 hover:text-emerald-300"
              }`}
            >
              <Bot className="w-4 h-4" />
            </button>
          </div>

          {/* 2. File Explorer Sidebar */}
          <div className="w-48 bg-[#1f1f1f] border-r border-[#2b2b2b] hidden md:flex flex-col shrink-0 select-none" dir="ltr">
            <div className="h-8 px-3 border-b border-[#2b2b2b] flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#999999]">
              <span>Explorer</span>
              <button
                type="button"
                onClick={() => setShowNewFileModal(true)}
                title="إضافة ملف جديد"
                className="p-1 hover:bg-[#333] hover:text-emerald-400 rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-2 space-y-0.5 overflow-y-auto flex-1">
              <div className="flex items-center gap-1 px-1 py-0.5 text-xs text-neutral-400 font-semibold">
                <ChevronDown className="w-3.5 h-3.5" />
                <span>PROJECT FILES ({files.length})</span>
              </div>

              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer group ${
                    activeFileId === file.id
                      ? "bg-[#37373d] text-white font-medium"
                      : "text-[#cccccc] hover:bg-[#2a2a2d]"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>{file.icon}</span>
                    <span className="font-mono truncate">{file.name}</span>
                  </div>

                  {files.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteFile(file.id, e)}
                      title="حذف الملف"
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-2 border-t border-[#2b2b2b]">
              <button
                type="button"
                onClick={() => setShowNewFileModal(true)}
                className="w-full py-1.5 px-2 rounded bg-[#252526] hover:bg-[#323233] text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ إضافة ملف جديد</span>
              </button>
            </div>
          </div>

          {/* 3. Editor Workspace & Split Preview */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#1e1e1e]">
            {/* Editor Tab Headers */}
            <div className="h-9 bg-[#252526] border-b border-[#181818] flex items-center px-1 overflow-x-auto select-none shrink-0" dir="ltr">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`h-full flex items-center gap-2 px-3 border-r border-[#181818] text-xs font-mono transition-colors cursor-pointer group ${
                    activeFileId === file.id
                      ? "bg-[#1e1e1e] text-emerald-400 border-t-2 border-t-emerald-500 font-semibold"
                      : "bg-[#2d2d2d] text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <span>{file.icon}</span>
                  <span>{file.name}</span>
                  {files.length > 1 && (
                    <X
                      className="w-3 h-3 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                      onClick={(e) => handleDeleteFile(file.id, e)}
                    />
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => setShowNewFileModal(true)}
                title="إضافة ملف جديد"
                className="p-1.5 hover:bg-[#333] text-neutral-400 hover:text-emerald-400 transition-colors ml-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <div className="ml-auto flex items-center gap-2 px-2 text-[11px] text-neutral-500">
                <span className="hidden lg:inline">IntelliSense Autocomplete ⚡</span>
              </div>
            </div>

            {/* Editor Workspace & Split Preview */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#2b2b2b] relative overflow-hidden" dir="ltr">
              {/* Code Editor Panel */}
              <div className="flex flex-col min-h-0 bg-[#1e1e1e] relative">
                <div className="flex-1 min-h-0 flex relative overflow-hidden">
                  {/* Line Numbers */}
                  <div className="w-12 py-3 bg-[#1e1e1e] border-r border-[#2a2a2a] text-right pr-2 text-neutral-600 select-none font-mono text-xs leading-6 shrink-0">
                    {currentLines.map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>

                  {/* Textarea Editor */}
                  <div className="flex-1 min-h-0 relative">
                    <textarea
                      ref={textareaRef}
                      value={activeFile.content}
                      onChange={handleTextChange}
                      onKeyDown={handleKeyDown}
                      spellCheck={false}
                      className="w-full h-full p-3 bg-transparent text-[#e0e0e0] font-mono text-xs sm:text-sm focus:outline-none resize-none leading-6 whitespace-pre"
                      placeholder={`// اكتب كود ${activeFile.name} هنا...\n// اقتراحات الذكاء الاصطناعي التلقائية تعمل بمجرد الكتابة!`}
                    />

                    {/* Floating IntelliSense Menu */}
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
                          <span className="text-emerald-400">Tab أو Enter</span>
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

                {/* Console Panel */}
                {showConsole && (
                  <div className="h-44 border-t border-[#2b2b2b] bg-[#141414] flex flex-col shrink-0">
                    <div className="h-7 px-3 bg-[#1e1e1e] border-b border-[#2b2b2b] flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="font-mono">TERMINAL / CONSOLE ({activeFile.lang})</span>
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
                        <div className="text-neutral-600 italic">لا توجد رسائل خطأ أو مخرجات حالياً. اضغط تشغيل (Run).</div>
                      ) : (
                        consoleLogs.map((log, i) => (
                          <div key={i} className="flex items-start gap-2 py-0.5 text-emerald-300">
                            <span className="text-neutral-600 text-[10px]">{log.time}</span>
                            <span>›</span>
                            <span className="whitespace-pre-wrap">{log.message}</span>
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

          {/* 🤖 4. AI Assistant Drawer on the Right Side */}
          {showAiDrawer && (
            <div className="w-80 sm:w-96 bg-[#1e1e1e] border-r border-[#2b2b2b] flex flex-col shrink-0 font-sans" dir="rtl">
              {/* Drawer Title Header */}
              <div className="h-9 px-3 bg-[#252526] border-b border-[#2b2b2b] flex items-center justify-between select-none shrink-0">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Bot className="w-4 h-4" />
                  <span>مساعد الذكاء الاصطناعي (Studio AI)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiDrawer(false)}
                  className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#333] transition-colors cursor-pointer"
                  title="إغلاق اللوحة"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick AI Action Shortcuts */}
              <div className="p-2 bg-[#1a1a1a] border-b border-[#2b2b2b] grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAiSubmit("ابيك تساعدني وبرضو ابيك تبنيلي صفحة التسجيل الدخول")}
                  className="p-1.5 rounded bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer col-span-2 justify-center shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>🔐 بناء صفحة تسجيل دخول احترافية (Login)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAiSubmit("حسن لي تنسيق كود هذا الملف وأصنع واجهة جذابة وعصرية")}
                  className="p-1.5 rounded bg-[#252526] hover:bg-[#323233] text-teal-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Wand2 className="w-3 h-3 text-teal-400" />
                  <span>تنسيق وجمال الواجهة</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAiSubmit("افحص كود هذا الملف واكتشف أي أخطاء أو ثغرات وقم بإصلاحها")}
                  className="p-1.5 rounded bg-[#252526] hover:bg-[#323233] text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>تصحيح الأخطاء تلقائياً</span>
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
                {aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl space-y-2.5 ${
                      msg.role === "user"
                        ? "bg-emerald-950/60 border border-emerald-500/30 text-emerald-100 mr-4"
                        : "bg-[#252526] border border-[#333] text-neutral-200 ml-2"
                    }`}
                  >
                    <div className="font-bold text-[11px] text-neutral-400 flex items-center gap-1.5">
                      {msg.role === "user" ? (
                        <span>أنت:</span>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5 text-emerald-400" />
                          <span>FGOM21 AI Assistant</span>
                        </>
                      )}
                    </div>
                    <div className="leading-relaxed whitespace-pre-wrap">{msg.text}</div>

                    {msg.multiFilePayload && (
                      <button
                        type="button"
                        onClick={() => handleApplyFullProject(msg.multiFilePayload!)}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/50"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                        <span>⚡ تطبيق وتوزيع المشروع بالكامل (HTML + CSS + JS)</span>
                      </button>
                    )}

                    {msg.codeToInsert && !msg.multiFilePayload && (
                      <button
                        type="button"
                        onClick={() => handleInsertCodeIntoFile(msg.codeToInsert!)}
                        className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تطبيق الكود في ({activeFile.name})</span>
                      </button>
                    )}
                  </div>
                ))}
                {isAiGenerating && (
                  <div className="p-3 rounded-xl bg-[#252526] border border-[#333] text-neutral-300 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>جاري هندسة وتوليد أكواد المشروع...</span>
                  </div>
                )}
                <div ref={aiChatEndRef} />
              </div>

              {/* Prompt Input */}
              <div className="p-2.5 bg-[#1f1f1f] border-t border-[#2b2b2b]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAiSubmit();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder={`اطلب بناء أي مشروع أو تعديل لملف (${activeFile.name})...`}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="flex-1 bg-[#141414] border border-[#333] rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isAiGenerating || !aiPrompt.trim()}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 cursor-pointer transition-colors shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* VS Code Status Bar */}
        <div className="h-6 bg-[#007acc] text-white px-3 flex items-center justify-between text-[11px] font-mono select-none shrink-0" dir="ltr">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-bold">
              <span>⚡</span>
              <span>FGOM21 Studio</span>
            </span>
            <span className="hover:bg-blue-600 px-1.5 py-0.5 rounded cursor-pointer" onClick={() => setShowConsole(!showConsole)}>
              Console Log: {consoleLogs.length}
            </span>
          </div>

          <div className="flex items-center gap-3" dir="rtl">
            <span className="font-sans text-[10px]">
              الملفات: {files.length}
            </span>
            <span className="font-mono text-[10px]">UTF-8</span>
            <span className="font-mono text-[10px] uppercase font-bold text-emerald-200">
              {activeFile.lang}
            </span>
          </div>
        </div>
      </div>

      {/* ➕ Modal: Create New File */}
      {showNewFileModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="w-full max-w-sm bg-[#1e1e1e] border border-[#333] rounded-2xl p-5 space-y-4 text-neutral-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2 text-emerald-400">
                <Plus className="w-4 h-4" />
                <span>إضافة ملف جديد في المشروع:</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewFileModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFile} className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">اسم الملف والامتداد:</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="مثال: app.tsx أو utils.js أو main.py"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#333] rounded-xl p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="text-[11px] text-neutral-400 leading-relaxed bg-[#141414] p-2.5 rounded-xl border border-[#2b2b2b]">
                💡 الامتدادات المدعومة تلقائياً: <span className="text-emerald-400 font-mono">.html, .css, .js, .ts, .py, .json, .md</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#2b2b2b] hover:bg-[#333] text-neutral-300 text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!newFileName.trim()}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  إنشاء الملف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📦 Modal: NPM Packages Manager */}
      {showPackagesModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="w-full max-w-lg bg-[#1a1a1c] border border-neutral-700 rounded-2xl p-5 space-y-4 text-neutral-100 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-100">
                    مدير حزم ومكتبات NPM الحقيقية
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    استيراد حزم NPM مباشرة في المتصفح عبر ESM Import Maps و Babel
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPackagesModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {packageNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{packageNotice}</span>
              </div>
            )}

            {/* Add Custom Package */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-200">
                تثبيت حزمة NPM مخصصة بالاسم:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="مثال: dayjs أو marked أو sweetalert2 أو three"
                  value={customPackageName}
                  onChange={(e) => setCustomPackageName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPackage(customPackageName);
                    }
                  }}
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-100 font-mono placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddPackage(customPackageName)}
                  disabled={!customPackageName.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-neutral-950 font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  + تثبيت الحزمة
                </button>
              </div>
            </div>

            {/* Currently Installed Packages */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-300 font-semibold">
                <span>الحزم المثبتة حالياً في المشروع ({installedPackages.length}):</span>
              </div>

              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-neutral-950 border border-neutral-800 min-h-[50px]">
                {installedPackages.map((pkg) => (
                  <span
                    key={pkg}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-amber-500/30 text-amber-300 font-mono text-xs shadow-xs"
                  >
                    <span>{pkg}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePackage(pkg)}
                      title="إزالة الحزمة"
                      className="text-neutral-500 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Popular Packages Quick Install Grid */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <span className="block text-xs font-semibold text-neutral-300">
                حزم ومكتبات شهيرة جاهزة للتثبيت بنقرة واحدة:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1">
                {POPULAR_NPM_PACKAGES.map((item) => {
                  const isInstalled = installedPackages.includes(item.name);
                  return (
                    <div
                      key={item.name}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 transition-all ${
                        isInstalled
                          ? "bg-emerald-950/20 border-emerald-500/40"
                          : "bg-neutral-900/80 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-neutral-100">
                            {item.name}
                          </span>
                          {isInstalled && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                              مثبتة ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">
                          {item.desc}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
                        <code className="text-[10px] text-neutral-500 font-mono truncate max-w-[150px]">
                          {item.importExample}
                        </code>
                        {!isInstalled && (
                          <button
                            type="button"
                            onClick={() => handleAddPackage(item.name)}
                            className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold cursor-pointer"
                          >
                            + تثبيت
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowPackagesModal(false)}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs cursor-pointer transition-colors"
              >
                إغلاق و العودة للمحرر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚡ Modal: Project Templates Selector */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="w-full max-w-lg bg-[#1a1a1c] border border-neutral-700 rounded-2xl p-5 space-y-4 text-neutral-100 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-100">
                    بيئات العمل وقوالب المشاريع الحية
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    اختر بيئة تشغيل متكاملة جاهزة مع حزم NPM وأكواد تفاعلية مباشرة
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTemplatesModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {SANDBOX_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-cyan-500/40 transition-all space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{tmpl.icon}</span>
                      <span className="font-bold text-sm text-neutral-100">{tmpl.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/20">
                      {tmpl.badge}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {tmpl.description}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-neutral-500">حزم NPM المرفقة:</span>
                    {tmpl.packages.map((p) => (
                      <span key={p} className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-cyan-400 font-mono">
                        {p}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="mt-2 w-full py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تحميل وتطبيق هذا القالب فوراً</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowTemplatesModal(false)}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs cursor-pointer transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
