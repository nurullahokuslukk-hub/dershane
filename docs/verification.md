# Doğrulama kaydı · v0.1.0-dev

## Kanıtlanan
- Node24.14.1 yerel domain/HTTP:37 test başarılı. Çapraz tenant/atama,rol filtreleri,izin iptali,replay,stale snapshot,canonical payload,CSRF,rate limit ve session hash kapsamı.
- GitHub API CI başarılı: https://github.com/nurullahokuslukk-hub/dershane/actions/runs/34208040066/job/102002131151
- Android unit test + assembleDebug başarılı: https://github.com/nurullahokuslukk-hub/dershane/actions/runs/34208521374/job/102003689982
- Debug APK workflow artifact'i geliştirme içindir; Play/production yayını değildir.
- Sentetik Chromium kontrolü:giriş/hata,kategori,not kaydı ve HTML escaping,mobil dialog/Escape,öğrenci kayıt oluşturma,izin iptali,öğretmen gizliliği,admin ekranı. Masaüstü1440px ve mobil390px render; yatay sayfa taşması/uncaught JS kontrolü.
- Son QA düzeltmesi:gecikmiş profil yanıtlarının yeni seçimi ezmesini engelleme,avatar baş harfleri,form aralıkları,satır içi geri bildirim. tests/browser.mjs bu kritik tarayıcı akışını CI'da tekrarlar; son PR kontrol sonucu ayrıca doğrulanır.

## Kanıtlanmayan / açık yayın kapıları
Fiziksel Android cihaz/OEM/pil/çoklu pencere ölçüm doğruluğu; tam offline geçmiş; tüm MVP ekranları;Postgres/RLS;yük ve bağımsız güvenlik;retention/backup-restore;hukuki roller/veli-temsil/rıza;Play kabulü.

Testlerin geçmesi bu başlıkları otomatik tamamlamaz. Main bir geliştirme tabanıdır,canlı ürün değildir.
