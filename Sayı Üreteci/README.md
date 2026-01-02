# Advanced Collatz-LFSR-SBox Random Number Generator

Bu proje, Kriptoloji dersi kapsamında **Collatz Sanısı (Collatz Conjecture)** problemini, **LFSR (Linear Feedback Shift Register)** ve **S-Box (Substitution Box)** yapılarıyla birleştirerek kriptografik açıdan güçlü bir rastgele sayı üreteci (CSPRNG) tasarlamayı amaçlar.

## Kullanılan Yöntemler ve Mimari
Proje 4 ana katmandan oluşmaktadır:
1.  **Kaos Katmanı (Collatz Conjecture):** Rastgeleliğin matematiksel temeli.
2.  **Dinamik Anahtar Katmanı (LFSR):** Donanımsal şifreleme mantığı ile periyodik karmaşıklık.
3.  **Karışıklık Katmanı (S-Box):** Doğrusallığı kırmak (non-linearity) için AES benzeri yerine koyma tablosu.
4.  **Dengeleme Katmanı (Von Neumann Extractor):** Üretilen bit dizisindeki 0 ve 1 oranını matematiksel olarak %50-%50 eşitlemek için.

## Algoritma Akış Şeması (Mantıksal)
1.  **BAŞLA:** Collatz Seed ve LFSR Seed değerlerini al.
2.  **COLLATZ ADIMI:** `3n+1` veya `n/2` kuralı ile 1 bit üret.
3.  **LFSR ADIMI:** Register'ı kaydır ve polinom ile XOR yaparak 1 bit üret.
4.  **XOR MIXING:** Collatz ve LFSR bitlerini XOR işlemine sok.
5.  **S-BOX:** Bitler 4'lü gruplar (Nibble) halinde birikince S-Box tablosundan geçir.
6.  **VON NEUMANN:** Çıktıyı ikili grupla:
    * `01` -> Çıktı `0`
    * `10` -> Çıktı `1`
    * `00` veya `11` -> At (Discard)
7.  **ÇIKTI:** Yeterli bit sayısına ulaşana kadar döngüye devam et.

## Algoritma Akış Şeması (Görsel)
```mermaid
graph TD
    Start([Başla: Seed_C & Seed_L]) --> Loop{Döngü: Hedef Bit Sayısı}
    
    subgraph "Bit Üretim Katmanı"
        Loop --> Collatz[Collatz İşlemi: 3n+1 / n/2]
        Loop --> LFSR[LFSR: Shift & Poly XOR]
        Collatz -- Bit C --> XOR((XOR Mixing))
        LFSR -- Bit L --> XOR
    end
    
    XOR -- Mixed Bit --> Buffer[Buffer'a Ekle]
    Buffer --> CheckBuffer{Buffer = 4 Bit?}
    
    CheckBuffer -- Hayır --> Loop
    CheckBuffer -- Evet --> SBox[S-Box Dönüşümü: Non-Linearity]
    
    subgraph "Dengeleme Katmanı"
        SBox -- 4 Bit --> Split[Bit Çiftlerini Ayır]
        Split --> VN{Von Neumann Kontrolü}
        VN -- "01" --> Out0[Çıktı: 0]
        VN -- "10" --> Out1[Çıktı: 1]
        VN -- "00 veya 11" --> Discard[At / Discard]
    end
    
    Out0 --> Stream[Anahtar Akışına Ekle]
    Out1 --> Stream
    Discard --> Loop
    Stream --> Loop
    
    style Start fill:#f9f,stroke:#333,stroke-width:2px
    style XOR fill:#f96,stroke:#333,stroke-width:2px
    style SBox fill:#69f,stroke:#333,stroke-width:2px
    style VN fill:#6f9,stroke:#333,stroke-width:2px
