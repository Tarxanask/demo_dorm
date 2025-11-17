# GitHub Repository Setup Guide

## Prerequisites

1. **Install Git** (if not already installed):
   - Download from: https://git-scm.com/download/win
   - During installation, choose "Git from the command line and also from 3rd-party software"
   - Restart your terminal after installation

2. **Create GitHub Account** (if you don't have one):
   - Go to: https://github.com/signup
   - Create a free account

## Quick Setup (Automated)

1. **Run the setup script**:
   ```powershell
   .\setup-github-repo.ps1
   ```

2. **Create repository on GitHub**:
   - Go to: https://github.com/new
   - Repository name: `demo_dorm`
   - Description: "Dormzy - Connect with residents from Kaunas dormitories"
   - Choose: **Public** or **Private**
   - **DO NOT** check "Initialize this repository with a README"
   - Click "Create repository"

3. **Push to GitHub** (using the URL from step 2):
   ```powershell
   .\setup-github-repo.ps1 https://github.com/YourUsername/demo_dorm.git
   ```

## Manual Setup

If you prefer to do it manually:

```powershell
# 1. Initialize Git (if not already done)
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Initial commit: Dormzy app with modern UI improvements"

# 4. Create repository on GitHub (go to https://github.com/new)
#    Name it: demo_dorm
#    DO NOT initialize with README

# 5. Add remote and push
git branch -M main
git remote add origin https://github.com/YourUsername/demo_dorm.git
git push -u origin main
```

## Authentication

If you get authentication errors:

1. **Use GitHub Personal Access Token**:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (full control of private repositories)
   - Copy the token
   - When prompted for password, paste the token instead

2. **Or use GitHub CLI** (easier):
   ```powershell
   # Install GitHub CLI
   winget install GitHub.cli
   
   # Authenticate
   gh auth login
   
   # Then push normally
   git push -u origin main
   ```

## After Setup

Once your code is on GitHub:

1. **Connect to Vercel**:
   - Go to: https://vercel.com
   - Import your GitHub repository
   - Vercel will auto-detect Next.js
   - Add your Firebase environment variables
   - Deploy!

2. **Update Firebase**:
   - Add your Vercel domain to Firebase authorized domains
   - Firebase Console → Authentication → Settings → Authorized domains

## Troubleshooting

- **"Git is not recognized"**: Install Git and restart terminal
- **"Permission denied"**: Check your GitHub credentials
- **"Repository not found"**: Make sure you created the repo on GitHub first
- **"Branch main does not exist"**: Run `git branch -M main` first

