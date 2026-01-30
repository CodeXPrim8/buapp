# Complete GitHub Setup Script for BU Project
# Run this in PowerShell where Git is installed

Write-Host "🚀 Setting up GitHub repository..." -ForegroundColor Cyan
Write-Host ""

# Navigate to project directory
$projectPath = "C:\Users\clemx\Downloads\Bison note mobile-app-build"
Set-Location $projectPath

Write-Host "📁 Project directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Step 1: Configure Git with your credentials
Write-Host "⚙️  Step 1: Configuring Git credentials..." -ForegroundColor Yellow
git config --global user.email "protectorng@gmail.com"
git config --global user.name "CodeXPrim8"

Write-Host "✅ Git configured:" -ForegroundColor Green
git config --global --get user.name
git config --global --get user.email
Write-Host ""

# Step 2: Initialize repository (if needed)
Write-Host "⚙️  Step 2: Initializing Git repository..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    git init
    Write-Host "✅ Repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Repository already initialized" -ForegroundColor Green
}
Write-Host ""

# Step 3: Add remote
Write-Host "⚙️  Step 3: Setting up remote repository..." -ForegroundColor Yellow
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "   Removing existing remote: $existingRemote" -ForegroundColor Yellow
    git remote remove origin
}
git remote add origin https://github.com/CodeXPrim8/BU.git
Write-Host "✅ Remote added: https://github.com/CodeXPrim8/BU.git" -ForegroundColor Green
Write-Host ""

# Step 4: Add all files
Write-Host "⚙️  Step 4: Adding all files to Git..." -ForegroundColor Yellow
git add .
$fileCount = (git status --short | Measure-Object -Line).Lines
Write-Host "✅ Added $fileCount files" -ForegroundColor Green
Write-Host ""

# Step 5: Create commit
Write-Host "⚙️  Step 5: Creating commit..." -ForegroundColor Yellow
git commit -m "Initial commit: Bison Note mobile app with admin dashboard"
Write-Host "✅ Commit created" -ForegroundColor Green
Write-Host ""

# Step 6: Set branch to main
Write-Host "⚙️  Step 6: Setting branch to main..." -ForegroundColor Yellow
git branch -M main
Write-Host "✅ Branch set to main" -ForegroundColor Green
Write-Host ""

# Step 7: Push to GitHub
Write-Host "⚙️  Step 7: Pushing to GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT: You will be prompted for GitHub credentials" -ForegroundColor Red
Write-Host "   Username: CodeXPrim8" -ForegroundColor White
Write-Host "   Password: Use a Personal Access Token (NOT your GitHub password)" -ForegroundColor White
Write-Host ""
Write-Host "   To create a Personal Access Token:" -ForegroundColor Yellow
Write-Host "   1. Go to: https://github.com/settings/tokens" -ForegroundColor White
Write-Host "   2. Click 'Generate new token (classic)'" -ForegroundColor White
Write-Host "   3. Select scope: 'repo' (full control)" -ForegroundColor White
Write-Host "   4. Copy the token and use it as your password" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Press Enter to continue with push (or Ctrl+C to cancel)"

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
    Write-Host "   Try running: git push -u origin main" -ForegroundColor White
}
