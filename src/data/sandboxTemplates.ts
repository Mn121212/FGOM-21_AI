import { SandboxFile } from "../components/CodeSandboxModal";

export interface NpmPackageDef {
  name: string;
  desc: string;
  category: "framework" | "ui" | "visuals" | "utility" | "security";
  importExample: string;
  defaultUrl?: string;
}

export const POPULAR_NPM_PACKAGES: NpmPackageDef[] = [
  {
    name: "react",
    desc: "مكتبة واجهات المستخدم الأشهر عالمياً (React 19)",
    category: "framework",
    importExample: "import React, { useState } from 'react';",
    defaultUrl: "https://esm.sh/react@19",
  },
  {
    name: "react-dom",
    desc: "تصيير وإدارة شجرة React DOM في المتصفح",
    category: "framework",
    importExample: "import ReactDOM from 'react-dom/client';",
    defaultUrl: "https://esm.sh/react-dom@19",
  },
  {
    name: "lucide-react",
    desc: "أيقونات SVG حديثة فائقة النقاء لمشاريع الويب",
    category: "ui",
    importExample: "import { Sparkles, Terminal, Shield } from 'lucide-react';",
    defaultUrl: "https://esm.sh/lucide-react",
  },
  {
    name: "canvas-confetti",
    desc: "تأثيرات الألعاب النارية والاحتفالات المبهجة",
    category: "visuals",
    importExample: "import confetti from 'canvas-confetti';",
    defaultUrl: "https://esm.sh/canvas-confetti",
  },
  {
    name: "chart.js",
    desc: "رسوم ومخططات بيانية تفاعلية متقدمة",
    category: "visuals",
    importExample: "import Chart from 'chart.js/auto';",
    defaultUrl: "https://esm.sh/chart.js/auto",
  },
  {
    name: "three",
    desc: "محرك رسوميات ثلاثية الأبعاد 3D WebGL",
    category: "visuals",
    importExample: "import * as THREE from 'three';",
    defaultUrl: "https://esm.sh/three",
  },
  {
    name: "crypto-js",
    desc: "حزمة أدوات التشفير والأمن السيبراني (SHA-256, MD5, AES)",
    category: "security",
    importExample: "import CryptoJS from 'crypto-js';",
    defaultUrl: "https://esm.sh/crypto-js",
  },
  {
    name: "axios",
    desc: "عميل HTTP لإرسال واستقبال طلبات الـ REST API",
    category: "utility",
    importExample: "import axios from 'axios';",
    defaultUrl: "https://esm.sh/axios",
  },
  {
    name: "lodash",
    desc: "مكتبة الدوال المساعدة الفائقة للبيانات والمصفوفات",
    category: "utility",
    importExample: "import _ from 'lodash';",
    defaultUrl: "https://esm.sh/lodash-es",
  },
];

export interface ProjectTemplate {
  id: string;
  name: string;
  badge: string;
  icon: string;
  description: string;
  files: SandboxFile[];
  packages: string[];
}

export const SANDBOX_TEMPLATES: ProjectTemplate[] = [
  {
    id: "react19",
    name: "React 19 + Lucide + Confetti",
    badge: "بيئة React حديثة",
    icon: "⚛️",
    description: "تطبيق React 19 كامل مع JSX و Hooks ومكتبة أيقونات وتأثيرات احتفالية حية.",
    packages: ["react", "react-dom", "lucide-react", "canvas-confetti"],
    files: [
      {
        id: "f-html",
        name: "index.html",
        lang: "html",
        icon: "🌐",
        content: `<!-- ⚛️ حاوية تطبيق React 19 المباشر -->
<div id="root"></div>`,
      },
      {
        id: "f-css",
        name: "styles.css",
        lang: "css",
        icon: "🎨",
        content: `body {
  margin: 0;
  background-color: #09090b;
  color: #f4f4f5;
  font-family: system-ui, -apple-system, sans-serif;
}`,
      },
      {
        id: "f-js",
        name: "App.jsx",
        lang: "js",
        icon: "⚡",
        content: `import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import confetti from "canvas-confetti";
import { Sparkles, Terminal, Code2, ShieldCheck, Heart } from "lucide-react";

function App() {
  const [count, setCount] = useState(0);

  const handleCelebrate = () => {
    setCount((c) => c + 1);
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 text-right" dir="rtl">
      <div className="max-w-md w-full bg-neutral-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950">
          <Sparkles className="w-8 h-8 text-neutral-950" />
        </div>

        <h1 className="text-xl font-black text-neutral-100">تطبيق React 19 المباشر</h1>
        <p className="text-xs text-neutral-400 leading-relaxed">
          يعمل بالكامل داخل المتصفح مع حزم NPM الحقيقية و Babel Live Transpiler بدون أي خادم!
        </p>

        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
          <span className="text-xs text-neutral-400">العداد التفاعلي (React State):</span>
          <div className="text-4xl font-mono font-bold text-emerald-400">{count}</div>
        </div>

        <button
          onClick={handleCelebrate}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 font-bold text-sm shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>زيادة العداد وتشغيل التأثير 🎉</span>
        </button>

        <div className="text-[11px] text-neutral-500 pt-2 flex items-center justify-center gap-1 font-mono">
          <span>🇸🇦 FGOM21 Live Web Sandbox</span>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);`,
      },
      {
        id: "f-pkg",
        name: "package.json",
        lang: "json",
        icon: "📦",
        content: `{
  "name": "fgom21-react-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.546.0",
    "canvas-confetti": "^1.9.4"
  }
}`,
      },
    ],
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity & Cryptography Lab",
    badge: "مختبر الأمن السيبراني",
    icon: "🛡️",
    description: "مختبر حقيقي للأمن السيبراني، تجزئة النصوص بـ SHA-256 و MD5، واختبار قوة كلمات المرور.",
    packages: ["crypto-js"],
    files: [
      {
        id: "f-html",
        name: "index.html",
        lang: "html",
        icon: "🌐",
        content: `<div class="cyber-app" dir="rtl">
  <div class="cyber-header">
    <div class="tag">🛡️ FGOM21 Security Suite 🇸🇦</div>
    <h2>مختبر التشفير وفحص أمان الويب</h2>
    <p>أداة مباشرة لحساب تجزئات التشفير وفحص قوة كلمات المرور وتعقيم المدخلات</p>
  </div>

  <div class="card">
    <label>النص المراد تجزئته (Hash Input):</label>
    <input type="text" id="hashInput" value="FGOM21-Secure-Web-2026" placeholder="اكتب أي نص أو مفتاح..." />
    <div class="hash-row">
      <span class="label">SHA-256 Hash:</span>
      <code id="sha256Result">...</code>
    </div>
    <div class="hash-row">
      <span class="label">MD5 Hash:</span>
      <code id="md5Result">...</code>
    </div>
  </div>

  <div class="card">
    <label>محلل قوة كلمات المرور (Entropy & Strength):</label>
    <input type="text" id="passInput" value="Fgom@2026#SecureWeb" placeholder="اختبر كلمة مرور..." />
    <div class="meter-track">
      <div id="meterFill" class="meter-fill"></div>
    </div>
    <div class="meter-footer">
      <span>مستوى الأمان: <strong id="strengthText">فائقة الأمان</strong></span>
      <span class="entropy-tag" id="entropyTag">4/4 معايير</span>
    </div>
  </div>
</div>`,
      },
      {
        id: "f-css",
        name: "styles.css",
        lang: "css",
        icon: "🎨",
        content: `body {
  margin: 0;
  background-color: #07090e;
  color: #e2e8f0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1.5rem;
}
.cyber-app {
  width: 100%;
  max-width: 600px;
  background: #0f172a;
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 20px;
  padding: 1.75rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.6);
}
.cyber-header {
  text-align: center;
  margin-bottom: 1.5rem;
}
.cyber-header h2 {
  margin: 0.5rem 0 0.25rem;
  color: #f8fafc;
  font-size: 1.35rem;
}
.cyber-header p {
  color: #94a3b8;
  font-size: 0.8rem;
  margin: 0;
}
.tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  font-size: 0.75rem;
  font-weight: bold;
}
.card {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}
.card label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 0.5rem;
}
input[type="text"] {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  background: #0f172a;
  border: 1px solid #334155;
  color: #f1f5f9;
  font-size: 0.85rem;
  box-sizing: border-box;
}
input[type="text"]:focus {
  outline: none;
  border-color: #10b981;
}
.hash-row {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #050811;
  border-radius: 8px;
  border: 1px solid #1e293b;
}
.hash-row .label {
  display: block;
  font-size: 0.7rem;
  color: #64748b;
  margin-bottom: 0.2rem;
}
.hash-row code {
  display: block;
  font-family: monospace;
  font-size: 0.75rem;
  color: #34d399;
  word-break: break-all;
}
.meter-track {
  height: 8px;
  background: #1e293b;
  border-radius: 999px;
  margin-top: 0.75rem;
  overflow: hidden;
}
.meter-fill {
  height: 100%;
  width: 80%;
  background: #10b981;
  transition: all 0.3s ease;
}
.meter-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #94a3b8;
}`,
      },
      {
        id: "f-js",
        name: "script.js",
        lang: "js",
        icon: "⚡",
        content: `import CryptoJS from "crypto-js";

const hashInput = document.getElementById("hashInput");
const sha256Result = document.getElementById("sha256Result");
const md5Result = document.getElementById("md5Result");

function updateHashes() {
  const val = hashInput.value || "";
  sha256Result.textContent = CryptoJS.SHA256(val).toString();
  md5Result.textContent = CryptoJS.MD5(val).toString();
}

hashInput.addEventListener("input", updateHashes);
updateHashes();

const passInput = document.getElementById("passInput");
const meterFill = document.getElementById("meterFill");
const strengthText = document.getElementById("strengthText");
const entropyTag = document.getElementById("entropyTag");

function checkStrength() {
  const pass = passInput.value || "";
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  const widths = ["20%", "40%", "65%", "85%", "100%"];
  const texts = ["ضعيفة جداً", "ضعيفة", "متوسطة", "قوية", "فائقة الأمان 🛡️"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#10b981", "#00E676"];

  meterFill.style.width = widths[score];
  meterFill.style.backgroundColor = colors[score];
  strengthText.textContent = texts[score];
  strengthText.style.color = colors[score];
  entropyTag.textContent = \`\${score}/4 معايير\`;
}

passInput.addEventListener("input", checkStrength);
checkStrength();

console.log("🛡️ تم تفعيل مختبر الأمن السيبراني FGOM21 بنجاح عبر CryptoJS!");`,
      },
      {
        id: "f-pkg",
        name: "package.json",
        lang: "json",
        icon: "📦",
        content: `{
  "name": "fgom21-cybersecurity-lab",
  "version": "1.0.0",
  "dependencies": {
    "crypto-js": "latest"
  }
}`,
      },
    ],
  },
  {
    id: "modern-web",
    name: "Modern Web + Confetti + Tailwind",
    badge: "تطبيق ويب تفاعلي",
    icon: "🌐",
    description: "صفحة هبوط تفاعلية مع أزرار تشغيل احتفالية وبطاقات تقنية بـ Tailwind CSS.",
    packages: ["canvas-confetti"],
    files: [
      {
        id: "f-html",
        name: "index.html",
        lang: "html",
        icon: "🌐",
        content: `<div class="min-h-screen bg-neutral-950 text-neutral-100 p-8 flex flex-col items-center justify-center font-sans" dir="rtl">
  <div class="max-w-md w-full bg-neutral-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4">
    <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950">
      <span class="text-2xl">⚡</span>
    </div>
    <h1 class="text-xl font-black text-neutral-100">استوديو تطوير الويب المباشر</h1>
    <p class="text-xs text-neutral-400 leading-relaxed">
      منصة FGOM21 AI تتيح لك كتابة الأكواد ومعاينتها لحظياً مع كامل أدوات الـ Live Preview!
    </p>

    <button
      id="celebrateBtn"
      class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 font-bold text-sm shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
    >
      <span>إطلاق الاحتفال بالأكواد 🎉</span>
    </button>

    <div class="text-[10px] text-neutral-500 pt-2 flex items-center justify-center gap-1 font-mono">
      <span>🇸🇦 تطوير سعودي متكامل — FGOM21 AI</span>
    </div>
  </div>
</div>`,
      },
      {
        id: "f-css",
        name: "styles.css",
        lang: "css",
        icon: "🎨",
        content: `body {
  margin: 0;
  background-color: #09090b;
}`,
      },
      {
        id: "f-js",
        name: "script.js",
        lang: "js",
        icon: "⚡",
        content: `import confetti from "canvas-confetti";

const btn = document.getElementById("celebrateBtn");
btn.addEventListener("click", () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
  console.log("🎉 تم إطلاق الاحتفال بنجاح!");
});

console.log("مرحباً بك في استوديو تطوير الويب FGOM21 AI 🇸🇦");`,
      },
      {
        id: "f-pkg",
        name: "package.json",
        lang: "json",
        icon: "📦",
        content: `{
  "name": "fgom21-modern-web",
  "version": "1.0.0",
  "dependencies": {
    "canvas-confetti": "latest"
  }
}`,
      },
    ],
  },
];

