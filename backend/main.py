import re
import random
import os
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from openai import OpenAI
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer, util
import torch

load_dotenv()

app = FastAPI(title="PolterText Humanizer API")

# Initialize client lazily or handle missing key
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None

# Initialize semantic similarity model for King
semantic_model = None
try:
    semantic_model = SentenceTransformer("all-MiniLM-L6-v2")
    print("✓ Semantic model loaded successfully")
except Exception as e:
    print(f"Warning: Could not load semantic model: {e}")

class HumanizeRequest(BaseModel):
    text: str = Field(..., max_length=100000) # Support large text
    tone: str = "Professional"
    readability: str = "Human-friendly"
    model: str = "ghost-pro"  # ghost-pro, ghost-mini, king
    promptStyle: str = "default"  # default, quick, polish

class HumanizeResponse(BaseModel):
    humanizedText: str
    wordCount: int

# --- King Model Phrase Libraries (Research-Based) ---

HEDGING_PHRASES = [
    "to some extent",
    "in practice",
    "arguably",
    "from a practical standpoint",
    "in many cases",
    "this tends to suggest",
    "generally speaking",
    "in most situations",
    "under normal circumstances"
]

CLARIFICATION_PHRASES = [
    "in other words",
    "put differently",
    "this is especially relevant when",
    "which becomes clear when",
    "to clarify",
    "more specifically",
    "that is to say"
]

NATURAL_TRANSITIONS = [
    "That said",
    "At the same time",
    "Still",
    "What's interesting here is",
    "In practice",
    "What's less obvious is",
    "Worth noting",
    "Interestingly enough"
]

EMPHASIS_PHRASES = [
    "It's worth noting that",
    "One overlooked aspect is",
    "This point matters more than it first appears",
    "What stands out here is",
    "A key consideration is",
    "What often gets missed is"
]

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

def chunk_text_king(text: str, max_words: int = 800, overlap: int = 100) -> List[str]:
    """
    King Model: Advanced chunking with paragraph awareness.
    Maintains context across chunks with overlap.
    """
    # Split by paragraphs first
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = []
    current_word_count = 0
    
    for para in paragraphs:
        para_words = para.split()
        para_word_count = len(para_words)
        
        # If adding this paragraph exceeds max, save current chunk
        if current_word_count + para_word_count > max_words and current_chunk:
            chunk_text = ' '.join(current_chunk)
            chunks.append(chunk_text)
            
            # Create overlap by keeping last few sentences
            overlap_words = ' '.join(current_chunk).split()[-overlap:]
            current_chunk = overlap_words
            current_word_count = len(overlap_words)
        
        current_chunk.extend(para_words)
        current_word_count += para_word_count
    
    # Add remaining chunk
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks if chunks else [text]

def inject_hedging_king(sentence: str) -> str:
    """King Model: Conditionally inject hedging phrases for human caution."""
    # Only inject 30% of the time to maintain naturalness
    if random.random() < 0.3 and len(sentence.split()) > 10:
        hedge = random.choice(HEDGING_PHRASES)
        # Insert at natural points
        if ',' in sentence:
            parts = sentence.split(',', 1)
            return f"{parts[0]}, {hedge},{parts[1]}"
        else:
            return f"{sentence.rstrip('.')}—{hedge}."
    return sentence

def inject_transitions_king(sentences: List[str]) -> List[str]:
    """King Model: Add natural transitions between ideas."""
    result = []
    for i, sentence in enumerate(sentences):
        # Add transitions between sections (not too frequently)
        if i > 0 and random.random() < 0.15 and len(sentence.split()) > 8:
            transition = random.choice(NATURAL_TRANSITIONS)
            sentence = f"{transition}, {sentence[0].lower()}{sentence[1:]}"
        result.append(sentence)
    return result

def vary_sentence_rhythm_king(sentences: List[str]) -> List[str]:
    """
    King Model: Vary sentence length for natural rhythm.
    Humans mix short, medium, and long sentences.
    """
    result = []
    buffer = ""
    
    for i, s in enumerate(sentences):
        word_count = len(s.split())
        
        # Combine very short sentences sometimes
        if word_count < 10 and buffer and random.random() < 0.6:
            buffer += " " + s
            # Flush buffer after combining 2-3 short sentences
            if random.random() < 0.5:
                result.append(buffer)
                buffer = ""
        # Break very long sentences
        elif word_count > 35 and ',' in s:
            parts = s.split(',', 2)
            result.append(parts[0] + '.')
            if len(parts) > 1:
                buffer = ','.join(parts[1:]).strip()
        else:
            if buffer:
                result.append(buffer)
                buffer = ""
            result.append(s)
    
    if buffer:
        result.append(buffer)
    
    return result

def semantic_similarity_king(original: str, rewritten: str) -> float:
    """
    King Model: Validate semantic preservation.
    Returns cosine similarity score (0-1).
    """
    if not semantic_model:
        return 1.0  # Skip validation if model not loaded
    
    try:
        emb1 = semantic_model.encode(original, convert_to_tensor=True)
        emb2 = semantic_model.encode(rewritten, convert_to_tensor=True)
        similarity = util.cos_sim(emb1, emb2).item()
        return similarity
    except Exception as e:
        print(f"Similarity check failed: {e}")
        return 1.0

def inject_emphasis_king(sentences: List[str]) -> List[str]:
    """King Model: Add emphasis variability (sparingly)."""
    result = []
    for i, sentence in enumerate(sentences):
        # Very selective - only 10% chance
        if i > 0 and random.random() < 0.1 and len(sentence.split()) > 12:
            emphasis = random.choice(EMPHASIS_PHRASES)
            sentence = f"{emphasis} {sentence[0].lower()}{sentence[1:]}"
        result.append(sentence)
    return result

def get_king_prompt(text: str, tone: str, readability: str, mode: str, prompt_style: str = "default") -> str:
    """
    Generate King model prompts based on style.
    Styles: default, quick, polish
    """
    
    if prompt_style == "quick":
        # Quick Humanizer (Short Snippets)
        if mode == "paraphrase":
            return f"""
Rewrite the following text naturally in English so it reads like a human wrote it while completely restructuring sentences.

IMPORTANT: The output must be 5-10% LONGER than the input. Add natural elaborations, examples, or clarifications where appropriate.

Keep meaning intact. Avoid robotic or repetitive phrases. Vary sentence length and style aggressively.

Tone: {tone}, Readability: {readability}

Text:
{text}
"""
        else:
            return f"""
Rewrite the following text naturally in English so it reads like a human wrote it.

IMPORTANT: The output must be 5-10% LONGER than the input. Add natural elaborations, transitions, or clarifications where appropriate.

Keep meaning intact. Avoid robotic or repetitive phrases. Vary sentence length and style.

Tone: {tone}, Readability: {readability}

Text:
{text}
"""
    
    elif prompt_style == "polish":
        # Post-Processing Polish Prompt
        return f"""
You are a text polishing assistant. Refine the following English text to improve flow, readability, and human-like style without changing the meaning.

IMPORTANT: The output must be 5-10% LONGER than the input. Add natural transitions, elaborations, or clarifying phrases where appropriate.

Guidelines:
- Vary sentence and paragraph structure.
- Remove or replace robotic/formulaic phrases.
- Tone: {tone}.
- Readability: {readability}.
- Preserve original content; do not summarize or invent new information.

Text:
{text}
"""
    
    else:  # default
        # Default English Humanizer Prompt (Enhanced)
        if mode == "paraphrase":
            return f"""
You are a professional writing assistant. Rewrite the following text aggressively to paraphrase it while sounding naturally human-written in English.

IMPORTANT: The output must be 5-10% LONGER than the input. Add natural elaborations, examples, or transitions where appropriate to enhance readability.

Requirements:
- Completely restructure sentences and use synonyms.
- Vary sentence length and rhythm naturally.
- Avoid repetitive AI-style phrases such as "In conclusion", "It is important to note that", "Furthermore", "Additionally", "Moreover".
- Use active voice whenever possible.
- Preserve the exact meaning; expand naturally rather than summarize.
- Apply discourse-level style transfer with natural imperfections.
- Apply the tone: {tone}.
- Apply readability level: {readability}.

Text:
{text}
"""
        else:
            return f"""
You are a professional writing assistant. Rewrite the following text so it sounds naturally human-written in English.

IMPORTANT: The output must be 5-10% LONGER than the input. Add natural elaborations, transitions, or clarifying phrases where appropriate to enhance readability.

Requirements:
- Vary sentence length and rhythm naturally.
- Avoid repetitive AI-style phrases such as "In conclusion", "It is important to note that", "Furthermore", "Additionally", "Moreover", "Consequently", "Therefore".
- Use active voice whenever possible.
- Preserve the exact meaning; expand naturally rather than summarize.
- Apply the tone: {tone}.
- Apply readability level: {readability}.

Text:
{text}
"""

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

def enhanced_postprocess_king(text: str) -> str:
    """
    King Model: Enhanced post-processing for English humanization.
    - Enforces contractions more aggressively
    - Checks for repeated AI phrases
    - Varies paragraph openings
    """
    # Apply standard post-processing
    text = rule_based_postprocess(text)
    
    # Additional AI phrase removal (in case they slipped through)
    ai_phrase_patterns = [
        r"\bIn conclusion,?\b",
        r"\bIt is important to note that\b",
        r"\bFurthermore,?\b",
        r"\bAdditionally,?\b",
        r"\bMoreover,?\b",
        r"\bConsequently,?\b",
        r"\bIn today's fast-paced world\b",
        r"\bIt goes without saying\b",
    ]
    
    for pattern in ai_phrase_patterns:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)
    
    # Cleanup double spaces from removals
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Fix spacing around punctuation
    text = re.sub(r'\s+([.,!?;:])', r'\1', text)
    text = re.sub(r'([.,!?;:])\s*([A-Z])', r'\1 \2', text)
    
    return text

async def call_ai_humanizer(text: str, tone: str, readability: str, mode: str = "humanize", model: str = "ghost-pro", prompt_style: str = "default") -> str:
    """
    Enhanced AI humanizer with model selection and prompt styles.
    Models: ghost-pro (GPT-4o), ghost-mini (GPT-4o-mini), king (GPT-4o + advanced processing)
    Prompt Styles: default, quick, polish
    """
    
    # King model uses enhanced English-focused prompts
    if model == "king":
        prompt = get_king_prompt(text, tone, readability, mode, prompt_style)
    elif mode == "paraphrase":
        prompt = f"""
        You are a professional writing assistant. Rewrite the following text aggressively to paraphrase it while sounding naturally human-written.

        IMPORTANT: The output must be 5-10% LONGER than the input. Add natural elaborations or transitions where appropriate.

        Requirements:
        - Completely restructure sentences and use synonyms.
        - Vary sentence length and rhythm.
        - Avoid repetitive AI-style phrases.
        - Preserve the exact meaning; expand naturally rather than summarize.
        - Apply the tone: {tone}.
        - Apply readability level: {readability}.

        Text:
        {text}
        """
    else:
        # Default Humanizer Prompt
        prompt = f"""
        You are a professional writing assistant. Rewrite the following text so it sounds naturally human-written.

        IMPORTANT: The output must be 5-10% LONGER than the input. Add natural elaborations, transitions, or clarifying phrases where appropriate.

        Requirements:
        - Vary sentence length and rhythm.
        - Avoid repetitive AI-style phrases such as "In conclusion", "It is important to note that", "Furthermore", "Additionally".
        - Use active voice whenever possible.
        - Preserve the exact meaning; expand naturally rather than summarize.
        - Apply the tone: {tone}.
        - Apply readability level: {readability}.

        Text:
        {text}
        """

    try:
        if not client:
            print("AI Error: OPENAI_API_KEY not found. Falling back to rule-based.")
            return text

        # Select model based on tier
        if model == "king":
            gpt_model = "gpt-4o"  # Use best available model for King
            temperature = 0.5  # Balanced creativity for King (as per user's example)
        elif model == "ghost-mini":
            gpt_model = "gpt-4o-mini"
            temperature = 0.7
        else:  # ghost-pro
            gpt_model = "gpt-4o"
            temperature = 0.7

        response = client.chat.completions.create(
            model=gpt_model,
            messages=[{"role": "system", "content": "You are an expert English writing assistant specializing in natural, human-like writing."},
                       {"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=4000 if model == "king" else 2000
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"AI Error: {e}")
        return text # Fallback to original if AI fails

@app.post("/humanize", response_model=HumanizeResponse)
async def humanize(request: HumanizeRequest):
    words = request.text.split()
    word_count = len(words)
    
    # King model supports up to 10,000 words
    max_words = 10000 if request.model == "king" else 5000
    
    if word_count > max_words:
        raise HTTPException(status_code=400, detail=f"Text exceeds {max_words} words limit for {request.model}")
    
    # King Model: Advanced processing pipeline
    if request.model == "king":
        # 1. Chunk text for large inputs
        if word_count > 800:
            chunks = chunk_text_king(request.text, max_words=800, overlap=100)
            processed_chunks = []
            
            for chunk in chunks:
                # 2. Preprocess
                cleaned = rule_based_preprocess(chunk)
                
                # 3. AI Humanization with King prompt
                ai_output = await call_ai_humanizer(cleaned, request.tone, request.readability, mode="humanize", model="king", prompt_style=request.promptStyle)
                
                # 4. Post-process with King enhancements
                sentences = re.split(r'(?<=[.!?])\s+', ai_output)
                
                # Apply King model enhancements
                sentences = vary_sentence_rhythm_king(sentences)
                sentences = inject_transitions_king(sentences)
                sentences = [inject_hedging_king(s) for s in sentences]
                sentences = inject_emphasis_king(sentences)
                
                enhanced = ' '.join(sentences)
                final = enhanced_postprocess_king(enhanced)
                
                # 5. Semantic validation
                similarity = semantic_similarity_king(chunk, final)
                if similarity < 0.80:
                    print(f"Warning: Low semantic similarity ({similarity:.2f}), using fallback")
                    final = enhanced_postprocess_king(ai_output)  # Fallback without enhancements
                
                processed_chunks.append(final)
            
            final_text = ' '.join(processed_chunks)
        else:
            # Single chunk processing
            cleaned = rule_based_preprocess(request.text)
            ai_output = await call_ai_humanizer(cleaned, request.tone, request.readability, mode="humanize", model="king", prompt_style=request.promptStyle)
            
            sentences = re.split(r'(?<=[.!?])\s+', ai_output)
            sentences = vary_sentence_rhythm_king(sentences)
            sentences = inject_transitions_king(sentences)
            sentences = [inject_hedging_king(s) for s in sentences]
            sentences = inject_emphasis_king(sentences)
            
            enhanced = ' '.join(sentences)
            final_text = enhanced_postprocess_king(enhanced)
            
            # Validate
            similarity = semantic_similarity_king(request.text, final_text)
            if similarity < 0.80:
                final_text = enhanced_postprocess_king(ai_output)
    else:
        # Ghost Pro / Ghost Mini: Standard processing
        cleaned_text = rule_based_preprocess(request.text)
        ai_output = await call_ai_humanizer(cleaned_text, request.tone, request.readability, mode="humanize", model=request.model)
        final_text = rule_based_postprocess(ai_output)
    
    return HumanizeResponse(humanizedText=final_text, wordCount=word_count)

@app.post("/paraphrase", response_model=HumanizeResponse)
async def paraphrase(request: HumanizeRequest):
    words = request.text.split()
    word_count = len(words)
    
    # King model supports up to 10,000 words
    max_words = 10000 if request.model == "king" else 5000
    
    if word_count > max_words:
        raise HTTPException(status_code=400, detail=f"Text exceeds {max_words} words limit for {request.model}")
    
    # King Model: Advanced paraphrase pipeline
    if request.model == "king":
        if word_count > 800:
            chunks = chunk_text_king(request.text, max_words=800, overlap=100)
            processed_chunks = []
            
            for chunk in chunks:
                cleaned = rule_based_preprocess(chunk)
                ai_output = await call_ai_humanizer(cleaned, request.tone, request.readability, mode="paraphrase", model="king", prompt_style=request.promptStyle)
                
                # Apply King enhancements for paraphrase
                sentences = re.split(r'(?<=[.!?])\s+', ai_output)
                sentences = vary_sentence_rhythm_king(sentences)
                sentences = inject_transitions_king(sentences)
                
                enhanced = ' '.join(sentences)
                final = enhanced_postprocess_king(enhanced)
                
                # Validate semantic preservation
                similarity = semantic_similarity_king(chunk, final)
                if similarity < 0.75:  # Slightly lower threshold for paraphrase
                    print(f"Warning: Low semantic similarity ({similarity:.2f}), using fallback")
                    final = enhanced_postprocess_king(ai_output)
                
                processed_chunks.append(final)
            
            final_text = ' '.join(processed_chunks)
        else:
            cleaned = rule_based_preprocess(request.text)
            ai_output = await call_ai_humanizer(cleaned, request.tone, request.readability, mode="paraphrase", model="king", prompt_style=request.promptStyle)
            
            sentences = re.split(r'(?<=[.!?])\s+', ai_output)
            sentences = vary_sentence_rhythm_king(sentences)
            sentences = inject_transitions_king(sentences)
            
            final_text = enhanced_postprocess_king(' '.join(sentences))
    else:
        # Ghost Pro / Ghost Mini
        cleaned_text = rule_based_preprocess(request.text)
        ai_output = await call_ai_humanizer(cleaned_text, request.tone, request.readability, mode="paraphrase", model=request.model)
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
