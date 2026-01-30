# Quick Push to GitHub Script
# Run this in your PowerShell terminal

Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\Users\clemx\Downloads\Bison note mobile-app-build"
Set-Location $projectPath

# Check if .git/index.lock exists and remove it
if (Test-Path ".git\index.lock") {
    Write-Host "⚠️  Removing stale lock file..." -ForegroundColor Yellow
    Remove-Item ".git\index.lock" -Force
    Write-Host "✅ Lock file removed" -ForegroundColor Green
    Write-Host ""
}

# Step 1: Add all changes
Write-Host "📦 Step 1: Adding all files..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Files added" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to add files" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Check what will be committed
Write-Host "📋 Files to be committed:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Step 3: Commit
Write-Host "💾 Step 2: Creating commit..." -ForegroundColor Yellow
$commitMessage = "Update: Add server startup scripts and fix dev script configuration"
git commit -m $commitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit created" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create commit" -ForegroundColor Red
    Write-Host "   (This might mean there are no changes to commit)" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 4: Push to GitHub
Write-Host "🌐 Step 3: Pushing to GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  You may be prompted for GitHub credentials:" -ForegroundColor Yellow
Write-Host "   Username: CodeXPrim8" -ForegroundColor White
Write-Host "   Password: Use your Personal Access Token (NOT your GitHub password)" -ForegroundColor White
Write-Host ""
Write-Host "   If you don't have a Personal Access Token:" -ForegroundColor Cyan
Write-Host "   1. Go to: https://github.com/settings/tokens" -ForegroundColor White
Write-Host "   2. Click 'Generate new token (classic)'" -ForegroundColor White
Write-Host "   3. Select scope: 'repo' (full control)" -ForegroundColor White
Write-Host "   4. Copy the token and use it as your password" -ForegroundColor White
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 SUCCESS! Your code has been pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 View your repository at:" -ForegroundColor Cyan
    Write-Host "   https://github.com/CodeXPrim8/BU" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Push failed. Common issues:" -ForegroundColor Red
    Write-Host "   1. Authentication failed - Make sure you used a Personal Access Token" -ForegroundColor Yellow
    Write-Host "   2. Repository doesn't exist - Create it on GitHub first" -ForegroundColor Yellow
    Write-Host "   3. Network issues - Check your internet connection" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Try running manually:" -ForegroundColor White
    Write-Host "   git push -u origin main" -ForegroundColor Gray
    Write-Host ""
}
