import JSZip from "jszip";

export interface ProjectUploadFile {
  path: string;
  content: string;
  encoding: "utf8" | "base64";
  size: number;
}

const MAX_FILES = 100;
const MAX_TOTAL_SIZE = 15 * 1024 * 1024;
const TEXT_EXTENSIONS = new Set([
  "c", "cc", "cpp", "cs", "css", "go", "h", "hpp", "html", "htm", "java",
  "js", "jsx", "json", "kt", "md", "mjs", "php", "py", "rb", "rs", "scss",
  "sh", "sql", "svelte", "swift", "ts", "tsx", "txt", "vue", "xml", "yaml",
  "yml", "toml", "ini", "gradle", "dockerfile", "prisma", "graphql", "gql",
]);
const IGNORED_SEGMENTS = new Set([
  ".git", ".svn", ".hg", "node_modules", "vendor", "dist", "build", "coverage",
  ".next", ".nuxt", ".cache", ".idea", ".vscode",
]);
const IGNORED_FILES = new Set([".env", ".env.local", ".npmrc", ".pypirc"]);

export function normalizeProjectPath(path: string, includeBuildArtifacts = false): string | null {
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  const segments = normalized.split("/");
  if (
    !normalized ||
    normalized.length > 240 ||
    segments.some((segment) => !segment || segment === "." || segment === "..") ||
    segments.some((segment) =>
      IGNORED_SEGMENTS.has(segment.toLowerCase()) &&
      !(includeBuildArtifacts && ["dist", "build"].includes(segment.toLowerCase()))
    ) ||
    IGNORED_FILES.has(segments[segments.length - 1].toLowerCase()) ||
    segments.some((segment) => /^\.env(?:\.|$)/i.test(segment)) ||
    /\.(?:pem|key|p12|pfx|keystore)$/i.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

function isTextFile(path: string): boolean {
  const baseName = path.split("/").pop()?.toLowerCase() || "";
  const extension = baseName.split(".").pop() || "";
  return TEXT_EXTENSIONS.has(extension) || ["dockerfile", "makefile", "license"].includes(baseName);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export async function readProjectUpload(
  fileList: FileList | File[],
  options: { includeBuildArtifacts?: boolean } = {}
): Promise<ProjectUploadFile[]> {
  const includeBuildArtifacts = options.includeBuildArtifacts || false;
  const files = Array.from(fileList);
  if (files.length === 0) throw new Error("اختر ملفات المشروع أو ملف ZIP.");
  const isZip = files.length === 1 && /\.zip$/i.test(files[0].name);
  if (isZip && files[0].size > MAX_TOTAL_SIZE) {
    throw new Error("حجم ملف ZIP يتجاوز 15 ميغابايت. استبعد node_modules وملفات البناء ثم أعد ضغط المشروع.");
  }
  const directFiles = isZip ? [] : files.filter((file) => {
    const filePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    return normalizeProjectPath(filePath, includeBuildArtifacts) !== null;
  });
  if (!isZip && directFiles.length > MAX_FILES) throw new Error(`الحد الأعلى ${MAX_FILES} ملفاً مسموحاً للمشروع.`);
  if (directFiles.some((file) => file.size > MAX_TOTAL_SIZE) || directFiles.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_SIZE) {
    throw new Error("حجم الملفات المرفوعة يتجاوز 15 ميغابايت.");
  }

  const upload = isZip
    ? await JSZip.loadAsync(files[0])
    : null;
  const entries: Array<{ path: string; read: () => Promise<Uint8Array> }> = [];

  if (upload) {
    const zipEntries = Object.values(upload.files).filter((entry) =>
      !entry.dir && normalizeProjectPath(entry.name, includeBuildArtifacts)
    );
    if (zipEntries.length > MAX_FILES) {
      throw new Error(`يحتوي ZIP على ملفات كثيرة؛ الحد الأعلى ${MAX_FILES}.`);
    }
    const declaredTotal = zipEntries.reduce((total, entry) => {
      const entryWithSize = entry as typeof entry & { _data?: { uncompressedSize?: number; compressedSize?: number } };
      const uncompressedSize = entryWithSize._data?.uncompressedSize;
      const compressedSize = entryWithSize._data?.compressedSize;
      if (
        typeof uncompressedSize !== "number" ||
        !Number.isFinite(uncompressedSize) ||
        uncompressedSize < 0 ||
        typeof compressedSize !== "number" ||
        !Number.isFinite(compressedSize) ||
        compressedSize < 0 ||
        (compressedSize === 0 && uncompressedSize > 0) ||
        (compressedSize > 0 && uncompressedSize / compressedSize > 1000)
      ) {
        throw new Error("تعذر التحقق من أحجام ملفات ZIP أو أن نسبة ضغطه غير آمنة.");
      }
      return total + uncompressedSize;
    }, 0);
    if (declaredTotal > MAX_TOTAL_SIZE) {
      throw new Error("حجم ملفات ZIP بعد فك الضغط يتجاوز 15 ميغابايت.");
    }
    for (const entry of zipEntries) {
      const safePath = normalizeProjectPath(entry.name, includeBuildArtifacts);
      if (!safePath) continue;
      entries.push({ path: safePath, read: () => entry.async("uint8array") });
    }
  } else {
    for (const file of directFiles) {
      const rawPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      const safePath = normalizeProjectPath(rawPath, includeBuildArtifacts);
      if (!safePath) continue;
      entries.push({ path: safePath, read: async () => new Uint8Array(await file.arrayBuffer()) });
    }
  }

  if (entries.length > MAX_FILES) throw new Error(`الحد الأعلى ${MAX_FILES} ملفاً للمشروع.`);

  const result: ProjectUploadFile[] = [];
  let totalSize = 0;
  for (const entry of entries) {
    const bytes = await entry.read();
    totalSize += bytes.byteLength;
    if (totalSize > MAX_TOTAL_SIZE) {
      throw new Error("حجم المشروع بعد فك الضغط يتجاوز 15 ميغابايت.");
    }
    result.push({
      path: entry.path,
      content: isTextFile(entry.path) ? new TextDecoder("utf-8", { fatal: false }).decode(bytes) : toBase64(bytes),
      encoding: isTextFile(entry.path) ? "utf8" : "base64",
      size: bytes.byteLength,
    });
  }

  if (result.length === 0) throw new Error("لم أجد ملفات مشروع مسموحاً بها داخل الرفع.");
  return result;
}

export async function createProjectZip(files: ProjectUploadFile[]): Promise<Blob> {
  const archive = new JSZip();
  for (const file of files) {
    archive.file(
      file.path,
      file.encoding === "base64" ? Uint8Array.from(atob(file.content), (char) => char.charCodeAt(0)) : file.content
    );
  }
  return archive.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
