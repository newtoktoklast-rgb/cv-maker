import { NextRequest, NextResponse } from "next/server";
import { validateMcpKey, handleMcpRpcMessage } from "@/lib/mcp-core";
import { sendToSession, mcpSessions } from "@/lib/mcp-sessions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const key =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    searchParams.get("key") ||
    searchParams.get("apiKey");

  // Determine user ID either from existing session or key validation
  let userId: string | null = null;
  if (sessionId && mcpSessions.has(sessionId)) {
    userId = mcpSessions.get(sessionId)!.userId;
  } else {
    userId = await validateMcpKey(key);
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const rpcResponse = await handleMcpRpcMessage(body, userId);

    if (rpcResponse) {
      const responseString = JSON.stringify(rpcResponse);

      // 1. If SSE session is open, stream it over SSE
      if (sessionId) {
        sendToSession(sessionId, "message", responseString);
      }

      // 2. Also return standard HTTP response for HTTP-based clients
      return new NextResponse(responseString, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // For notifications (like notifications/initialized) that don't need a body
    return new NextResponse(null, {
      status: 202,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: `Parse error: ${err.message}` },
      },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    },
  });
}

