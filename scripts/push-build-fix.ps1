# Push Build Fix to GitHub
Write-Host "=== Pushing Supabase Build Fix to GitHub ===" -ForegroundColor Cyan
Write-Host ""

# Remove lock file
Write-Host "1. Removing git lock file..." -ForegroundColor Yellow
Remove-Item -Path ".git\index.lock" -Force -ErrorAction SilentlyContinue
Write-Host "   Done" -ForegroundColor Green
Write-Host ""

# Stage all changes
Write-Host "2. Staging changes..." -ForegroundColor Yellow
git add lib/supabase.ts
git add .gitignore
git add package.json
git add BUILD_FIX_SUPABASE.md
git add DEPLOYMENT_FIX_SUMMARY.md
git add DEPLOYMENT_ISSUES_CHECK.md
git add DEPLOYMENT_SUMMARY.md
git add IMPLEMENTATION_COMPLETE.md
git add QUICK_DEPLOYMENT_GUIDE.md
git add VERCEL_ENV_CHECKLIST.md
git add scripts/

if ($?) {
    Write-Host "   Staged" -ForegroundColor Green
} else {
    Write-Host "   Failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Commit
Write-Host "3. Committing changes..." -ForegroundColor Yellow
$commitMsg = "Fix Supabase initialization during build time - prevents build failures"
git commit -m $commitMsg
if ($?) {
    Write-Host "   Committed" -ForegroundColor Green
} else {
    Write-Host "   Failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Push
Write-Host "4. Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
if ($?) {
    Write-Host "   Successfully pushed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vercel will automatically rebuild your app." -ForegroundColor Cyan
    Write-Host "The build should now succeed!" -ForegroundColor Cyan
} else {
    Write-Host "   Failed to push" -ForegroundColor Red
    Write-Host "   You may need to authenticate with GitHub" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
