# PowerShell script to add and push all project files to GitHub
# Run this AFTER you've successfully pushed the initial README.md

Write-Host "📦 Adding all project files to GitHub..." -ForegroundColor Cyan

# Navigate to project directory
$projectPath = "C:\Users\clemx\Downloads\Bison note mobile-app-build"
Set-Location $projectPath

# Check git status
Write-Host "`n📊 Checking git status..." -ForegroundColor Yellow
git status

# Add all files (respects .gitignore)
Write-Host "`n➕ Adding all files..." -ForegroundColor Yellow
git add .

# Show what will be committed
Write-Host "`n📋 Files staged for commit:" -ForegroundColor Yellow
git status --short

# Create commit
Write-Host "`n💾 Creating commit..." -ForegroundColor Yellow
$commitMessage = Read-Host "Enter commit message (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Add all project files"
}
git commit -m $commitMessage

# Push to GitHub
Write-Host "`n⬆️  Pushing to GitHub..." -ForegroundColor Yellow
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed all files to GitHub!" -ForegroundColor Green
    Write-Host "`n🌐 View your repository at: https://github.com/CodeXPrim8/BU" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Push failed. Please check the error above." -ForegroundColor Red
}
