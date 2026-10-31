import type { Config, Context } from "@netlify/functions";
import type { AddressInfo } from "net";

// Runs the existing Express API (server.ts) inside a modern Netlify Function so
// AI Gateway credentials are injected and SSE chat responses keep streaming.
(globalThis as any).__FGOM_SERVERLESS__ = true;

let baseUrlPromise: Promise<string> | null = null;

function getBaseUrl() {
  if (!baseUrlPromise) {
    baseUrlPromise = import("../../server.ts").then(
      ({ default: app }) =>
        new Promise<string>((resolve, reject) => {
          app.set("trust proxy", true);
          const server = app.listen(0, "127.0.0.1", () => {
            const { port } = server.address() as AddressInfo;
            resolve(`http://127.0.0.1:${port}`);
          });
          server.on("error", reject);
        })
    );
    baseUrlPromise.catch(() => {
      baseUrlPromise = null;
    });
  }
  return baseUrlPromise;
}

export default async (req: Request, context: Context) => {
  const baseUrl = await getBaseUrl();
  const url = new URL(req.url);

  const headers = new Headers(req.headers);
  headers.set("x-forwarded-for", context.ip);
  headers.set("x-forwarded-host", url.host);
  headers.set("x-forwarded-proto", url.protocol.replace(":", ""));

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const upstream = await fetch(`${baseUrl}${url.pathname}${url.search}`, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
};

export const config: Config = {
  path: "/api/*",
};
