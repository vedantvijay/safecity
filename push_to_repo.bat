@echo off
REM SafeCity - Push to Another Repository Script
REM This script helps you push your code to another person's repository

echo ========================================
echo SafeCity - Push to Repository
echo ========================================
echo.

REM Step 1: Get target repository URL
set /p REPO_URL="Enter target repository URL: "

if "%REPO_URL%"=="" (
    echo Error: Repository URL cannot be empty!
    pause
    exit /b 1
)

echo.
echo Target Repository: %REPO_URL%
echo.

REM Step 2: Confirm
set /p CONFIRM="Continue with push? (y/n): "

if /i not "%CONFIRM%"=="y" (
    echo Push cancelled.
    pause
    exit /b 0
)

echo.
echo ========================================
echo Step 1: Checking Git Status
echo ========================================
git status

echo.
echo ========================================
echo Step 2: Adding All Changes
echo ========================================
git add .

echo.
echo ========================================
echo Step 3: Committing Changes
echo ========================================
git commit -m "Complete SafeCity implementation with ML model, community features, and chatbot integration"

echo.
echo ========================================
echo Step 4: Adding Target Remote
echo ========================================
git remote add target %REPO_URL% 2>nul
if errorlevel 1 (
    echo Remote 'target' already exists, updating URL...
    git remote set-url target %REPO_URL%
)

echo.
echo ========================================
echo Step 5: Pushing to Target Repository
echo ========================================
git push target main

if errorlevel 1 (
    echo.
    echo Push failed! Trying with force...
    set /p FORCE="Force push? This will overwrite remote. (y/n): "
    if /i "%FORCE%"=="y" (
        git push target main --force
    )
)

echo.
echo ========================================
echo Push Complete!
echo ========================================
echo.
echo Repository: %REPO_URL%
echo Branch: main
echo.
echo Next steps:
echo 1. Verify code is visible in the target repository
echo 2. Share SETUP_INSTRUCTIONS.md with the other person
echo 3. Provide them with necessary API keys
echo.

pause
