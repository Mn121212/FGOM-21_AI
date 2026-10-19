import React, { useState } from "react";
import { Check, Copy, Download, Code2, Play, ShieldAlert } from "lucide-react";
import { ChatFontSize } from "../types";

interface CodeBlockProps {
  language?: string;
  value: string;
  fontSize?: ChatFontSize;
  onRunInSandbox?: (code: string, language: string) => void;
  onAuditSecurity?: (code: string, language: string) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  language = "plaintext",
  value,
  fontSize = "large",
  onRunInSandbox,
  onAuditSecurity,
}) => {
  const [copied, setCopied] = useState(false);

  const cleanLang = language.replace(/^language-/, "").toLowerCase() || "code";
  const isRunnable = ["html", "css", "javascript", "js", "typescript", "ts", "jsx", "tsx"].includes(cleanLang);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleDownload = () => {
    const extMap: Record<string, string> = {
      python: "py",
      javascript: "js",
      typescript: "ts",
      jsx: "jsx",
      tsx: "tsx",
      html: "html",
      css: "css",
      json: "json",
      sql: "sql",
      cpp: "cpp",
      c: "c",
      java: "java",
      rust: "rs",
      go: "go",
      bash: "sh",
      shell: "sh",
    };
    const ext = extMap[cleanLang] || "txt";
    const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code_snippet.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = value.split("\n");

  return (
    <div id="code-block-container" className="my-4 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 text-neutral-200 shadow-xl">
      {/* Code Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/90 border-b border-neutral-800/80 text-xs text-neutral-400">
        <div className="flex items-center gap-2 font-mono">
          <Code2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold uppercase tracking-wider text-neutral-300">
            {cleanLang}
          </span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-500 font-sans">{lines.length} سطر</span>
        </div>

        <div className="flex items-center gap-1.5" dir="ltr">
          {/* Live Runner Button */}
          {isRunnable && onRunInSandbox && (
            <button
              type="button"
              onClick={() => onRunInSandbox(value, cleanLang)}
              title="تشغيل وتجربة الكود في استوديو الأكواد الحي"
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 rounded-md transition-colors font-sans text-xs cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>تشغيل الكود</span>
            </button>
          )}

          {/* Security Audit Button */}
          {onAuditSecurity && (
            <button
              type="button"
              onClick={() => onAuditSecurity(value, cleanLang)}
              title="فحص أمان وثغرات هذا الكود (OWASP Scanner)"
              className="flex items-center gap-1 px-2.5 py-1 bg-red-950/40 hover:bg-red-900/40 border border-red-500/30 text-red-300 rounded-md transition-colors font-sans text-xs cursor-pointer"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>فحص الأمان</span>
            </button>
          )}

          <button
            id="download-code-btn"
            onClick={handleDownload}
            title="تحميل كملف"
            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-md transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            id="copy-code-btn"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-200 rounded-md transition-colors font-sans text-xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>نسخ الكود</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content in Strict LTR */}
      <div
        className={`overflow-x-auto p-4 sm:p-5 font-mono leading-relaxed bg-neutral-950/95 ${
          fontSize === "xlarge"
            ? "text-base sm:text-lg"
            : fontSize === "large"
            ? "text-sm sm:text-base"
            : "text-xs sm:text-sm"
        }`}
        dir="ltr"
      >
        <pre className="flex">
          {/* Line Numbers */}
          <div className="select-none pr-4 mr-4 border-r border-neutral-800 text-neutral-600 text-right min-w-[2.5rem]">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          {/* Actual Code Text */}
          <code className="text-neutral-100 flex-1 whitespace-pre tab-4">
            {value}
          </code>
        </pre>
      </div>
    </div>
  );
};
