@echo off
setlocal enabledelayedexpansion

echo =======================================================
echo           MultiT2I One-Click Build Script
echo =======================================================

:: 1. Cleanup
echo [1/5] Cleaning previous builds...
if exist "release-packager" (
    echo   - Removing old release...
    rmdir /s /q "release-packager"
)
if exist "build-stage" (
    echo   - Removing old build stage...
    rmdir /s /q "build-stage"
)
if exist "dist" rmdir /s /q "dist"
if exist "dist-electron" rmdir /s /q "dist-electron"

:: 2. Compile
echo [2/5] Compiling source code...
call pnpm run compile
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed!
    pause
    exit /b %errorlevel%
)

:: 3. Prepare Stage
echo [3/5] Preparing build stage...
mkdir build-stage
echo   - Copying dist...
xcopy /E /I /Q /Y dist build-stage\dist >nul
echo   - Copying dist-electron...
xcopy /E /I /Q /Y dist-electron build-stage\dist-electron >nul
echo   - Copying package.json...
copy /Y package.json build-stage\package.json >nul

:: 4. Package
echo [4/5] Packaging application (using electron-packager)...
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
call pnpm exec electron-packager build-stage MultiT2I --platform=win32 --arch=x64 --out=release-packager --overwrite
if %errorlevel% neq 0 (
    echo [ERROR] Packaging failed!
    pause
    exit /b %errorlevel%
)

:: 5. Cleanup Stage
echo [5/5] Cleaning up temporary files...
rmdir /s /q build-stage

echo.
echo =======================================================
echo [SUCCESS] Build completed successfully!
echo.
echo Output location:
echo   %~dp0release-packager\MultiT2I-win32-x64\MultiT2I.exe
echo.
echo You can now zip the folder 'release-packager\MultiT2I-win32-x64'
echo and share it with your friends.
echo =======================================================
pause
