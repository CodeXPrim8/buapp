# Start Both Servers Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Bison Note Applications" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = "c:\Users\clemx\Downloads\Bison note mobile-app-build"
$adminDir = "$rootDir\admin-dashboard"

# Check if directories exist
if (-not (Test-Path $rootDir)) {
    Write-Host "ERROR: Root directory not found: $rootDir" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $adminDir)) {
    Write-Host "ERROR: Admin dashboard directory not found: $adminDir" -ForegroundColor Red
    exit 1
}

# Check if node_modules exist
if (-not (Test-Path "$rootDir\node_modules")) {
    Write-Host "WARNING: Main app dependencies not installed. Run: npm install" -ForegroundColor Yellow
}

if (-not (Test-Path "$adminDir\node_modules")) {
    Write-Host "WARNING: Admin dashboard dependencies not installed. Run: cd admin-dashboard && npm install" -ForegroundColor Yellow
}

Write-Host "Starting Main Application (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir'; Write-Host 'Main App - Port 3000' -ForegroundColor Green; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "Starting Admin Dashboard (Port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$adminDir'; Write-Host 'Admin Dashboard - Port 3001' -ForegroundColor Green; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Servers Starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Main Application:    http://localhost:3000" -ForegroundColor White
Write-Host "Admin Dashboard:     http://localhost:3001/login" -ForegroundColor White
Write-Host ""
Write-Host "Two PowerShell windows have been opened." -ForegroundColor Yellow
Write-Host "Check those windows for any errors or startup messages." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this script (servers will continue running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
