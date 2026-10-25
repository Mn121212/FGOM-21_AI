import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Terminal, User, FileCode, RotateCcw, Cpu, ShieldCheck } from "lucide-react";
import { ChatMessage as ChatMessageType, ChatFontSize } from "../types";
import { CodeBlock } from "./CodeBlock";
import { BrandLogo } from "./BrandLogo";

interface ChatMessageProps {
  message: ChatMessageType;
  onRegenerate?: () => void;
  fontSize?: ChatFontSize;
  onRunInSandbox?: (code: string, language: string) => void;
  onAuditSecurity?: (code: string, language: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRegenerate,
  fontSize = "large",
  onRunInSandbox,
  onAuditSecurity,
}) => {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === "assistant";

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  // Typographic scale mappings
  const proseSizeClasses =
    fontSize === "xlarge"
      ? "text-xl sm:text-2xl leading-[2.1] text-neutral-50"
      : fontSize === "large"
      ? "text-base sm:text-lg md:text-xl leading-[1.95] text-neutral-100"
      : "text-base leading-relaxed text-neutral-100";

  const inlineCodeClasses =
    fontSize === "xlarge"
      ? "text-base sm:text-lg px-2.5 py-1"
      : fontSize === "large"
      ? "text-sm sm:text-base px-2 py-0.5"
      : "text-xs sm:text-sm px-1.5 py-0.5";

  const h1Classes =
    fontSize === "xlarge"
      ? "text-2xl sm:text-3xl font-bold text-white mt-5 mb-3 text-right"
      : fontSize === "large"
      ? "text-xl sm:text-2xl font-bold text-white mt-4 mb-2.5 text-right"
      : "text-lg sm:text-xl font-bold text-white mt-4 mb-2 text-right";

  const h2Classes =
    fontSize === "xlarge"
      ? "text-xl sm:text-2xl font-bold text-white mt-4 mb-2.5 border-b border-neutral-800 pb-1.5 text-right"
      : fontSize === "large"
      ? "text-lg sm:text-xl font-bold text-white mt-3.5 mb-2 border-b border-neutral-800 pb-1 text-right"
      : "text-base sm:text-lg font-bold text-white mt-3.5 mb-2 border-b border-neutral-800 pb-1 text-right";

  const h3Classes =
    fontSize === "xlarge"
      ? "text-lg sm:text-xl font-semibold text-neutral-100 mt-3.5 mb-2 text-right"
      : fontSize === "large"
      ? "text-base sm:text-lg font-semibold text-neutral-100 mt-3 mb-1.5 text-right"
      : "text-sm sm:text-base font-semibold text-neutral-200 mt-3 mb-1.5 text-right";

  const tableClasses =
    fontSize === "xlarge"
      ? "text-base sm:text-lg"
      : fontSize === "large"
      ? "text-sm sm:text-base"
      : "text-xs sm:text-sm";

  return (
    <div
      id={`message-${message.id}`}
      className={`py-6 px-4 sm:px-7 transition-colors ${
        isAssistant ? "bg-neutral-900/40 border-y border-neutral-900/90" : "bg-transparent"
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-4 sm:gap-5">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isAssistant ? (
            <BrandLogo size="md" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-200">
              <User className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Message Content Body */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Header row: Author + timestamp */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-neutral-400">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm sm:text-base">
                {isAssistant ? "FGOM21 AI" : "أنت"}
              </span>

              {isAssistant && message.modelUsed && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-neutral-800/90 border border-neutral-700/70 text-neutral-200 font-mono">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  {message.modelUsed}
                </span>
              )}

              {isAssistant && message.developerMode && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  وضع المطور
                </span>
              )}
            </div>

            <span className="text-xs text-neutral-500 font-mono">
              {new Date(message.timestamp).toLocaleTimeString("ar-SA", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Attached files badges in user message */}
          {message.files && message.files.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-2">
              {message.files.map((file, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800/90 border border-neutral-700/80 text-xs sm:text-sm text-neutral-200 font-mono"
                >
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  {file.name}
                  <span className="text-neutral-400 text-xs">
                    ({file.language.toUpperCase()})
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Markdown Content */}
          <div className={`${proseSizeClasses} font-sans prose prose-invert max-w-none text-right`} dir="rtl">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeString = String(children).replace(/\n$/, "");

                  if (!inline && (match || codeString.includes("\n"))) {
                    return (
                      <CodeBlock
                        language={match ? match[1] : "plaintext"}
                        value={codeString}
                        fontSize={fontSize}
                        onRunInSandbox={onRunInSandbox}
                        onAuditSecurity={onAuditSecurity}
                      />
                    );
                  }

                  return (
                    <code
                      className={`${inlineCodeClasses} mx-0.5 rounded-md bg-neutral-800/90 text-emerald-300 font-mono border border-neutral-700/60 font-medium`}
                      dir="ltr"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p({ children }) {
                  return <p className="mb-4 last:mb-0 leading-inherit font-normal text-right" dir="rtl">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-disc list-inside space-y-1.5 my-3 mr-2 text-right" dir="rtl">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal list-inside space-y-1.5 my-3 mr-2 text-right" dir="rtl">{children}</ol>;
                },
                li({ children }) {
                  return <li className="leading-inherit text-neutral-100 text-right" dir="rtl">{children}</li>;
                },
                h1({ children }) {
                  return <h1 className={h1Classes} dir="rtl">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className={h2Classes} dir="rtl">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className={h3Classes} dir="rtl">{children}</h3>;
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-4 border border-neutral-800 rounded-xl" dir="rtl">
                      <table className={`min-w-full divide-y divide-neutral-800 ${tableClasses} text-right`}>
                        {children}
                      </table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="px-4 py-2.5 bg-neutral-900 font-semibold text-neutral-100 text-right" dir="rtl">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return <td className="px-4 py-2.5 border-t border-neutral-800/80 text-neutral-200 text-right" dir="rtl">{children}</td>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className={`border-r-4 border-emerald-500 bg-neutral-900/60 pr-4 py-2 my-3 text-neutral-200 italic rounded-l-lg ${tableClasses} text-right`} dir="rtl">
                      {children}
                    </blockquote>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>

            {/* Pulsing indicator when streaming */}
            {message.isStreaming && (
              <span className="inline-block w-2.5 h-5 ml-1.5 bg-emerald-400 animate-pulse align-middle rounded-xs" />
            )}
          </div>

          {/* Action Footer for Assistant Messages */}
          {isAssistant && !message.isStreaming && (
            <div className="flex items-center gap-2 pt-3 text-xs sm:text-sm text-neutral-400">
              <button
                type="button"
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-neutral-800/80 text-neutral-400 hover:text-neutral-200 transition-colors font-sans"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">تم نسخ الرد</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>نسخ الرد</span>
                  </>
                )}
              </button>

              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-neutral-800/80 text-neutral-400 hover:text-neutral-200 transition-colors font-sans"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة التوليد</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

