import React, { useState } from "react";
import {
  Menu,
  ChevronDown,
  Download,
  Trash,
  Type,
  Check,
  X,
} from "lucide-react";
import { ModelInfo, ChatFontSize } from "../types";
import { BrandLogo } from "./BrandLogo";

interface HeaderProps {
  onToggleSidebar: () => void;
  models?: ModelInfo[];
  selectedModel?: string;
  onSelectModel?: (modelId: string) => void;
  developerMode?: boolean;
  onToggleDeveloperMode?: () => void;
  chatTitle: string;
  onExportMarkdown: () => void;
  onClearChat: () => void;
  hasMessages: boolean;
  fontSize: ChatFontSize;
  onChangeFontSize: (size: ChatFontSize) => void;
  onOpenSettings?: () => void;
  onOpenGuide?: () => void;
  activeProviderName?: string;
  hasCustomKey?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  chatTitle,
  onExportMarkdown,
  onClearChat,
  hasMessages,
  fontSize,
  onChangeFontSize,
}) => {
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [confirmClearChat, setConfirmClearChat] = useState(false);

  const fontSizes: Array<{ id: ChatFontSize; label: string; sample: string; hint: string }> = [
    { id: "normal", label: "عادي", sample: "16px", hint: "حجم قياسي مدمج" },
    { id: "large", label: "كبير (مريح)", sample: "18px", hint: "الأنسب للقراءة الواضحة" },
    { id: "xlarge", label: "كبير جداً", sample: "22px", hint: "خط عريض فائق الوضوح" },
  ];

  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-20 shrink-0">
      {/* Right side (in RTL): Menu toggle & Chat Title + Quick Tools */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 transition-colors lg:hidden cursor-pointer"
          title="القائمة الجانبية"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" />
            <h1 className="font-bold text-sm sm:text-base text-neutral-100 truncate max-w-[180px] sm:max-w-xs md:max-w-md">
              {chatTitle || "محادثة برمجية جديدة"}
            </h1>
          </div>
        </div>
      </div>

      {/* Left side (in RTL): Actions & Font Size */}
      <div className="flex items-center gap-1.5 sm:gap-2">

        {/* Font Size Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setFontMenuOpen(!fontMenuOpen)}
            title="تغيير حجم خط المحادثة"
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-200 transition-all cursor-pointer"
          >
            <Type className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline font-sans">الخط:</span>
            <span className="font-semibold text-emerald-400 font-sans">
              {fontSize === "xlarge" ? "كبير جداً" : fontSize === "large" ? "كبير" : "عادي"}
            </span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          {fontMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setFontMenuOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1.5 w-60 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-2 z-40 space-y-1">
                <div className="px-3 py-1.5 text-[11px] text-neutral-400 font-sans border-b border-neutral-800/80 mb-1">
                  اختر حجم خط نصوص المحادثة:
                </div>
                {fontSizes.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      onChangeFontSize(f.id);
                      setFontMenuOpen(false);
                    }}
                    className={`w-full text-right px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                      fontSize === f.id
                        ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-200"
                        : "hover:bg-neutral-800/70 text-neutral-300 border border-transparent"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm font-sans flex items-center gap-2">
                        <span>{f.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                          {f.sample}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 font-sans mt-0.5">{f.hint}</p>
                    </div>
                    {fontSize === f.id && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Export Markdown */}
        {hasMessages && (
          <button
            type="button"
            onClick={onExportMarkdown}
            title="تصدير المحادثة بتنسيق Markdown"
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Clear current chat messages */}
        {hasMessages && (
          confirmClearChat ? (
            <div className="flex items-center gap-1 bg-red-950/60 border border-red-500/40 rounded-xl px-2 py-1 text-xs">
              <span className="text-[11px] text-red-200 hidden sm:inline">مسح المحادثة؟</span>
              <button
                type="button"
                onClick={() => {
                  onClearChat();
                  setConfirmClearChat(false);
                }}
                className="p-1 hover:bg-red-800 text-red-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="تأكيد مسح المحادثة"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearChat(false)}
                className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors cursor-pointer"
                title="إلغاء"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClearChat(true)}
              title="تفريغ المحادثة الحالية"
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <Trash className="w-4 h-4" />
            </button>
          )
        )}
      </div>
    </header>
  );
};
