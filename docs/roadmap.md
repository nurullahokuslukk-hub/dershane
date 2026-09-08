# MVP yol haritası ve kabul durumu · v0.2

8 Eylül 2026. "Kod var", "test edildi" ve "canlıya hazır" ayrı durumlardır. Merge, deploy değildir. Tam üretim MVP'si henüz tamamlanmadı.

## Tamamlanan geliştirme dilimi
- [x] Çok kiracılı yerel API, sunucuda rol/atama sınırları, web cookie/CSRF ve Android bearer.
- [x] İsteğe bağlı paket bazlı kullanım paylaşımı; cihaz/gün/revision/idempotency, iptal ve kategori görünümü.
- [x] Yeni responsive web tasarımı ve özgün ikonlar.
- [x] Normalize TYT/AYT ders sonuçları, sunucuda net hesabı ve öğrenci gelişim analizi.
- [x] Ödev atama/teslim/düzeltme/doğrulama; etüt planı ve katılım.
- [x] Android öğrenci sonuç/plan ekranlarının kaynakları ve derleme iş akışı.
- [x] Supabase/PostgreSQL 14 tablo, read-only RLS ve gerçek PostgreSQL izolasyon testleri.
- [x] 50 Node testi ve rol bazlı tarayıcı regresyonları.

Bu işaretler üretim uygunluğunu veya gerçek cihaz testini ifade etmez. Son commit'in CI sonucu ayrıca kontrol edilir.

## Kalan işler — bağımlılık sırası
1. **Üretim veri ve kimlik katmanı.** Bölge/sözleşme kararı, güvenli proje bağlantısı, Node domain ile eşdeğer transactional RPC/repository, Supabase Auth, oturum yenileme, kurtarma ve personel MFA. Kabul: normal kullanıcı oturumlarıyla başarılı yazım + başka kurum/öğrenciye ret; idempotency, iptal ve audit aynı transaction içinde. Service key istemcide bulunmaz.
2. **Kurum ve kabul yönetimi.** Sistem yöneticisi, kurum/şube/sınıf, personel ataması, davet ve onay akışı. Kabul: kullanıcı kendi rolünü değiştiremez; görevden alma derhal etkili olur; bekleyen öğrenci verisine erişemez.
3. **Akademik veri bütünlüğü.** Deneme düzeltme/revision geçmişi, doğrulanmış CSV import, sayfalama, öğretmen ders kapsamı ve daha fazla konu girdisi. Kabul: yanlış kapasite, çift import, farklı sınav dağılımı ve izinsiz düzeltme testleri. Sıralama/yerleştirme puanı uydurulmaz.
4. **Android pilot sağlamlığı.** Akademik offline kuyruk, 409/422 çözüm ekranları, uzun offline kullanım boşlukları, hesap değişimi ve gerçek cihaz matrisi. Kabul: yeniden başlatma, ağ kaybı, gün/saat değişimi, izin iptali ve OEM pil davranışında kayıp/sızıntı yok; eksik veri sıfır kabul edilmez.
5. **Hukuki süreç ve veri yaşam döngüsü.** Veli/temsil doğrulaması, aydınlatma ve tercih sürümleri, veri talebi/hesap silme, retention, yedekleme ve geri yükleme tatbikatı. Kabul: iptal ile toplama durur; silme ve backup restore kayıtları denetlenebilir. KVKK incelemesi dış uzman onayı gerektirir.
6. **Yayın.** İzleme, alarm, yük/güvenlik incelemesi, staging, gönüllü küçük pilot, Play Data safety/hesap silme/target SDK ve imzalı sürüm. Kabul: kritik hata yok, geri alma ve restore denenmiş, izin matrisi gerçek cihazda kanıtlanmış.
7. **Pilot iyileştirmesi.** Kategori kataloğu yönetimi/sürümleme, çoklu pencere/OEM ölçüm değerlendirmesi, kullanıcı geri bildirimi ve ticari plan.

Önceki 10–12 haftalık plan ekip ve dış onaylara bağlı kaba tahmindi; bu belge tarih garantisi vermez. Bir sonraki teknik bağımlılık canlıya uygun Postgres/Auth katmanıdır, ancak doğrulanmamış telefon verisi veya hukuki süreç olmadan gerçek veriyle pilot başlatılmaz.

## Her iş için Done
Kod + olumlu/olumsuz otomatik test + kurum/atama/izin kontrolü + mobil/masaüstü/hata/boş durum görsel incelemesi + güncel belge + migration/geri alma değerlendirmesi. Dış onay veya fiziksel cihaz kanıtı gereken iş, yalnız kod yazılarak kapatılamaz.
