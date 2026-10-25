import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeft,
  Download,
  Layers3,
  Loader2,
  MousePointer2,
  Network,
  RefreshCw,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { AppSettings } from "../types";
import { AI_PROVIDERS } from "../data/providers";

type FlowMode = "user-journey" | "system-flow" | "automation";
type NodeKind = "user" | "screen" | "service" | "decision" | "data" | "external" | "result";

interface FlowNode {
  id: string;
  title: string;
  description: string;
  actor: string;
  kind: NodeKind;
  stage: number;
  nextIds: string[];
  details: string[];
}

interface FlowMap {
  title: string;
  summary: string;
  nodes: FlowNode[];
}

interface AiHealth {
  hasGeminiKey: boolean;
  hasCloudflareKey: boolean;
}

interface InteractiveFlowMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  model: string;
  onOpenSettings: () => void;
}

const FLOW_MODES: Array<{ id: FlowMode; label: string; description: string }> = [
  { id: "user-journey", label: "رحلة المستخدم", description: "من أول زيارة إلى اكتمال هدف المستخدم" },
  { id: "system-flow", label: "كيف يعمل الموقع", description: "الواجهة والخادم والخدمات والنتيجة" },
  { id: "automation", label: "تدفق آلي", description: "خطوات وأحداث وقرارات شبيهة بمخطط n8n" },
];

const NODE_STYLES: Record<NodeKind, { label: string; className: string }> = {
  user: { label: "المستخدم", className: "border-sky-500/40 bg-sky-500/[0.08] text-sky-100" },
  screen: { label: "واجهة", className: "border-violet-500/40 bg-violet-500/[0.08] text-violet-100" },
  service: { label: "خدمة", className: "border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-100" },
  decision: { label: "قرار", className: "border-amber-500/40 bg-amber-500/[0.08] text-amber-100" },
  data: { label: "بيانات", className: "border-cyan-500/40 bg-cyan-500/[0.08] text-cyan-100" },
  external: { label: "خدمة خارجية", className: "border-fuchsia-500/40 bg-fuchsia-500/[0.08] text-fuchsia-100" },
  result: { label: "نتيجة", className: "border-teal-500/40 bg-teal-500/[0.08] text-teal-100" },
};

const CARD_WIDTH = 224;
const CARD_HEIGHT = 156;
const COLUMN_GAP = 112;
const ROW_GAP = 38;
const PADDING = 48;

function parseFlowMap(reply: string): FlowMap {
  const jsonText = reply.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || reply;
  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error("لم يصل مخطط بصيغة منظمة. أعد المحاولة أو أعد صياغة الفكرة.");
  }

  const parsed = JSON.parse(jsonText.slice(firstBrace, lastBrace + 1)) as Partial<FlowMap>;
  if (
    typeof parsed.title !== "string" ||
    typeof parsed.summary !== "string" ||
    !Array.isArray(parsed.nodes) ||
    parsed.nodes.length < 3 ||
    parsed.nodes.length > 18
  ) {
    throw new Error("المخطط الناتج غير مكتمل. جرّب وصف الفكرة بشكل أوضح.");
  }

  const allowedKinds = new Set<NodeKind>([
    "user",
    "screen",
    "service",
    "decision",
    "data",
    "external",
    "result",
  ]);
  const nodes = parsed.nodes.map((node, index): FlowNode => {
    if (
      !node ||
      typeof node.id !== "string" ||
      typeof node.title !== "string" ||
      typeof node.description !== "string"
    ) {
      throw new Error(`بيانات الخطوة رقم ${index + 1} في المخطط غير صالحة.`);
    }

    const kind = allowedKinds.has(node.kind as NodeKind) ? (node.kind as NodeKind) : "service";
    const stage = Number.isInteger(node.stage) ? Math.min(5, Math.max(0, Number(node.stage))) : index;
    return {
      id: node.id.slice(0, 48),
      title: node.title.slice(0, 100),
      description: node.description.slice(0, 220),
      actor: typeof node.actor === "string" ? node.actor.slice(0, 80) : "النظام",
      kind,
      stage,
      nextIds: Array.isArray(node.nextIds)
        ? node.nextIds.filter((id): id is string => typeof id === "string").slice(0, 5)
        : [],
      details: Array.isArray(node.details)
        ? node.details.filter((detail): detail is string => typeof detail === "string").slice(0, 5)
        : [],
    };
  });

  const ids = new Set(nodes.map((node) => node.id));
  if (ids.size !== nodes.length) {
    throw new Error("المخطط يحتوي على معرفات خطوات مكررة. أعد المحاولة.");
  }
  nodes.forEach((node) => {
    node.nextIds = node.nextIds.filter((id) => ids.has(id) && id !== node.id);
  });

  return { title: parsed.title.slice(0, 120), summary: parsed.summary.slice(0, 500), nodes };
}

async function readStreamReply(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    const responseText = await response.text();
    let errorMessage: string | undefined;
    try {
      const errorBody = JSON.parse(responseText) as { error?: string };
      errorMessage = errorBody.error;
    } catch {
      errorMessage = undefined;
    }
    throw new Error(errorMessage || `تعذر إنشاء الخريطة (${response.status}).`);
  }

  if (!contentType.toLowerCase().includes("text/event-stream") || !response.body) {
    throw new Error("خادم الذكاء الاصطناعي لا يدعم بث الاستجابة المطلوبة. حدّث خادم FGOM21.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let reply = "";
  let streamError = "";

  const processFrame = (frame: string) => {
    const dataLine = frame.split(/\r?\n/).find((line) => line.startsWith("data:"));
    if (!dataLine) return;
    const value = dataLine.slice(5).trim();
    if (!value || value === "[DONE]") return;

    try {
      const event = JSON.parse(value) as { text?: unknown; error?: unknown };
      if (typeof event.text === "string") reply += event.text;
      if (typeof event.error === "string") streamError = event.error;
    } catch {
      streamError = "وصلت استجابة غير مفهومة من محرك الذكاء الاصطناعي.";
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    pending += decoder.decode(value, { stream: !done });
    const frames = pending.split(/\r?\n\r?\n/);
    pending = frames.pop() || "";
    frames.forEach(processFrame);
    if (done) break;
  }
  if (pending.trim()) processFrame(pending);

  if (streamError) throw new Error(streamError);
  if (!reply.trim()) throw new Error("لم يُرجع مزوّد الذكاء الاصطناعي أي محتوى.");
  return reply;
}

export const InteractiveFlowMapModal: React.FC<InteractiveFlowMapModalProps> = ({
  isOpen,
  onClose,
  settings,
  model,
  onOpenSettings,
}) => {
  const [idea, setIdea] = useState("");
  const [mode, setMode] = useState<FlowMode>("user-journey");
  const [flowMap, setFlowMap] = useState<FlowMap | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [zoom, setZoom] = useState(1);
  const [aiHealth, setAiHealth] = useState<AiHealth | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    fetch("/api/health")
      .then(async (response) => {
        if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
          return null;
        }
        return (await response.json()) as AiHealth;
      })
      .then((health) => {
        if (active) setAiHealth(health);
      })
      .catch(() => {
        if (active) setAiHealth(null);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  const positions = useMemo(() => {
    if (!flowMap) return new Map<string, { x: number; y: number }>();
    const columns = new Map<number, FlowNode[]>();
    flowMap.nodes.forEach((node) => {
      const column = columns.get(node.stage) || [];
      column.push(node);
      columns.set(node.stage, column);
    });

    const result = new Map<string, { x: number; y: number }>();
    columns.forEach((nodes, stage) => {
      nodes.forEach((node, row) => {
        result.set(node.id, {
          x: PADDING + stage * (CARD_WIDTH + COLUMN_GAP),
          y: PADDING + row * (CARD_HEIGHT + ROW_GAP),
        });
      });
    });
    return result;
  }, [flowMap]);

  const selectedNode = flowMap?.nodes.find((node) => node.id === selectedNodeId) || null;
  const activeProvider = settings.selectedProvider || "builtin";
  const activeProviderName =
    AI_PROVIDERS.find((provider) => provider.id === activeProvider)?.name || "المحرك المدمج";
  const mapSize = useMemo(() => {
    if (!flowMap) return { width: 900, height: 480 };
    const maxStage = Math.max(...flowMap.nodes.map((node) => node.stage));
    const maxRows = Math.max(
      ...Array.from(
        flowMap.nodes.reduce((counts, node) => {
          counts.set(node.stage, (counts.get(node.stage) || 0) + 1);
          return counts;
        }, new Map<number, number>()).values()
      )
    );
    return {
      width: PADDING * 2 + (maxStage + 1) * CARD_WIDTH + maxStage * COLUMN_GAP,
      height: PADDING * 2 + maxRows * CARD_HEIGHT + Math.max(0, maxRows - 1) * ROW_GAP,
    };
  }, [flowMap]);

  if (!isOpen) return null;

  const generateFlow = async () => {
    if (!idea.trim()) {
      setErrorMessage("اكتب فكرة الموقع أو التطبيق أولاً.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");
    setFlowMap(null);
    setSelectedNodeId(null);

    const modeInfo = FLOW_MODES.find((item) => item.id === mode)!;
    const provider = activeProvider;
    let apiKey = "";
    if (provider === "gemini") apiKey = settings.apiKeys?.gemini || "";
    else if (provider === "openai") apiKey = settings.apiKeys?.openai || "";
    else if (provider === "groq") apiKey = settings.apiKeys?.groq || "";
    else if (provider === "deepseek") apiKey = settings.apiKeys?.deepseek || "";
    else if (provider === "anthropic") apiKey = settings.apiKeys?.anthropic || "";
    else if (provider === "openrouter") apiKey = settings.apiKeys?.openrouter || "";
    else if (provider === "cloudflare") {
      apiKey = settings.apiKeys?.cloudflareToken || settings.cfApiToken || "";
    }

    if (provider !== "builtin" && !apiKey.trim()) {
      setErrorMessage("المزوّد المحدد ما عنده مفتاح محفوظ. أضف مفتاحه من الإعدادات أو اختر المحرك المدمج.");
      setIsGenerating(false);
      return;
    }
    if (
      provider === "builtin" &&
      aiHealth &&
      !aiHealth.hasGeminiKey &&
      !aiHealth.hasCloudflareKey
    ) {
      setErrorMessage(
        "المحرك المجاني غير مهيأ على الخادم حالياً. اختر مزوداً وأدخل مفتاحه من الإعدادات، أو أضف مفتاح Gemini/Cloudflare إلى بيئة الخادم."
      );
      setIsGenerating(false);
      return;
    }

    const prompt = `أنت مهندس تجربة مستخدم ومهندس أنظمة وخبير في تصميم مخططات التدفق التفاعلية.
حوّل فكرة المشروع التالية إلى مخطط كامل يشرح العمل من البداية إلى النهاية.
نوع المخطط: ${modeInfo.label} — ${modeInfo.description}
الفكرة: ${idea.trim()}

أعد JSON صالحاً فقط دون Markdown أو مقدمة، بهذا الشكل:
{
  "title": "اسم واضح للمخطط",
  "summary": "ملخص عربي موجز لمسار العمل",
  "nodes": [
    {
      "id": "unique-kebab-case-id",
      "title": "عنوان قصير للخطوة",
      "description": "ماذا يحدث في هذه الخطوة؟",
      "actor": "المستخدم أو الواجهة أو الخادم أو خدمة خارجية",
      "kind": "user|screen|service|decision|data|external|result",
      "stage": 0,
      "nextIds": ["id-of-next-node"],
      "details": ["تفصيل عملي أو حالة خطأ"]
    }
  ]
}
أنشئ من 8 إلى 14 خطوة عملية، stages أرقام من 0 إلى 5 تمثل أعمدة من البداية للنهاية. استخدم nextIds لربط المسارات، وضمّن التحقق من المدخلات وحالات النجاح والفشل والخطوة النهائية. اجعل المخطط خاصاً بالفكرة، متسلسلاً ومفهوماً، ولا تخترع تكاملات غير مطلوبة.`;

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model,
          developerMode: true,
          provider,
          apiKey,
          customModel: settings.activeCustomModel || "",
          cfAccountId: settings.cfAccountId || settings.apiKeys?.cloudflareAccountId || "",
        }),
      });

      const reply = await readStreamReply(response);
      const generatedMap = parseFlowMap(reply);
      setFlowMap(generatedMap);
      setSelectedNodeId(generatedMap.nodes[0]?.id || null);
      setZoom(1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "تعذر إنشاء الخريطة.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadMap = () => {
    if (!flowMap) return;
    const lines = [
      `# ${flowMap.title}`,
      "",
      flowMap.summary,
      "",
      ...flowMap.nodes.map((node, index) => {
        const nextTitles = node.nextIds
          .map((id) => flowMap.nodes.find((item) => item.id === id)?.title)
          .filter(Boolean);
        return [
          `## ${index + 1}. ${node.title}`,
          `- النوع: ${NODE_STYLES[node.kind].label}`,
          `- المسؤول: ${node.actor}`,
          `- التفاصيل: ${node.description}`,
          nextTitles.length ? `- التالي: ${nextTitles.join("، ")}` : "",
          ...node.details.map((detail) => `- ملاحظة: ${detail}`),
          "",
        ].filter(Boolean).join("\n");
      }),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${flowMap.title.replace(/[^\p{L}\p{N}-]+/gu, "-").slice(0, 60) || "flow-map"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-5" dir="rtl">
      <section className="flex h-[96vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-white">خريطة تفاعلية لكيفية عمل الموقع</h2>
              <p className="text-xs text-neutral-400">حوّل الفكرة إلى رحلة كاملة قابلة للاستكشاف</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid shrink-0 gap-3 border-b border-neutral-800 bg-neutral-900/30 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            <label className="block text-xs font-bold text-neutral-300">
              اكتب فكرة الموقع أو التطبيق
              <textarea
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                rows={2}
                maxLength={1800}
                placeholder="مثال: منصة حجز مواعيد لعيادة، من اختيار الطبيب والموعد إلى التأكيد والتذكير..."
                className="mt-1.5 w-full resize-y rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm leading-6 text-white outline-none placeholder:text-neutral-600 focus:border-indigo-400"
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {FLOW_MODES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    title={item.description}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${mode === item.id ? "border-indigo-400/40 bg-indigo-500/15 text-indigo-200" : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-neutral-500">{idea.length}/1800</span>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3">
            <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/[0.04] p-3 text-xs leading-6 text-neutral-300">
              <div className="mb-1 flex items-center gap-2 font-bold text-indigo-200">
                <Sparkles className="h-4 w-4" /> ماذا سيظهر؟
              </div>
              خطوات مترابطة من البداية للنهاية. اضغط أي بطاقة لتفاصيلها، ثم كبّر الخريطة أو نزّلها كملف.
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-400">
              <span>المزوّد الحالي: <strong className="text-neutral-200">{activeProviderName}</strong></span>
              <button type="button" onClick={onOpenSettings} className="text-indigo-300 underline-offset-2 hover:underline">
                تغيير الإعدادات
              </button>
            </div>
            {activeProvider === "builtin" &&
              aiHealth &&
              !aiHealth.hasGeminiKey &&
              !aiHealth.hasCloudflareKey && (
                <p className="text-[11px] leading-5 text-amber-300">
                  المحرك المجاني غير متاح حالياً على هذا الخادم؛ استخدم مفتاحك من الإعدادات أو فعّل مفتاح الخادم.
                </p>
              )}
            <button
              type="button"
              onClick={generateFlow}
              disabled={isGenerating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-400 disabled:cursor-wait disabled:opacity-60"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : flowMap ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? "جاري بناء الخريطة..." : flowMap ? "إعادة إنشاء الخريطة" : "أنشئ خريطتي"}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div role="alert" className="mx-4 mt-3 flex shrink-0 items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-sm text-red-200 sm:mx-6">
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col">
          {flowMap ? (
            <>
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-800 px-4 py-3 sm:px-6">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-white">{flowMap.title}</h3>
                  <p className="mt-0.5 line-clamp-1 text-xs text-neutral-400">{flowMap.summary}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden items-center gap-1 text-xs text-neutral-500 sm:flex">
                    <MousePointer2 className="h-3.5 w-3.5" /> اختر خطوة لعرض تفاصيلها
                  </span>
                  <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-900">
                    <button type="button" onClick={() => setZoom((value) => Math.min(1.5, value + 0.1))} className="p-2 text-neutral-300 hover:text-white" aria-label="تكبير"><ZoomIn className="h-4 w-4" /></button>
                    <span className="min-w-12 text-center text-[11px] text-neutral-400">{Math.round(zoom * 100)}%</span>
                    <button type="button" onClick={() => setZoom((value) => Math.max(0.55, value - 0.1))} className="p-2 text-neutral-300 hover:text-white" aria-label="تصغير"><ZoomOut className="h-4 w-4" /></button>
                  </div>
                  <button type="button" onClick={downloadMap} className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-200 hover:border-indigo-500/40">
                    <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">تنزيل الخريطة</span>
                  </button>
                </div>
              </div>

              <div className="relative min-h-0 flex-1 overflow-auto bg-[#090b10]">
                <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(#64748b 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
                <div
                  className="relative"
                  style={{
                    width: mapSize.width * zoom,
                    height: mapSize.height * zoom,
                    minWidth: "100%",
                    minHeight: "100%",
                  }}
                >
                  <div
                    className="absolute right-0 top-0"
                    style={{
                      width: mapSize.width,
                      height: mapSize.height,
                      transform: `scale(${zoom})`,
                      transformOrigin: "top right",
                    }}
                  >
                    <svg className="pointer-events-none absolute inset-0" width={mapSize.width} height={mapSize.height} aria-hidden="true">
                      <defs>
                        <marker id="flow-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                          <path d="M0,0 L9,4.5 L0,9 z" fill="#818cf8" />
                        </marker>
                      </defs>
                      {flowMap.nodes.flatMap((node) => node.nextIds.map((nextId) => {
                        const from = positions.get(node.id);
                        const to = positions.get(nextId);
                        if (!from || !to) return null;
                        const startX = mapSize.width - from.x - CARD_WIDTH;
                        const endX = mapSize.width - to.x;
                        const startY = from.y + CARD_HEIGHT / 2;
                        const endY = to.y + CARD_HEIGHT / 2;
                        const middleX = (startX + endX) / 2;
                        const path = `M ${startX} ${startY} C ${middleX} ${startY}, ${middleX} ${endY}, ${endX} ${endY}`;
                        const highlighted = selectedNodeId === node.id || selectedNodeId === nextId;
                        return <path key={`${node.id}-${nextId}`} d={path} fill="none" stroke={highlighted ? "#a5b4fc" : "#4b5563"} strokeWidth={highlighted ? 2.5 : 1.5} strokeDasharray={highlighted ? undefined : "5 5"} markerEnd="url(#flow-arrow)" />;
                      }))}
                    </svg>

                    {flowMap.nodes.map((node, index) => {
                      const position = positions.get(node.id);
                      if (!position) return null;
                      const style = NODE_STYLES[node.kind];
                      const selected = node.id === selectedNodeId;
                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`absolute flex flex-col rounded-2xl border p-3 text-right shadow-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${style.className} ${selected ? "z-10 scale-[1.025] ring-2 ring-indigo-300/70 shadow-indigo-950/50" : "hover:z-10 hover:border-indigo-300/50 hover:brightness-110"}`}
                          style={{ right: position.x, top: position.y, width: CARD_WIDTH, height: CARD_HEIGHT }}
                        >
                          <div className="mb-2 flex w-full items-center justify-between gap-2">
                            <span className="rounded-md border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-semibold">{style.label}</span>
                            <span className="text-[10px] text-white/50">{String(index + 1).padStart(2, "0")}</span>
                          </div>
                          <span className="line-clamp-2 text-sm font-bold leading-6 text-white">{node.title}</span>
                          <span className="mt-1 line-clamp-2 text-[11px] leading-5 text-neutral-300">{node.description}</span>
                          <span className="mt-auto flex items-center gap-1 text-[10px] text-white/50">
                            <Layers3 className="h-3 w-3" /> {node.actor}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {selectedNode && (
                <aside className="shrink-0 border-t border-neutral-800 bg-neutral-900/70 px-4 py-3 sm:px-6">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{selectedNode.title}</h4>
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] ${NODE_STYLES[selectedNode.kind].className}`}>{NODE_STYLES[selectedNode.kind].label}</span>
                        <span className="text-[10px] text-neutral-500">المسؤول: {selectedNode.actor}</span>
                      </div>
                      <p className="mt-1 text-xs leading-6 text-neutral-300">{selectedNode.description}</p>
                      {selectedNode.details.length > 0 && (
                        <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-neutral-400">
                          {selectedNode.details.map((detail) => <li key={detail} className="flex items-center gap-1"><ArrowDownLeft className="h-3 w-3 text-indigo-300" />{detail}</li>)}
                        </ul>
                      )}
                    </div>
                    {selectedNode.nextIds.length > 0 && (
                      <div className="hidden max-w-48 shrink-0 sm:block">
                        <p className="mb-1 text-[10px] text-neutral-500">الخطوات التالية</p>
                        {selectedNode.nextIds.map((id) => {
                          const next = flowMap.nodes.find((node) => node.id === id);
                          return next ? (
                            <button key={id} type="button" onClick={() => setSelectedNodeId(id)} className="mb-1 flex items-center gap-1 text-xs text-indigo-200 hover:text-white">
                              <ArrowLeft className="h-3 w-3" /> {next.title}
                            </button>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </aside>
              )}
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.07] text-indigo-300">
                {isGenerating ? <Loader2 className="h-7 w-7 animate-spin" /> : <Network className="h-7 w-7" />}
              </div>
              <h3 className="text-lg font-bold text-white">{isGenerating ? "نرتّب خطوات فكرتك..." : "فكرتك، مرسومة من البداية للنهاية"}</h3>
              <p className="mt-2 max-w-lg text-sm leading-7 text-neutral-400">
                {isGenerating
                  ? "يحلل الذكاء الاصطناعي المستخدم والواجهات والخدمات والقرارات والنهايات، ثم يربطها في خريطة قابلة للتفاعل."
                  : "اكتب وصفاً بسيطاً واختر نوع التدفق. ستظهر الخطوات كبطاقات موصولة؛ اضغط أي بطاقة لاستكشاف دورها وما يحدث بعدها."}
              </p>
              {!isGenerating && (
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {["متجر إلكتروني", "منصة حجز مواعيد", "تطبيق توصيل"].map((example) => (
                    <button key={example} type="button" onClick={() => setIdea(`موقع ${example}: وضّح رحلة المستخدم وآلية عمل الموقع من البداية إلى إتمام الطلب، مع حالات النجاح والخطأ.`)} className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-400 hover:border-indigo-500/40 hover:text-indigo-200">
                      {example}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
