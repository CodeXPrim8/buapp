# GitHub Setup Instructions

## Quick Setup

Run this single command in PowerShell (in your project directory):

```powershell
.\setup-github.ps1
```

## Manual Setup (if script doesn't work)

Run these commands one by one in PowerShell:

```powershell
# Navigate to project
cd "C:\Users\clemx\Downloads\Bison note mobile-app-build"

# Configure Git
git config --global user.email "protectorng@gmail.com"
git config --global user.name "CodeXPrim8"

# Initialize repository (if not already done)
git init

# Add remote
git remote add origin https://github.com/CodeXPrim8/BU.git

# Add all files
git add .

# Commit
git commit -m "Initial commit: Bison Note mobile app with admin dashboard"

# Set branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

## Authentication

When you run `git push`, GitHub will ask for credentials:

- **Username**: `CodeXPrim8`
- **Password**: Use a **Personal Access Token** (NOT your GitHub password)

### How to Create a Personal Access Token:

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Give it a name (e.g., "BU Project")
4. Select expiration (or "No expiration")
5. Check the **`repo`** scope (full control)
6. Click **"Generate token"**
7. **Copy the token immediately** (you won't see it again!)
8. Use this token as your password when pushing

## Verify Setup

After pushing, verify your repository:

```powershell
git remote -v
git status
```

View your repository online:
https://github.com/CodeXPrim8/BU

## Troubleshooting

### "Git is not recognized"
- Install Git from: https://git-scm.com/download/win
- Restart PowerShell after installation

### "Authentication failed"
- Make sure you're using a Personal Access Token, not your password
- Check that the token has `repo` scope

### "Repository not found"
- Make sure the repository exists at: https://github.com/CodeXPrim8/BU
- Create it on GitHub if it doesn't exist

### "Permission denied"
- Verify your GitHub username is correct: `CodeXPrim8`
- Check that you have write access to the repository
