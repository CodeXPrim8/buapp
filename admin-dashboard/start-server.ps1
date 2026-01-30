# Super Admin Dashboard - Clean Startup Script
# This script ensures all potential issues are fixed before starting the server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Super Admin Dashboard - Clean Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop all Node processes on ports 3000 and 3001
Write-Host "[1/4] Stopping all Node processes on ports 3000/3001..." -ForegroundColor Yellow
$processes = Get-Process | Where-Object {$_.Path -like "*node*"} | Where-Object {
    $connections = Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue
    $connections | Where-Object {$_.LocalPort -eq 3000 -or $_.LocalPort -eq 3001}
}
if ($processes) {
    $processes | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Stopped $($processes.Count) process(es)" -ForegroundColor Green
} else {
    Write-Host "  ✓ No processes found on ports 3000/3001" -ForegroundColor Green
}
Start-Sleep -Seconds 2

# Step 2: Clear build cache
Write-Host "[2/4] Clearing build cache..." -ForegroundColor Yellow
$buildCache = ".next"
if (Test-Path $buildCache) {
    Remove-Item -Recurse -Force $buildCache -ErrorAction SilentlyContinue
    Write-Host "  ✓ Build cache (.next) cleared" -ForegroundColor Green
} else {
    Write-Host "  ✓ No build cache to clear" -ForegroundColor Green
}

# Step 3: Verify Turbopack is disabled
Write-Host "[3/4] Verifying Turbopack is disabled..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw
if ($packageJson -match '--no-turbo') {
    Write-Host "  ✓ Turbopack disabled (using webpack)" -ForegroundColor Green
} else {
    Write-Host "  ✗ WARNING: --no-turbo flag not found in package.json" -ForegroundColor Red
}

# Step 4: Verify authentication is configured
Write-Host "[4/4] Verifying authentication setup..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "SUPABASE_SERVICE_ROLE_KEY" -and $envContent -match "JWT_SECRET") {
        Write-Host "  ✓ Authentication configured" -ForegroundColor Green
    } else {
        Write-Host "  ✗ WARNING: Missing authentication environment variables" -ForegroundColor Red
    }
} else {
    Write-Host "  ✗ ERROR: .env.local file not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting server..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server will start on: http://localhost:3001" -ForegroundColor Green
Write-Host "Login page: http://localhost:3001/login" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
npm run dev
