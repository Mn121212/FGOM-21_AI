import { CodeFile } from "../types";

export function detectLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    py: "python",
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    json: "json",
    sql: "sql",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    java: "java",
    go: "go",
    rs: "rust",
    php: "php",
    rb: "ruby",
    sh: "bash",
    bash: "bash",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    xml: "xml",
    env: "properties",
    dockerfile: "dockerfile",
  };
  return map[ext] || "plaintext";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function readFileAsCodeFile(file: File): Promise<CodeFile> {
  const isImg = file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);

  if (isImg) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    return {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      content: `[صورة مرفقة للتحليل والتصميم: ${file.name}]`,
      size: file.size,
      lines: 1,
      language: "image",
      isImage: true,
      dataUrl,
      mimeType: file.type || "image/png",
    };
  }

  const text = await file.text();
  const lines = text.split(/\r\n|\r|\n/).length;
  const language = detectLanguage(file.name);

  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: file.name,
    content: text,
    size: file.size,
    lines,
    language,
    isImage: false,
  };
}
