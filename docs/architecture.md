# Mimari

## Çalışan yerel yapı
Web (HTML/CSS/ES modülleri) → Node.js24 TypeScript modular-monolith API → SQLite yerel demo adaptörü.
Android Kotlin → HTTPS JSON bearer API; UsageStatsManager → cihazda ForegroundReducer → Keystore şifreli SQLite outbox → WorkManager. Android build/test durumu Actions'ta; fiziksel cihaz doğrulaması ayrı kapı.

## Üretim hedefi
Aynı domain modülleri + PostgreSQL17+ repository, versioned migrations, gerçek runtime rolüyle FORCE RLS. HTTPS reverse proxy, ayrı auth/tenant/academic/privacy/telemetry/guidance modülleri, worker/outbox. Mikroservis/Redis/Kubernetes ancak ölçülen ihtiyaç olursa. Tek kod tabanı; web framework geçişi zorunlu değil.
Tenant istemci body/header'ından alınmaz; doğrulanmış session'ın üyeliğinden gelir. Tüm sorgularda tenant ve atama kontrolü; tüm çocuk kayıtlarda composite FK. Üretim request'i transaction içinde SET LOCAL app.tenant_id; runtime rolü tablo sahibi/superuser/BYPASSRLS değildir. RLS uygulama yetkisini kaldırmaz. Auth lookup ayrı en dar yetkili yüzeydir. Export/cache/jobs aynı izolasyona tabidir.

## Süre ve sync
Gün Europe/Istanbul; timestamp ISO UTC. Tam gün snapshot, delta toplama değil. Batch UUID + canonical payload hash: replay aynı sonuç, farklı içerik409. Device/day monoton revision ve sabit windowStart; eski snapshot409. Yeni snapshot eskisini atomik değiştirir, süreler iki kez eklenmez. İzin versiyonu zorunlu, izin öncesi pencere yasak. Toplam süre ölçüm penceresini aşamaz. Kategori sunucu kataloğundan; bilinmeyen sınıflandırılmamış. Katalog sürümleme/historik kategori sabitleme üretim işidir.

## Güvenlik/işletim
Scrypt N32768,r8,p1 + salt; token hash ile saklanan opak8 saat session; web HttpOnly/SameSite=Strict + Origin/CSRF; mobil bearer Keystore. Yerel HTTP localhost; prod adaptör fail-closed. Login IP rate limit, body limiti, parametrik SQL, no-store, CSP. Token/payload/not audit'e yazılmaz. Mobil refresh/MFA/recovery tamamlanmadı.
Türkiye lokasyonlu hosting/backup hedefi; sağlayıcı sözleşme/veri akışları/hukuki değerlendirme sonrası seçilir. Dev/staging/prod ayrı ortam. Hedef RPO24h/RTO4h; restore testi olmadan SLA değil. 5.000 sentetik öğrenci ve p95<500ms yük testi hedefi; ölçülmüş kapasite değil.

## Modüller ve geliştirme
apps/api/src/domain.ts doğrulama/kategori/zaman; store.ts demo repository/use case; server.ts HTTP/auth routing. Üretime geçişte tenant-aware repository arayüzleriyle dar modüllere böl. apps/web view/client; android collector/outbox/worker.
Main geliştirme tabanıdır; production deploy değildir. PR+test+review gerekir. Migration expand/migrate/contract; destructive rollback yerine forward-fix. İki mobil sürüm/90 gün geri uyumluluk hedefi sözleşmeyle doğrulanır.
