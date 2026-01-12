import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, tone = "professional", readability = "natural", userId = null } = body;
    
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }
    
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount > 5000) {
      return NextResponse.json({ error: "Text exceeds 5000 words limit" }, { status: 400 });
    }

    // Call FastAPI backend
    const fastApiRes = await fetch("http://localhost:8000/paraphrase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, tone, readability }),
    });

    if (!fastApiRes.ok) {
      const errorData = await fastApiRes.json();
      throw new Error(errorData.detail || "FastAPI error");
    }

    const { humanizedText } = await fastApiRes.json();
    
    // Log to database if connected
    if (supabaseAdmin) {
      const { error: logError } = await supabaseAdmin
        .from("humanizations")
        .insert({
          user_id: userId,
          original_text: text,
          humanized_text: humanizedText,
          tone,
          readability,
          word_count: wordCount
        });
        
      if (logError) console.error("Database log error:", logError);
    }
    
    return NextResponse.json({ humanizedText, wordCount });
  } catch (error: any) {
    console.error("Paraphrase error:", error);
    return NextResponse.json({ error: error.message || "Failed to paraphrase text" }, { status: 500 });
  }
}
