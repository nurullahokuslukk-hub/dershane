# v0.2 geliştirme teslimi

Bu sürüm yeni öğrenci tasarımı, normalize deneme analizi, ödev teslim-kontrol ve etüt akışını ekler. Tam üretim MVP'si veya canlı Supabase dağıtımı değildir.

## Denemek için
1. Node 24.14+ (24.x) kurun.
2. `npm run seed`, sonra `npm start` çalıştırın.
3. `http://127.0.0.1:3100` açın. Rastgele test girişleri `.local/demo-credentials.json` içindedir.
4. Öğrenciyle deneme/plan/telefon ekranlarını; öğretmenle sonuç/ödev/etüt; rehberlikle özel not/kullanımı deneyin.
5. `npm test` ile 50 Node testini çalıştırın. Tarayıcı testleri için CI'daki sabit Playwright/Chromium kurulumu gerekir.

Bağımsız `design/preview.html` veya teslim edilen HTML tasarım önizlemesidir: kurgusal veriler, bellek içi değişiklikler, sayfa yenilenince sıfırlanır. Gerçek API ve auth kanıtı değildir.

## Kaynak ve kanıt
- https://github.com/nurullahokuslukk-hub/dershane/pull/5
- https://github.com/nurullahokuslukk-hub/dershane/actions
- docs/roadmap.md: açık kabul/yayın kapıları
- docs/supabase.md: PostgreSQL RLS temeli ve bağlanmamış runtime sınırı
- docs/mvp-v2.md: yeni API sözleşmesi

ZIP güvenli yerel geliştirme kaynak paketidir; bire bir GitHub git geçmişi/clone'u değildir. `.git`, `.local`, token, gerçek parola, SQLite veritabanı, node_modules, build ve imza anahtarları içermez. APK kaynaklardan veya ilgili başarılı CI artifact'ından alınır; bu pakette imzalı yayın APK'sı yoktur.

50 yerel otomatik test ve rol bazlı tarayıcı testi geçti. PostgreSQL RLS sorguları GitHub CI'da çalıştırıldı. Android için son commit'in CI sonucu kontrol edilmelidir. Fiziksel cihaz, Supabase Auth uçtan uca, production dağıtımı veya KVKK onayı yapılmadı. Bu sınırlar kaldırılmadan gerçek öğrenci verisi kullanılmamalı.
