import math
import time
import sys
# Senin ana dosyanın adı main.py olduğu için oradan class'ı çekiyoruz
try:
    from main import AdvancedCryptoRNG
except ImportError:
    print("HATA: main.py dosyası bulunamadı. Lütfen bu dosyayı main.py ile aynı klasöre koyun.")
    sys.exit(1)

class DiehardTest:
    """
    Diehard / NIST Rastgelelik Testleri Bataryası
    Bu sınıf, üretilen sayıların istatistiksel olarak rastgele olup olmadığını test eder.
    """
    def __init__(self, bit_stream):
        self.bits = bit_stream
        self.n = len(bit_stream)

    # 1. Monobit (Frequency) Testi - Temel Denge
    def monobit_test(self):
        ones = sum(self.bits)
        zeros = self.n - ones
        # -1 (0 için) ve +1 (1 için) toplamı
        s = abs(ones - zeros)
        p_value = math.erfc(s / (math.sqrt(2 * self.n)))
        return p_value

    # 2. Runs Testi - Ardışık Dizilimler
    def runs_test(self):
        pi = sum(self.bits) / self.n
        if abs(pi - 0.5) > (2 / math.sqrt(self.n)):
            return 0.0 # Frekans testi geçilemediyse bu da geçersizdir
        
        v_n = 1
        for i in range(self.n - 1):
            if self.bits[i] != self.bits[i+1]:
                v_n += 1
                
        num = abs(v_n - 2 * self.n * pi * (1 - pi))
        den = 2 * math.sqrt(2 * self.n) * pi * (1 - pi)
        p_value = math.erfc(num / den)
        return p_value

    # 3. Serial Test (Ardışık İkili İlişkiler)
    def serial_test(self):
        counts = {'00': 0, '01': 0, '10': 0, '11': 0}
        for i in range(self.n - 1):
            pair = f"{self.bits[i]}{self.bits[i+1]}"
            counts[pair] += 1
        
        expected = (self.n - 1) / 4
        chi_sq = sum([(counts[k] - expected)**2 / expected for k in counts])
        return math.exp(-chi_sq / 2)

    # 4. Autocorrelation (Özilişki) Testi
    def autocorrelation_test(self, lag=1):
        xor_sum = 0
        for i in range(self.n - lag):
            xor_sum += (self.bits[i] ^ self.bits[i + lag])
        
        numerator = 2 * (xor_sum - ((self.n - lag) / 2))
        denominator = math.sqrt(self.n - lag)
        result = numerator / denominator
        p_value = math.erfc(abs(result) / math.sqrt(2))
        return p_value

def run_diehard_suite():
    print("--- DIEHARD / NIST İSTATİSTİKSEL TEST RAPORU ---")
    print("Algoritma: Collatz-LFSR-SBox (AdvancedCryptoRNG)")
    
    # Test için veri üretimi (En az 20.000 bit önerilir)
    TEST_SIZE = 20000
    SEED_C = int(time.time())
    SEED_L = 0xACE1
    
    print(f"Veri Seti Hazırlanıyor... ({TEST_SIZE} bit)")
    rng = AdvancedCryptoRNG(SEED_C, SEED_L)
    bits = rng.generate_keystream(TEST_SIZE)
    
    tester = DiehardTest(bits)
    
    tests = [
        ("Monobit (Frequency) Test", tester.monobit_test()),
        ("Runs Test (Ardışıklık)", tester.runs_test()),
        ("Serial Test (İkili İlişki)", tester.serial_test()),
        ("Autocorrelation (Lag=5)", tester.autocorrelation_test(lag=5))
    ]
    
    print("-" * 60)
    print(f"{'TEST ADI':<30} | {'P-DEĞERİ':<10} | {'SONUÇ'}")
    print("-" * 60)
    
    success_count = 0
    for name, p in tests:
        # P-Değeri 0.01'den büyükse rastgelelik kabul edilir
        status = "BAŞARILI" if p >= 0.01 else "BAŞARISIZ"
        if status == "BAŞARILI": success_count += 1
        print(f"{name:<30} | {p:.5f}    | {status}")
        
    print("-" * 60)
    
    if success_count == len(tests):
        print("\n[ONAY] Üreteç, Diehard/NIST test kriterlerini karşılıyor.")
        print("Sonuç: GÜVENLİ (Kriptografik olarak kullanılabilir aday).")
    else:
        print(f"\n[UYARI] {len(tests) - success_count} test başarısız oldu.")

if __name__ == "__main__":
    run_diehard_suite()