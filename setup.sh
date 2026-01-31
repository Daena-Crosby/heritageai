#!/bin/bash

echo "🚀 Setting up HeritageAI project..."

# Backend setup
echo "📦 Setting up backend..."
cd backend
if [ ! -d "node_modules" ]; then
  npm install
fi
cd ..

# Frontend setup
echo "📦 Setting up frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
  npm install
fi
cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your HUGGINGFACE_API_TOKEN to backend/.env"
echo "2. Run 'npm run dev' in the backend directory"
echo "3. Run 'npm start' in the frontend directory"
