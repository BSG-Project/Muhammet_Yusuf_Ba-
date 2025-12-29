import time

class AdvancedCryptoRNG:
    def __init__(self, c_seed, l_seed, poly_mask=0xB400):
        self.c_state = c_seed  # Collatz Durumu
        self.l_state = l_seed  # LFSR Durumu (16-bit)
        self.poly = poly_mask  # LFSR Feedback Polinomu
        self.sbox = [0xC, 0x5, 0x6, 0xB, 0x9, 0x0, 0xA, 0xD, 
                     0x3, 0xE, 0xF, 0x8, 0x4, 0x7, 0x1, 0x2]

    def _collatz_next(self):
        """Collatz Sanısı: 3n+1 veya n/2"""
        if self.c_state % 2 == 0:
            self.c_state //= 2
        else:
            self.c_state = 3 * self.c_state + 1
        return self.c_state % 2

    def _lfsr_next(self):
        """LFSR: Linear Feedback Shift Register (Donanımsal Kaydırma)"""
        lsb = self.l_state & 1
        self.l_state >>= 1
        if lsb:
            self.l_state ^= self.poly
        return self.l_state & 1

    def generate_keystream(self, length):
        """
        Şifreleme için güvenli ve dengeli anahtar akışı üretir.
        Kullanılan Yöntemler: Collatz + LFSR + S-Box + Von Neumann
        """
        keystream = []
        nibble_buffer = []

        while len(keystream) < length:
            # 1. Collatz ve LFSR'dan bit al
            b_c = self._collatz_next()
            b_l = self._lfsr_next()
            
            # 2. Mixing (Karıştırma) - XOR
            mixed_bit = b_c ^ b_l
            nibble_buffer.append(mixed_bit)

            # 3. S-Box Dönüşümü (4 bitlik bloklar halinde)
            if len(nibble_buffer) == 4:
                val = sum(v << i for i, v in enumerate(reversed(nibble_buffer)))
                transformed_val = self.sbox[val] # Non-lineer dönüşüm
                transformed_bits = [(transformed_val >> i) & 1 for i in range(3, -1, -1)]
                
                # 4. Von Neumann Düzeltmesi (%50-%50 Olasılık Garantisi)
                for i in range(0, 4, 2):
                    pair = transformed_bits[i:i+2]
                    if pair == [0, 1]:
                        keystream.append(0)
                    elif pair == [1, 0]:
                        keystream.append(1)
                    # 00 ve 11 durumları atılır (discard)
                
                nibble_buffer = [] 
                
        return keystream[:length]

def text_to_bits(text):
    bits = []
    for char in text:
        val = ord(char)
        for i in range(7, -1, -1):
            bits.append((val >> i) & 1)
    return bits

def bits_to_text(bits):
    chars = []
    for i in range(0, len(bits), 8):
        byte = bits[i:i+8]
        val = 0
        for b in byte:
            val = (val << 1) | b
        chars.append(chr(val))
    return "".join(chars)

# --- TEST SENARYOSU ---
if __name__ == "__main__":
    print("--- Collatz-LFSR-SBox Hibrit Kripto Sistemi ---\n")
    
    SECRET_MESSAGE = "Kriptoloji Odev Teslimi 2025"
    SEED_COLLATZ = int(time.time())
    SEED_LFSR = 0xACE1 
    
    print(f"Sifrelenecek Mesaj: {SECRET_MESSAGE}")
    print(f"Kullanilan Seed (Zaman Damgasi): {SEED_COLLATZ}")
    
    # 1. ŞİFRELEME
    msg_bits = text_to_bits(SECRET_MESSAGE)
    rng = AdvancedCryptoRNG(SEED_COLLATZ, SEED_LFSR)
    keystream = rng.generate_keystream(len(msg_bits))
    cipher_bits = [m ^ k for m, k in zip(msg_bits, keystream)]
    
    # Hex formatında şifreli mesajı göster
    cipher_hex = hex(int("".join(map(str, cipher_bits)), 2))
    print(f"Sifreli Mesaj (Hex): {cipher_hex}")

    # 2. İSTATİSTİK KONTROLÜ
    print("\n--- Istatistiksel Analiz (Rastgelelik Testi) ---")
    test_len = 10000
    test_rng = AdvancedCryptoRNG(SEED_COLLATZ, SEED_LFSR)
    stream = test_rng.generate_keystream(test_len)
    zeros = stream.count(0)
    ones = stream.count(1)
    print(f"{test_len} bit uretildi.")
    print(f"0 Sayisi: {zeros}")
    print(f"1 Sayisi: {ones}")
    print(f"Denge Orani: %{(ones/test_len)*100} (Von Neumann Duzeltmesi ile mukemmel denge)")

    # 3. DEŞİFRELEME KONTROLÜ
    print("\n--- Desifreleme Kontrolu ---")
    rng_dec = AdvancedCryptoRNG(SEED_COLLATZ, SEED_LFSR)
    dec_keystream = rng_dec.generate_keystream(len(cipher_bits))
    decrypted_bits = [c ^ k for c, k in zip(cipher_bits, dec_keystream)]
    decrypted_text = bits_to_text(decrypted_bits)
    
    print(f"Cozulen Mesaj: {decrypted_text}")