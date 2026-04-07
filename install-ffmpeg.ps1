# PowerShell script to add FFmpeg to system PATH
# Run this as Administrator

Write-Host "Adding FFmpeg to system PATH..." -ForegroundColor Cyan

# Get current system PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

# FFmpeg bin directory
$ffmpegPath = "C:\ffmpeg\bin"

# Check if FFmpeg directory exists
if (-not (Test-Path $ffmpegPath)) {
    Write-Host "ERROR: FFmpeg not found at $ffmpegPath" -ForegroundColor Red
    Write-Host "Please extract FFmpeg to C:\ffmpeg first" -ForegroundColor Yellow
    exit 1
}

# Check if already in PATH
if ($currentPath -like "*$ffmpegPath*") {
    Write-Host "FFmpeg is already in system PATH" -ForegroundColor Green
    exit 0
}

# Add to PATH
$newPath = $currentPath + ";$ffmpegPath"
[Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")

Write-Host "✓ FFmpeg successfully added to system PATH" -ForegroundColor Green
Write-Host "Please restart your terminal/IDE for changes to take effect" -ForegroundColor Yellow
