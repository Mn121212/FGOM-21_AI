import React, { useRef } from "react";
import { Upload, FileCode, X, Eye, Sparkles } from "lucide-react";
import { CodeFile } from "../types";
import { readFileAsCodeFile, formatFileSize } from "../utils/fileParser";

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
    const remainingSlots = 5 - files.length;
    if (remainingSlots <= 0) {
      alert("الحد الأقصى المسموح به هو 5 ملفات برمجية.");
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, remainingSlots);
    const parsedFiles: CodeFile[] = [];

    for (const f of filesToProcess) {
      // Check file size (limit 2MB per text code file)
      if (f.size > 2 * 1024 * 1024) {
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
    if (!disabled && files.length < 5) {
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
    <div className="w-full space-y-2">
      {/* Hidden file input supporting code and images */}
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

      {/* Upload button or active drag zone */}
      {files.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-dashed text-xs transition-all cursor-pointer ${
            isDragging
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
              : "border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-900 text-neutral-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              إرفاق صور تصاميم أو ملفات برمجية (PNG, JPG, JS, HTML, Python...)
            </span>
          </div>
          <span className="text-[11px] bg-neutral-800 px-2 py-0.5 rounded text-neutral-400">
            انقر لرفع صورة أو كود
          </span>
        </div>
      ) : (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-2.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
            <span className="flex items-center gap-1.5 font-medium text-neutral-300">
              <FileCode className="w-4 h-4 text-emerald-400" />
              الملفات المرفقة للمشروع ({files.length}/5)
            </span>
            <div className="flex items-center gap-2">
              {files.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-emerald-400 hover:underline text-[11px]"
                >
                  + إضافة ملف آخر
                </button>
              )}
              <button
                type="button"
                onClick={() => onFilesChange([])}
                className="text-neutral-500 hover:text-red-400 text-[11px]"
              >
                إزالة الكل
              </button>
            </div>
          </div>

          {/* List of files */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-neutral-950 border border-neutral-800/90 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 shrink-0">
                    {file.isImage && file.dataUrl ? (
                      <img
                        src={file.dataUrl}
                        alt={file.name}
                        className="w-6 h-6 object-cover rounded border border-emerald-500/40"
                      />
                    ) : (
                      <FileCode className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-neutral-200 truncate text-[11px] font-medium" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      {file.isImage ? "صورة تصميم (Image)" : `${file.language.toUpperCase()} • ${file.lines} سطر`} • {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPreviewFile(file)}
                    title="معاينة الملف"
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(file.id)}
                    title="إزالة"
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick analysis button */}
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={onInstantAnalyze}
              disabled={disabled}
              className="flex items-center gap-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg transition-colors font-medium cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>تحليل معماري شامل وفحص أمان للملفات المرفقة</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
