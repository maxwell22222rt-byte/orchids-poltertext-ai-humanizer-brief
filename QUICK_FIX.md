# 🔧 Quick Fix Guide

## Problem Summary

Your system has **3 issues**:

1. ❌ **King model not visible in UI dropdown** → Browser caching issue
2. ❌ **Models reducing word count** → Invalid OpenAI API key (no AI processing)
3. ❌ **Models not functional** → Invalid OpenAI API key

## Root Cause

**Your OpenAI API key is invalid or expired (Error 401)**

Backend logs show:
```
AI Error: Error code: 401 - Incorrect API key provided
```

When the AI fails, the system returns the original text unchanged, which explains:
- No text modifications
- No word count increase
- Models appear "broken"

## Solution Steps

### Step 1: Get a New OpenAI API Key

1. Go to: https://platform.openai.com/account/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)
4. **Important**: Save it somewhere safe - you can't see it again!

### Step 2: Update Your .env File

```bash
cd /workspaces/orchids-poltertext-ai-humanizer-brief/backend
nano .env  # or use any editor
```

Replace the line:
```
OPENAI_API_KEY=sk-proj-QI_9SlaUQjyQz_...
```

With your new key:
```
OPENAI_API_KEY=sk-YOUR_NEW_KEY_HERE
```

Save and exit (Ctrl+X, then Y, then Enter in nano)

### Step 3: Restart the Backend

```bash
# Kill the old backend process
pkill -f uvicorn

# Start fresh
cd /workspaces/orchids-poltertext-ai-humanizer-brief/backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

You should see:
```
✓ Semantic model loaded successfully
INFO: Application startup complete
```

And **NO** "AI Error: Error code: 401" messages.

### Step 4: Fix UI - Hard Refresh Browser

King model IS in the code, but your browser is caching the old version.

**Hard Refresh** (clears cache):
- **Chrome/Edge (Windows/Linux)**: `Ctrl + Shift + R`
- **Chrome/Edge (Mac)**: `Cmd + Shift + R`
- **Firefox (Windows/Linux)**: `Ctrl + F5`
- **Firefox (Mac)**: `Cmd + Shift + R`

Or:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Step 5: Test Everything

```bash
cd /workspaces/orchids-poltertext-ai-humanizer-brief
./test-all-models.sh
```

**Expected Results** (after fixing API key):
```
✅ Output (20-21 words):  ← Should be MORE than input (19 words)
[Different text from input, not identical]
✅ Word count increase: 7.5% (within 5-10% target)
```

## Verification Checklist

After completing steps 1-4:

- [ ] Backend starts without "401" errors
- [ ] Test script shows TEXT IS DIFFERENT from input
- [ ] Test script shows word count INCREASED by 5-10%
- [ ] King model visible in UI dropdown
- [ ] All 3 King prompt styles selectable
- [ ] Processing actually modifies text (not just returns it unchanged)

## Why This Happened

1. **Invalid API Key**: The OpenAI key was either:
   - Expired (project keys have shorter lifespans)
   - Revoked
   - Never valid (copied incorrectly)
   - Used up credits/quota

2. **Browser Cache**: Modern browsers aggressively cache React/Next.js apps for speed. After code changes, you need a hard refresh.

## Current System Behavior

**When API key is invalid:**
```python
try:
    # Call OpenAI API
    response = client.chat.completions.create(...)
except Exception as e:
    print(f"AI Error: {e}")
    return text  # ← Returns original unchanged!
```

This is why your output = input exactly!

## Testing Without Valid API Key

If you can't get an OpenAI key immediately, you can temporarily modify the code to see basic rule-based processing, but it won't do real AI humanization.

**Not recommended** - the system is designed for OpenAI's GPT-4o/GPT-4o-mini models.

## Cost Estimate

For OpenAI API usage:
- **Ghost Mini** (GPT-4o-mini): ~$0.002 per 1000 words
- **Ghost Pro** (GPT-4o): ~$0.01 per 1000 words  
- **King** (GPT-4o + processing): ~$0.015 per 1000 words

Very affordable for normal use. A typical test run costs < $0.01.

## Next Steps

1. ✅ Get new OpenAI API key
2. ✅ Update `backend/.env`
3. ✅ Restart backend (`pkill -f uvicorn` then start again)
4. ✅ Hard refresh browser (Ctrl+Shift+R)
5. ✅ Run `./test-all-models.sh`
6. ✅ Check UI shows King model
7. ✅ Test actual humanization in browser

---

**Once you complete these steps, all 3 issues will be resolved!** 🎉
