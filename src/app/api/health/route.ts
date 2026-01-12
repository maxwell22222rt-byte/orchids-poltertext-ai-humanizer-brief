import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    openai_api_key_set: !!process.env.OPENAI_API_KEY,
    supabase_connected: !!process.env.DATABASE_URL,
    environment: process.env.NODE_ENV || "development",
  });
}
