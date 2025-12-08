@echo off
setlocal enabledelayedexpansion

echo =======================================================
echo           MediaPicGen One-Click Build Script
echo =======================================================

:: 1. Cleanup
echo [1/3] Cleaning previous builds...
if exist "release" (
    echo   - Removing old release...
    rmdir /s /q "release"
)
if exist "dist" rmdir /s /q "dist"
if exist "dist-electron" rmdir /s /q "dist-electron"

:: 2. Build (Compile + Package)
echo [2/3] Building application (using electron-builder)...
:: Note: Mirror configuration is now handled in .npmrc
call pnpm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo =======================================================
echo [SUCCESS] Build completed successfully!
echo.
echo Output location:
echo   %~dp0release\MediaPicGen Setup 1.0.0.exe
echo   %~dp0release\win-unpacked\MediaPicGen.exe
echo.
echo =======================================================
pause
