@echo off
title Identix Biometric Cloud Bridge
color 0A
cls
echo ================================================================
echo    Starting Identix Hardware to Cloud Bridge...
echo ================================================================
echo.
cd /d "%~dp0"
node bridge\identix_bridge.js
pause
