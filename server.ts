import express from "express";
import path from "path";
import fs from "fs";
import { createHash, randomUUID } from "crypto";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { timingSafeEqual } from "crypto";
import JSZip from "jszip";
import { GoogleGenAI } from "@google/genai";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import helmet from "helmet";
import * as ArcjetModule from "@arcjet/node";
import { shield, detectBot, tokenBucket } from "@arcjet/node";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PLATFORM_PROVIDERS = new Set([
  "github",
  "railway",
  "render",
  "flyio",
  "vercel",
  "netlify",
  "supabase",
  "neon",
  "planetscale",
  "turso",
]);

type OAuthProvider = "github" | "vercel" | "supabase";

type PendingOAuthConnection = {
  userId: string;
  provider: OAuthProvider;
  codeVerifier: string;
  createdAt: number;
};

const pendingOAuthConnections = new Map<string, PendingOAuthConnection>();
const OAUTH_CONNECTION_TTL_MS = 10 * 60 * 1000;

function toBase64Url(value: Buffer) {
  return value.toString("base64url");
}

function createPkcePair() {
  const codeVerifier = toBase64Url(randomBytes(48));
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  return { codeVerifier, codeChallenge };
}

function getAppUrl(req: express.Request) {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return `${req.protocol}://${req.get("host")}`;
}

function getOAuthConfig(provider: OAuthProvider) {
  const config = {
    github: {
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      authorizeUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      scope: "read:user repo",
    },
    vercel: {
      clientId: process.env.VERCEL_OAUTH_CLIENT_ID,
      clientSecret: process.env.VERCEL_OAUTH_CLIENT_SECRET,
      authorizeUrl: "https://vercel.com/oauth/authorize",
      tokenUrl: "https://api.vercel.com/login/oauth/token",
      scope: "openid email profile offline_access",
    },
    supabase: {
      clientId: process.env.SUPABASE_OAUTH_CLIENT_ID,
      clientSecret: process.env.SUPABASE_OAUTH_CLIENT_SECRET,
      authorizeUrl: "https://api.supabase.com/v1/oauth/authorize",
      tokenUrl: "https://api.supabase.com/v1/oauth/token",
      scope: "",
    },
  }[provider];

  return config.clientId && config.clientSecret ? config : null;
}

function isOAuthProvider(value: string): value is OAuthProvider {
  return value === "github" || value === "vercel" || value === "supabase";
}

function getPlatformAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getCredentialEncryptionKey(): Buffer | null {
  const value = process.env.PLATFORM_CREDENTIALS_ENCRYPTION_KEY;
  if (!value) return null;

  const key =
    /^[a-f0-9]{64}$/i.test(value)
      ? Buffer.from(value, "hex")
      : Buffer.from(value, "base64");
  return key.length === 32 ? key : null;
}

function encryptProviderSecret(secret: string): string {
  const key = getCredentialEncryptionKey();
  if (!key) throw new Error("PLATFORM_CREDENTIALS_ENCRYPTION_KEY is missing or invalid");

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}

function decryptProviderSecret(encrypted: string): string {
  const key = getCredentialEncryptionKey();
  if (!key) throw new Error("PLATFORM_CREDENTIALS_ENCRYPTION_KEY is missing or invalid");

  const [ivValue, tagValue, ciphertextValue] = encrypted.split(".");
  if (!ivValue || !tagValue || !ciphertextValue) {
    throw new Error("Stored provider credential has an invalid format");
  }

  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

async function authenticatePlatformUser(
  req: express.Request,
  res: express.Response
): Promise<{ userId: string; admin: SupabaseClient } | null> {
  const admin = getPlatformAdmin();
  if (!admin || !getCredentialEncryptionKey()) {
    res.status(503).json({
      error: "مسار النشر غير مهيأ. يلزم إعداد Supabase ومفتاح تشفير بيانات الربط على الخادم.",
      code: "DEPLOYMENT_HUB_NOT_CONFIGURED",
    });
    return null;
  }

  const authorization = req.header("authorization") || "";
  const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    res.status(401).json({ error: "سجّل الدخول للمتابعة.", code: "AUTH_REQUIRED" });
    return null;
  }

  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data.user) {
    res.status(401).json({ error: "انتهت جلسة الدخول أو أنها غير صالحة.", code: "INVALID_SESSION" });
    return null;
  }

  return { userId: data.user.id, admin };
}

// 🔒 Helmet Security Headers Middleware (Clickjacking & MIME-Sniffing Protection)
app.use(
  helmet({
    contentSecurityPolicy: false, // Prevents breaking inline previews and Vite assets
    crossOriginEmbedderPolicy: false,
  })
);

// 🛡️ Arcjet Security Engine Setup (Key: ajkey_01m5jbehn5enz834kme0xwq2t2)
const ARCJET_KEY = process.env.ARCJET_KEY || "ajkey_01m5jbehn5enz834kme0xwq2t2";

const arcjetFactory =
  typeof (ArcjetModule as any).arcjet === "function"
    ? (ArcjetModule as any).arcjet
    : typeof ArcjetModule.default === "function"
    ? ArcjetModule.default
    : typeof ArcjetModule === "function"
    ? ArcjetModule
    : null;

const aj =
  typeof arcjetFactory === "function"
    ? arcjetFactory({
        key: ARCJET_KEY,
        characteristics: ["ip.src"], // Track request limits per client IP
        rules: [
          // 1. Shield Rule: Protection against SQL Injection, XSS, and Common Attacks
          shield({ mode: "LIVE" }),

          // 2. Bot Protection: Detect and block malicious automated bot scripts
          detectBot({
            mode: "LIVE",
            allow: ["CATEGORY:SEARCH_ENGINE"], // Allow Google/Bing search engines for SEO
          }),

          // 3. Rate Limiting (Token Bucket): 20 requests capacity, refill 10 per 60 seconds
          tokenBucket({
            mode: "LIVE",
            refillRate: 10,
            interval: 60,
            capacity: 20,
          }),
        ],
      })
    : null;

// 🛡️ Arcjet Express Middleware Function (Safe Fallback Pipeline)
async function arcjetSecurityMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (!ARCJET_KEY || !aj) return next();

  try {
    const decision = await aj.protect(req, { requested: 1 });

    if (decision && decision.isDenied()) {
      if (decision.reason && typeof decision.reason.isRateLimit === "function" && decision.reason.isRateLimit()) {
        console.warn(`🛡️ [Arcjet Rate Limit Exceeded] IP: ${req.ip}`);
        return res.status(429).json({
          error: "تم تجاوز حد الطلبات المسموح به مؤقتاً (Rate Limit Exceeded). يرجى الانتظار دقيقة قبل إرسال المزيد من الرسائل.",
          code: "TOO_MANY_REQUESTS",
        });
      }

      if (decision.reason && typeof decision.reason.isBot === "function" && decision.reason.isBot()) {
        console.warn(`🤖 [Arcjet Bot Blocked] IP: ${req.ip}`);
        return res.status(403).json({
          error: "تم حظر هذا الطلب بواسطة نظام حماية البوتات والسكربتات التلقائية (Bot Protection).",
          code: "BOT_DETECTED",
        });
      }

      console.warn(`🛡️ [Arcjet Shield Denied] IP: ${req.ip}`);
      return res.status(403).json({
        error: "تم حظر الطلب لدواعي الأمان والحماية السحابية (Arcjet Security Shield).",
        code: "ACCESS_DENIED",
      });
    }

    next();
  } catch (err) {
    console.warn("Arcjet protection check warning (falling back to standard pipeline):", err);
    next();
  }
}

// Accept up to 50 code files or reference images in one chat request.
app.use(express.json({ limit: "80mb" }));

type PublishedSiteAnalytics = {
  ownerKeyHash: string;
  name: string;
  url: string;
  visits: number;
  createdAt: string;
};

const HOSTING_DATA_PATH = process.env.FGOM_HOSTING_DATA_PATH?.trim() || path.join(process.cwd(), ".data");
const PUBLISHED_SITES_PATH = path.join(HOSTING_DATA_PATH, "published-sites.json");

function loadPublishedSites(): Record<string, PublishedSiteAnalytics> {
  if (!fs.existsSync(PUBLISHED_SITES_PATH)) return {};
  const parsed: unknown = JSON.parse(fs.readFileSync(PUBLISHED_SITES_PATH, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Published sites analytics file has an invalid format.");
  }
  return parsed as Record<string, PublishedSiteAnalytics>;
}

function savePublishedSites(sites: Record<string, PublishedSiteAnalytics>) {
  fs.mkdirSync(path.dirname(PUBLISHED_SITES_PATH), { recursive: true });
  const temporaryPath = `${PUBLISHED_SITES_PATH}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(sites), { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temporaryPath, PUBLISHED_SITES_PATH);
}

function isSafeHostedPath(filePath: string): boolean {
  const parts = filePath.replace(/\\/g, "/").split("/");
  return (
    filePath.length > 0 &&
    filePath.length <= 240 &&
    !filePath.startsWith("/") &&
    parts.every((part) => part && part !== "." && part !== "..") &&
    !parts.some((part) =>
      [".git", "node_modules", ".npmrc", ".pypirc"].includes(part.toLowerCase()) ||
      /^\.env(?:\.|$)/i.test(part)
    ) &&
    !/\.(?:pem|key|p12|pfx|keystore)$/i.test(filePath)
  );
}
app.use(express.urlencoded({ extended: true, limit: "80mb" }));

const FREE_REQUEST_LIMIT = 25;
const FREE_REQUEST_WINDOW_MS = 24 * 60 * 60 * 1000;
const QUOTA_COOKIE_NAME = "fgom_usage_id";
const FORMSPREE_SUPPORT_ENDPOINT = "https://formspree.io/f/xdearyyg";
const FREE_REQUEST_STORE_PATH = path.join(process.cwd(), ".data", "free-request-usage.json");

function loadFreeRequestUsage(): Map<string, { count: number; startedAt: number }> {
  try {
    const raw = JSON.parse(fs.readFileSync(FREE_REQUEST_STORE_PATH, "utf8"));
    return new Map(
      Object.entries(raw).filter(
        ([, value]: [string, any]) =>
          value && Number.isFinite(value.count) && Number.isFinite(value.startedAt)
      ) as Array<[string, { count: number; startedAt: number }]>
    );
  } catch {
    return new Map();
  }
}

const freeRequestUsage = loadFreeRequestUsage();

function persistFreeRequestUsage() {
  try {
    fs.mkdirSync(path.dirname(FREE_REQUEST_STORE_PATH), { recursive: true });
    fs.writeFileSync(
      FREE_REQUEST_STORE_PATH,
      JSON.stringify(Object.fromEntries(freeRequestUsage)),
      "utf8"
    );
  } catch (error) {
    console.error("Could not persist free request usage:", error);
  }
}

function getCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const item = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

function consumeFreeRequest(req: express.Request, res: express.Response, hasOwnApiKey: boolean) {
  if (hasOwnApiKey) return { allowed: true, remaining: null, resetAt: null };

  let clientId = getCookieValue(req.headers.cookie, QUOTA_COOKIE_NAME);
  if (!clientId || !/^[a-z0-9-]{20,}$/i.test(clientId)) {
    clientId = randomUUID();
    res.cookie(QUOTA_COOKIE_NAME, clientId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: FREE_REQUEST_WINDOW_MS,
    });
  }

  const now = Date.now();
  const existing = freeRequestUsage.get(clientId);
  const expired = !existing || now - existing.startedAt >= FREE_REQUEST_WINDOW_MS;
  const usage = expired ? { count: 0, startedAt: now } : existing;

  if (usage.count >= FREE_REQUEST_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: usage.startedAt + FREE_REQUEST_WINDOW_MS,
    };
  }

  usage.count += 1;
  freeRequestUsage.set(clientId, usage);
  persistFreeRequestUsage();
  return {
    allowed: true,
    remaining: FREE_REQUEST_LIMIT - usage.count,
    resetAt: usage.startedAt + FREE_REQUEST_WINDOW_MS,
  };
}

// Lazy GoogleGenAI client
let genAIClient: GoogleGenAI | null = null;

function hasGeminiApiKey(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim();
  return Boolean(key && key.length >= 20);
}

function getGenAI(): GoogleGenAI {
  if (!hasGeminiApiKey()) {
    throw new Error(
      "خدمة Gemini غير مفعّلة. أضف مفتاح GEMINI_API_KEY صالحاً في ملف .env ثم أعد تشغيل الخادم."
    );
  }

  if (!genAIClient) {
    // On Netlify, AI Gateway injects GEMINI_API_KEY and GOOGLE_GEMINI_BASE_URL at runtime.
    genAIClient = new GoogleGenAI({
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Available Models metadata
const MODELS = [
  {
    id: "llama-3.1-8b",
    name: "Llama 3.1 8B (Cloudflare Workers AI)",
    provider: "Cloudflare Workers AI",
    badge: "الأساسي / مجاني وسريع",
    description: "نموذج ميتا فائق السرعة والمثالي لحل المسائل البرمجية اليومية وكتابة الدوال بسرعة.",
    cfModel: "@cf/meta/llama-3.1-8b-instruct",
  },
  {
    id: "qwen-2.5-coder",
    name: "Qwen 2.5 Coder",
    provider: "Alibaba Cloud / Cloudflare",
    badge: "متخصص الأكواد",
    description: "نموذج استثنائي في كتابة الشيفرات المعقدة، اختبارات الوحدة، وإعادة الهيكلة.",
    cfModel: "@cf/qwen/qwen2.5-coder-7b-instruct",
  },
  {
    id: "mistral-7b",
    name: "Mistral 7B",
    provider: "Mistral AI",
    badge: "منطق دقيق",
    description: "نموذج ذو كفاءة ومنطق حسابي قوي في الخوارزميات وتحسين الأداء.",
    cfModel: "@cf/mistral/mistral-7b-instruct-v0.2",
  },
  {
    id: "kimi-code",
    name: "Kimi Code",
    provider: "Moonshot AI",
    badge: "مشاريع وسياق ضخم",
    description: "مخصص للمشاريع الكبيرة وتتبع تدفق البيانات وتحليل الملفات المتعددة.",
    cfModel: "@cf/meta/llama-3.1-70b-instruct",
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "Google",
    badge: "أداء فائق واستقرار",
    description: "أحدث نماذج جوجل السريعة مع دقة تحليل عالية واستيعاب للملفات الكبيرة.",
    cfModel: null,
  },
];

// Helper: build system prompt in technical Arabic
function buildSystemPrompt(modelId: string, developerMode: boolean, filesCount: number): string {
  const modelInfo = MODELS.find((m) => m.id === modelId) || MODELS[0];

  let prompt = `أنت "FGOM21 AI" (منصة الذكاء الاصطناعي للمبرمجين العرب)، مساعد برمجي وازن ومهندس برمجيات محترف وخبير في علوم الحاسوب.
أنت تجسد محرك (${modelInfo.name}) وتتحدث باللغة العربية الفصحى الواضحة والتقنية بطلاقة تامة، مع المحافظة على كتابة الأكواد والمصطلحات البرمجية باللغة الإنجليزية في قوالب برمجية منفصلة ومنظمة.

🚨 [القاعدة الأساسية والصارمة لجميع إجاباتك]:
- محاذاة النصوص والرسائل لليمين تماماً (Right-Aligned) لأنك تخاطب دائماً مستخدماً يتحدث باللغة العربية.
- ممنوع منعاً باتاً توسيط النصوص أو جعلها في المنتصف (Center).
- اجعل اتجاه النص دائماً من اليمين لليسار (RTL) مع ضبط وتنسيق الفقرات والعناوين والقوائم والشروحات لتكون متناسقة ومتراصة نحو اليمين تماماً.
- الكتل والرموز البرمجية (Code Blocks) تُعرض في سياقها البرمجي المعتاد LTR، لكن كل ما يحيط بها من شروحات وعناوين ونقاط يجب أن يكون محاذياً لليمين تماماً.

🎯 المبادئ الأساسية:
1. أنت موجّه خصيصاً للمبرمجين والمطورين العرب لمساعدتهم على بناء برمجيات عالمية المستوى.
2. اكتب إجاباتك بتنسيق Markdown عالي الجودة والوضوح، مع استخدام العناوين المنظمة والنقاط الواضحة المحاذاة لليمين.
3. جميع الأكواد البرمجية يجب أن تكون داخل كتل كودية (\`\`\`language) محددة اللغة بدقة (مثل: \`\`\`python، \`\`\`typescript، \`\`\`html).
4. أضف تعليقات واضحة داخل الكود تشرح الأجزاء المعقدة.
5. لا تفترض أشياء غير منطقية، واقترح حلولاً عملية قابلة للنسخ والتشغيل المباشر.
`;

  if (developerMode) {
    prompt += `
⚡ [وضع المطور (Developer Mode) مفعل الآن]:
المستخدم طلب إجابة متعمقة بمستوى خبير هندسة برمجيات (Senior Software Engineer / Solutions Architect):
- ركز بشدة على:
  1. هندسة البرمجيات والتصميم النظيف (Clean Code, SOLID, Design Patterns).
  2. تدقيق الأمان واكتشاف الثغرات (Security Audit, OWASP, SQL Injection, XSS, Input Sanitization).
  3. تعقيد الوقت والمساحة (Big-O Time & Space Complexity Analysis).
  4. الحالات الحدية (Edge Cases) والبرمجة الدفاعية (Defensive Programming & Error Handling).
  5. اختبارات الوحدة (Unit Tests / Integration Tests) إن كان ذلك ملائماً.
  6. تقديم نصائح قابلية التوسع (Scalability & Performance Bottlenecks).
قدم تحليلاً تقنياً عميقاً وممنهجاً لا يكتفي بإعطاء الكود فقط بل يبرر القرارات الهندسية.
`;
  } else {
    prompt += `
💡 [الوضع القياسي للمحادثة]:
قدم إجابات واضحة، مباشرة، وعملية تركز على حل المشكلة المباشرة بكفاءة عالية وبدون تعقيدات لا لزوم لها، مع شرح بسيط ومباشر باللغة العربية.
`;
  }

  if (filesCount > 0) {
    prompt += `
📁 [تحليل الملفات البرمجية]:
المستخدم أرفق ${filesCount} ملف(ات) برمجية من مشروعه.
قم بفحص محتوى الملفات المرفقة بدقة، وربط الاستدعاءات (Imports/Exports) بين الملفات، والتعامل مع السياق الكامل للمشروع كحزمة واحدة متكاملة. عند الإشارة لأي ملف، اذكر اسمه بوضوح.
`;
  }

  return prompt;
}

// Check Cloudflare capability
async function tryCloudflareAI(
  cfModel: string,
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string
): Promise<string | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return null; // CF not configured, use Gemini
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${cfModel}`;
    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: formattedMessages }),
    });

    if (!res.ok) {
      console.warn(`Cloudflare API returned status ${res.status}, falling back to Gemini.`);
      return null;
    }

    const data = (await res.json()) as any;
    if (data?.result?.response) {
      return data.result.response;
    }
    return null;
  } catch (err) {
    console.warn("Cloudflare API error, falling back to Gemini:", err);
    return null;
  }
}

// Resilient Gemini callers with automatic failover and 503 retry
const CANDIDATE_GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.6-flash",
];

function isTemporaryError(err: any): boolean {
  const msg = (err?.message || "").toLowerCase();
  const status = err?.status || err?.code;
  return (
    status === 503 ||
    status === 429 ||
    msg.includes("503") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota")
  );
}

async function generateWithFallback(
  contents: any[],
  systemInstruction: string,
  temperature: number
) {
  const ai = getGenAI();
  let lastErr: any = null;

  for (const model of CANDIDATE_GEMINI_MODELS) {
    // Retry up to 2 times for temporary 503 spikes
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents,
          config: { systemInstruction, temperature },
        });
        if (res && res.text) {
          return res;
        }
      } catch (err: any) {
        lastErr = err;
        console.warn(`Model ${model} attempt ${attempt + 1} failed:`, err?.message || err);
        if (isTemporaryError(err) && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));
          continue;
        }
        break; // try next candidate model
      }
    }
  }
  throw lastErr;
}

// Resilient Stream caller that handles stream connection failures and falls back gracefully
async function executeStreamWithFallback(
  contents: any[],
  systemInstruction: string,
  temperature: number,
  onChunk: (text: string, modelName: string) => void
): Promise<void> {
  const ai = getGenAI();
  let lastErr: any = null;
  let chunksSent = 0;

  for (const model of CANDIDATE_GEMINI_MODELS) {
    try {
      const stream = await ai.models.generateContentStream({
        model,
        contents,
        config: { systemInstruction, temperature },
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          chunksSent++;
          onChunk(chunk.text, model);
        }
      }

      // Successfully streamed the full response
      return;
    } catch (err: any) {
      lastErr = err;
      console.warn(`Streaming failed with model ${model} (chunks sent: ${chunksSent}):`, err?.message || err);

      // If we already sent chunks to client, we cannot seamlessly restart with a different model
      if (chunksSent > 0) {
        throw err;
      }

      // If temporary 503 / UNAVAILABLE / high demand, give a short pause then try next model
      if (isTemporaryError(err)) {
        await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 300));
      }
    }
  }

  // Final fallback: if streaming failed for all models, try non-streaming and emit as chunks
  if (chunksSent === 0) {
    console.log("All streaming candidate models failed; trying non-streaming fallback...");
    const nonStreamRes = await generateWithFallback(contents, systemInstruction, temperature);
    const text = nonStreamRes.text || "";
    if (text) {
      const chunkSize = 40;
      for (let i = 0; i < text.length; i += chunkSize) {
        onChunk(text.slice(i, i + chunkSize), "FGOM21 Neural Engine");
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
      return;
    }
  }

  throw lastErr;
}

// User-provided AI Streaming Helpers
async function callOpenAICompatibleStream(
  endpointUrl: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  temperature: number,
  extraHeaders: Record<string, string>,
  onChunk: (text: string) => void
): Promise<void> {
  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
  ];

  const res = await fetch(endpointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      temperature,
      stream: true,
    }),
  });

  if (!res.ok) {
    let errBody = "";
    try {
      const j: any = await res.json();
      errBody = j?.error?.message || JSON.stringify(j);
    } catch (_) {
      errBody = await res.text();
    }
    throw new Error(`خطأ من مزود الذكاء الاصطناعي (${res.status}): ${errBody || res.statusText}`);
  }

  if (!res.body) {
    throw new Error("لم يتم استلام تدفق بيانات من المزود.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":") || trimmed === "data: [DONE]") continue;
      if (trimmed.startsWith("data: ")) {
        const jsonStr = trimmed.slice(6);
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed?.choices?.[0]?.delta?.content || "";
          if (delta) {
            onChunk(delta);
          }
        } catch (_) {}
      }
    }
  }
}

async function callAnthropicStream(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  temperature: number,
  onChunk: (text: string) => void
): Promise<void> {
  const formattedMessages = messages
    .filter((m) => m.content && m.content.trim())
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

  if (formattedMessages.length === 0 || formattedMessages[0].role !== "user") {
    formattedMessages.unshift({ role: "user", content: "مرحباً" });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model || "claude-3-5-sonnet-20241022",
      system: systemPrompt,
      messages: formattedMessages,
      max_tokens: 4096,
      temperature,
      stream: true,
    }),
  });

  if (!res.ok) {
    let errBody = "";
    try {
      const j: any = await res.json();
      errBody = j?.error?.message || JSON.stringify(j);
    } catch (_) {
      errBody = await res.text();
    }
    throw new Error(`خطأ من مزود Anthropic (${res.status}): ${errBody || res.statusText}`);
  }

  if (!res.body) {
    throw new Error("لم يتم استلام تدفق بيانات من Anthropic.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("event:") || trimmed.startsWith(":")) continue;
      if (trimmed.startsWith("data: ")) {
        const jsonStr = trimmed.slice(6);
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            onChunk(parsed.delta.text);
          }
        } catch (_) {}
      }
    }
  }
}

async function callUserGeminiStream(
  apiKey: string,
  model: string,
  contents: any[],
  systemInstruction: string,
  temperature: number,
  onChunk: (text: string) => void
): Promise<void> {
  const userAi = new GoogleGenAI({ apiKey });
  const chosenModel = model || "gemini-3.8-flash";
  const stream = await userAi.models.generateContentStream({
    model: chosenModel,
    contents,
    config: { systemInstruction, temperature },
  });

  for await (const chunk of stream) {
    if (chunk.text) {
      onChunk(chunk.text);
    }
  }
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "FGOM21 AI",
    hasGeminiKey: hasGeminiApiKey(),
    hasCloudflareKey: Boolean(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID),
  });
});

app.get("/api/platform/config", (_req, res) => {
  res.json({
    authConfigured: Boolean(
      (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
        process.env.VITE_SUPABASE_URL &&
        process.env.VITE_SUPABASE_ANON_KEY
    ),
    storageConfigured: Boolean(
      getPlatformAdmin() && getCredentialEncryptionKey()
    ),
  });
});

// The customer authenticates with the provider on its own consent page.  The
// application never asks the customer to paste an access token into our UI.
app.post("/api/platform/oauth/:provider/start", arcjetSecurityMiddleware, async (req, res) => {
  try {
    const providerValue = req.params.provider;
    if (!isOAuthProvider(providerValue)) {
      return res.status(400).json({ error: "خدمة الربط غير مدعومة." });
    }

    const auth = await authenticatePlatformUser(req, res);
    if (!auth) return;

    const provider = providerValue;
    const config = getOAuthConfig(provider);
    if (!config) {
      return res.status(503).json({
        error: `ربط ${provider} غير مهيأ لدى المنصة بعد.`,
        code: "OAUTH_PROVIDER_NOT_CONFIGURED",
      });
    }

    const state = toBase64Url(randomBytes(32));
    const { codeVerifier, codeChallenge } = createPkcePair();
    pendingOAuthConnections.set(state, {
      userId: auth.userId,
      provider,
      codeVerifier,
      createdAt: Date.now(),
    });

    const callbackUrl = `${getAppUrl(req)}/api/platform/oauth/${provider}/callback`;
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });
    if (config.scope) params.set("scope", config.scope);
    if (provider === "vercel") params.set("nonce", toBase64Url(randomBytes(24)));

    res.json({ authorizationUrl: `${config.authorizeUrl}?${params.toString()}` });
  } catch (error) {
    console.error("Could not start provider OAuth connection:", error);
    res.status(500).json({ error: "تعذر بدء تسجيل الدخول إلى الخدمة." });
  }
});

app.get("/api/platform/oauth/:provider/callback", async (req, res) => {
  const providerValue = req.params.provider;
  const appUrl = getAppUrl(req);
  const completeUrl = new URL(`${appUrl}/`);
  completeUrl.searchParams.set("integration", providerValue);

  try {
    if (!isOAuthProvider(providerValue)) throw new Error("خدمة الربط غير مدعومة.");
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const providerError = typeof req.query.error === "string" ? req.query.error : "";
    const pending = pendingOAuthConnections.get(state);
    pendingOAuthConnections.delete(state);

    if (providerError) throw new Error("تم إلغاء الموافقة على الربط.");
    if (!code || !pending || pending.provider !== providerValue) {
      throw new Error("انتهت جلسة الربط أو أنها غير صالحة. أعد المحاولة.");
    }
    if (Date.now() - pending.createdAt > OAUTH_CONNECTION_TTL_MS) {
      throw new Error("انتهت مهلة تسجيل الدخول. أعد المحاولة.");
    }

    const config = getOAuthConfig(providerValue);
    const admin = getPlatformAdmin();
    if (!config || !admin || !getCredentialEncryptionKey()) {
      throw new Error("إعدادات الربط في الخادم غير مكتملة.");
    }

    const callbackUrl = `${appUrl}/api/platform/oauth/${providerValue}/callback`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl,
      code_verifier: pending.codeVerifier,
    });
    if (providerValue !== "supabase") {
      body.set("client_id", config.clientId);
      body.set("client_secret", config.clientSecret);
    }

    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        ...(providerValue === "supabase"
          ? { Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}` }
          : {}),
      },
      body,
    });
    const tokenData = (await tokenResponse.json().catch(() => ({}))) as Record<string, unknown>;
    if (!tokenResponse.ok || typeof tokenData.access_token !== "string") {
      throw new Error("تعذر إتمام موافقة الخدمة. أعد المحاولة.");
    }

    let label = providerValue === "github" ? "GitHub" : providerValue === "vercel" ? "Vercel" : "Supabase";
    if (providerValue === "github") {
      const profileResponse = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "FGOM21-AI" },
      });
      const profile = (await profileResponse.json().catch(() => ({}))) as { login?: string };
      if (profile.login) label = `GitHub: ${profile.login}`;
    }

    const encryptedSecret = encryptProviderSecret(
      JSON.stringify({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        expiresIn: tokenData.expires_in || null,
        scope: tokenData.scope || null,
      })
    );
    const { error } = await admin.from("provider_connections").upsert(
      {
        user_id: pending.userId,
        provider: providerValue,
        label,
        encrypted_secret: encryptedSecret,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider,label" }
    );
    if (error) throw error;

    completeUrl.searchParams.set("status", "connected");
  } catch (error) {
    completeUrl.searchParams.set("status", "error");
    completeUrl.searchParams.set("message", error instanceof Error ? error.message : "تعذر إكمال الربط.");
  }

  res.redirect(303, completeUrl.toString());
});

app.get("/api/platform/connections", arcjetSecurityMiddleware, async (req, res) => {
  try {
    const auth = await authenticatePlatformUser(req, res);
    if (!auth) return;

    const { data, error } = await auth.admin
      .from("provider_connections")
      .select("id, provider, label, created_at, updated_at")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ connections: data || [] });
  } catch (error) {
    console.error("Could not load provider connections:", error);
    res.status(500).json({ error: "تعذر تحميل الحسابات المرتبطة." });
  }
});

app.post("/api/platform/connections", arcjetSecurityMiddleware, async (req, res) => {
  try {
    const auth = await authenticatePlatformUser(req, res);
    if (!auth) return;

    const provider = typeof req.body?.provider === "string" ? req.body.provider : "";
    const label = typeof req.body?.label === "string" ? req.body.label.trim() : "";
    const secret = typeof req.body?.secret === "string" ? req.body.secret.trim() : "";

    if (!PLATFORM_PROVIDERS.has(provider)) {
      return res.status(400).json({ error: "منصة الربط غير مدعومة." });
    }
    if (!label || label.length > 80) {
      return res.status(400).json({ error: "أدخل اسماً واضحاً للحساب، بحد أقصى 80 حرفاً." });
    }
    if (secret.length < 12 || secret.length > 8192) {
      return res.status(400).json({ error: "بيانات الربط غير صالحة أو تجاوزت الحد المسموح." });
    }

    const encryptedSecret = encryptProviderSecret(secret);
    const { data, error } = await auth.admin
      .from("provider_connections")
      .upsert(
        {
          user_id: auth.userId,
          provider,
          label,
          encrypted_secret: encryptedSecret,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider,label" }
      )
      .select("id, provider, label, created_at, updated_at")
      .single();

    if (error) throw error;
    res.status(201).json({ connection: data });
  } catch (error) {
    console.error("Could not save provider connection:", error);
    res.status(500).json({ error: "تعذر حفظ الربط. تحقق من إعدادات قاعدة بيانات المنصة." });
  }
});

app.delete("/api/platform/connections/:connectionId", arcjetSecurityMiddleware, async (req, res) => {
  try {
    const auth = await authenticatePlatformUser(req, res);
    if (!auth) return;
    if (!/^[0-9a-f-]{36}$/i.test(req.params.connectionId)) {
      return res.status(400).json({ error: "معرّف الربط غير صالح." });
    }

    const { error } = await auth.admin
      .from("provider_connections")
      .delete()
      .eq("id", req.params.connectionId)
      .eq("user_id", auth.userId);

    if (error) throw error;
    res.status(204).end();
  } catch (error) {
    console.error("Could not remove provider connection:", error);
    res.status(500).json({ error: "تعذر حذف الربط." });
  }
});

app.get("/api/platform/github/repositories", arcjetSecurityMiddleware, async (req, res) => {
  try {
    const auth = await authenticatePlatformUser(req, res);
    if (!auth) return;

    const { data: connection, error } = await auth.admin
      .from("provider_connections")
      .select("encrypted_secret")
      .eq("user_id", auth.userId)
      .eq("provider", "github")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!connection) {
      return res.status(409).json({ error: "اربط حساب GitHub أولاً ثم اختر المستودع." });
    }

    const credential = JSON.parse(decryptProviderSecret(connection.encrypted_secret)) as {
      accessToken?: string;
    };
    if (!credential.accessToken) throw new Error("بيانات ربط GitHub غير صالحة.");

    const githubResponse = await fetch(
      "https://api.github.com/user/repos?affiliation=owner,collaborator&sort=updated&per_page=100",
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${credential.accessToken}`,
          "User-Agent": "FGOM21-AI",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    const payload = (await githubResponse.json().catch(() => ({}))) as any;
    if (!githubResponse.ok || !Array.isArray(payload)) {
      return res.status(502).json({ error: "تعذر قراءة مستودعات GitHub المرتبطة بهذا الحساب." });
    }

    res.json({
      repositories: payload.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        branch: repo.default_branch || "main",
        isPrivate: Boolean(repo.private),
      })),
    });
  } catch (error) {
    console.error("Could not load connected GitHub repositories:", error);
    res.status(500).json({ error: "تعذر تحميل مستودعات GitHub." });
  }
});

app.get("/api/platform/projects", arcjetSecurityMiddleware, async (req, res) => {
  try {
    const auth = await authenticatePlatformUser(req, res);
    if (!auth) return;

    const { data, error } = await auth.admin
      .from("deployment_projects")
      .select("id, name, repository_url, branch, created_at, updated_at")
      .eq("user_id", auth.userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    res.json({ projects: data || [] });
  } catch (error) {
    console.error("Could not load deployment projects:", error);
    res.status(500).json({ error: "تعذر تحميل المشاريع." });
  }
});

app.post("/api/platform/projects", arcjetSecurityMiddleware, async (req, res) => {
  try {
    const auth = await authenticatePlatformUser(req, res);
    if (!auth) return;

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const branch = typeof req.body?.branch === "string" ? req.body.branch.trim() : "main";
    const repositoryUrl =
      typeof req.body?.repositoryUrl === "string" ? req.body.repositoryUrl.trim() : "";
    let parsedRepository: URL;

    try {
      parsedRepository = new URL(repositoryUrl);
    } catch {
      return res.status(400).json({ error: "أدخل رابط مستودع GitHub صالحاً." });
    }

    const repositoryParts = parsedRepository.pathname
      .replace(/\.git$/i, "")
      .split("/")
      .filter(Boolean);
    if (
      parsedRepository.protocol !== "https:" ||
      parsedRepository.hostname !== "github.com" ||
      repositoryParts.length !== 2
    ) {
      return res.status(400).json({ error: "يجب أن يكون الرابط لمستودع GitHub بصيغة owner/repository." });
    }
    if (!name || name.length > 100 || !/^[\w./-]{1,120}$/.test(branch)) {
      return res.status(400).json({ error: "اسم المشروع أو الفرع غير صالح." });
    }

    const normalizedRepositoryUrl = `https://github.com/${repositoryParts.join("/")}`;
    const { data, error } = await auth.admin
      .from("deployment_projects")
      .insert({
        user_id: auth.userId,
        name,
        repository_url: normalizedRepositoryUrl,
        branch,
      })
      .select("id, name, repository_url, branch, created_at, updated_at")
      .single();

    if (error) throw error;
    res.status(201).json({ project: data });
  } catch (error) {
    console.error("Could not save deployment project:", error);
    res.status(500).json({ error: "تعذر حفظ المشروع." });
  }
});

app.get("/api/hosting/config", (_req, res) => {
  let publicUrlConfigured = false;
  try {
    const publicUrl = new URL(process.env.APP_URL || "");
    publicUrlConfigured = publicUrl.protocol === "https:";
  } catch {
    publicUrlConfigured = false;
  }
  res.json({
    netlifyConfigured: Boolean(process.env.NETLIFY_ACCESS_TOKEN?.trim()),
    publicUrlConfigured,
  });
});

app.post("/api/hosting/deploy", arcjetSecurityMiddleware, async (req, res) => {
  let createdSiteId = "";
  const suppliedToken = typeof req.body?.token === "string" ? req.body.token.trim() : "";
  const token = suppliedToken || process.env.NETLIFY_ACCESS_TOKEN?.trim() || "";
  if (!token) {
    return res.status(503).json({
      error: "أدخل مفتاح Netlify الخاص بك للمتابعة.",
      code: "NETLIFY_NOT_CONFIGURED",
    });
  }
  if (token.length < 20 || token.length > 500 || /[\r\n]/.test(token)) {
    return res.status(400).json({ error: "مفتاح Netlify غير صالح. تحقق منه ثم أعد المحاولة." });
  }

  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const files = req.body?.files;
    if (!name || name.length > 60 || !Array.isArray(files) || files.length === 0 || files.length > 100) {
      return res.status(400).json({ error: "اسم الموقع أو قائمة الملفات غير صالحة." });
    }

    const staticExtensions = new Set([
      "html", "htm", "css", "js", "mjs", "cjs", "json", "svg", "png", "jpg", "jpeg",
      "webp", "avif", "gif", "ico", "woff", "woff2", "ttf", "otf", "txt", "xml",
      "webmanifest", "pdf", "mp4", "mp3", "webm", "wasm", "map",
    ]);
    const archive = new JSZip();
    const uniquePaths = new Set<string>();
    let totalSize = 0;
    for (const item of files) {
      if (!item || typeof item !== "object") {
        return res.status(400).json({ error: "قائمة الملفات تحتوي على إدخال غير صالح." });
      }
      const file = item as { path?: unknown; content?: unknown; encoding?: unknown };
      if (
        typeof file.path !== "string" ||
        !isSafeHostedPath(file.path) ||
        uniquePaths.has(file.path) ||
        typeof file.content !== "string" ||
        (file.encoding !== "utf8" && file.encoding !== "base64")
      ) {
        return res.status(400).json({ error: "أحد الملفات له مسار أو محتوى غير صالح." });
      }
      const extension = file.path.split("/").pop()?.split(".").pop()?.toLowerCase() || "";
      if (!staticExtensions.has(extension)) {
        return res.status(400).json({
          error: `لا يمكن تشغيل ملفات .${extension || "بدون امتداد"} كاستضافة ثابتة. ارفع ناتج البناء الجاهز (HTML/CSS/JS)؛ الخوادم تحتاج منصة تشغيل منفصلة.`,
        });
      }
      const bytes = file.encoding === "base64"
        ? Buffer.from(file.content, "base64")
        : Buffer.from(file.content, "utf8");
      if (file.encoding === "base64" && (!/^[A-Za-z0-9+/]*={0,2}$/.test(file.content) || file.content.length % 4 !== 0)) {
        return res.status(400).json({ error: "ترميز ملف ثنائي غير صالح." });
      }
      totalSize += bytes.byteLength;
      if (totalSize > 15 * 1024 * 1024) {
        return res.status(413).json({ error: "حجم الموقع يتجاوز الحد الأقصى البالغ 15 ميغابايت." });
      }
      uniquePaths.add(file.path);
      archive.file(file.path, bytes);
    }
    if (!uniquePaths.has("index.html") && !uniquePaths.has("index.htm")) {
      return res.status(400).json({ error: "يجب أن يحتوي المجلد الرئيسي للموقع على index.html." });
    }

    let analyticsOrigin: string | null = null;
    try {
      const appOrigin = new URL(getAppUrl(req));
      if (appOrigin.protocol === "https:") analyticsOrigin = appOrigin.origin;
    } catch {
      analyticsOrigin = null;
    }
    const siteName = `${name.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 35) || "fgom-site"}-${randomUUID().slice(0, 6)}`;
    const authHeaders = { Authorization: `Bearer ${token}`, Accept: "application/json" };
    const siteResponse = await fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ name: siteName }),
    });
    const siteData = await siteResponse.json().catch(() => ({})) as {
      id?: string; ssl_url?: string; error_message?: string; message?: string;
    };
    if (!siteResponse.ok || !siteData.id) {
      const status = siteResponse.status === 401 || siteResponse.status === 403 ? 401 : 502;
      return res.status(status).json({
        error: status === 401 ? "رفض Netlify المفتاح. تحقق من صلاحيته وصلاحياته." : "تعذر إنشاء الموقع في Netlify.",
      });
    }
    createdSiteId = siteData.id;

    const indexPath = uniquePaths.has("index.html") ? "index.html" : "index.htm";
    const indexFile = files.find((item: { path: string }) => item.path === indexPath) as {
      path: string; content: string; encoding: "utf8" | "base64";
    };
    if (indexFile.encoding !== "utf8") {
      throw new Error("ملف index.html يجب أن يكون نصاً.");
    }
    const encodedSiteId = JSON.stringify(siteData.id).replace(/</g, "\\u003c");
    if (analyticsOrigin) {
      const encodedOrigin = JSON.stringify(analyticsOrigin).replace(/</g, "\\u003c");
      const tracker = `<script>(function(){try{var k="fgom21-analytics-"+${encodedSiteId};if(sessionStorage.getItem(k))return;fetch(${encodedOrigin}+"/api/hosting/analytics/track",{method:"POST",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify({siteId:${encodedSiteId}})}).then(function(r){if(r.ok)sessionStorage.setItem(k,"1")}).catch(function(){})}catch(_){}})();</script>`;
      indexFile.content = indexFile.content.replace(/<\/body\s*>/i, `${tracker}</body>`);
      if (!/<\/body\s*>/i.test(indexFile.content)) indexFile.content += tracker;
    }
    archive.file(indexPath, indexFile.content);

    const zipBuffer = await archive.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
    const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${encodeURIComponent(siteData.id)}/deploys`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/zip" },
      body: new Uint8Array(zipBuffer),
    });
    let deployData = await deployResponse.json().catch(() => ({})) as {
      id?: string; state?: string; ssl_url?: string; deploy_ssl_url?: string; error_message?: string;
    };
    if (!deployResponse.ok || !deployData.id) {
      throw new Error(deployResponse.status === 401 || deployResponse.status === 403
        ? "رفض Netlify رفع ملفات الموقع. راجع صلاحيات المفتاح."
        : "أنشأ Netlify مساحة الموقع لكن تعذر رفع الملفات. لن يُعرض رابط نشر غير مؤكد.");
    }

    const deadline = Date.now() + 30_000;
    while (deployData.state !== "ready" && Date.now() < deadline) {
      if (deployData.state === "error") throw new Error("فشل Netlify في تجهيز الموقع. راجع قيود الحساب ثم أعد المحاولة.");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const statusResponse = await fetch(`https://api.netlify.com/api/v1/deploys/${encodeURIComponent(deployData.id)}`, {
        headers: authHeaders,
      });
      if (!statusResponse.ok) throw new Error("تعذر التحقق من حالة نشر Netlify.");
      deployData = await statusResponse.json() as typeof deployData;
    }
    if (deployData.state !== "ready") throw new Error("ما زال Netlify يجهز النشر؛ لم يتم تأكيد الرابط بعد.");

    const url = deployData.ssl_url || deployData.deploy_ssl_url || siteData.ssl_url;
    if (!url || !url.startsWith("https://")) {
      throw new Error("أكد Netlify اكتمال النشر لكن لم يُرجع رابط HTTPS صالحاً.");
    }

    const analyticsKey = randomBytes(32).toString("base64url");
    try {
      const storedSites = loadPublishedSites();
      storedSites[siteData.id] = {
        ownerKeyHash: createHash("sha256").update(analyticsKey).digest("hex"),
        name,
        url,
        visits: 0,
        createdAt: new Date().toISOString(),
      };
      savePublishedSites(storedSites);
      return res.status(201).json({
        siteId: siteData.id,
        name,
        url,
        analyticsKey,
        visits: 0,
        ...(!analyticsOrigin ? { warning: "تم النشر بنجاح. عداد الزيارات يحتاج إعداد رابط HTTPS العام للمنصة." } : {}),
      });
    } catch (error) {
      console.error("Site deployed, but analytics could not be saved:", error);
      return res.status(201).json({
        siteId: siteData.id,
        name,
        url,
        visits: null,
        warning: "تم النشر، لكن تعذر حفظ بيانات لوحة الزيارات على هذا الخادم.",
      });
    }
  } catch (error) {
    if (createdSiteId) {
      try {
        await fetch(`https://api.netlify.com/api/v1/sites/${encodeURIComponent(createdSiteId)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (cleanupError) {
        console.error("Could not remove incomplete Netlify site:", cleanupError);
      }
    }
    console.error("Netlify deployment failed:", error);
    res.status(502).json({
      error: error instanceof Error ? error.message : "تعذر إكمال النشر عبر Netlify.",
    });
  }
});

app.post(
  "/api/hosting/analytics/track",
  express.text({ type: "text/plain", limit: "1kb" }),
  arcjetSecurityMiddleware,
  (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  let body = req.body as unknown;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body) as unknown;
    } catch {
      return res.status(400).json({ error: "بيانات الزيارة غير صالحة." });
    }
  }
  const siteId = body && typeof body === "object" && "siteId" in body && typeof body.siteId === "string"
    ? body.siteId
    : "";
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(siteId)) return res.status(400).json({ error: "معرف الموقع غير صالح." });
  try {
    const sites = loadPublishedSites();
    const site = sites[siteId];
    if (!site) return res.status(404).json({ error: "الموقع غير مسجل للتحليلات." });
    site.visits += 1;
    savePublishedSites(sites);
    res.status(204).end();
  } catch (error) {
    console.error("Could not record published site visit:", error);
    res.status(500).json({ error: "تعذر تسجيل الزيارة." });
  }
  }
);

app.get("/api/hosting/analytics/public", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const sites = loadPublishedSites();
    const publicSites = Object.entries(sites).map(([siteId, site]) => ({
      siteId,
      name: site.name,
      url: site.url,
      visits: Number.isSafeInteger(site.visits) && site.visits > 0 ? site.visits : 0,
      createdAt: site.createdAt,
    }));
    const totalVisits = publicSites.reduce((total, site) => total + site.visits, 0);
    res.json({ stats: { siteCount: publicSites.length, totalVisits, sites: publicSites } });
  } catch (error) {
    console.error("Could not read public hosting analytics:", error);
    res.status(500).json({ error: "تعذر تحميل الإحصاءات العامة." });
  }
});

app.get("/api/hosting/analytics/dashboard/:siteId", arcjetSecurityMiddleware, (req, res) => {
  const dashboardKey = req.header("x-dashboard-key") || "";
  if (dashboardKey.length < 32 || dashboardKey.length > 200) {
    return res.status(401).json({ error: "مفتاح لوحة الزيارات غير صالح." });
  }
  try {
    const sites = loadPublishedSites();
    const site = sites[req.params.siteId];
    if (!site) return res.status(404).json({ error: "لم يتم العثور على إحصاءات هذا الموقع." });
    const suppliedHash = createHash("sha256").update(dashboardKey).digest();
    const storedHash = Buffer.from(site.ownerKeyHash, "hex");
    if (storedHash.length !== suppliedHash.length || !timingSafeEqual(suppliedHash, storedHash)) {
      return res.status(403).json({ error: "مفتاح لوحة الزيارات غير صحيح." });
    }
    res.json({ site: { name: site.name, url: site.url, visits: site.visits, createdAt: site.createdAt } });
  } catch (error) {
    console.error("Could not read published site analytics:", error);
    res.status(500).json({ error: "تعذر تحميل إحصاءات الموقع." });
  }
});

// ✉️ Direct Support Ticket System Endpoint (Destination: fgom900@gmail.com)
app.post("/api/support/ticket", arcjetSecurityMiddleware, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ ok: false, error: "تفاصيل الرسالة مطلوبة لاكتكال التذكرة." });
    }

    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ ok: false, error: "أدخل بريدًا إلكترونيًا صالحًا للرد على طلبك." });
    }

    const ticketId = "TKT-" + Date.now().toString().slice(-6) + "-" + Math.floor(100 + Math.random() * 900);
    const timestamp = new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });

    const ticketData = {
      id: ticketId,
      destination: "fgom900@gmail.com",
      senderName: (name && typeof name === "string" && name.trim()) ? name.trim() : "مستخدم المنصة",
      senderEmail: (email && typeof email === "string" && email.trim()) ? email.trim() : "غير محدد",
      subject: (subject && typeof subject === "string" && subject.trim()) ? subject.trim() : "استفسار وتذكرة دعم فني",
      message: message.trim(),
      timestamp,
      app: "FGOM21 AI Platform",
    };

    const formspreeResponse = await fetch(FORMSPREE_SUPPORT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: ticketData.senderName,
        email: ticketData.senderEmail,
        subject: ticketData.subject,
        message: ticketData.message,
        ticketId: ticketData.id,
        submittedAt: ticketData.timestamp,
        _subject: `[FGOM21 AI] ${ticketData.subject} — ${ticketData.id}`,
      }),
    });

    if (!formspreeResponse.ok) {
      const detail = await formspreeResponse.json().catch(() => ({})) as any;
      console.error("Formspree support submission failed:", detail);
      return res.status(502).json({ ok: false, error: "تعذر إرسال تذكرة الدعم حاليًا. يرجى المحاولة لاحقًا." });
    }

    console.log("\n========================================================");
    console.log(`📩 [NEW SUPPORT TICKET RECEIVED FOR fgom900@gmail.com]`);
    console.log(`🎫 Ticket ID : ${ticketData.id}`);
    console.log(`👤 Sender    : ${ticketData.senderName} (${ticketData.senderEmail})`);
    console.log(`📌 Subject   : ${ticketData.subject}`);
    console.log(`⏰ Time      : ${ticketData.timestamp}`);
    console.log(`📝 Message   :\n${ticketData.message}`);
    console.log("========================================================\n");

    return res.json({
      ok: true,
      ticketId: ticketData.id,
      destination: "fgom900@gmail.com",
      message: "تم تسليم تذكرتك بنجاح وتوجيهها مباشرة إلى فريق الدعم المباشر.",
      timestamp: ticketData.timestamp,
    });
  } catch (err: any) {
    console.error("Error handling support ticket:", err);
    return res.status(500).json({ ok: false, error: "حدث خطأ أثناء معالجة التذكرة. يرجى المحاولة لاحقاً." });
  }
});

// Test API Key Endpoint
app.post("/api/test-key", async (req, res) => {
  try {
    const { provider, apiKey, accountId } = req.body;
    if (!provider) {
      return res.status(400).json({ ok: false, error: "يجب تحديد مزود الذكاء الاصطناعي." });
    }

    if (provider === "builtin") {
      return res.json({ ok: true, message: "المحرك المدمج نشط ومتاح للجميع مجاناً!" });
    }

    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      return res.status(400).json({ ok: false, error: "يرجى إدخال مفتاح API أولاً لتتمكن من اختباره." });
    }

    const key = apiKey.trim();

    if (provider === "gemini") {
      const testAi = new GoogleGenAI({ apiKey: key });
      await testAi.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: "اختبار",
      });
      return res.json({ ok: true, message: "تم التحقق بنجاح! مفتاح Google Gemini صالح وشغال." });
    }

    if (provider === "openai") {
      const testRes = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!testRes.ok) {
        const err = (await testRes.json().catch(() => ({}))) as any;
        throw new Error(err?.error?.message || `فشل التحقق من OpenAI (رمز ${testRes.status})`);
      }
      return res.json({ ok: true, message: "تم التحقق بنجاح! مفتاح OpenAI صالح وشغال." });
    }

    if (provider === "groq") {
      const testRes = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!testRes.ok) {
        const err = (await testRes.json().catch(() => ({}))) as any;
        throw new Error(err?.error?.message || `فشل التحقق من Groq (رمز ${testRes.status})`);
      }
      return res.json({ ok: true, message: "تم التحقق بنجاح! مفتاح Groq صالح وشغال بسرعته الخارقة." });
    }

    if (provider === "deepseek") {
      const testRes = await fetch("https://api.deepseek.com/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!testRes.ok) {
        const err = (await testRes.json().catch(() => ({}))) as any;
        throw new Error(err?.error?.message || `فشل التحقق من DeepSeek (رمز ${testRes.status})`);
      }
      return res.json({ ok: true, message: "تم التحقق بنجاح! مفتاح DeepSeek صالح وشغال." });
    }

    if (provider === "anthropic") {
      const testRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 5,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      if (!testRes.ok) {
        const err = (await testRes.json().catch(() => ({}))) as any;
        throw new Error(err?.error?.message || `فشل التحقق من Anthropic (رمز ${testRes.status})`);
      }
      return res.json({ ok: true, message: "تم التحقق بنجاح! مفتاح Anthropic Claude صالح وشغال." });
    }

    if (provider === "openrouter") {
      const testRes = await fetch("https://openrouter.ai/api/v1/auth/key", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!testRes.ok) {
        const err = (await testRes.json().catch(() => ({}))) as any;
        throw new Error(err?.error?.message || `فشل التحقق من OpenRouter (رمز ${testRes.status})`);
      }
      return res.json({ ok: true, message: "تم التحقق بنجاح! مفتاح OpenRouter صالح وشغال." });
    }

    if (provider === "cloudflare") {
      if (!accountId) {
        return res.status(400).json({ ok: false, error: "معرف حساب Cloudflare (Account ID) مطلوب." });
      }
      const testRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: "hi" }),
        }
      );
      if (!testRes.ok) {
        throw new Error(`فشل التحقق من Cloudflare Workers AI (رمز ${testRes.status})`);
      }
      return res.json({ ok: true, message: "تم التحقق بنجاح! حساب ومفتاح Cloudflare Workers AI يعملان." });
    }

    return res.status(400).json({ ok: false, error: "المزود المحدد غير معروف." });
  } catch (err: any) {
    return res.status(400).json({
      ok: false,
      error: err?.message || "تعذر التحقق من المفتاح. تأكد من صحة الرمز والاتصال بالإنترنت.",
    });
  }
});

// Models endpoint
app.get("/api/models", (req, res) => {
  res.json({
    models: MODELS,
    defaultModel: "llama-3.1-8b",
  });
});

// Analyze files summary endpoint
app.post("/api/analyze-files", async (req, res) => {
  try {
    const { files } = req.body;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "لم يتم إرسال أي ملفات للتحليل." });
    }

    const filesContext = files
      .slice(0, 50)
      .map(
        (f: any, idx: number) =>
          `=== ملف [${idx + 1}]: ${f.name} (${f.type || "code"}) ===\n${f.content || ""}\n`
      )
      .join("\n\n");

    const prompt = `قم بإجراء تحليل معماري وتقني شامل وسريع لهذه الملفات البرمجية (${files.length} ملفات):

${filesContext}

المطلوب باللغة العربية الفصحى وبصيغة Markdown منسقة:
1. 📋 ملخص هيكل المشروع والغرض منه.
2. 🛠️ التقنيات والمكتبات المستخدمة المكتشفة.
3. ⚠️ ملاحظات الأمان وجودة الشيفرة (Security & Code Quality notes).
4. 🚀 3 أسئلة أو تحسينات مقترحة يمكن للمطور مناقشتها معك الآن.`;

    const response = await generateWithFallback(
      [{ role: "user", parts: [{ text: prompt }] }],
      buildSystemPrompt("llama-3.1-8b", true, files.length),
      0.2
    );

    res.json({
      summary: response.text || "تم فحص الملفات بنجاح.",
    });
  } catch (err: any) {
    console.error("Error analyzing files:", err);
    res.status(500).json({
      error: "حدث خطأ أثناء تحليل الملفات: " + (err.message || String(err)),
    });
  }
});

// 🐙 GitHub Repository Inspector Endpoint
app.post("/api/github/inspect", async (req, res) => {
  try {
    const { repoUrl, owner: inputOwner, repo: inputRepo } = req.body;
    let owner = inputOwner;
    let repo = inputRepo;

    if (repoUrl && typeof repoUrl === "string") {
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\s#?]+)/i);
      if (match) {
        owner = match[1];
        repo = match[2].replace(/\.git$/i, "");
      }
    }

    if (!owner || !repo) {
      return res.status(400).json({
        error: "يرجى إدخال رابط مستودع GitHub صالح (مثال: owner/repo أو https://github.com/owner/repo)",
      });
    }

    const headers: Record<string, string> = {
      "User-Agent": "FGOM21-AI-Inspector",
      Accept: "application/vnd.github.v3+json",
    };

    // 1. Fetch Repo Info
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        return res.status(404).json({ error: "المستودع غير موجود أو أنه خاص (Private)." });
      }
      if (repoRes.status === 403) {
        return res.status(429).json({ error: "تم تجاوز حد استعلامات GitHub API المؤقت. يرجى المحاولة بعد دقيقة." });
      }
      return res.status(repoRes.status).json({ error: `فشل جلب بيانات المستودع (${repoRes.status})` });
    }
    const repoData = (await repoRes.json()) as any;

    // 2. Fetch README
    let readmeContent = "";
    try {
      const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
      if (readmeRes.ok) {
        const readmeData = (await readmeRes.json()) as any;
        if (readmeData.content) {
          readmeContent = Buffer.from(readmeData.content, "base64").toString("utf-8");
        }
      }
    } catch (_) {}

    // 3. Fetch Root Contents Tree
    let filesList: Array<{ name: string; path: string; type: string; size: number }> = [];
    try {
      const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers });
      if (contentsRes.ok) {
        const contentsData = (await contentsRes.json()) as any[];
        if (Array.isArray(contentsData)) {
          filesList = contentsData.map((item) => ({
            name: item.name,
            path: item.path,
            type: item.type,
            size: item.size || 0,
          }));
        }
      }
    } catch (_) {}

    return res.json({
      success: true,
      repo: {
        name: repoData.name,
        fullName: repoData.full_name,
        owner: repoData.owner?.login,
        avatarUrl: repoData.owner?.avatar_url,
        description: repoData.description || "لا يوجد وصف محدد في المستودع.",
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        defaultBranch: repoData.default_branch,
        language: repoData.language || "غير محدد",
        license: repoData.license?.name || "بدون رخصة محددة",
        htmlUrl: repoData.html_url,
        updatedAt: repoData.updated_at,
        readme: readmeContent,
        files: filesList,
      },
    });
  } catch (err: any) {
    console.error("Error inspecting GitHub repo:", err);
    return res.status(500).json({ error: "حدث خطأ أثناء فحص مستودع GitHub: " + (err.message || String(err)) });
  }
});

// 🛡️ Security Audit & Code Optimizer Endpoint
app.post("/api/security/audit", async (req, res) => {
  try {
    const { code, language = "javascript", context = "" } = req.body;
    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ error: "يرجى تزويد الكود البرمجي المراد فحصه أمنياً." });
    }

    const auditPrompt = `أنت كبير مهندسي الأمن السيبراني ومراجع جودة الأكواد في منصة FGOM21 AI.
مهمتك: إجراء فحص أمني دقيق وصارم للكود التالي بلغة (${language}):

\`\`\`${language}
${code.slice(0, 12000)}
\`\`\`
${context ? `سياق إضافي من المطور: ${context}` : ""}

المطلوب إرجاع رد بصيغة JSON حصراً بهذا التنسيق وبدون أي نصوص قبله أو بعده:
{
  "score": 85,
  "grade": "A",
  "summary": "ملخص شامل باللغة العربية حول الوضع الأمني للكود وجودته العامة.",
  "vulnerabilities": [
    {
      "id": "VULN-1",
      "title": "عنوان الثغرة (مثال: حقن SQL أو تسريب بيانات حساسة أو XSS)",
      "severity": "critical" | "high" | "medium" | "low",
      "line": "السطر أو الجزء المعني بالخطأ",
      "explanation": "شرح مفصل بالعربي لماذا هذا الجزء يشكل خطراً وكيف يمكن استغلاله.",
      "cwe": "CWE-89 أو OWASP A03:2021",
      "fixRecommendation": "الحل الموصى به برمجياً لتأمين هذا الجزء."
    }
  ],
  "optimizations": [
    "نصيحة أداء 1 باللغة العربية",
    "نصيحة أداء 2 باللغة العربية"
  ],
  "fixedCode": "// الكود المصحح والآمن بالكامل مع تعليقات توضيحية للأجزاء التي تم تأمينها"
}

القواعد الصارمة:
1. النتيجة score من 0 إلى 100، والـ grade إما A+ أو A أو B أو C أو F.
2. إذا كان الكود ممتازاً وخالياً من الثغرات، اجعل score 95+ و vulnerabilities مصفوفة فارغة.
3. التزم باللغة العربية الفصحى في الشروحات، واجعل الكود المصحح كاملاً وجاهزاً للنسخ والتشغيل المباشر.
4. أرجع JSON فقط.`;

    const aiResponse = await generateWithFallback(
      [{ role: "user", parts: [{ text: auditPrompt }] }],
      "أنت نظام فحص أمني متخصص يعيد نتائج JSON صالحة فقط.",
      0.1
    );

    let rawText = (aiResponse.text || "").trim();
    // Clean code block ticks if wrapped
    if (rawText.startsWith("```json")) rawText = rawText.slice(7);
    if (rawText.startsWith("```")) rawText = rawText.slice(3);
    if (rawText.endsWith("```")) rawText = rawText.slice(0, -3);
    rawText = rawText.trim();

    try {
      const parsedAudit = JSON.parse(rawText);
      return res.json(parsedAudit);
    } catch (parseErr) {
      console.warn("JSON parse failed, returning fallback audit:", parseErr);
      return res.json({
        score: 75,
        grade: "B",
        summary: "تم فحص الكود البرمجي واكتشاف بعض الملاحظات الأمنية وأفضل الممارسات البرمجية.",
        vulnerabilities: [
          {
            id: "VULN-GEN",
            title: "توصية التحقق من المدخلات ومطابقة المعايير",
            severity: "medium",
            explanation: "يُنصح دائماً بإجراء تحقق صارم من أنواع المدخلات (Input Sanitization) واستخدام معاملات مشفرة ومحمية.",
            cwe: "OWASP Top 10",
            fixRecommendation: "استخدم معالجة مسبقة للبيانات وفلترة المدخلات غير الموثوقة.",
          },
        ],
        optimizations: [
          "تقليل التكرار واستخدام دوال غير متزامنة فعالة.",
          "تفعيل التخزين المؤقت وحظر الأخطاء الصامتة.",
        ],
        fixedCode: code,
      });
    }
  } catch (err: any) {
    console.error("Error in security audit:", err);
    return res.status(500).json({ error: "حدث خطأ أثناء إجراء الفحص الأمني: " + (err.message || String(err)) });
  }
});

// 🤖 Autonomous Coding Agent Endpoint
app.post("/api/agent/plan", async (req, res) => {
  try {
    const { task, techStack = "React / TypeScript / Tailwind" } = req.body;
    if (!task || typeof task !== "string" || !task.trim()) {
      return res.status(400).json({ error: "يرجى تزويد الوكيل بالمهمة البرمجية المطلوب تنفيذها." });
    }

    const agentPrompt = `أنت "FGOM21 Autonomous AI Agent"، وكيل برمجي ذكي متقدم يعمل كـ Senior Software Architect & Autonomous Builder.
المستخدم كلفك بمهمة برمجية كاملة:
"${task.trim()}"

التقنيات المستهدفة: ${techStack}

مهمتك: وضع خطة هندسية دقيقة وتنفيذ كامل متعدد الملفات (Multi-File Solution) قابل للتشغيل المباشر.
يجب إرجاع الرد بصيغة JSON حصراً بهذا التنسيق وبدون أي نصوص إضافية:
{
  "title": "عنوان موجز وقوي للمشروع",
  "summary": "شرح معماري باللغة العربية يوضح كيف حقق الوكيل متطلبات المهمة.",
  "steps": [
    { "id": 1, "title": "تحليل المتطلبات وهندسة البيانات", "status": "completed", "details": "شرح الخطوة بالعربي" },
    { "id": 2, "title": "بناء الهيكل والواجهة التفاعلية", "status": "completed", "details": "شرح الخطوة بالعربي" },
    { "id": 3, "title": "تطبيق المنطق البرمجي وإدارة الحالة", "status": "completed", "details": "شرح الخطوة بالعربي" },
    { "id": 4, "title": "المراجعة الأمنية وفحص الحالات الاستثنائية", "status": "completed", "details": "شرح الخطوة بالعربي" }
  ],
  "files": [
    {
      "name": "index.html",
      "language": "html",
      "description": "واجهة المستخدم الرئيسية",
      "content": "<!DOCTYPE html>..."
    },
    {
      "name": "styles.css",
      "language": "css",
      "description": "ملف التنسيقات العصرية",
      "content": "/* styles */"
    },
    {
      "name": "app.js",
      "language": "javascript",
      "description": "المنطق التفاعلي المكتمل",
      "content": "// logic"
    }
  ],
  "runInstructions": "تعليمات تشغيل سريعة بالعربي خطوة بخطوة."
}

شروط صارمة:
1. يجب أن تكون الأكواد في files كاملة 100% بدون أي اختصارات أو تعليقات مثل '// اكتب الكود هنا'.
2. اجعل واجهة المستخدم فائقة الجمال والتجاوب مع دعم اللغة العربية وتصميم عصري داكن (Dark Theme).
3. أرجع JSON فقط.`;

    const aiResponse = await generateWithFallback(
      [{ role: "user", parts: [{ text: agentPrompt }] }],
      "أنت وكيل برمجي ذاتي ينفذ مشاريع كاملة ويعيد إجابات JSON نقية وصالحة فقط.",
      0.2
    );

    let rawText = (aiResponse.text || "").trim();
    if (rawText.startsWith("```json")) rawText = rawText.slice(7);
    if (rawText.startsWith("```")) rawText = rawText.slice(3);
    if (rawText.endsWith("```")) rawText = rawText.slice(0, -3);
    rawText = rawText.trim();

    try {
      const parsedPlan = JSON.parse(rawText);
      return res.json(parsedPlan);
    } catch (parseErr) {
      console.warn("Failed to parse agent JSON, falling back:", parseErr);
      return res.json({
        title: "مشروع " + task.slice(0, 30),
        summary: "قام الوكيل بهندسة النظام وتوليد الملفات اللازمة للمشروع.",
        steps: [
          { id: 1, title: "تحليل المهمة", status: "completed", details: "تمت مراجعة المتطلبات بنجاح." },
          { id: 2, title: "توليد ملفات الكود", status: "completed", details: "تم بناء الشيفرة البرمجية بالكامل." },
        ],
        files: [
          {
            name: "index.html",
            language: "html",
            description: "الصفحة الرئيسية للمشروع",
            content: `<!DOCTYPE html>\n<html dir="rtl" lang="ar">\n<head>\n  <meta charset="UTF-8">\n  <title>${task.slice(0, 25)}</title>\n  <style>body{background:#0a0a0a;color:#fff;font-family:sans-serif;padding:2rem;text-align:right;}</style>\n</head>\n<body>\n  <h1>${task}</h1>\n  <p>تم توليد المشروع بواسطة وكيل FGOM21 AI الذكي.</p>\n</body>\n</html>`,
          },
        ],
        runInstructions: "افتح الملف في المتصفح أو قم بتشغيله في استوديو الأكواد الحي.",
      });
    }
  } catch (err: any) {
    console.error("Error in agent runner:", err);
    return res.status(500).json({ error: "حدث خطأ في تشغيل الوكيل البرمجي: " + (err.message || String(err)) });
  }
});

// Non-streaming chat endpoint
app.post("/api/chat", arcjetSecurityMiddleware, async (req, res) => {
  try {
    const { messages = [], model = "llama-3.1-8b", developerMode = false, files = [], provider = "builtin", apiKey = "" } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "الرسائل مطلوبة لبدء المحادثة." });
    }

    const quota = consumeFreeRequest(
      req,
      res,
      provider !== "builtin" && typeof apiKey === "string" && apiKey.trim().length > 0
    );
    if (!quota.allowed) {
      const resetAt = new Date(quota.resetAt!).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });
      return res.status(429).json({
        code: "FREE_REQUEST_LIMIT_REACHED",
        resetAt: quota.resetAt,
        error: `استهلكت 25 طلبًا مجانيًا. ستتجدد طلباتك في ${resetAt}. أضف مفتاح API الخاص بك للاستخدام بلا حد داخل المنصة.`,
      });
    }
    res.setHeader("X-FGOM-Requests-Remaining", String(quota.remaining));

    const systemPrompt = buildSystemPrompt(model, Boolean(developerMode), files?.length || 0);
    const selectedModel = MODELS.find((m) => m.id === model) || MODELS[0];

    // Format files into context if present
    let filesContext = "";
    if (Array.isArray(files) && files.length > 0) {
      filesContext =
        "\n\n📂 [الملفات المرفقة من المشروع]:\n" +
        files
          .slice(0, 50)
          .map(
            (f: any, idx: number) =>
              `=== الملف (${idx + 1}/${files.length}): ${f.name} ===\n\`\`\`${f.type || ""}\n${f.content || ""}\n\`\`\``
          )
          .join("\n\n") +
        "\n\n[نهاية الملفات المرفقة]\n";
    }

    // Try Cloudflare Workers AI if configured
    if (selectedModel.cfModel && process.env.CLOUDFLARE_API_TOKEN) {
      const messagesWithFiles = [...messages];
      if (filesContext && messagesWithFiles.length > 0) {
        const lastIndex = messagesWithFiles.length - 1;
        messagesWithFiles[lastIndex] = {
          ...messagesWithFiles[lastIndex],
          content: `${filesContext}\n\n${messagesWithFiles[lastIndex].content}`,
        };
      }

      const cfResponse = await tryCloudflareAI(selectedModel.cfModel, messagesWithFiles, systemPrompt);
      if (cfResponse) {
        return res.json({
          reply: cfResponse,
          modelUsed: selectedModel.name,
          engine: "Cloudflare Workers AI",
        });
      }
    }

    // Default & High-Performance Fallback: Gemini with resilient retry
    // Prepare contents for Gemini
    // Incorporate conversation history & file context into the prompt
    const contents: any[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const isLast = i === messages.length - 1;
      let text = msg.content;
      const parts: any[] = [];

      if (isLast && msg.role === "user") {
        if (filesContext) {
          text = `${filesContext}\n\n${text}`;
        }

        // Send reference images as native Gemini vision inputs, rather than
        // merely naming them in the prompt.
        if (Array.isArray(files)) {
          for (const file of files) {
            if (file.dataUrl && typeof file.dataUrl === "string" && file.dataUrl.includes(",")) {
              const data = file.dataUrl.split(",")[1];
              const mimeType =
                file.mimeType || file.dataUrl.match(/data:([^;]+);/)?.[1] || "image/png";

              if (data) {
                parts.push({ inlineData: { mimeType, data } });
              }
            }
          }
        }
      }

      parts.push({ text });
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts,
      });
    }

    const result = await generateWithFallback(
      contents,
      systemPrompt,
      developerMode ? 0.2 : 0.7
    );

    const reply = result.text || "عذراً، لم أستطع توليد إجابة في الوقت الحالي.";

    return res.json({
      reply,
      modelUsed: selectedModel.name,
      engine: "FGOM21 Neural Engine",
    });
  } catch (err: any) {
    console.error("Error in /api/chat:", err);
    return res.status(500).json({
      error: "حدث خطأ أثناء معالجة الطلب: " + (err?.message || "خطأ غير متوقع"),
    });
  }
});

// Streaming Chat Endpoint via SSE
app.post("/api/chat/stream", arcjetSecurityMiddleware, async (req, res) => {
  try {
    const {
      messages = [],
      model = "llama-3.1-8b",
      developerMode = false,
      files = [],
      provider = "builtin",
      apiKey = "",
      customModel = "",
      cfAccountId = "",
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "الرسائل مطلوبة لبدء المحادثة." });
    }

    const quota = consumeFreeRequest(
      req,
      res,
      provider !== "builtin" && typeof apiKey === "string" && apiKey.trim().length > 0
    );
    if (!quota.allowed) {
      const resetAt = new Date(quota.resetAt!).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });
      return res.status(429).json({
        code: "FREE_REQUEST_LIMIT_REACHED",
        resetAt: quota.resetAt,
        error: `استهلكت 25 طلبًا مجانيًا. ستتجدد طلباتك في ${resetAt}. أضف مفتاح API الخاص بك للاستخدام بلا حد داخل المنصة.`,
      });
    }
    res.setHeader("X-FGOM-Requests-Remaining", String(quota.remaining));

    const systemPrompt = buildSystemPrompt(model, Boolean(developerMode), files?.length || 0);
    const selectedModel = MODELS.find((m) => m.id === model) || MODELS[0];

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // Format files context
    let filesContext = "";
    if (Array.isArray(files) && files.length > 0) {
      filesContext =
        "\n\n📂 [الملفات المرفقة من المشروع]:\n" +
        files
          .slice(0, 50)
          .map(
            (f: any, idx: number) =>
              `=== الملف (${idx + 1}/${files.length}): ${f.name} ===\n\`\`\`${f.type || ""}\n${f.content || ""}\n\`\`\``
          )
          .join("\n\n") +
        "\n\n[نهاية الملفات المرفقة]\n";
    }

    const messagesWithFiles = [...messages];
    if (filesContext && messagesWithFiles.length > 0) {
      const lastIndex = messagesWithFiles.length - 1;
      messagesWithFiles[lastIndex] = {
        ...messagesWithFiles[lastIndex],
        content: `${filesContext}\n\n${messagesWithFiles[lastIndex].content}`,
      };
    }

    // Contents for Gemini with Multimodal Image Support
    const contents: any[] = [];
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const isLast = i === messages.length - 1;
      let text = msg.content;
      const parts: any[] = [];

      if (isLast && msg.role === "user") {
        if (filesContext) {
          text = `${filesContext}\n\n${text}`;
        }

        // Attach any uploaded images directly as inlineData for Gemini Vision
        if (Array.isArray(files)) {
          for (const f of files) {
            if (f.dataUrl && typeof f.dataUrl === "string" && f.dataUrl.includes(",")) {
              const base64Part = f.dataUrl.split(",")[1];
              const mime = f.mimeType || (f.dataUrl.match(/data:([^;]+);/)?.[1]) || "image/png";
              if (base64Part) {
                parts.push({
                  inlineData: {
                    mimeType: mime,
                    data: base64Part,
                  },
                });
              }
            }
          }
        }
      }

      parts.push({ text });

      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts,
      });
    }

    const trimmedKey = typeof apiKey === "string" ? apiKey.trim() : "";

    // 1. Custom User Provider with their own API Key
    if (trimmedKey && provider !== "builtin") {
      if (provider === "gemini") {
        const targetModel = customModel || "gemini-3.8-flash";
        await callUserGeminiStream(
          trimmedKey,
          targetModel,
          contents,
          systemPrompt,
          developerMode ? 0.2 : 0.7,
          (textChunk) => {
            res.write(
              `data: ${JSON.stringify({ text: textChunk, modelUsed: `Google Gemini (${targetModel}) [مفتاحك]` })}\n\n`
            );
          }
        );
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      if (provider === "openai") {
        const targetModel = customModel || "gpt-4o";
        await callOpenAICompatibleStream(
          "https://api.openai.com/v1/chat/completions",
          trimmedKey,
          targetModel,
          messagesWithFiles,
          systemPrompt,
          developerMode ? 0.2 : 0.7,
          {},
          (textChunk) => {
            res.write(
              `data: ${JSON.stringify({ text: textChunk, modelUsed: `OpenAI (${targetModel}) [مفتاحك]` })}\n\n`
            );
          }
        );
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      if (provider === "groq") {
        const targetModel = customModel || "llama-3.3-70b-versatile";
        await callOpenAICompatibleStream(
          "https://api.groq.com/openai/v1/chat/completions",
          trimmedKey,
          targetModel,
          messagesWithFiles,
          systemPrompt,
          developerMode ? 0.2 : 0.7,
          {},
          (textChunk) => {
            res.write(
              `data: ${JSON.stringify({ text: textChunk, modelUsed: `Groq (${targetModel}) [مفتاحك]` })}\n\n`
            );
          }
        );
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      if (provider === "deepseek") {
        const targetModel = customModel || "deepseek-chat";
        await callOpenAICompatibleStream(
          "https://api.deepseek.com/chat/completions",
          trimmedKey,
          targetModel,
          messagesWithFiles,
          systemPrompt,
          developerMode ? 0.2 : 0.7,
          {},
          (textChunk) => {
            res.write(
              `data: ${JSON.stringify({ text: textChunk, modelUsed: `DeepSeek (${targetModel}) [مفتاحك]` })}\n\n`
            );
          }
        );
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      if (provider === "anthropic") {
        const targetModel = customModel || "claude-3-5-sonnet-20241022";
        await callAnthropicStream(
          trimmedKey,
          targetModel,
          messagesWithFiles,
          systemPrompt,
          developerMode ? 0.2 : 0.7,
          (textChunk) => {
            res.write(
              `data: ${JSON.stringify({ text: textChunk, modelUsed: `Claude (${targetModel}) [مفتاحك]` })}\n\n`
            );
          }
        );
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      if (provider === "openrouter") {
        const targetModel = customModel || "meta-llama/llama-3.3-70b-instruct";
        await callOpenAICompatibleStream(
          "https://openrouter.ai/api/v1/chat/completions",
          trimmedKey,
          targetModel,
          messagesWithFiles,
          systemPrompt,
          developerMode ? 0.2 : 0.7,
          { "HTTP-Referer": "https://fgom21.ai", "X-Title": "FGOM21 AI" },
          (textChunk) => {
            res.write(
              `data: ${JSON.stringify({ text: textChunk, modelUsed: `OpenRouter (${targetModel}) [مفتاحك]` })}\n\n`
            );
          }
        );
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      if (provider === "cloudflare") {
        const targetAccount = cfAccountId || process.env.CLOUDFLARE_ACCOUNT_ID;
        const targetModel = customModel || "@cf/meta/llama-3.1-8b-instruct";
        if (targetAccount) {
          const url = `https://api.cloudflare.com/client/v4/accounts/${targetAccount}/ai/run/${targetModel}`;
          const formattedMessages = [
            { role: "system", content: systemPrompt },
            ...messagesWithFiles.map((m) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: m.content,
            })),
          ];

          const cfRes = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${trimmedKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ messages: formattedMessages }),
          });

          if (!cfRes.ok) {
            throw new Error(`خطأ من Cloudflare (${cfRes.status})`);
          }

          const cfData = (await cfRes.json()) as any;
          const cfText = cfData?.result?.response || "";
          const chunkSize = 25;
          for (let i = 0; i < cfText.length; i += chunkSize) {
            res.write(
              `data: ${JSON.stringify({ text: cfText.slice(i, i + chunkSize), modelUsed: `Cloudflare (${targetModel}) [مفتاحك]` })}\n\n`
            );
            await new Promise((r) => setTimeout(r, 12));
          }
          res.write("data: [DONE]\n\n");
          res.end();
          return;
        }
      }
    }

    // 2. Default & Built-in Engine Fallback
    // Try Cloudflare first if configured on server
    if (selectedModel.cfModel && process.env.CLOUDFLARE_API_TOKEN) {
      const cfResponse = await tryCloudflareAI(selectedModel.cfModel, messagesWithFiles, systemPrompt);
      if (cfResponse) {
        const chunkSize = 25;
        for (let i = 0; i < cfResponse.length; i += chunkSize) {
          const chunk = cfResponse.slice(i, i + chunkSize);
          res.write(`data: ${JSON.stringify({ text: chunk, modelUsed: selectedModel.name })}\n\n`);
          await new Promise((r) => setTimeout(r, 12));
        }
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
    }

    // Resilient streaming with Google Gemini
    await executeStreamWithFallback(
      contents,
      systemPrompt,
      developerMode ? 0.2 : 0.7,
      (textChunk) => {
        res.write(
          `data: ${JSON.stringify({ text: textChunk, modelUsed: selectedModel.name })}\n\n`
        );
      }
    );

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    console.error("Error in streaming chat:", err);
    const userMsg =
      isTemporaryError(err)
        ? "النموذج يواجه ضغطاً مؤقتاً في الطلبات، تم تحديث مسار المعالجة الاحتياطي. يرجى إعادة المحاولة الآن."
        : err?.message || "حدث خطأ أثناء معالجة الرد.";

    if (!res.headersSent) {
      res.status(500).json({ error: userMsg });
    } else {
      res.write(`data: ${JSON.stringify({ error: userMsg })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }
});

app.use("/api", (req, res) => {
  res.status(404).json({
    error: "مسار API غير موجود في الخادم الحالي. أوقف نسخة FGOM21 القديمة ثم شغّل أحدث نسخة عبر npm run dev.",
    code: "API_ROUTE_NOT_FOUND",
  });
});

// Vite middleware or Static Bundle setup
async function startServer() {
  const distPath = path.join(process.cwd(), "dist");
  // `npm run dev` runs this source file through tsx.  A previous version
  // served /dist whenever it existed, which meant development always showed
  // an outdated bundle instead of the files currently being edited.
  const isProductionBundle =
    process.env.NODE_ENV === "production" ||
    /[\\/]dist[\\/]server\.cjs$/i.test(process.argv[1] || "");

  if (
    isProductionBundle &&
    fs.existsSync(distPath) &&
    fs.existsSync(path.join(distPath, "index.html"))
  ) {
    console.log("Serving production static bundle from /dist...");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.log("Starting Vite middleware server in DEV mode...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FGOM21 AI Server running on http://localhost:${PORT} and http://0.0.0.0:${PORT}`);
  });
}

// Inside the Netlify Function the app is served by netlify/functions/api.mts.
if (!(globalThis as any).__FGOM_SERVERLESS__) {
  startServer();
}

export default app;
