import { NextRequest, NextResponse } from "next/server";
import { validateMcpKey, handleMcpRpcMessage } from "@/lib/mcp-core";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    searchParams.get("key") ||
    searchParams.get("apiKey");

  const userId = await validateMcpKey(key);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized: Invalid or missing API key" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const rpcResponse = await handleMcpRpcMessage(body, userId);

    return new NextResponse(rpcResponse ? JSON.stringify(rpcResponse) : null, {
      status: rpcResponse ? 200 : 202,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
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

