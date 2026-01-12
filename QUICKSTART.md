# 🚀 Quick Start Guide - King Model

## Prerequisites
- Python 3.11+
- Node.js 18+
- OpenAI API Key

## 1. Setup Backend (2 minutes)

```bash
# Run automated setup
./setup-king.sh

# OR manually:
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 2. Configure Environment

Create `.env` file in project root:

```bash
OPENAI_API_KEY=your_api_key_here
BACKEND_URL=http://localhost:8000
```

## 3. Start Backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

Backend will be available at: http://localhost:8000

## 4. Start Frontend (new terminal)

```bash
npm install  # if needed
npm run dev
```

Frontend will be available at: http://localhost:3000

## 5. Test the Implementation

### Option A: Use Frontend UI
1. Open http://localhost:3000
2. Select **King** from the Model dropdown
3. Paste your text (up to 10,000 words)
4. Choose tone and readability
5. Click **Humanize** or **Paraphrase**

### Option B: Run Test Script
```bash
./test-king.sh
```

### Option C: Use API Directly
```bash
curl -X POST http://localhost:8000/humanize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Furthermore, it is important to note that AI is revolutionizing technology.",
    "model": "king",
    "tone": "professional",
    "readability": "natural"
  }'
```

## 6. Verify Installation

Check backend health:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "openai_api_key_set": true,
  "supabase_connected": false
}
```

## Model Selection

### Ghost Mini
- **Speed**: ⚡ Fast
- **Quality**: ⭐⭐⭐ Good
- **Max Words**: 5,000
- **Use Case**: Quick drafts, testing

### Ghost Pro
- **Speed**: ⚡⚡ Medium
- **Quality**: ⭐⭐⭐⭐ Very Good
- **Max Words**: 5,000
- **Use Case**: Production use, balanced

### King 👑
- **Speed**: ⚡⚡⚡ Slower
- **Quality**: ⭐⭐⭐⭐⭐ Excellent
- **Max Words**: 10,000
- **Use Case**: Research papers, long content, maximum quality

## Common Issues

### Backend not running
```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill existing process if needed
kill -9 $(lsof -t -i:8000)
```

### Missing dependencies
```bash
cd backend
pip install -r requirements.txt
```

### OpenAI API errors
- Check API key is set in `.env`
- Verify API key has credits
- Check OpenAI status: https://status.openai.com

### Frontend can't reach backend
- Set `BACKEND_URL=http://localhost:8000` in `.env`
- Ensure backend is running on port 8000
- Check CORS settings if deploying remotely

## API Endpoints

### Humanize
```bash
POST http://localhost:8000/humanize
{
  "text": "Your text here",
  "model": "king",
  "tone": "professional",
  "readability": "natural"
}
```

### Paraphrase
```bash
POST http://localhost:8000/paraphrase
{
  "text": "Your text here",
  "model": "king",
  "tone": "professional",
  "readability": "natural"
}
```

### Health Check
```bash
GET http://localhost:8000/health
```

## Interactive API Docs

Visit http://localhost:8000/docs for:
- Interactive API testing
- Request/response schemas
- Example payloads

## Next Steps

1. ✅ Test all three models
2. ✅ Compare quality differences
3. ✅ Adjust tone and readability settings
4. ✅ Test with different text lengths
5. ✅ Review [KING_MODEL.md](KING_MODEL.md) for details
6. ✅ Check [ARCHITECTURE.md](ARCHITECTURE.md) for diagrams

## Support

- **Documentation**: See [KING_MODEL.md](KING_MODEL.md)
- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Implementation**: See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Backend Code**: [backend/main.py](backend/main.py)
- **Frontend Code**: [src/components/TextHumanizer.tsx](src/components/TextHumanizer.tsx)

## Success! 🎉

You now have three AI humanization models:
- 🏃 **Ghost Mini** - Fast & Efficient
- ⚖️ **Ghost Pro** - Balanced Quality
- 👑 **King** - Maximum Quality with Research-Based Processing

Enjoy using the King Model for discourse-level style transfer!
