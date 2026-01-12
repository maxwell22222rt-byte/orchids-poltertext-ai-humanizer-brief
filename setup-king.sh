#!/bin/bash

# King Model Setup Script
# This script sets up the King model and its dependencies

echo "🔧 Setting up King Model for PolterText AI Humanizer"
echo "=================================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11+"
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"

# Navigate to backend directory
cd backend || exit 1

echo ""
echo "📦 Installing Python dependencies..."
echo "This may take a few minutes for sentence-transformers..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✓ All dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🔍 Checking installed packages..."
pip list | grep -E "(sentence-transformers|torch|openai|fastapi)"

echo ""
echo "=================================================="
echo "✓ King Model setup complete!"
echo ""
echo "Next steps:"
echo "1. Set OPENAI_API_KEY in .env file"
echo "2. Run: cd backend && source venv/bin/activate"
echo "3. Run: uvicorn main:app --reload"
echo "4. Test at http://localhost:8000/docs"
echo ""
echo "Models available:"
echo "  - ghost-mini (Fast, GPT-4o-mini)"
echo "  - ghost-pro (Balanced, GPT-4o)"
echo "  - king (Maximum Quality, GPT-4o + Advanced Processing)"
echo ""
