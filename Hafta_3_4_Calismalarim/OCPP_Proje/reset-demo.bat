@echo off
chcp 65001 >nul
title OCPP Demo - Sıfırlama

echo.
echo ════════════════════════════════════════════════════════════
echo    ⚠️  OCPP Demo - SIFIRLAMA (Tüm Veriler Silinecek!)
echo ════════════════════════════════════════════════════════════
echo.
echo Bu işlem:
echo    - Tüm Docker konteynerlerini siler
echo    - Veritabanını siler (CP001 kaydı dahil)
echo    - Çalınan dosyaları siler
echo.
echo ════════════════════════════════════════════════════════════
echo.

set /p confirm="Devam etmek için 'EVET' yazın: "

if /i not "%confirm%"=="EVET" (
    echo İptal edildi.
    pause
    exit /b 0
)

echo.
echo [1/3] Node.js işlemleri durduruluyor...
taskkill /f /im node.exe 2>nul

echo.
echo [2/3] Docker konteynerleri ve volume'lar siliniyor...
docker-compose down -v --remove-orphans

echo.
echo [3/3] Çalınan dosyalar temizleniyor...
if exist "attacker-server\stolen-data" (
    del /q "attacker-server\stolen-data\*" 2>nul
    echo    ✅ stolen-data klasörü temizlendi
)

echo.
echo ════════════════════════════════════════════════════════════
echo    ✅ SİFIRLAMA TAMAMLANDI!
echo ════════════════════════════════════════════════════════════
echo.
echo    Yeniden başlatmak için:
echo    1. install.bat (bağımlılıklar zaten yüklü ise atla)
echo    2. start-demo.bat
echo    3. Steve'de CP001'i yeniden kaydedin
echo.
pause
