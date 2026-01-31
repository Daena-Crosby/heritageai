# PowerShell setup script for Windows

Write-Host "🚀 Setting up HeritageAI project..." -ForegroundColor Green

# Backend setup
Write-Host "📦 Setting up backend..." -ForegroundColor Yellow
Set-Location backend
if (-not (Test-Path "node_modules")) {
    npm install
}
Set-Location ..

# Frontend setup
Write-Host "📦 Setting up frontend..." -ForegroundColor Yellow
Set-Location frontend
if (-not (Test-Path "node_modules")) {
    npm install
}
Set-Location ..

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Add your HUGGINGFACE_API_TOKEN to backend/.env"
Write-Host "2. Run 'npm run dev' in the backend directory"
Write-Host "3. Run 'npm start' in the frontend directory"
