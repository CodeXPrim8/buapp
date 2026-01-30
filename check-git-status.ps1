# Git Status Check Script
# Run this in PowerShell where Git is installed

Write-Host "🔍 Checking Git Configuration and Status..." -ForegroundColor Cyan
Write-Host ""

# Navigate to project
$projectPath = "C:\Users\clemx\Downloads\Bison note mobile-app-build"
Set-Location $projectPath

Write-Host "📁 Project Directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Check Git Config
Write-Host "⚙️  Git Configuration:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $userName = git config --global user.name
    $userEmail = git config --global user.email
    Write-Host "   Username: $userName" -ForegroundColor White
    Write-Host "   Email:    $userEmail" -ForegroundColor White
} catch {
    Write-Host "   ❌ Git not configured or not installed" -ForegroundColor Red
}
Write-Host ""

# Check Remote
Write-Host "🌐 Remote Repository:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    git remote -v
} catch {
    Write-Host "   ❌ Cannot check remote (Git not available)" -ForegroundColor Red
}
Write-Host ""

# Check Status
Write-Host "📊 Repository Status:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    git status
} catch {
    Write-Host "   ❌ Cannot check status (Git not available)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   💡 Install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "   Then restart PowerShell and run this script again." -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "   1. If Git is not installed, install it first" -ForegroundColor White
Write-Host "   2. Configure Git:" -ForegroundColor White
Write-Host "      git config --global user.name 'CodeXPrim8'" -ForegroundColor Gray
Write-Host "      git config --global user.email 'protectorng@gmail.com'" -ForegroundColor Gray
Write-Host "   3. Add remote (if not added):" -ForegroundColor White
Write-Host "      git remote add origin https://github.com/CodeXPrim8/BU.git" -ForegroundColor Gray
Write-Host "   4. Add and commit files:" -ForegroundColor White
Write-Host "      git add ." -ForegroundColor Gray
Write-Host "      git commit -m 'Initial commit'" -ForegroundColor Gray
Write-Host "   5. Push to GitHub:" -ForegroundColor White
Write-Host "      git push -u origin main" -ForegroundColor Gray
Write-Host ""
