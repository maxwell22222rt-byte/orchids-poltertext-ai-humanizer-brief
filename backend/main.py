import re
import random
import os
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="PolterText Humanizer API")

# Initialize client lazily or handle missing key
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None

class HumanizeRequest(BaseModel):
    text: str = Field(..., max_length=100000) # Support large text
    tone: str = "Professional"
    readability: str = "Human-friendly"

class HumanizeResponse(BaseModel):
    humanizedText: str
    wordCount: int

# --- Rule-Based Rules ---

AI_PATTERNS = [
    r"\bIn conclusion\b", r"\bIt is important to note\b", r"\bFurthermore\b",
    r"\bAdditionally\b", r"\bMoreover\b", r"\bConsequently\b", r"\bTherefore\b",
    r"\bIn today's fast-paced world\b", r"\bIt goes without saying\b",
    r"\bAs previously mentioned\b", r"\bIn summary\b", r"\bTo put it simply\b"
]

CONTRACTIONS = {
    "do not": "don't", "does not": "doesn't", "did not": "didn't",
    "cannot": "can't", "will not": "won't", "would not": "wouldn't",
    "should not": "shouldn't", "could not": "couldn't", "is not": "isn't",
    "are not": "aren't", "was not": "wasn't", "were not": "weren't",
    "have not": "haven't", "has not": "hasn't", "it is": "it's",
    "that is": "that's", "there is": "there's", "I am": "I'm",
    "you are": "you're", "we are": "we're", "they are": "they're"
}

# --- Core Logic ---

def rule_based_preprocess(text: str) -> str:
    # Remove obvious AI patterns
    for pattern in AI_PATTERNS:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)
    
    # Basic sentence restructuring for long sentences
    sentences = re.split(r'(?<=[.!?]) +', text)
    processed_sentences = []
    for s in sentences:
        words = s.split()
        if len(words) > 25:
            # Inject a comma or break if it's too long
            mid = len(words) // 2
            processed_sentences.append(" ".join(words[:mid]) + ",")
            processed_sentences.append(" ".join(words[mid:]))
        else:
            processed_sentences.append(s)
    return " ".join(processed_sentences)

def rule_based_postprocess(text: str) -> str:
    # Enforce contractions for natural feel
    for full, short in CONTRACTIONS.items():
        if random.random() > 0.2:
            text = re.sub(rf"\b{full}\b", short, text, flags=re.IGNORECASE)
    
    # Cleanup extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

async def call_ai_humanizer(text: str, tone: str, readability: str, mode: str = "humanize") -> str:
    if mode == "paraphrase":
        prompt = f"""
        You are a professional writing assistant. Rewrite the following text aggressively to paraphrase it while sounding naturally human-written.

        Requirements:
        - Completely restructure sentences and use synonyms.
        - Vary sentence length and rhythm.
        - Avoid repetitive AI-style phrases.
        - Preserve the exact meaning; do not summarize.
        - Apply the tone: {tone}.
        - Apply readability level: {readability}.

        Text:
        {text}
        """
    else:
        # Default Humanizer Prompt provided by user
        prompt = f"""
        You are a professional writing assistant. Rewrite the following text so it sounds naturally human-written.

        Requirements:
        - Vary sentence length and rhythm.
        - Avoid repetitive AI-style phrases such as "In conclusion", "It is important to note that", "Furthermore", "Additionally".
        - Use active voice whenever possible.
        - Preserve the exact meaning; do not summarize or add new information.
        - Apply the tone: {tone}.
        - Apply readability level: {readability}.

        Text:
        {text}
        """

    try:
        if not client:
            print("AI Error: OPENAI_API_KEY not found. Falling back to rule-based.")
            return text

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "system", "content": "You are a helpful assistant that writes like a human."},
                     {"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2000
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"AI Error: {e}")
        return text # Fallback to original if AI fails

@app.post("/humanize", response_model=HumanizeResponse)
async def humanize(request: HumanizeRequest):
    words = request.text.split()
    word_count = len(words)
    if word_count > 5000:
        raise HTTPException(status_code=400, detail="Text exceeds 5000 words limit")
    
    # 1. Preprocess
    cleaned_text = rule_based_preprocess(request.text)
    
    # 2. AI Humanization
    ai_output = await call_ai_humanizer(cleaned_text, request.tone, request.readability)
    
    # 3. Postprocess
    final_text = rule_based_postprocess(ai_output)
    
    return HumanizeResponse(humanizedText=final_text, wordCount=word_count)

@app.post("/paraphrase", response_model=HumanizeResponse)
async def paraphrase(request: HumanizeRequest):
    words = request.text.split()
    word_count = len(words)
    if word_count > 5000:
        raise HTTPException(status_code=400, detail="Text exceeds 5000 words limit")
    
    # Aggressive preprocessing for paraphrase
    cleaned_text = rule_based_preprocess(request.text)
    
    # AI Paraphrase
    ai_output = await call_ai_humanizer(cleaned_text, request.tone, request.readability, mode="paraphrase")
    
    # Postprocess
    final_text = rule_based_postprocess(ai_output)
    
    return HumanizeResponse(humanizedText=final_text, wordCount=word_count)

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "openai_api_key_set": api_key is not None,
        "supabase_connected": os.getenv("DATABASE_URL") is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
