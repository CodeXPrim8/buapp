# Push to GitHub Script
Write-Host "=== Pushing to GitHub ===" -ForegroundColor Cyan
Write-Host ""

# Remove lock file if it exists
Write-Host "1. Checking for git lock file..." -ForegroundColor Yellow
if (Test-Path ".git\index.lock") {
    Remove-Item -Path ".git\index.lock" -Force
    Write-Host "   ✓ Removed lock file" -ForegroundColor Green
} else {
    Write-Host "   ✓ No lock file found" -ForegroundColor Green
}

Write-Host ""

# Stage all changes
Write-Host "2. Staging all changes..." -ForegroundColor Yellow
git add -A
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Changes staged" -ForegroundColor Green
} else {
    Write-Host "   ✗ Failed to stage changes" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check status
Write-Host "3. Checking status..." -ForegroundColor Yellow
git status --short

Write-Host ""

# Commit changes
Write-Host "4. Committing changes..." -ForegroundColor Yellow
$commitMessage = "Fix navigation, history colors, and topup transactions`n`n- Fix vendor mode navigation (Create Event, Setup Gateway)`n- Fix history page: debits red, credits green`n- Fix topup transactions showing as debits`n- Add security improvements and phone testing docs"
git commit -m $commitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Changes committed" -ForegroundColor Green
} else {
    Write-Host "   ✗ Failed to commit changes" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Push to GitHub
Write-Host "5. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "   ✗ Failed to push to GitHub" -ForegroundColor Red
    Write-Host "   → You may need to authenticate or check your credentials" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
