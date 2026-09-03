import React from "react";
import { X, FileCode, Copy, Check } from "lucide-react";
import { CodeFile } from "../types";
import { formatFileSize } from "../utils/fileParser";

interface FileViewerModalProps {
  file: CodeFile | null;
  onClose: () => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({ file, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!file) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const lines = file.content.split("\n");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="file-viewer-modal"
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-100 text-sm sm:text-base">{file.name}</h3>
              <p className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5 font-mono">
                <span>{file.language.toUpperCase()}</span>
                <span>•</span>
                <span>{file.lines} سطر</span>
                <span>•</span>
                <span>{formatFileSize(file.size)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="copy-file-content-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>نسخ المحتوى</span>
                </>
              )}
            </button>
            <button
              id="close-file-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-neutral-950 font-mono text-xs sm:text-sm leading-relaxed" dir="ltr">
          <div className="flex">
            <div className="select-none pr-4 mr-4 border-r border-neutral-800 text-neutral-600 text-right min-w-[2.5rem]">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <div className="text-neutral-200 flex-1 whitespace-pre">
              {file.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
