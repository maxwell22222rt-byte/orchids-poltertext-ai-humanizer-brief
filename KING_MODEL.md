# King Model - Advanced AI Humanizer

## Overview

The **King Model** is a research-based AI humanization system that performs discourse-level style transfer to transform AI-generated text into naturally human-written content.

## Key Features

### 1. Advanced Linguistic Processing
- **Variable Sentence Rhythm**: Mixes short, medium, and long sentences naturally
- **Natural Discourse Flow**: Maintains coherent transitions with realistic imperfection
- **Lexical Diversity**: Avoids perfect synonym balance for authentic variation
- **Stylistic Personality**: Adds human-like writing traits

### 2. Research-Based Phrase Libraries

#### Hedging Phrases (Human Caution)
- "to some extent"
- "in practice"
- "arguably"
- "from a practical standpoint"
- "in many cases"

#### Natural Transitions
- "That said"
- "At the same time"
- "Still"
- "What's interesting here is"
- "What's less obvious is"

#### Clarification Phrases
- "in other words"
- "put differently"
- "this is especially relevant when"
- "which becomes clear when"

#### Emphasis Phrases
- "It's worth noting that"
- "One overlooked aspect is"
- "This point matters more than it first appears"

### 3. Technical Capabilities

- **Supports up to 10,000 words** (vs 5,000 for Ghost Pro/Mini)
- **Intelligent Chunking**: Paragraph-aware text splitting with overlapping context
- **Semantic Validation**: Ensures meaning preservation with 80%+ similarity threshold
- **Advanced Prompt Engineering**: GPT-4o with discourse-level instructions

## Architecture

```
Input Text (up to 10,000 words)
   ↓
Chunking Engine (800 words/chunk, 100-word overlap)
   ↓
Rule-Based Preprocessing
   ↓
LLM Rewrite (GPT-4o with King prompts)
   ↓
Phrase & Style Injection
   ├── Sentence Rhythm Variation
   ├── Natural Transitions
   ├── Hedging Phrases
   └── Emphasis Variability
   ↓
Rule-Based Post-Processing
   ↓
Semantic Validation (≥0.80 similarity)
   ↓
Chunk Reassembly
   ↓
Final Output
```

## Model Comparison

| Feature | Ghost Mini | Ghost Pro | King |
|---------|-----------|-----------|------|
| Max Words | 5,000 | 5,000 | 10,000 |
| LLM Model | GPT-4o-mini | GPT-4o | GPT-4o |
| Chunking | No | No | Yes (Advanced) |
| Phrase Injection | No | No | Yes |
| Semantic Validation | No | No | Yes |
| Discourse Analysis | No | No | Yes |
| Processing Speed | Fast | Medium | Slower |
| Quality | Good | Very Good | Excellent |

## Usage

### Frontend (React/Next.js)

```typescript
const response = await fetch("/api/humanize", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: yourText,
    tone: "professional",
    readability: "natural",
    model: "king"  // Select King model
  }),
});

const data = await response.json();
console.log(data.humanizedText);
```

### Backend (Python/FastAPI)

```python
from pydantic import BaseModel

class HumanizeRequest(BaseModel):
    text: str
    tone: str = "Professional"
    readability: str = "Human-friendly"
    model: str = "king"

# POST to /humanize or /paraphrase
```

## Installation

### Backend Requirements

```bash
cd backend
pip install -r requirements.txt
```

Required packages:
- `sentence-transformers` - For semantic validation
- `torch` - Required by sentence-transformers
- `openai` - GPT-4o integration
- `fastapi` - API framework

### Running the Backend

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

Set environment variable:
```bash
export BACKEND_URL=http://localhost:8000
```

## Evaluation Metrics

### Quantitative
- **Sentence Length Variance**: Measures rhythm diversity
- **Lexical Diversity (TTR)**: Type-token ratio for vocabulary variation
- **Readability**: Flesch-Kincaid scoring
- **Semantic Similarity**: Cosine similarity ≥0.80 for meaning preservation

### Qualitative
- Human preference tests
- Blind readability scoring
- AI detection bypass rates

## Configuration

### Chunking Parameters
```python
chunk_text_king(text, max_words=800, overlap=100)
```

### Phrase Injection Probabilities
- Hedging: 30% of sentences
- Transitions: 15% between sections
- Emphasis: 10% of sentences

### Semantic Threshold
- Humanize mode: ≥0.80 similarity
- Paraphrase mode: ≥0.75 similarity

## Research Foundation

The King model is based on computational linguistics research:

1. **Discourse-Level Style Transfer**: Not just word replacement, but structural transformation
2. **Human Writing Mechanics**: Empirical analysis of human vs AI writing patterns
3. **Conditional Phrase Injection**: Strategic, not random placement
4. **Semantic Preservation**: Validates meaning retention

## Deployment

### Development
```bash
# Start backend
cd backend
uvicorn main:app --reload

# Start frontend
npm run dev
```

### Production (Docker)
```dockerfile
FROM python:3.11
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Limitations

- Requires backend server (cannot run in serverless frontend)
- Slower processing due to advanced features
- Higher OpenAI API costs (GPT-4o + more tokens)
- Requires `sentence-transformers` model download (~90MB)

## Future Enhancements

1. Support for GPT-4.1 when available
2. Custom fine-tuned models
3. Language-specific phrase libraries
4. Advanced metrics dashboard
5. A/B testing framework

## License

Part of PolterText AI Humanizer system.
