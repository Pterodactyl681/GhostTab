import { NextResponse } from "next/server";

import { getGhostTabService } from "@/lib/services/ghost-tab";

export async function GET() {
  try {
    const nowMs = Date.now();
    const service = getGhostTabService();
    const collection = service.listSessions(nowMs);

    return NextResponse.json({
      ok: true,
      result: {
        activeSessions: collection.activeSessions,
        historySessions: collection.historySessions,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to load sessions.",
      },
      { status: 500 },
    );
  }
}

