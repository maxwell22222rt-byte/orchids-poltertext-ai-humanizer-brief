#!/bin/bash

echo "========================================="
echo "PolterText Diagnostic Tool"
echo "========================================="
echo ""

# Check Backend
echo "🔍 Checking Backend..."
if ps aux | grep -q "[u]vicorn"; then
    echo "✅ Backend is running"
    
    # Check health endpoint
    HEALTH=$(curl -s http://localhost:8000/health)
    echo "📊 Backend Health:"
    echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
    
    # Check for API key errors in logs
    if [ -f /tmp/backend.log ]; then
        ERROR_COUNT=$(grep -c "AI Error.*401" /tmp/backend.log 2>/dev/null || echo "0")
        if [ "$ERROR_COUNT" -gt "0" ]; then
            echo "❌ Found $ERROR_COUNT OpenAI API errors (401 - Invalid Key)"
            echo "   You need to update your OPENAI_API_KEY in backend/.env"
        else
            echo "✅ No API key errors detected"
        fi
    fi
else
    echo "❌ Backend is NOT running"
    echo "   Start it with: cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
fi
echo ""

# Check Frontend Code
echo "🔍 Checking Frontend Code..."
if [ -f "src/components/TextHumanizer.tsx" ]; then
    KING_COUNT=$(grep -c '"king"' src/components/TextHumanizer.tsx)
    MODELS_ARRAY=$(grep -A 20 "const MODELS = \[" src/components/TextHumanizer.tsx | grep -c "value:")
    
    echo "✅ Frontend component exists"
    echo "📊 Found $KING_COUNT references to 'king' model"
    echo "📊 MODELS array has $MODELS_ARRAY entries (should be 3: ghost-mini, ghost-pro, king)"
    
    # Extract model definitions
    echo ""
    echo "📋 Configured Models:"
    grep -A 3 'value: "' src/components/TextHumanizer.tsx | grep -E 'value:|label:' | head -12
else
    echo "❌ Frontend component not found"
fi
echo ""

# Check if King model is in MODELS array
echo "🔍 Verifying King Model in Code..."
if grep -q 'value: "king"' src/components/TextHumanizer.tsx; then
    echo "✅ King model IS defined in MODELS array"
    echo "   Location: src/components/TextHumanizer.tsx"
    grep -B 2 -A 4 'value: "king"' src/components/TextHumanizer.tsx | head -7
else
    echo "❌ King model NOT found in MODELS array"
fi
echo ""

# Check Environment Variables
echo "🔍 Checking Environment..."
cd backend
if [ -f ".env" ]; then
    echo "✅ .env file exists in backend/"
    
    if grep -q "OPENAI_API_KEY=" .env; then
        KEY_LENGTH=$(grep "OPENAI_API_KEY=" .env | cut -d'=' -f2 | wc -c)
        if [ "$KEY_LENGTH" -gt "10" ]; then
            echo "✅ OPENAI_API_KEY is set (length: $KEY_LENGTH chars)"
            
            # Check key format
            KEY_PREFIX=$(grep "OPENAI_API_KEY=" .env | cut -d'=' -f2 | cut -d'-' -f1)
            if [ "$KEY_PREFIX" = "sk" ]; then
                echo "✅ Key format looks valid (starts with 'sk-')"
            else
                echo "⚠️  Key format unusual (doesn't start with 'sk-')"
            fi
        else
            echo "❌ OPENAI_API_KEY is empty or too short"
        fi
    else
        echo "❌ OPENAI_API_KEY not found in .env"
    fi
else
    echo "❌ No .env file found in backend/"
fi
cd ..
echo ""

# Test Backend Endpoints
echo "🔍 Testing Backend Endpoints..."
echo "Testing Ghost Mini..."
GHOST_MINI=$(curl -X POST http://localhost:8000/humanize \
  -H "Content-Type: application/json" \
  -d '{"text": "AI test sentence.", "tone": "Professional", "readability": "Human-friendly", "model": "ghost-mini"}' \
  -s 2>&1)

echo "Testing Ghost Pro..."
GHOST_PRO=$(curl -X POST http://localhost:8000/humanize \
  -H "Content-Type: application/json" \
  -d '{"text": "AI test sentence.", "tone": "Professional", "readability": "Human-friendly", "model": "ghost-pro"}' \
  -s 2>&1)

echo "Testing King..."
KING=$(curl -X POST http://localhost:8000/humanize \
  -H "Content-Type: application/json" \
  -d '{"text": "AI test sentence.", "tone": "Professional", "readability": "Human-friendly", "model": "king", "promptStyle": "default"}' \
  -s 2>&1)

# Check if responses are valid
if echo "$GHOST_MINI" | grep -q "humanizedText"; then
    echo "✅ Ghost Mini endpoint working"
else
    echo "❌ Ghost Mini endpoint failed: $GHOST_MINI"
fi

if echo "$GHOST_PRO" | grep -q "humanizedText"; then
    echo "✅ Ghost Pro endpoint working"
else
    echo "❌ Ghost Pro endpoint failed: $GHOST_PRO"
fi

if echo "$KING" | grep -q "humanizedText"; then
    echo "✅ King endpoint working"
else
    echo "❌ King endpoint failed: $KING"
fi

echo ""

# Summary
echo "========================================="
echo "📋 Summary & Recommendations"
echo "========================================="
echo ""

# Determine main issues
HAS_BACKEND=$(ps aux | grep -q "[u]vicorn" && echo "yes" || echo "no")
HAS_KING_CODE=$(grep -q 'value: "king"' src/components/TextHumanizer.tsx && echo "yes" || echo "no")
HAS_API_ERRORS=$(grep -c "AI Error.*401" /tmp/backend.log 2>/dev/null || echo "0")

if [ "$HAS_BACKEND" = "no" ]; then
    echo "❌ CRITICAL: Backend is not running"
    echo "   Action: cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
    echo ""
fi

if [ "$HAS_API_ERRORS" -gt "0" ]; then
    echo "❌ CRITICAL: OpenAI API key is invalid (401 errors)"
    echo "   Action: Update OPENAI_API_KEY in backend/.env with a valid key"
    echo "   Get key from: https://platform.openai.com/account/api-keys"
    echo ""
fi

if [ "$HAS_KING_CODE" = "yes" ]; then
    echo "✅ King model is properly defined in frontend code"
    echo "   If not visible in UI: Hard refresh browser (Ctrl+Shift+R)"
    echo ""
else
    echo "❌ King model is missing from frontend code"
    echo "   This should not happen - code may be corrupted"
    echo ""
fi

if [ "$HAS_BACKEND" = "yes" ] && [ "$HAS_API_ERRORS" = "0" ] && [ "$HAS_KING_CODE" = "yes" ]; then
    echo "🎉 System appears healthy!"
    echo "   If King still not visible in UI: Clear browser cache and hard refresh"
    echo ""
fi

echo "📚 For detailed instructions, see:"
echo "   - QUICK_FIX.md (step-by-step fix guide)"
echo "   - SYSTEM_STATUS.md (detailed system info)"
echo ""
