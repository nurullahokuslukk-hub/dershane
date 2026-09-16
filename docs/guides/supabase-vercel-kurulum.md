---
title: Supabase, Vercel ve Sentry hesap kurulumu
description: Kod tarafı hazır — bu hesapları sadece sen açabilirsin, adım adım rehber.
status: active
updated_at: 2026-09-16
---

# Supabase ve Vercel Kurulumu

Kod tarafında her şey hazır (bkz. [decisions/0002-teknik-mimari.md](../decisions/0002-teknik-mimari.md)).
Geriye kalan iki şey **hesap açmak** — bunu senin adına yapamam, ama adım adım
anlatıyorum. Toplam ~10 dakika sürer.

## 1. Supabase projesi oluştur

1. [supabase.com](https://supabase.com) → "Start your project" → GitHub veya
   e-posta ile üye ol.
2. "New Project" → proje adı: `dersahne` (veya istediğin bir isim).
3. **Region: "EU Central (Frankfurt)" seç** — bu, KVKK için üzerinde durduğumuz
   karar (bkz. yukarıdaki ADR).
4. Bir database şifresi belirle (bir yere not al, ileride gerekebilir).
5. Proje oluşunca **Project Settings → API** sekmesine git, şu üç değeri kopyala:
   - `Project URL`
   - `anon public` anahtarı
   - `service_role` anahtarı (gizli tut, kimseyle paylaşma)

## 2. Veritabanı şemasını kur

1. Supabase panelinde **SQL Editor**'ü aç.
2. `supabase/migrations/` klasöründeki dosyaları **numara sırasıyla** (0001,
   0002, 0003, 0004...) tek tek kopyala-yapıştır-çalıştır. Her biri bir
   öncekinin üzerine ekleme yapıyor, sırayı atlama.
3. Hata almadan bittiyse, **Table Editor**'de `tenant`, `user_account` gibi
   tabloları görmen lazım — şema kuruldu demektir.

Yeni bir migration dosyası eklendiğinde (dosya adında en yüksek numarayı
görürsün) sadece o dosyayı çalıştırman yeterli — öncekiler zaten uygulanmış.

## 3. Yerel geliştirme için `.env.local` doldur

Proje kök dizininde `.env.local` dosyası zaten var (yer tutucu değerlerle,
`git`e girmez). İçini adım 1'de kopyaladığın gerçek değerlerle değiştir:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="xxxxx"
SUPABASE_SERVICE_ROLE_KEY="xxxxx"
```

Sonra `npm run dev` ile uygulamayı çalıştır — artık gerçek Supabase'e bağlanır.

## 4. Vercel'e deploy (canlıya alma zamanı geldiğinde)

Şimdilik zorunlu değil (yerelde çalışıyoruz), ama hazır olduğunda:

1. [vercel.com](https://vercel.com) → GitHub ile üye ol.
2. Bu repoyu GitHub'a push et (henüz push edilmedi — istediğinde ayrıca
   yardımcı olurum).
3. Vercel'de "Add New Project" → bu GitHub reposunu seç.
4. **Region: Frankfurt (`fra1`)** seç (Settings → Functions → Region).
5. Environment Variables kısmına adım 1'deki üç değeri aynen ekle.
6. Deploy.

## 5. Sentry (hata izleme) kurulumu — opsiyonel

Kod tarafı hazır (`instrumentation.ts`, `instrumentation-client.ts`,
`next.config.ts`); DSN girmezsen uygulama normal çalışır, sadece hatalar
hiçbir yere bildirilmez. Gerçek kullanıcılar sisteme girmeden önce kurman
önerilir — bir şey patladığında sen fark etmeden önce sistem sana haber versin.

1. [sentry.io](https://sentry.io) → ücretsiz hesap aç.
2. "Create Project" → platform: **Next.js** → proje adı: `dersahne`.
3. Kurulum ekranında sana bir **DSN** (uzun bir URL) verecek, kopyala.
4. Sentry'de sol menüden **Settings → Organization Settings**'e git,
   üstteki "Organization slug"ı not al (bu `SENTRY_ORG`). Proje sayfasında
   da proje slug'ını not al (bu `SENTRY_PROJECT`).
5. `.env.local`'e ekle:

```bash
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
SENTRY_ORG="xxxxx"
SENTRY_PROJECT="dersahne"
```

6. Vercel'e deploy ettiğinde aynı üç değeri Vercel'in Environment Variables
   kısmına da ekle (adım 4).

## İlk kullanıcıyı oluşturma (system admin)

Normal kayıt akışında herkes (öğrenci/öğretmen/rehberlik/dershane admin) roster
toplu içe aktarma + kendi hesabını doğrulama (claim code) yoluyla sisteme
giriyor (bkz.
[decisions/0003-toplu-kayit-ve-claim-akisi.md](../decisions/0003-toplu-kayit-ve-claim-akisi.md)).
Ama sistemdeki **ilk** kullanıcı (system admin) hiçbir dershaneye bağlı
olmadığı için bu akışa giremez — elle/script ile oluşturulması gerekir:

```bash
node --env-file=.env.local scripts/create-system-admin.mjs "sen@e-posta.com" "GüçlüBirŞifre.123" "Adın Soyadın"
```

Bu, sana `system_admin` rolüyle giriş yapabileceğin bir hesap açar — buradan
sonra dershane oluşturma, şube/sınıf/öğretmen/rehberlik ekleme hepsi web
panelinden yapılır.
