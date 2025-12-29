# OCPP Güvenlik Açığı Simülasyonu

> ⚠️ **UYARI:** Bu proje yalnızca eğitim ve güvenlik araştırması amaçlıdır. Gerçek sistemlerde yetkisiz kullanımı yasaktır.

## 🎯 Proje Hakkında

Bu proje, OCPP 1.6J protokolündeki `GetDiagnostics` komutunun kötüye kullanılmasıyla oluşan **bilgi sızıntısı güvenlik açığını** görselleştirir.

### Saldırı Senaryosu
1. Saldırgan, CSMS üzerinden şarj istasyonuna `GetDiagnostics` komutu gönderir
2. Komuttaki upload URL'ini kendi sunucusuna yönlendirir
3. Şarj istasyonu, yapılandırma dosyalarını saldırganın sunucusuna yükler
4. Dashboard, saldırıyı gerçek zamanlı olarak görselleştirir

## 🏗️ Sistem Mimarisi

```
┌─────────────────┐    GetDiagnostics     ┌─────────────────┐
│   Steve CSMS    │ ─────────────────────▶│   Şarj Noktası  │
│   (Docker)      │   (Zararlı URL ile)   │   (HMI :3002)   │
│   :8180         │                       │                 │
└─────────────────┘                       └────────┬────────┘
                                                   │
                                          Teşhis Dosyası Yükleme
                                                   │
                                                   ▼
┌─────────────────┐    Socket.io          ┌─────────────────┐
│    Dashboard    │ ◀────────────────────│ Saldırgan       │
│   (Next.js)     │   Gerçek Zamanlı     │ Sunucusu        │
│   :3000         │                       │   :3001         │
└─────────────────┘                       └─────────────────┘
```

## 📋 Gereksinimler

- **Node.js** v20+ (LTS)
- **Docker Desktop** (Docker Compose v2)
- **npm** paket yöneticisi

---

## 🚀 Hızlı Başlangıç (Önerilen)

### Batch dosyaları ile çift tıklamalı kurulum:

| Dosya | Açıklama |
|-------|----------|
| `install.bat` | 📦 İlk kurulum (npm install + Docker) |
| `start-demo.bat` | ▶️ Tüm servisleri başlatır |
| `stop-demo.bat` | ⏹️ Servisleri durdurur (veri korunur) |
| `reset-demo.bat` | 🗑️ Her şeyi sıfırlar |
| `trigger-attack.bat` | 🎯 Saldırı sayfasını açar |

**İlk kullanım:**
1. `install.bat` → Çift tıkla
2. `start-demo.bat` → Çift tıkla
3. Steve'de CP001 ve RFID kartını kaydedin (aşağıya bakın)

**Sonraki kullanımlar:**
1. `start-demo.bat` → Çift tıkla

---

## 📝 Steve'de Gerekli Ayarlar

### 1. Şarj Noktası Kaydı
1. http://localhost:8180/steve/manager/home
2. **Data Management** → **Charge Points** → **Add**
3. **Charge Point ID:** `CP001`
4. **Add** butonuna tıklayın

### 2. RFID Kart Kaydı
1. **Data Management** → **OCPP Tags** → **Add**
2. **ID Tag:** `DEMO_CARD_002`
3. **Max. Active Transaction Count:** `-1` (sınırsız)
4. **Add** butonuna tıklayın

---

## 🎮 Saldırı Simülasyonu

### GetDiagnostics Saldırısı

1. Steve'de GetDiagnostics sayfasına gidin:
   ```
   http://localhost:8180/steve/manager/operations/v1.6/GetDiagnostics
   ```

2. Parametreleri girin:
   - **Charge Point:** `CP001`
   - **Location (Kopyala-Yapıştır):**
   ```
   http://localhost:3001/upload
   ```

3. **Perform** butonuna tıklayın

4. Sonuçları izleyin:
   - 📊 **Dashboard:** http://localhost:3000
   - ⚡ **Şarj Noktası HMI:** http://localhost:3002

---

## 🔧 Port Tablosu

| Servis | Port | URL |
|--------|------|-----|
| Steve Web Arayüzü | 8180 | http://localhost:8180/steve/manager/home |
| Dashboard | 3000 | http://localhost:3000 |
| Şarj Noktası HMI | 3002 | http://localhost:3002 |
| Saldırgan Sunucusu | 3001 | http://localhost:3001 |
| MariaDB | 3306 | - |

---

## 📁 Proje Yapısı

```
proje/
├── install.bat               # Kurulum scripti
├── start-demo.bat            # Başlatma scripti
├── stop-demo.bat             # Durdurma scripti
├── reset-demo.bat            # Sıfırlama scripti
├── docker-compose.yml        # Steve CSMS ve MariaDB
│
├── attacker-server/          # 🏴‍☠️ Saldırgan Sunucusu (:3001)
│   ├── src/index.ts          # Express + Socket.io
│   ├── src/file-analyzer.ts  # Hassas veri analizi
│   └── stolen-data/          # Çalınan dosyalar
│
├── vulnerable-cp/            # 🎯 Şarj Noktası Simülatörü (:3002)
│   ├── src/index.ts          # OCPP Client + Express HMI
│   ├── src/mock-fs.ts        # Simüle yapılandırma dosyaları
│   └── public/               # HMI Panel arayüzü
│       ├── index.html
│       ├── styles.css
│       └── client.js
│
└── dashboard/                # 📊 Saldırı Dashboard'u (:3000)
    ├── src/app/page.tsx
    ├── src/lib/useSocket.ts
    └── src/components/
```

---

## 🛑 Sistemi Durdurma

```bash
# Servisleri durdur (veri korunur)
stop-demo.bat

# Her şeyi sıfırla (veritabanı dahil)
reset-demo.bat
```

---

## ⚠️ Güvenlik Uyarısı

✅ **İzin Verilen:**
- Güvenlik eğitimi
- İzinli penetrasyon testleri
- Akademik araştırma

❌ **Yasak:**
- Yetkisiz erişim
- Gerçek sistemlere saldırı

---

## 📚 Kaynaklar

- [OCPP 1.6J Spesifikasyonu](https://www.openchargealliance.org/)
- [Steve CSMS GitHub](https://github.com/steve-community/steve)

---

**BSG Simülasyon Projesi** - OCPP Güvenlik Açığı Demonstrasyonu
