@echo off
chcp 65001 >nul
title OCPP Demo - Durdurma

echo.
echo ════════════════════════════════════════════════════════════
echo    🛑 OCPP Güvenlik Simülasyonu - Durduruluyor
echo ════════════════════════════════════════════════════════════
echo.

:: Kill Node processes
echo [1/2] Node.js işlemleri durduruluyor...
taskkill /f /im node.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    ✅ Node.js işlemleri durduruldu
) else (
    echo    ℹ️  Çalışan Node.js işlemi bulunamadı
)

:: Stop Docker containers (NOT remove - keeps data)
echo.
echo [2/2] Docker konteynerleri duraklatılıyor...
docker-compose stop
if %ERRORLEVEL% EQU 0 (
    echo    ✅ Docker konteynerleri durduruldu (veriler korunuyor)
) else (
    echo    ⚠️  Docker durdurma hatası
)

echo.
echo ════════════════════════════════════════════════════════════
echo    ✅ TÜM SERVİSLER DURDURULDU!
echo ════════════════════════════════════════════════════════════
echo.
echo    ℹ️  Veritabanı ve CP001 kaydı korunuyor.
echo    ℹ️  Tekrar başlatmak için: start-demo.bat
echo.
echo    ⚠️  Sıfırdan başlamak isterseniz: reset-demo.bat
echo.
pause
