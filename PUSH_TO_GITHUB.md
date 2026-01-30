# Push to GitHub - Quick Guide

## If you've already committed your files:

Simply run:
```powershell
git push -u origin main
```

## If you haven't committed yet:

Run these commands in order:

```powershell
# Navigate to project
cd "C:\Users\clemx\Downloads\Bison note mobile-app-build"

# Add all files
git add .

# Commit
git commit -m "Initial commit: Bison Note mobile app with admin dashboard"

# Push to GitHub
git push -u origin main
```

## Authentication

When prompted:
- **Username**: `CodeXPrim8`
- **Password**: Use your **Personal Access Token** (not your GitHub password)

### Don't have a token?
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select `repo` scope
4. Copy and use as password

## Troubleshooting

### "Everything up-to-date"
- Your code is already pushed! Check: https://github.com/CodeXPrim8/BU

### "Authentication failed"
- Make sure you're using a Personal Access Token, not password
- Token must have `repo` scope

### "Repository not found"
- Make sure the repo exists at: https://github.com/CodeXPrim8/BU
- Create it on GitHub if needed

### "Permission denied"
- Verify username: `CodeXPrim8`
- Check you have write access to the repository
