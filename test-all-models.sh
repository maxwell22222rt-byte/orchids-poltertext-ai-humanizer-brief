#!/bin/bash

# Test script for all paraphrasing models
echo "========================================="
echo "Testing PolterText AI Humanizer Models"
echo "========================================="
echo ""

# Check if backend is running
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "❌ Backend is not running!"
    echo "Please start the backend with: cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000"
    exit 1
fi

echo "✅ Backend is running"
echo ""

# Test text
TEST_TEXT="The process of creating sophisticated content requires careful attention to detail and strategic planning. This approach ensures optimal results."

echo "📝 Test Input Text ($(($(echo "$TEST_TEXT" | wc -w))) words):"
echo "$TEST_TEXT"
echo ""

# Function to test a model
test_model() {
    local MODEL=$1
    local STYLE=${2:-"default"}
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ "$STYLE" != "default" ]; then
        echo "Testing: $MODEL ($STYLE style)"
    else
        echo "Testing: $MODEL"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    RESPONSE=$(curl -X POST http://localhost:8000/humanize \
      -H "Content-Type: application/json" \
      -d "{\"text\": \"$TEST_TEXT\", \"tone\": \"Professional\", \"readability\": \"Human-friendly\", \"model\": \"$MODEL\", \"promptStyle\": \"$STYLE\"}" \
      -s)
    
    # Extract humanized text and word count
    HUMANIZED=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('humanizedText', 'ERROR'))")
    WORD_COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('wordCount', 0))")
    OUTPUT_WORDS=$(echo "$HUMANIZED" | wc -w)
    
    if [ "$HUMANIZED" == "ERROR" ]; then
        echo "❌ Failed to process"
        echo "Response: $RESPONSE"
    else
        echo "✅ Output ($OUTPUT_WORDS words):"
        echo "$HUMANIZED"
        echo ""
        
        # Calculate percentage change
        INPUT_WORDS=$(echo "$TEST_TEXT" | wc -w)
        PERCENT_CHANGE=$(echo "scale=1; ($OUTPUT_WORDS - $INPUT_WORDS) * 100 / $INPUT_WORDS" | bc)
        
        if (( $(echo "$PERCENT_CHANGE >= 5" | bc -l) )) && (( $(echo "$PERCENT_CHANGE <= 10" | bc -l) )); then
            echo "✅ Word count increase: ${PERCENT_CHANGE}% (within 5-10% target)"
        elif (( $(echo "$PERCENT_CHANGE >= 0" | bc -l) )); then
            echo "⚠️  Word count increase: ${PERCENT_CHANGE}% (expected 5-10%)"
        else
            echo "❌ Word count DECREASED by ${PERCENT_CHANGE#-}% (should increase 5-10%)"
        fi
    fi
    echo ""
}

# Test all models
test_model "ghost-mini"
test_model "ghost-pro"
test_model "king" "default"
test_model "king" "quick"
test_model "king" "polish"

echo "========================================="
echo "Testing Complete!"
echo "========================================="
