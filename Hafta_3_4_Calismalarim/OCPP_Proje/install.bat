@echo off
chcp 65001 >nul
title OCPP Demo - Kurulum

echo.
echo ════════════════════════════════════════════════════════════
echo    OCPP Güvenlik Simülasyonu - Kurulum
echo ════════════════════════════════════════════════════════════
echo.

echo [1/4] Docker konteynerleri başlatılıyor...
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo HATA: Docker başlatılamadı! Docker Desktop çalışıyor mu?
    pause
    exit /b 1
)

echo.
echo [2/4] Attacker Server bağımlılıkları yükleniyor...
cd attacker-server
call npm install
cd ..

echo.
echo [3/4] Vulnerable CP bağımlılıkları yükleniyor...
cd vulnerable-cp
call npm install
cd ..

echo.
echo [4/4] Dashboard bağımlılıkları yükleniyor...
cd dashboard
call npm install
cd ..

echo.
echo ════════════════════════════════════════════════════════════
echo    ✅ Kurulum tamamlandı!
echo ════════════════════════════════════════════════════════════
echo.
echo Şimdi start-demo.bat dosyasını çalıştırabilirsiniz.
echo.
pause
