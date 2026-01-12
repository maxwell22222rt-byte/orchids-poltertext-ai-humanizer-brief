import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import OpenAI from "openai";

// AI Patterns to remove
const AI_PATTERNS = [
  /\bIn conclusion\b/gi,
  /\bIt is important to note\b/gi,
  /\bFurthermore\b/gi,
  /\bAdditionally\b/gi,
  /\bMoreover\b/gi,
  /\bConsequently\b/gi,
  /\bTherefore\b/gi,
  /\bIn today's fast-paced world\b/gi,
  /\bIt goes without saying\b/gi,
  /\bAs previously mentioned\b/gi,
  /\bIn summary\b/gi,
  /\bTo put it simply\b/gi,
];

const CONTRACTIONS: Record<string, string> = {
  "do not": "don't",
  "does not": "doesn't",
  "did not": "didn't",
  "cannot": "can't",
  "will not": "won't",
  "would not": "wouldn't",
  "should not": "shouldn't",
  "could not": "couldn't",
  "is not": "isn't",
  "are not": "aren't",
  "was not": "wasn't",
  "were not": "weren't",
  "have not": "haven't",
  "has not": "hasn't",
  "it is": "it's",
  "that is": "that's",
  "there is": "there's",
  "I am": "I'm",
  "you are": "you're",
  "we are": "we're",
  "they are": "they're",
};

function ruleBasedPreprocess(text: string): string {
  // Remove obvious AI patterns
  let processed = text;
  for (const pattern of AI_PATTERNS) {
    processed = processed.replace(pattern, "");
  }

  // Basic sentence restructuring for long sentences
  const sentences = processed.split(/(?<=[.!?])\s+/);
  const processedSentences: string[] = [];

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/);
    if (words.length > 25) {
      // Inject a comma or break if it's too long
      const mid = Math.floor(words.length / 2);
      processedSentences.push(words.slice(0, mid).join(" ") + ",");
      processedSentences.push(words.slice(mid).join(" "));
    } else {
      processedSentences.push(sentence);
    }
  }

  return processedSentences.join(" ");
}

function ruleBasedPostprocess(text: string): string {
  // Enforce contractions for natural feel
  let processed = text;
  for (const [full, short] of Object.entries(CONTRACTIONS)) {
    if (Math.random() > 0.2) {
      const regex = new RegExp(`\\b${full}\\b`, "gi");
      processed = processed.replace(regex, short);
    }
  }

  // Cleanup extra spaces
  processed = processed.replace(/\s+/g, " ").trim();
  return processed;
}

async function callAIHumanizer(
  text: string,
  tone: string,
  readability: string,
  mode: "humanize" | "paraphrase" = "humanize"
): Promise<string> {
  const prompt =
    mode === "paraphrase"
      ? `You are a professional writing assistant. Rewrite the following text aggressively to paraphrase it while sounding naturally human-written.

Requirements:
- Completely restructure sentences and use synonyms.
- Vary sentence length and rhythm.
- Avoid repetitive AI-style phrases.
- Preserve the exact meaning; do not summarize.
- Apply the tone: ${tone}.
- Apply readability level: ${readability}.

Text:
${text}`
      : `You are a professional writing assistant. Rewrite the following text so it sounds naturally human-written.

Requirements:
- Vary sentence length and rhythm.
- Avoid repetitive AI-style phrases such as "In conclusion", "It is important to note that", "Furthermore", "Additionally".
- Use active voice whenever possible.
- Preserve the exact meaning; do not summarize or add new information.
- Apply the tone: ${tone}.
- Apply readability level: ${readability}.

Text:
${text}`;

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("OPENAI_API_KEY not found. Falling back to rule-based processing.");
      return text;
    }

    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that writes like a human.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || text;
  } catch (error) {
    console.error("AI Error:", error);
    return text; // Fallback to original if AI fails
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, tone = "professional", readability = "natural", userId = null } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount > 5000) {
      return NextResponse.json(
        { error: "Text exceeds 5000 words limit" },
        { status: 400 }
      );
    }

    // 1. Preprocess
    const cleanedText = ruleBasedPreprocess(text);

    // 2. AI Humanization
    const aiOutput = await callAIHumanizer(cleanedText, tone, readability, "humanize");

    // 3. Postprocess
    const humanizedText = ruleBasedPostprocess(aiOutput);

    const apiKeyMissing = !process.env.OPENAI_API_KEY;

    // Log to database if connected
    if (supabaseAdmin) {
      const { error: logError } = await supabaseAdmin.from("humanizations").insert({
        user_id: userId,
        original_text: text,
        humanized_text: humanizedText,
        tone,
        readability,
        word_count: wordCount,
      });

      if (logError) console.error("Database log error:", logError);
    }

    return NextResponse.json({
      humanizedText,
      wordCount,
      warning: apiKeyMissing
        ? "OpenAI API Key is missing. Using rule-based humanization fallback."
        : null,
    });
  } catch (error: any) {
    console.error("Humanization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to humanize text" },
      { status: 500 }
    );
  }
}
