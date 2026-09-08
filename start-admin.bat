@echo off
title Portfolio Admin Panel
echo.
echo  ======================================
echo    Portfolio Admin Panel
echo  ======================================
echo.
echo  [*] Dang khoi dong admin server...
echo  [*] Mo trinh duyet tai: http://localhost:3000/admin/
echo.
echo  Nhan Ctrl+C de dung server.
echo.
cd /d "%~dp0"
node admin-server.js
pause
