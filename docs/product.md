# Ürün kararı · 8 Eylül 2026

Kaynak: sağlanan urun-tanimi.pdf ve son kullanıcı düzeltmesi. Ürün gözetim değil rehberlik SaaS'ıdır. Her dershane tenant; ilk pazar Cizre, kod Türkiye geneline uygun. Reklam, veri satışı, native iOS, AI/risk skoru ve otomatik cezalandırma kapsam dışı.

## Telefon kullanım akışı
1. Öğrenci davetle kayıt, temsil/aydınlatma süreci, admin onayı. Bu onboarding henüz kodlanmadı; demo hesapları seed'den.
2. Kullanım paylaşımı ayrı ve isteğe bağlı onay. Android'in kullanım erişimi ayrıca kullanıcı tarafından açılır. İki adım da olmadan toplama yok.
3. Cihazda ön plan olaylarından uygulama başına saniye hesaplanır; ham olaylar, mesajlar, ekran içeriği, dosyalar ve konum gönderilmez. Uygulama paket adı + gün + cihaz + süre + ölçüm penceresi/kalitesi gider.
4. Sunucu tenant/user/device/consentVersion denetler; uygulama kategorisini istemciden kabul etmez. Bilinmeyen paketler sınıflandırılmamış kalır. Paket listesi hassas çıkarım riski taşıyabileceği için hukuk incelemesi zorunludur.
5. Rehberlik sadece atanmış öğrencinin verisini görür; öğrenci kendi verisini görür. Öğretmen ve kurum admini telefon verisi/özel notu otomatik okuyamaz.
6. Gün + cihaz seçilir; uygulamalar azalan süreyle sıralanır, kategori filtresi uygulanır. Cihazlar toplanıp tek ekran süresi diye sunulmaz. Süre, içerik veya çalışma kalitesi kanıtı değildir.
7. İptal: yerelde toplama durur, şifreli kuyruk silinir, sunucuya iptal online olduğunda iletilir. Sunucu kullanım kayıtlarını temizler ve eski batch'leri reddeder. Diğer akademik işlevler etkilenmez.

## Diğer kararlar
Öğrenci kodu + kurum kodu + parola; personelde pilot öncesi MFA. Öğrenci e-posta/telefon zorunlu değil. Davet tek kullanımlık,72 saat,hash; admin onayı. Europe/Istanbul yerel gün; olay zamanları UTC. Çalışma/soru öğrenci beyanı, akademik girdi öğretmen kaynağı olarak etiketlenir. Deneme yanlış ceza böleni sınavda açıkça tanımlıdır. Eksik kayıt sıfır değildir. Günlük bildirim çalışma planı hakkındadır, sağlık tanısı/ruh hali testi değildir.

Ücret: kurum aboneliği + aktif öğrenci bandı; pilot sonrası maliyet/görüşmelerle sayısal fiyat. Bildirimler sonraki aşamada, hassas içeriksiz ve21.00–08.00 sessiz. Dershane başına ayrı kod yok; kontrollü tenant feature flag.
