@echo off
title Git Installation & Push to GitHub
color 0A

echo ================================================================
echo    TAMER EDUCATIONAL ACTIVITIES - Git Setup
echo ================================================================
echo.

:CHECK_GIT
echo Checking if Git is installed...
git --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [!] Git is NOT installed yet.
    echo.
    echo I've opened TWO options for you:
    echo.
    echo Option 1: GitHub Desktop (EASIER - Recommended!)
    echo    - Simple graphical interface
    echo    - No commands needed
    echo    - Just click and push!
    echo.
    echo Option 2: Git for Windows (Command Line)
    echo    - More control
    echo    - Use this script to push
    echo.
    echo ================================================================
    echo INSTALLATION STEPS:
    echo ================================================================
    echo.
    echo FOR GITHUB DESKTOP:
    echo 1. Download and install GitHub Desktop
    echo 2. Sign in with your GitHub account
    echo 3. Click: File ^> Add Local Repository
    echo 4. Browse to: d:\Gaming Template
    echo 5. Click: Publish repository
    echo 6. Done! Your code is on GitHub!
    echo.
    echo FOR GIT FOR WINDOWS:
    echo 1. Download and install Git for Windows
    echo 2. Use default settings during installation
    echo 3. After installation, run this script again
    echo 4. Script will automatically push to GitHub
    echo.
    echo ================================================================
    echo.
    set /p choice="Have you installed Git? (y/n): "
    if /i "%choice%"=="y" goto CHECK_GIT
    if /i "%choice%"=="n" (
        echo.
        echo Please install Git first, then run this script again.
        echo.
        pause
        exit /b 1
    )
    goto CHECK_GIT
) else (
    echo [OK] Git is installed!
    git --version
    echo.
    goto SETUP_REPO
)

:SETUP_REPO
echo ================================================================
echo Setting up your repository...
echo ================================================================
echo.

cd /d "d:\Gaming Template"

REM Check if .git exists
if not exist ".git" (
    echo Initializing Git repository...
    git init
    echo.
    
    echo Configuring Git...
    echo.
    echo Please enter your GitHub username:
    set /p username="Username (default: Karan2907): "
    if "%username%"=="" set username=Karan2907
    
    echo Please enter your GitHub email:
    set /p email="Email: "
    
    git config user.name "%username%"
    git config user.email "%email%"
    echo.
    echo Configuration saved!
    echo.
)

REM Add remote
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Adding remote repository...
    git remote add origin https://github.com/Karan2907/Tamer-Educational-Activities.git
    echo Remote added!
    echo.
)

REM Stage files
echo Staging all files...
git add .
echo.

REM Check for changes
git diff-index --quiet HEAD -- >nul 2>&1
if errorlevel 1 (
    echo Creating commit...
    git commit -m "Initial commit: Tamer Educational Activities - 8 interactive templates"
    echo.
) else (
    echo No new changes to commit.
    echo.
)

REM Set branch to main
echo Setting branch to main...
git branch -M main
echo.

echo ================================================================
echo READY TO PUSH!
echo ================================================================
echo.
echo Repository: https://github.com/Karan2907/Tamer-Educational-Activities
echo.
echo IMPORTANT: When prompted for password, use a Personal Access Token
echo.
echo To create a token:
echo 1. Visit: https://github.com/settings/tokens
echo 2. Click: Generate new token (classic)
echo 3. Name: Tamer Educational Activities
echo 4. Select: repo (check the box)
echo 5. Click: Generate token
echo 6. COPY the token (starts with ghp_)
echo 7. Use it as your password below
echo.
echo ================================================================
pause

echo.
echo Pushing to GitHub...
echo.
git push -u origin main

if errorlevel 1 (
    echo.
    echo ================================================================
    echo [ERROR] Push failed!
    echo ================================================================
    echo.
    echo Possible solutions:
    echo.
    echo 1. If "non-fast-forward" error:
    echo    git pull origin main --allow-unrelated-histories
    echo    Then run this script again
    echo.
    echo 2. If authentication failed:
    echo    Make sure you're using Personal Access Token (not password)
    echo.
    echo 3. If repository doesn't exist:
    echo    Create it at: https://github.com/new
    echo    Name: Tamer-Educational-Activities
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ================================================================
    echo [SUCCESS] PUSHED TO GITHUB!
    echo ================================================================
    echo.
    echo Your project is now live at:
    echo https://github.com/Karan2907/Tamer-Educational-Activities
    echo.
    echo NEXT STEPS:
    echo ================================================================
    echo.
    echo 1. Visit your repository on GitHub
    echo.
    echo 2. Enable GitHub Pages:
    echo    - Go to Settings ^> Pages
    echo    - Source: main branch
    echo    - Your app will be live at:
    echo      https://karan2907.github.io/Tamer-Educational-Activities/template_fix_complete.html
    echo.
    echo 3. Add repository description:
    echo    "Interactive educational activities platform with 8 engaging templates"
    echo.
    echo 4. Add topics:
    echo    education, interactive-learning, firebase, tailwindcss, quiz-app
    echo.
    echo ================================================================
    echo.
    echo Congratulations! Your project is on GitHub!
    echo.
    pause
)
