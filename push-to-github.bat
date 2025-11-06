@echo off
echo ========================================
echo Tamer Educational Activities
echo GitHub Push Script
echo ========================================
echo.

REM Check if Git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed!
    echo.
    echo Please install Git first:
    echo Option 1: GitHub Desktop - https://desktop.github.com/
    echo Option 2: Git for Windows - https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo Git is installed. Proceeding...
echo.

REM Navigate to project directory
cd /d "%~dp0"

REM Check if already a git repository
if not exist ".git" (
    echo Initializing Git repository...
    git init
    echo.
    
    echo Setting up Git configuration...
    echo Please enter your GitHub username:
    set /p username="Username: "
    echo Please enter your GitHub email:
    set /p email="Email: "
    
    git config user.name "%username%"
    git config user.email "%email%"
    echo.
)

REM Check if remote exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Adding remote repository...
    git remote add origin https://github.com/Karan2907/Tamer-Educational-Activities.git
    echo.
) else (
    echo Remote repository already configured.
    echo.
)

REM Stage all files
echo Staging files...
git add .
echo.

REM Check if there are changes to commit
git diff-index --quiet HEAD -- >nul 2>&1
if errorlevel 1 (
    REM Prompt for commit message
    echo Please enter a commit message:
    set /p commitmsg="Message (or press Enter for default): "
    
    if "%commitmsg%"=="" (
        set commitmsg=Update: Tamer Educational Activities platform
    )
    
    echo.
    echo Committing changes...
    git commit -m "%commitmsg%"
    echo.
) else (
    echo No changes to commit.
    echo.
)

REM Set branch to main
echo Setting branch to main...
git branch -M main
echo.

REM Push to GitHub
echo Pushing to GitHub...
echo.
echo NOTE: You may be prompted for credentials.
echo Use your GitHub username and a Personal Access Token (not password).
echo.
echo To create a token: https://github.com/settings/tokens
echo.

git push -u origin main

if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Push failed!
    echo ========================================
    echo.
    echo Common solutions:
    echo 1. Make sure you're using a Personal Access Token
    echo 2. Check your internet connection
    echo 3. Verify the repository exists: https://github.com/Karan2907/Tamer-Educational-Activities
    echo.
    echo If you get "non-fast-forward" error, try:
    echo git pull origin main --allow-unrelated-histories
    echo git push -u origin main
    echo.
) else (
    echo.
    echo ========================================
    echo SUCCESS!
    echo ========================================
    echo.
    echo Your project has been pushed to:
    echo https://github.com/Karan2907/Tamer-Educational-Activities
    echo.
    echo Next steps:
    echo 1. Visit your repository on GitHub
    echo 2. Enable GitHub Pages in Settings
    echo 3. Add description and topics
    echo.
)

pause
