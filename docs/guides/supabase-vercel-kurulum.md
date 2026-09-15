---
title: Supabase ve Vercel hesap kurulumu
description: Kod tarafı hazır — bu iki hesabı sadece sen açabilirsin, adım adım rehber.
status: active
updated_at: 2026-09-15
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
2. [`supabase/migrations/0001_init.sql`](../../supabase/migrations/0001_init.sql)
   dosyasının tüm içeriğini kopyala, SQL Editor'e yapıştır, çalıştır (Run).
3. Hata almadan bittiyse, **Table Editor**'de `tenant`, `user_account` gibi
   tabloları görmen lazım — şema kuruldu demektir.

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

## İlk kullanıcıyı oluşturma (system admin)

Şu an kayıt akışı davet koduyla başlıyor (bkz.
[flows/student-registration-flow.md](../flows/student-registration-flow.md)),
ama sistemdeki **ilk** kullanıcı (system admin) davet koduyla giremez —
birinin onu elle oluşturması gerekir. Adım 1-3 tamamlanınca bunu nasıl
yapacağımızı (Supabase Auth panelinden veya bir script ile) birlikte
kararlaştırırız — bu, Faz 1'in ilerleyen bir adımı.
