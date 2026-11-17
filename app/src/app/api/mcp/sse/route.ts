import { NextRequest, NextResponse } from "next/server";
import { validateMcpKey } from "@/lib/mcp-core";
import { registerSession, unregisterSession } from "@/lib/mcp-sessions";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    searchParams.get("key") ||
    searchParams.get("apiKey");

  const userId = await validateMcpKey(key);

  if (!userId) {
    return new NextResponse(
      JSON.stringify({
        error: "Unauthorized",
        message: "Invalid or missing MCP API key. Provide via ?key=... or 'x-api-key' header.",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const sessionId = crypto.randomUUID();
  const encoder = new TextEncoder();

  let keepAliveInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (event: string, data: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
      };

      registerSession(sessionId, userId, sendEvent);

      // 1. Send the endpoint URL to the MCP client (standard MCP SSE handshake)
      const messageEndpoint = `/api/mcp/message?sessionId=${sessionId}&key=${encodeURIComponent(key || "")}`;
      sendEvent("endpoint", messageEndpoint);

      // 2. Periodic keep-alive ping to prevent timeouts
      keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          if (keepAliveInterval) clearInterval(keepAliveInterval);
        }
      }, 25000);
    },
    cancel() {
      if (keepAliveInterval) clearInterval(keepAliveInterval);
      unregisterSession(sessionId);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, no-store",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    },
  });
}

