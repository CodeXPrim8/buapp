# Start All Servers - Run this script in your PowerShell terminal
# Right-click and "Run with PowerShell" or run: .\start-all-servers.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Bison Note - Start All Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$adminDir = Join-Path $rootDir "admin-dashboard"

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "✓ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check dependencies
if (-not (Test-Path (Join-Path $rootDir "node_modules"))) {
    Write-Host "⚠ Main app dependencies not installed." -ForegroundColor Yellow
    Write-Host "  Installing dependencies for main app..." -ForegroundColor Yellow
    Set-Location $rootDir
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install main app dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Main app dependencies installed" -ForegroundColor Green
}

if (-not (Test-Path (Join-Path $adminDir "node_modules"))) {
    Write-Host "⚠ Admin dashboard dependencies not installed." -ForegroundColor Yellow
    Write-Host "  Installing dependencies for admin dashboard..." -ForegroundColor Yellow
    Set-Location $adminDir
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install admin dashboard dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Admin dashboard dependencies installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Yellow
Write-Host ""

# Start Main App
Write-Host "Starting Main Application (Port 3000)..." -ForegroundColor Cyan
$mainAppJob = Start-Job -ScriptBlock {
    Set-Location $using:rootDir
    npm run dev
}

# Start Admin Dashboard
Start-Sleep -Seconds 2
Write-Host "Starting Admin Dashboard (Port 3001)..." -ForegroundColor Cyan
$adminJob = Start-Job -ScriptBlock {
    Set-Location $using:adminDir
    npm run dev
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Servers Starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Main Application:    http://localhost:3000" -ForegroundColor White
Write-Host "Admin Dashboard:    http://localhost:3001/login" -ForegroundColor White
Write-Host ""
Write-Host "Waiting for servers to start (this may take 30-60 seconds)..." -ForegroundColor Yellow
Write-Host ""

# Wait and check status
$maxWait = 60
$waited = 0
$mainAppReady = $false
$adminReady = $false

while ($waited -lt $maxWait -and (-not $mainAppReady -or -not $adminReady)) {
    Start-Sleep -Seconds 2
    $waited += 2
    
    if (-not $mainAppReady) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
            Write-Host "✓ Main App is ready!" -ForegroundColor Green
            $mainAppReady = $true
        } catch {
            # Still starting
        }
    }
    
    if (-not $adminReady) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/login" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
            Write-Host "✓ Admin Dashboard is ready!" -ForegroundColor Green
            $adminReady = $true
        } catch {
            # Still starting
        }
    }
    
    if (-not $mainAppReady -or -not $adminReady) {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host ""

# Check final status
if ($mainAppReady -and $adminReady) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ Both servers are running!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  ⚠ Servers may still be starting" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Check server status:" -ForegroundColor Yellow
    Write-Host "  Get-Job | Receive-Job" -ForegroundColor White
    Write-Host ""
    Write-Host "Stop servers:" -ForegroundColor Yellow
    Write-Host "  Stop-Job -Name Job*; Remove-Job -Name Job*" -ForegroundColor White
}

Write-Host ""
Write-Host "Press Ctrl+C to stop the servers" -ForegroundColor Gray
Write-Host ""

# Keep script running and show job output
try {
    while ($true) {
        $mainOutput = Receive-Job -Job $mainAppJob -ErrorAction SilentlyContinue
        $adminOutput = Receive-Job -Job $adminJob -ErrorAction SilentlyContinue
        
        if ($mainOutput) {
            Write-Host "[Main App] $mainOutput" -ForegroundColor Cyan
        }
        if ($adminOutput) {
            Write-Host "[Admin] $adminOutput" -ForegroundColor Magenta
        }
        
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "`nStopping servers..." -ForegroundColor Yellow
    Stop-Job -Job $mainAppJob, $adminJob -ErrorAction SilentlyContinue
    Remove-Job -Job $mainAppJob, $adminJob -ErrorAction SilentlyContinue
    Write-Host "Servers stopped." -ForegroundColor Green
}
