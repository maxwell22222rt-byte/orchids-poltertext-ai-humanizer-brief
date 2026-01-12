# King Model - English-Focused Enhancements

## 🎯 New Features Added

The King model has been enhanced with English-focused prompts and advanced processing features specifically designed for high-quality English humanization.

## 📝 Prompt Styles

The King model now supports **three prompt styles** to match different use cases:

### 1. Default Style (Recommended)
**Best for**: Comprehensive humanization with full linguistic processing

```python
promptStyle: "default"
```

Features:
- Full discourse-level style transfer
- Variable sentence rhythm
- Natural transitions and hedging
- Complete AI phrase removal
- Active voice preference
- Tone and readability customization

**Prompt template**:
```
You are a professional writing assistant. Rewrite the following text so it sounds naturally human-written in English.

Requirements:
- Vary sentence length and rhythm naturally.
- Avoid repetitive AI-style phrases such as "In conclusion", "It is important to note that", "Furthermore", "Additionally", "Moreover", "Consequently", "Therefore".
- Use active voice whenever possible.
- Preserve the exact meaning; do not summarize or add new information.
- Apply the tone: {tone}.
- Apply readability level: {readability}.

Text:
{text_input}
```

### 2. Quick Style
**Best for**: Fast processing of short snippets and quick rewrites

```python
promptStyle: "quick"
```

Features:
- Streamlined processing
- Faster turnaround
- Essential humanization
- Maintains meaning
- Removes robotic phrases

**Prompt template**:
```
Rewrite the following text naturally in English so it reads like a human wrote it. 
Keep meaning intact. Avoid robotic or repetitive phrases. Vary sentence length and style.

Tone: {tone}, Readability: {readability}

Text:
{text_input}
```

### 3. Polish Style
**Best for**: Refining already-written text, improving flow and readability

```python
promptStyle: "polish"
```

Features:
- Text refinement focus
- Flow improvement
- Structure variation
- Formula removal
- No content changes

**Prompt template**:
```
You are a text polishing assistant. Refine the following English text to improve flow, readability, and human-like style without changing the meaning. 

Guidelines:
- Vary sentence and paragraph structure.
- Remove or replace robotic/formulaic phrases.
- Tone: {tone}.
- Readability: {readability}.
- Preserve original content; do not summarize or invent new information.

Text:
{text_input}
```

## 🔧 Enhanced Post-Processing

The King model now includes **enhanced post-processing** specifically for English:

### Features:
1. **Aggressive Contraction Enforcement**
   - "do not" → "don't"
   - "it is" → "it's"
   - "they are" → "they're"
   - More natural conversational tone

2. **Secondary AI Phrase Removal**
   - Catches phrases that slip through initial processing
   - Patterns: "In conclusion", "It is important to note", "Furthermore", etc.

3. **Punctuation Cleanup**
   - Proper spacing around commas, periods
   - Consistent capitalization
   - Professional formatting

4. **Paragraph Opening Variation**
   - Avoids repetitive sentence starters
   - Natural flow between sections

### Implementation:
```python
def enhanced_postprocess_king(text: str) -> str:
    """
    King Model: Enhanced post-processing for English humanization.
    - Enforces contractions more aggressively
    - Checks for repeated AI phrases
    - Varies paragraph openings
    """
    # Apply standard post-processing
    text = rule_based_postprocess(text)
    
    # Additional AI phrase removal
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
    
    # Cleanup and formatting
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'\s+([.,!?;:])', r'\1', text)
    text = re.sub(r'([.,!?;:])\s*([A-Z])', r'\1 \2', text)
    
    return text
```

## 📊 Usage Examples

### Frontend (React/Next.js)

```typescript
const response = await fetch("/api/humanize", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: yourText,
    tone: "professional",
    readability: "natural",
    model: "king",
    promptStyle: "default"  // or "quick" or "polish"
  }),
});
```

### Backend (Python/FastAPI)

```python
from pydantic import BaseModel

class HumanizeRequest(BaseModel):
    text: str
    tone: str = "Professional"
    readability: str = "Human-friendly"
    model: str = "king"
    promptStyle: str = "default"  # default, quick, polish

# POST to /humanize or /paraphrase
```

### Direct API Call

```bash
curl -X POST http://localhost:8000/humanize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Furthermore, AI is important.",
    "model": "king",
    "tone": "professional",
    "readability": "natural",
    "promptStyle": "default"
  }'
```

## 🎨 UI Integration

The frontend automatically shows the **Prompt Style selector** when King model is selected:

```
Model: [King ▼]
Tone: [Professional ▼]
Level: [Natural Human ▼]
Style: [Default ▼]  ← Only appears for King model
```

Style options:
- **Default** - Full humanization
- **Quick** - Fast processing
- **Polish** - Refine & improve

## 🚀 Processing Pipeline

### Default Style Pipeline:
```
1. Rule-Based Preprocessing (Remove AI patterns)
   ↓
2. Text Chunking (if > 800 words)
   ↓
3. GPT-4o Rewrite (Default English prompt)
   ↓
4. Sentence Rhythm Variation
   ↓
5. Natural Transitions (15%)
   ↓
6. Hedging Phrases (30%)
   ↓
7. Emphasis Injection (10%)
   ↓
8. Enhanced Post-Processing
   ↓
9. Semantic Validation (≥80%)
   ↓
10. Final Output
```

### Quick Style Pipeline:
```
1. Rule-Based Preprocessing
   ↓
2. GPT-4o Rewrite (Quick prompt)
   ↓
3. Enhanced Post-Processing
   ↓
4. Final Output
```

### Polish Style Pipeline:
```
1. GPT-4o Polish (Polish prompt)
   ↓
2. Enhanced Post-Processing
   ↓
3. Final Output
```

## 📈 Performance Comparison

| Style | Speed | Quality | Use Case |
|-------|-------|---------|----------|
| Default | Slower | Excellent | Research, long content |
| Quick | Fast | Very Good | Snippets, quick edits |
| Polish | Medium | Excellent | Already-written refinement |

## 🎓 Best Practices

### When to use Default:
- ✅ Academic papers
- ✅ Long-form content (>1000 words)
- ✅ Professional documents
- ✅ Maximum AI detection bypass

### When to use Quick:
- ✅ Short snippets (<500 words)
- ✅ Social media posts
- ✅ Quick rewrites
- ✅ Time-sensitive content

### When to use Polish:
- ✅ Already humanized text
- ✅ Flow improvement
- ✅ Final touches
- ✅ Blog post refinement

## 🔧 Configuration Options

### Temperature Settings:
```python
# King model uses temperature 0.5 for balanced creativity
if model == "king":
    temperature = 0.5  # Balanced creativity for English
```

### Post-Processing Intensity:
```python
# Enhanced post-processing is always applied for King
final = enhanced_postprocess_king(text)
```

### Semantic Validation Thresholds:
```python
# Humanize: ≥0.80 similarity required
# Paraphrase: ≥0.75 similarity required
```

## 📚 API Reference

### Request Parameters

| Parameter | Type | Default | Options | Description |
|-----------|------|---------|---------|-------------|
| `text` | string | required | - | Input text to humanize |
| `model` | string | "ghost-pro" | ghost-mini, ghost-pro, king | Model selection |
| `tone` | string | "professional" | professional, academic, casual, creative | Writing tone |
| `readability` | string | "natural" | high-school, college, natural | Reading level |
| `promptStyle` | string | "default" | default, quick, polish | King-only: prompt style |

### Response Format

```json
{
  "humanizedText": "Your humanized text here...",
  "wordCount": 150
}
```

## 🆕 Changelog

### Version 2.0 - English-Focused Enhancements

**Added:**
- ✅ Three prompt styles (default, quick, polish)
- ✅ Enhanced post-processing for English
- ✅ Aggressive contraction enforcement
- ✅ Secondary AI phrase removal
- ✅ Improved punctuation handling
- ✅ Dynamic UI for prompt style selection
- ✅ Temperature optimization (0.5 for King)

**Improved:**
- ✅ English-specific prompt templates
- ✅ Faster processing for Quick style
- ✅ Better semantic validation
- ✅ More natural conversational tone

## 💡 Tips for Maximum Quality

1. **Use Default for important content** - It provides the most comprehensive humanization
2. **Quick is great for testing** - Try Quick first to see if it meets your needs
3. **Polish for final touches** - Use Polish on already-humanized content for refinement
4. **Combine with tone settings** - Adjust tone (casual/professional) for better results
5. **Check word count** - King supports up to 10,000 words (vs 5,000 for Ghost models)

## 🔗 Related Documentation

- [KING_MODEL.md](KING_MODEL.md) - Main King model documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Implementation details
