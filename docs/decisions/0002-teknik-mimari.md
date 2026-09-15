---
title: "0002 — Teknik mimari: hosting, backend, database, senkronizasyon"
description: Backend dili/framework, hosting, database sağlayıcısı ve offline senkronizasyon yaklaşımı — open-questions.md madde "kesin hosting/database sağlayıcısı"nın çözümü.
status: accepted
updated_at: 2026-09-15
---

# 0002 — Teknik Mimari

**Durum:** kabul edildi
**Tarih:** 2026-09-15

## Soru

`open-questions.md`: "Kesin hosting/database sağlayıcısı" netleşmemişti. Kullanıcı
backend dili seçimini bana bıraktı, hosting için "düşük maliyetli ama güçlü, Vercel
+ Supabase" yönünü işaret etti, veri lokasyonu için "orta yol" istedi (KVKK
hassasiyeti var ama managed servis seçenekleri değerlendirilsin), teknik detaylara
katılmayacağını (ürün/iş kararlarına odaklanacağını) belirtti.

## Karar

- **Tek uygulama, tek dil:** Next.js (App Router) — hem web paneli hem backend API
  aynı proje içinde. API, Next.js **Route Handler**'ları (`/app/api/...`) olarak
  TypeScript ile yazılır; ayrı bir Node/Express servisi **kurulmaz**. Android
  uygulaması da aynı API'ye HTTPS ile bağlanır — tek API yüzeyi, tek deploy
  hedefi.
- **Hosting:** Vercel (web + API). Deploy bölgesi: **EU (Frankfurt/`fra1`)**.
- **Database + Auth:** Supabase — managed PostgreSQL + Supabase Auth. Proje
  bölgesi: **EU Central (Frankfurt)**.
  - Supabase Auth, e-posta+şifre ve telefon+şifre girişini native destekliyor —
    [decisions/0001-auth-yontemi.md](0001-auth-yontemi.md) ile birebir örtüşüyor,
    kendi auth/şifre-hash altyapımızı yazmamıza gerek kalmıyor.
  - Serverless ortamda (Vercel) doğrudan Postgres bağlantısı yerine Supabase'in
    **connection pooler**'ı (Supavisor) kullanılır — aksi halde çok sayıda kısa
    ömürlü serverless fonksiyon çağrısı DB bağlantı limitini hızla tüketir.
  - **Row-Level Security (RLS):** `tenant_id` bazlı RLS politikaları, backend
    authorization kontrolünün **yerine değil, yanına** ikinci bir savunma
    katmanı olarak eklenir (bkz. [data-model.md](../data-model.md) "Ortak
    kurallar" — zaten öngörülmüştü). Uygulama katmanındaki tenant kontrolü
    birincil savunma olmaya devam eder ([CLAUDE.md](../../CLAUDE.md)
    değişmez kural).
- **Offline senkronizasyon (Faz 2'de uygulanacak, mimarisi şimdi kararlaştırıldı):**
  Android tarafında yerel bir veritabanı (Room/SQLite) kayıt kuyruğu tutar;
  arka plan işçisi (WorkManager) bağlantı geldiğinde kuyruktaki kayıtları
  `client_record_id` ile API'ye gönderir. API bu kimliğe göre upsert yapar —
  aynı kayıt tekrar gönderilse bile çift kayıt oluşmaz. Bu mekanizma zaten
  [data-model.md](../data-model.md) "Ortak kurallar"da tanımlıydı; burada sadece
  hangi bileşenin (Room + WorkManager) bunu uygulayacağı netleşti.

## Gerekçe

- **Tek Next.js uygulaması** (ayrı bir backend servisi yerine) operasyonel yükü
  ciddi şekilde azaltır: tek deploy, tek fatura, tek log akışı — kullanıcı kodu
  takip etmeyeceğini belirttiği için bakım yükünü minimumda tutmak öncelikli.
  İleride trafik/karmaşıklık gerektirirse API kısmı ayrı bir servise
  taşınabilir (Route Handler'lar zaten HTTP sınırında izole).
- **Supabase Auth kullanmak** kendi auth sistemimizi yazıp güvenlik açığı riski
  almaktan daha güvenli ve daha az iş — şifre hashleme, token yönetimi, oturum
  süresi gibi konular (PDF §20 güvenlik gereksinimleri) hazır ve denenmiş bir
  altyapıya devrediliyor.
- **Vercel + Supabase düşük maliyetli başlangıç:** ikisi de ücretsiz katmanla
  başlanabilir, Cizre ölçeğindeki ilk müşteriler için yeterli; berrak bir
  yükseltme yolu var (Supabase Pro ~$25/ay, Vercel Pro) — rakamlar değişebilir,
  kayıt sırasında güncel fiyatlandırma kontrol edilmeli.
- **EU (Frankfurt) bölgesi**, kullanıcının istediği "orta yol": KVKK'nın kesin
  hukuki gereksinimi Faz 3'te uzman hukukçuyla netleşecek
  ([phases/phase-3-kvkk-hardening.md](../phases/phase-3-kvkk-hardening.md)),
  ama şimdiden verinin AB içinde (Türkiye'de değil ama ABD'de de değil)
  barınması, o değerlendirmeyi kolaylaştıran, makul bir varsayılan. Bölge
  sonradan değiştirilebilir ama veri taşıma gerektirir — bu yüzden baştan
  bilinçli seçildi.

## Sonuçlar

- `open-questions.md`'den "Kesin hosting/database sağlayıcısı" kaldırıldı.
- [phases/phase-1-mvp-backend-web.md](../phases/phase-1-mvp-backend-web.md)
  kapsamı bu karara göre güncellendi.
- **Bilinen sınırlamalar (ileride dikkat edilecek, şimdiden engel değil):**
  - Vercel serverless fonksiyon süre limiti (ücretsiz katmanda ~10sn) — bu
    ürünün API çağrıları (CRUD işlemleri) için yeterli, uzun süren toplu iş
    yok.
  - Supabase ücretsiz katmanda proje 1 hafta hareketsiz kalırsa duraklatılıyor
    — gerçek dershaneler canlıya geçmeden önce ücretli katmana geçilmeli.
  - Bu sınırlamalar üründen değil sağlayıcı katmanından geliyor; hosting
    sağlayıcısı değiştirilirse bu ADR yeniden gözden geçirilir.

## Taşınabilirlik (ileride sağlayıcı değiştirme riski)

- **Database:** düşük risk. Supabase sıradan PostgreSQL'dir; başka bir Postgres
  sağlayıcıya (kendi sunucu, RDS, vs.) standart `pg_dump`/`pg_restore` ile
  taşınabilir. RLS politikaları da standart Postgres özelliğidir, taşınır.
- **Hosting:** düşük risk. Next.js uygulaması Vercel'e özgü değildir; Railway,
  Render veya kendi sunucu üzerinde de çalışır (küçük yapılandırma
  farklarıyla).
- **Auth:** orta risk — **tek gerçek bağımlılık noktası burası.** Supabase
  Auth'tan tamamen ayrılmak, kullanıcı hesaplarının ve giriş mekanizmasının
  başka bir sisteme (kendi auth kodumuz veya başka bir sağlayıcı) taşınmasını
  gerektirir. Şifre hash'leri dışa aktarılabilir ama servisin kendisi (oturum/
  JWT üretimi) yeniden kurulmalıdır. Kabul edilebilir bir risk — karşılığında
  MVP'de auth'u sıfırdan yazma yükünden kurtuluyoruz.
