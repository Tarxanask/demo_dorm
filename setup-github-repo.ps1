# PowerShell script to set up and push to a new GitHub repository
# Run this script after installing Git and GitHub CLI

Write-Host "Setting up GitHub repository for demo_dorm..." -ForegroundColor Cyan

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git is not installed!" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Initialize git repository if not already initialized
if (-not (Test-Path .git)) {
    Write-Host "Initializing Git repository..." -ForegroundColor Cyan
    git init
    Write-Host "Git repository initialized!" -ForegroundColor Green
} else {
    Write-Host "Git repository already initialized." -ForegroundColor Yellow
}

# Add all files
Write-Host "Adding files to Git..." -ForegroundColor Cyan
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "Committing changes..." -ForegroundColor Cyan
    git commit -m "Initial commit: Dormzy app with modern UI improvements"
    Write-Host "Changes committed!" -ForegroundColor Green
} else {
    Write-Host "No changes to commit." -ForegroundColor Yellow
}

# Check current branch
$currentBranch = git branch --show-current
if (-not $currentBranch) {
    Write-Host "Creating main branch..." -ForegroundColor Cyan
    git branch -M main
    $currentBranch = "main"
}

Write-Host "`nCurrent branch: $currentBranch" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://github.com/new and create a new repository named 'demo_dorm'" -ForegroundColor White
Write-Host "2. DO NOT initialize it with README, .gitignore, or license" -ForegroundColor White
Write-Host "3. Copy the repository URL (e.g., https://github.com/YourUsername/demo_dorm.git)" -ForegroundColor White
Write-Host "4. Run the following commands:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/YourUsername/demo_dorm.git" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host "`nOr run this script with the repository URL as an argument:" -ForegroundColor Yellow
Write-Host "   .\setup-github-repo.ps1 https://github.com/YourUsername/demo_dorm.git" -ForegroundColor Cyan

# If repository URL is provided as argument, set it up automatically
if ($args.Count -gt 0) {
    $repoUrl = $args[0]
    Write-Host "`nSetting up remote repository: $repoUrl" -ForegroundColor Cyan
    
    # Remove existing origin if it exists
    $existingRemote = git remote get-url origin 2>$null
    if ($existingRemote) {
        Write-Host "Removing existing remote origin..." -ForegroundColor Yellow
        git remote remove origin
    }
    
    # Add new remote
    git remote add origin $repoUrl
    Write-Host "Remote added successfully!" -ForegroundColor Green
    
    # Push to GitHub
    Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
    try {
        git push -u origin $currentBranch
        Write-Host "`nSuccessfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "Repository URL: $repoUrl" -ForegroundColor Cyan
    } catch {
        Write-Host "`nERROR: Failed to push to GitHub." -ForegroundColor Red
        Write-Host "You may need to authenticate. Try:" -ForegroundColor Yellow
        Write-Host "   git push -u origin $currentBranch" -ForegroundColor Cyan
    }
}

