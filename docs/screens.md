# Ekranlar · v0.2

## Tasarım sistemi
Sabit açık tema; beyaz/açık gri/lila yüzeyler, geniş yuvarlatılmış kartlar, hafif gölgeler, özgün 24px/1.7 stroke çizgi ikonları. Referansların görsel yönü kullanıldı; Iconly'nin ücretli dosyaları, Threads logosu ve fotoğraflar kopyalanmadı. 16px gövde, en az 14px küçük metin, 44px web etkileşim hedefi; görünür klavye odağı ve reduced-motion.

Mobilde alt menü ayrı alan ayırır; içerik onun arkasında gizlenmez. İçerik bölümü kaydırılabilir. Masaüstünde sol menü vardır. Grafik değerleri metin alternatifiyle sunulur; yalnız renk kullanılmaz.

## Öğrenci web
- Bugün: son net, önceki karşılaştırılabilir denemeye fark, gelişim, günlük çalışma ve ödevler.
- Deneme: TYT/AYT filtresi, deneme seçimi, doğru/yanlış/boş/net, ders kartları ve girilmiş konu notları.
- Planım: atanmış ödev, teslim notu, öğretmen geri bildirimi ve etüt.
- Telefon: tarih/cihaz/kategori, uygulama süreleri ve izin durumları.
- Artı: çalışma/soru/günlük kayıt formu.

## Personel
Atanmış öğrenciler arasında seçim; deneme girişi, ödev atama/kontrol, etüt/katılım. Rehberlik özel notlara ve izinli telefon verisine erişir; öğretmen/yönetici telefon verisine veya özel notlara erişmez. Yönetici bekleyen öğrenciyi onaylar. Tam kurum/şube/davet yönetimi henüz yok.

## Native Android
Bugün, Deneme, Planım, Telefon. Sonuç okuma, ders netleri, ödev teslimi ve etüt; ayrı rıza/OS izin ekranı. Akademik işlemler online; web ile tüm ekranlar bire bir eşit değildir. APK derleme başarısı fiziksel cihaz UX/ölçüm testi yerine geçmez.

## Durumlar
Eksik sınav sıfır değildir; farklı sınavlar karıştırılmaz. Ağ hatası boş veri gibi gösterilmez. Form doğrulama hatası yerinde kalır. Teslim sürüm çakışmasında yenileme gerekir. Dialog Escape ile kapanır. Geç gelen öğrenci cevabı yeni seçimi ezmez.

`design/preview.html` tek dosyalık, kurgusal ve bellekte çalışan bir önizlemedir; auth, kalıcı kayıt veya üretim güvenlik testi değildir.
