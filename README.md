# Dershane · v0.1.0-dev

**Yerel web/API ve native Android geliştirme sürümü. Tamamlanmış üretim ürünü veya Play Store yayını değildir.**

İstenen akış: öğrenci onayı + Android kullanım erişimi → uygulama bazlı süre → güvenli sunucu → kategori/gün/cihaz → atanmış rehberlik.

## Hemen çalıştır
Node.js 24.14+ (24.x):
```sh
node scripts/seed.ts
node apps/api/src/server.ts
# http://127.0.0.1:3100
node --test tests/*.test.ts
```
Harici npm paketi gerekmez. Giriş bilgileri seed sırasında rastgele üretilip `.local/demo-credentials.json` içine yazılır. Bu dosya, DB ve tokenlar Git'e alınmaz. Seed mevcut DB'yi ezmez. Roller: rehberlik, ogretmen, ogrenci, admin; kurum `cizre-demo`. Sadece kurgusal veri kullanılır.

## Çalışan kapsam
- Web giriş/çıkış; rol, tenant ve atanmış öğrenci kapsamı.
- Rehberlikte uygulama/gün/cihaz/kategori seçimi ve kullanım süresine göre sıralama.
- Öğrenci çalışma/soru/günlük bildirim; öğretmen deneme/ödev/katılım kaydı; özel rehberlik notları; pending öğrenci onayı.
- Android bearer + web cookie/CSRF; izin sürümü, cihaz sahipliği, tekil batch, artan snapshot revision, atomik kayıt/audit.
- İptalde kullanım tablolarını temizleme ve yeni/replay aktarımını reddetme.

## Henüz tamamlanmayanlar
PostgreSQL üretim adaptörü/RLS testleri, tüm Android ekranları ve gerçek cihaz testleri, davet/veli-temsil akışı, MFA/parola kurtarma/refresh rotation, gelişmiş ödev iş akışı, kalıcı retention/backup-restore, production dağıtımı ve Play incelemesi. SQLite adaptörü `NODE_ENV=production` ile açılmaz. Demo onayı hukuki süreç yerine geçmez.

Android kurulum ve sınırları: [android/README.md](android/README.md). GitHub Actions debug build sonucu ayrıca kontrol edilmelidir; build başarısı cihaz doğrulaması değildir.

Tasarım önizlemesi: `python3 scripts/build-preview.py` ardından `design/preview.html` açın (sentetik, kalıcı değil). Belgeler: [Ürün](docs/product.md) · [Mimari](docs/architecture.md) · [Veri modeli](docs/data-model.md) · [Ekranlar](docs/screens.md) · [Yol haritası](docs/roadmap.md) · [Güvenlik/KVKK](docs/security.md) · [API](docs/api.md).
