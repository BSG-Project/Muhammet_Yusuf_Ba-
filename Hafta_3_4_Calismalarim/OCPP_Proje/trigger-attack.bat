@echo off
chcp 65001 >nul
title OCPP Demo - Saldırı Tetikleme

echo.
echo ════════════════════════════════════════════════════════════
echo    🎯 OCPP Saldırı Simülasyonu - GetDiagnostics
echo ════════════════════════════════════════════════════════════
echo.
echo Bu script Steve üzerinden GetDiagnostics komutu gönderir.
echo.
echo ⚠️  ÖNEMLİ: 
echo    1. Tüm servislerin çalıştığından emin olun (start-demo.bat)
echo    2. Steve'de CP001 kayıtlı olmalı
echo.
echo ════════════════════════════════════════════════════════════
echo.

set /p confirm="Saldırıyı başlatmak için ENTER tuşuna basın (iptal: CTRL+C)..."

echo.
echo 🚀 Steve Web arayüzü açılıyor...
echo.
echo ────────────────────────────────────────────────────────────
echo    Manuel Adımlar:
echo ────────────────────────────────────────────────────────────
echo    1. Operations → GetDiagnostics
echo    2. Charge Point: CP001
echo    3. Location: http://host.docker.internal:3001/upload
echo    4. Perform butonuna tıklayın
echo ────────────────────────────────────────────────────────────
echo.
echo 📺 Dashboard ve HMI Panel'i izleyin!
echo.

start "" "http://localhost:8180/steve/manager/operations/v1.6/GetDiagnostics"

echo Kapatmak için herhangi bir tuşa basın...
pause >nul
