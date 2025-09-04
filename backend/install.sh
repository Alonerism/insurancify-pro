#!/bin/bash
# Installation script for Insurance Master Backend

echo "🚀 Installing Insurance Master Backend..."

# Check Python version
python_version=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" = "$required_version" ]; then
    echo "✅ Python $python_version detected"
else
    echo "❌ Python $required_version or higher required. Found: $python_version"
    exit 1
fi

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data/policies

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    echo "Try: pip3 install --user -r requirements.txt"
    exit 1
fi

# Setup environment file
if [ ! -f .env ]; then
    echo "⚙️  Creating environment file..."
    cp env.example .env
    echo "✅ Created .env from env.example"
    echo "📝 Edit .env to configure email and other optional settings"
else
    echo "⚙️  Environment file already exists"
fi

# Initialize database
echo "🗄️  Initializing database..."
python3 src/database.py

if [ $? -eq 0 ]; then
    echo "✅ Database initialized with sample data"
else
    echo "❌ Failed to initialize database"
    exit 1
fi

# Run smoke test
echo "🧪 Running smoke test..."
python3 smoke.py

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Installation completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env to configure email settings (optional)"
    echo "2. Start the API server: python3 main.py serve"
    echo "3. View API docs at: http://127.0.0.1:8000/docs"
    echo "4. Run CLI commands: python3 main.py --help"
    echo ""
    echo "Quick test:"
    echo "  python3 main.py agents    # List agents"
    echo "  python3 main.py policies  # List policies"
    echo "  python3 main.py stats     # Show statistics"
else
    echo "⚠️  Installation completed but smoke test failed"
    echo "Check the output above for details"
    exit 1
fi
