# Tamer Educational Activities - Local Server Launcher
# This script starts a local web server for the application

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Tamer Educational Activities" -ForegroundColor Yellow
Write-Host " Local Development Server" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$port = 8000
$url = "http://localhost:$port"

# Function to open browser
function Open-Browser {
    param($url)
    Start-Process $url
}

# Try Node.js http-server
Write-Host "Checking for Node.js http-server..." -ForegroundColor Green

# Refresh environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Try to find node
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if ($nodePath) {
    Write-Host "Node.js found!" -ForegroundColor Green
    Write-Host ""
    
    # Check if http-server is installed
    $httpServerInstalled = npm list -g http-server 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Installing http-server..." -ForegroundColor Yellow
        npm install -g http-server
    }
    
    Write-Host ""
    Write-Host "Starting server at $url" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    
    # Open browser after 2 seconds
    Start-Sleep -Seconds 2
    Open-Browser $url
    
    # Start server
    npx http-server -p $port
    exit
}

# Try Python
Write-Host "Node.js not found. Checking for Python..." -ForegroundColor Yellow
$pythonPath = Get-Command python -ErrorAction SilentlyContinue
if ($pythonPath) {
    Write-Host "Python found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Starting server at $url" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    
    Start-Sleep -Seconds 2
    Open-Browser $url
    
    python -m http.server $port
    exit
}

# Try PHP
Write-Host "Python not found. Checking for PHP..." -ForegroundColor Yellow
$phpPath = Get-Command php -ErrorAction SilentlyContinue
if ($phpPath) {
    Write-Host "PHP found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Starting server at $url" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    
    Start-Sleep -Seconds 2
    Open-Browser $url
    
    php -S localhost:$port
    exit
}

# No server found
Write-Host ""
Write-Host "ERROR: No local server tool found!" -ForegroundColor Red
Write-Host ""
Write-Host "Please install one of the following:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Node.js (Recommended):" -ForegroundColor Cyan
Write-Host "   Download from: https://nodejs.org" -ForegroundColor White
Write-Host "   After install, run this script again" -ForegroundColor White
Write-Host ""
Write-Host "2. Python:" -ForegroundColor Cyan
Write-Host "   Download from: https://www.python.org" -ForegroundColor White
Write-Host ""
Write-Host "3. Use VS Code Live Server Extension" -ForegroundColor Cyan
Write-Host "   Install 'Live Server' in VS Code" -ForegroundColor White
Write-Host "   Right-click index.html -> Open with Live Server" -ForegroundColor White
Write-Host ""

# Open HOW_TO_RUN.html for instructions
Write-Host "Opening setup guide..." -ForegroundColor Yellow
Start-Process "HOW_TO_RUN.html"

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
