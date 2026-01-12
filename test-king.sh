#!/bin/bash

# King Model Test Script
# Tests the three models: ghost-mini, ghost-pro, and king

echo "🧪 Testing King Model Implementation"
echo "===================================="

# Test text
TEST_TEXT="Furthermore, it is important to note that artificial intelligence has revolutionized the way we process information. Moreover, this technology continues to evolve at an unprecedented pace. In conclusion, the future of AI holds immense potential for transforming various industries."

# Check if backend is running
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "❌ Backend is not running at http://localhost:8000"
    echo "Please start the backend first:"
    echo "  cd backend && uvicorn main:app --reload"
    exit 1
fi

echo "✓ Backend is running"
echo ""

# Test Ghost Mini
echo "1️⃣  Testing Ghost Mini Model..."
echo "--------------------------------"
RESPONSE=$(curl -s -X POST http://localhost:8000/humanize \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$TEST_TEXT\", \"model\": \"ghost-mini\", \"tone\": \"professional\", \"readability\": \"natural\"}")

WORD_COUNT=$(echo $RESPONSE | jq -r '.wordCount // "error"')
echo "✓ Ghost Mini completed - Word count: $WORD_COUNT"
echo ""

# Test Ghost Pro
echo "2️⃣  Testing Ghost Pro Model..."
echo "--------------------------------"
RESPONSE=$(curl -s -X POST http://localhost:8000/humanize \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$TEST_TEXT\", \"model\": \"ghost-pro\", \"tone\": \"professional\", \"readability\": \"natural\"}")

WORD_COUNT=$(echo $RESPONSE | jq -r '.wordCount // "error"')
echo "✓ Ghost Pro completed - Word count: $WORD_COUNT"
echo ""

# Test King Model
echo "3️⃣  Testing King Model (Advanced)..."
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST http://localhost:8000/humanize \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$TEST_TEXT\", \"model\": \"king\", \"tone\": \"professional\", \"readability\": \"natural\"}")

WORD_COUNT=$(echo $RESPONSE | jq -r '.wordCount // "error"')
HUMANIZED=$(echo $RESPONSE | jq -r '.humanizedText // "error"')

echo "✓ King Model completed - Word count: $WORD_COUNT"
echo ""
echo "Sample output:"
echo "$HUMANIZED" | head -c 200
echo "..."
echo ""

# Test paraphrase endpoint
echo "4️⃣  Testing King Model Paraphrase..."
echo "------------------------------------"
RESPONSE=$(curl -s -X POST http://localhost:8000/paraphrase \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$TEST_TEXT\", \"model\": \"king\", \"tone\": \"professional\", \"readability\": \"natural\"}")

WORD_COUNT=$(echo $RESPONSE | jq -r '.wordCount // "error"')
echo "✓ King Paraphrase completed - Word count: $WORD_COUNT"
echo ""

# Test large text with King (if OpenAI key is available)
echo "5️⃣  Testing King Model with Large Text..."
echo "-----------------------------------------"
LARGE_TEXT=$(python3 -c "print('This is a test sentence. ' * 200)")
RESPONSE=$(curl -s -X POST http://localhost:8000/humanize \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$LARGE_TEXT\", \"model\": \"king\", \"tone\": \"professional\", \"readability\": \"natural\"}")

WORD_COUNT=$(echo $RESPONSE | jq -r '.wordCount // "error"')
echo "✓ King Model (large text) completed - Word count: $WORD_COUNT"
echo ""

echo "===================================="
echo "✅ All tests completed!"
echo ""
echo "Model Comparison:"
echo "  Ghost Mini - Fast processing, good quality"
echo "  Ghost Pro  - Balanced speed/quality"
echo "  King       - Advanced processing with phrase injection"
echo ""
