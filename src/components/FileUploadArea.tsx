import React, { useRef } from "react";
import { Upload, FileCode, X, Eye, Sparkles } from "lucide-react";
import { CodeFile } from "../types";
import { readFileAsCodeFile, formatFileSize } from "../utils/fileParser";

const MAX_FILES = 50;
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

interface FileUploadAreaProps {
  files: CodeFile[];
  onFilesChange: (files: CodeFile[]) => void;
  onPreviewFile: (file: CodeFile) => void;
  onInstantAnalyze: () => void;
  disabled?: boolean;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  files,
  onFilesChange,
  onPreviewFile,
  onInstantAnalyze,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList) return;
    const remainingSlots = MAX_FILES - files.length;
    if (remainingSlots <= 0) {
      alert(`الحد الأقصى المسموح به هو ${MAX_FILES} ملفًا أو صورة.`);
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, remainingSlots);
    const parsedFiles: CodeFile[] = [];

    for (const f of filesToProcess) {
      if (f.size > MAX_FILE_SIZE_BYTES) {
        alert(`الملف ${f.name} كبير جداً (أكثر من 2 ميجابايت).`);
        continue;
      }
      try {
        const parsed = await readFileAsCodeFile(f);
        parsedFiles.push(parsed);
      } catch (err) {
        console.error("Error reading file:", err);
      }
    }

    if (parsedFiles.length > 0) {
      onFilesChange([...files, ...parsedFiles]);
    }
  };

  const handleRemove = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && files.length < MAX_FILES) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full space-y-2" dir="rtl">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".png,.jpg,.jpeg,.webp,.gif,.svg,.py,.js,.jsx,.ts,.tsx,.html,.css,.scss,.json,.sql,.cpp,.c,.h,.hpp,.java,.go,.rs,.php,.rb,.sh,.yaml,.yml,.md,.txt,image/*"
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Upload button when no files are attached */}
      {files.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`flex items-center justify-between px-3.5 py-2 rounded-xl border border-dashed text-xs transition-all cursor-pointer ${
            isDragging
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
              : "border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-900 text-neutral-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#00E676] shrink-0" />
            <span className="font-extrabold text-[11px] sm:text-xs text-neutral-200">
              إرفاق صور تصاميم أو ملفات برمجية
            </span>
          </div>
          <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded text-neutral-400 font-bold shrink-0">
            حتى 50 ملفاً أو صورة
          </span>
        </div>
      ) : (
        /* Attached files container: COMPACT HORIZONTAL SCROLLBAR (العرض) */
        <div className="bg-[#121214] border border-neutral-800/90 rounded-2xl p-2 space-y-1.5 shadow-md">
          {/* Header info */}
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[#00E676] font-bold text-xs">📁</span>
              <span className="font-extrabold text-neutral-200 text-[11px]">
                الملفات المرفقة ({files.length}/{MAX_FILES})
              </span>
              <span className="text-[10px] text-neutral-500 hidden sm:inline">(تمرير أفقي ↔)</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onInstantAnalyze}
                disabled={disabled}
                className="text-[#00E676] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-[#00E676]" />
                <span>تحليل معماري شامل</span>
              </button>

              {files.length < MAX_FILES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-emerald-400 hover:underline font-bold text-[11px] cursor-pointer"
                >
                  + إضافة
                </button>
              )}

              <button
                type="button"
                onClick={() => onFilesChange([])}
                className="text-neutral-500 hover:text-red-400 font-bold text-[11px] cursor-pointer"
              >
                إزالة الكل
              </button>
            </div>
          </div>

          {/* ⚡ HORIZONTAL SCROLLABLE CAROUSEL (عرض أفقي مدمج لا يغطي الشات) */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar scroll-smooth max-h-24">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 p-1.5 pr-2 rounded-xl bg-[#18181c] border border-neutral-800/90 text-xs shrink-0 w-48 max-w-[200px] shadow-xs group"
              >
                {/* Thumbnail / Icon */}
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#00E676] flex items-center justify-center shrink-0 overflow-hidden">
                  {file.isImage && file.dataUrl ? (
                    <img
                      src={file.dataUrl}
                      alt={file.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <FileCode className="w-4 h-4 text-[#00E676]" />
                  )}
                </div>

                {/* File details */}
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-neutral-100 truncate text-[11px] font-bold" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[9px] text-neutral-400 font-mono truncate">
                    {file.isImage ? "صورة تصميم" : file.language.toUpperCase()} • {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPreviewFile(file)}
                    title="معاينة الملف"
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(file.id)}
                    title="إزالة"
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
