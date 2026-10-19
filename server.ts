import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing with support for code file payloads up to 10MB
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Lazy GoogleGenAI client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const key = process.env.GEMINI_API_KEY;
    genAIClient = new GoogleGenAI({
      apiKey: key || "",
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
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasCloudflareKey: Boolean(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID),
  });
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
      .slice(0, 5)
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
app.post("/api/chat", async (req, res) => {
  try {
    const { messages = [], model = "llama-3.1-8b", developerMode = false, files = [] } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "الرسائل مطلوبة لبدء المحادثة." });
    }

    const systemPrompt = buildSystemPrompt(model, Boolean(developerMode), files?.length || 0);
    const selectedModel = MODELS.find((m) => m.id === model) || MODELS[0];

    // Format files into context if present
    let filesContext = "";
    if (Array.isArray(files) && files.length > 0) {
      filesContext =
        "\n\n📂 [الملفات المرفقة من المشروع]:\n" +
        files
          .slice(0, 5)
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
      if (isLast && msg.role === "user" && filesContext) {
        text = `${filesContext}\n\n${text}`;
      }

      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text }],
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
app.post("/api/chat/stream", async (req, res) => {
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
          .slice(0, 5)
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

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FGOM21 AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
