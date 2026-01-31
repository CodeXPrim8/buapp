# Push Supabase Build Fix to New Repository
Write-Host "=== Pushing Supabase Fix to New Repository ===" -ForegroundColor Cyan
Write-Host ""

# Check current remote
Write-Host "1. Checking current Git remote..." -ForegroundColor Yellow
$currentRemote = git remote get-url origin 2>$null
if ($currentRemote) {
    Write-Host "   Current remote: $currentRemote" -ForegroundColor Cyan
} else {
    Write-Host "   No remote configured" -ForegroundColor Yellow
}
Write-Host ""

# Set new remote
Write-Host "2. Setting remote to new repository..." -ForegroundColor Yellow
$newRepoUrl = "https://github.com/flourishhopemx01-droid/buapp.git"
git remote set-url origin $newRepoUrl
if ($?) {
    Write-Host "   Remote updated to: $newRepoUrl" -ForegroundColor Green
} else {
    Write-Host "   Failed to update remote" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Stage the fix
Write-Host "3. Staging Supabase fix..." -ForegroundColor Yellow
git add lib/supabase.ts
git add .gitignore
git add package.json
if ($?) {
    Write-Host "   Files staged" -ForegroundColor Green
} else {
    Write-Host "   Failed to stage files" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Commit
Write-Host "4. Committing changes..." -ForegroundColor Yellow
git commit -m "Fix Supabase initialization during build time - prevents build failures"
if ($?) {
    Write-Host "   Committed" -ForegroundColor Green
} else {
    Write-Host "   Failed to commit (may already be committed)" -ForegroundColor Yellow
}
Write-Host ""

# Push
Write-Host "5. Pushing to new repository..." -ForegroundColor Yellow
git push origin main
if ($?) {
    Write-Host "   Successfully pushed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vercel will automatically rebuild your app." -ForegroundColor Cyan
    Write-Host "The build should now succeed!" -ForegroundColor Cyan
} else {
    Write-Host "   Failed to push" -ForegroundColor Red
    Write-Host "   You may need to authenticate with GitHub" -ForegroundColor Yellow
    Write-Host "   Or the repository may not exist yet" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Wait for Vercel to detect the push and rebuild" -ForegroundColor White
Write-Host "2. Check Vercel deployment logs" -ForegroundColor White
Write-Host "3. Build should now succeed!" -ForegroundColor White
