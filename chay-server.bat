@echo off
REM Bam doi vao file nay de chay server nhan xac nhan va loi chuc.
REM Cu de cua so nay mo, dong lai la So Luu But tren thiep se bien mat.
title Wedding RSVP Server - DUNG DONG CUA SO NAY
cd /d "%~dp0"
echo.
echo   Server dang chay tai http://localhost:4000
echo   Dong cua so nay se tat So Luu But tren thiep.
echo.
node index.js
pause
