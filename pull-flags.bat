@echo off
REM One-click flagged-hands pull.
REM Double-click this file to run the Supabase pull.
REM Output goes to: project-management\flag-pulls\flagged-YYYY-MM-DD.json and .md

cd /d "%~dp0"
echo.
echo ============================================
echo   Pulling flagged hands from Supabase...
echo ============================================
echo.

node scripts\pull-flagged-hands.js

echo.
echo ============================================
echo   Done. Press any key to close this window.
echo ============================================
pause >nul
