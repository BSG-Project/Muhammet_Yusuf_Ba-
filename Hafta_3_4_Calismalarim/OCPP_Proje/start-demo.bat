@echo off
chcp 65001 >nul
title OCPP Demo - Başlatıcı

echo.
echo ════════════════════════════════════════════════════════════
echo    ⚡ OCPP Güvenlik Simülasyonu - Başlatılıyor
echo ════════════════════════════════════════════════════════════
echo.

:: Check if Docker is running
docker ps >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Docker çalışmıyor! Docker Desktop başlatılıyor...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo 30 saniye bekleniyor...
    timeout /t 30 /nobreak
)

:: Start Docker containers
echo [1/4] Docker konteynerleri başlatılıyor...
docker-compose up -d

:: Wait for Steve to be ready
echo.
echo ⏳ Steve CSMS hazır olana kadar bekleniyor (20 saniye)...
timeout /t 20 /nobreak

:: Start Attacker Server in new window
echo.
echo [2/4] Saldırgan Sunucusu başlatılıyor (Port 3001)...
start "Saldırgan Sunucusu" cmd /k "cd /d %~dp0attacker-server && npm run dev"

:: Wait a bit
timeout /t 3 /nobreak

:: Start Dashboard in new window
echo [3/4] Dashboard başlatılıyor (Port 3000)...
start "Dashboard" cmd /k "cd /d %~dp0dashboard && npm run dev"

:: Wait a bit
timeout /t 3 /nobreak

:: Start Vulnerable CP in new window
echo [4/4] Şarj Noktası Simülatörü başlatılıyor (Port 3002)...
start "Şarj Noktası HMI" cmd /k "cd /d %~dp0vulnerable-cp && npm run dev"

:: Wait for Next.js to compile (takes longer)
echo.
echo ⏳ Next.js Dashboard derleniyor (15 saniye)...
timeout /t 15 /nobreak

:: Open browsers
echo.
echo ════════════════════════════════════════════════════════════
echo    🌐 Tarayıcılar açılıyor...
echo ════════════════════════════════════════════════════════════
echo.

:: Open Dashboard first (main attack visualization)
echo    📊 Dashboard açılıyor...
start "" "http://localhost:3000"
timeout /t 2 /nobreak

:: Open Charge Point HMI
echo    ⚡ Şarj Noktası HMI açılıyor...
start "" "http://localhost:3002"
timeout /t 2 /nobreak

:: Open Steve CSMS home
echo    🖥️  Steve CSMS açılıyor...
start "" "http://localhost:8180/steve/manager/home"
timeout /t 2 /nobreak

:: Open GetDiagnostics page (attack trigger)
echo    🎯 Saldırı Sayfası (GetDiagnostics) açılıyor...
start "" "http://localhost:8180/steve/manager/operations/v1.6/GetDiagnostics"

echo.
echo ════════════════════════════════════════════════════════════
echo    ✅ TÜM SERVİSLER BAŞLATILDI!
echo ════════════════════════════════════════════════════════════
echo.
echo    📊 Dashboard:        http://localhost:3000
echo    ⚡ Şarj Noktası HMI: http://localhost:3002
echo    🖥️  Steve CSMS:       http://localhost:8180/steve/manager/home
echo    🎯 Saldırı Sayfası:  http://localhost:8180/steve/manager/operations/v1.6/GetDiagnostics
echo    🏴‍☠️ Attacker Server:  http://localhost:3001
echo.
echo ════════════════════════════════════════════════════════════
echo    ⚠️  ÖNEMLİ AYARLAR:
echo    1. Steve'de CP001 kayıtlı değilse:
echo       Data Management → Charge Points → Add → CP001
echo    2. RFID Kart ekleyin:
echo       Data Management → OCPP Tags → Add → DEMO_CARD_002
echo ════════════════════════════════════════════════════════════
echo.
echo    🎯 SALDIRI İÇİN:
echo    GetDiagnostics sayfasında:
echo    - Charge Point: CP001
echo    - Location: http://host.docker.internal:3001/upload
echo    - Perform butonuna tıklayın!
echo.
echo Bu pencereyi kapatmak için herhangi bir tuşa basın...
pause >nul
