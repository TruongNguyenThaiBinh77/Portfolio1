@echo off
echo Kiem tra Docker Desktop...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker khong duoc tim thay. Vui long cai dat Docker Desktop va chay no truoc khi chay script nay.
    pause
    exit /b
)

echo Dang khoi dong portfolio...
docker compose up -d

echo ========================================================
echo Portfolio da duoc khoi dong ngam (nen)!
echo Ban co the xem tai: http://localhost:8080
echo.
echo De quan tri noi dung, chay file start-admin.bat
echo Admin Panel:  http://localhost:3000/admin
echo.
echo Luu y: Ban co the dong cua so nay ma trang web van chay.
echo De tat trang web, hay chay file stop.bat
echo ========================================================
pause

