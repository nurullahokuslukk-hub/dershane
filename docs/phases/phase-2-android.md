---
title: "Faz 2 — Android Öğrenci Uygulaması"
description: Öğrenci hesabı, günlük bildirim, çalışma/soru kayıtları ve izinli telefon kullanım verisi senkronizasyonu. Codex tarafından geliştirilecek.
status: in-progress
updated_at: 2026-09-17
---

# Faz 2 — Android Öğrenci Uygulaması

**Bu fazı Codex geliştirecek** (Claude Code web/backend tarafında paralel
çalışmaya devam ediyor). Bu belge Codex için kendi başına yeterli bir başlangıç
noktası olacak şekilde yazıldı — ama Codex'in yine de [AGENTS.md](../../AGENTS.md)'yi
(kural dosyası, tüm AI araçları için ortak) ve [docs/index.md](../index.md)'yi
önce okuması gerekiyor.

## Teknik karar (kesinleşti)

**Native Android, Kotlin, Jetpack Compose (UI).** Gerekçe:
[decisions/0005-android-native-kotlin.md](../decisions/0005-android-native-kotlin.md).

**Kritik mimari nokta: ayrı bir backend/API yazılmayacak.** Android uygulaması
web panelinin bağlandığı **aynı Supabase projesine** doğrudan bağlanır — aynı
`NEXT_PUBLIC_SUPABASE_URL`/anon key, aynı Supabase Auth, aynı tablolar, aynı
RLS politikaları (bkz. `supabase/migrations/0001_init.sql` içindeki
`current_tenant_id()`/`is_system_admin()`). Kütüphane: **`supabase-kt`**
(Kotlin Multiplatform Supabase istemcisi — Postgrest, Auth, Realtime
modülleri). Bu, kullanıcının istediği "her şey köprü gibi bağlantılı olsun"
isteğinin karşılığı: web ve Android aynı arka uca yazıyor/okuyor, ayrı bir
senkronizasyon katmanı gerekmiyor.

Gerçek Supabase bağlantı bilgileri `.env.local`'de duruyor (git'e girmez);
Codex'e bu değerleri kullanıcı ayrıca verecek (`local.properties` veya
`BuildConfig` üzerinden, git'e girmeyecek şekilde — `.gitignore`'a
`android/local.properties` eklenmeli).

## Ön koşul

Faz A (yönetim CRUD) ve Faz B (roster toplu içe aktarma) `status: done` —
yani sistemde gerçekten öğrenci/sınıf/tenant oluşturulabiliyor olmalı. **Bu
sağlandı.** Faz C/D (deneme sonucu içe aktarma/gösterme) henüz sürmekte ama
Android işine engel değil, paralel ilerleyebilir.

## Kapsam — ne inşa edilecek

Ekranların **tam listesi ve her ekranın alan/aksiyon detayı zaten yazılı**,
yeniden icat edilmeyecek: [flows/android-student.md](../flows/android-student.md).
Bu belge okunmadan kodlamaya başlanmamalı. Özet:

1. **Giriş** — e-posta/telefon + şifre (Supabase Auth `signInWithPassword`).
   Hesap doğrulama (claim) **web'de** oluyor, Android'de karşılığı yok (bkz.
   flows/android-student.md → Onboarding notu).
2. **Ana Sayfa** — günlük özet, diğer ekranlara geçiş.
3. **Günlük Bildirim** — `daily_checkin` (mood_score 1-5 + not, günde 1 kez).
3b. **Dershane Devam Bildirimi** — `daily_dershane_presence`: "Bugün
   dershaneye gittin mi?" + giriş saati, akşam ~20.00 hatırlatmasıyla çıkış
   saati. **Konum izni yok, konum toplanmıyor** — öz-bildirim. Karar:
   [decisions/0006-dershane-devam-oz-bildirimi.md](../decisions/0006-dershane-devam-oz-bildirimi.md),
   ekran detayı flows/android-student.md. Rehberlik web paneli bu veriyi
   okuyan tarafı **hazır** (`/rehberlik/students/[id]` → "Dershane düzeni").
4. **Çalışma Kaydı Ekle / Geçmişi** — `study_session` (type: serbest).
5. **Soru Kaydı Ekle** — `question_log`.
6. **Ödev Listesi / Detayı** — `homework_assignment` (durum güncelleme, satır
   öğretmen tarafından web'de oluşturuluyor).
7. **Deneme Sonuçları** — `mock_exam_subject_result`, salt okunur (giriş web'den).
8. **Etüt Katılımı** — `study_session` (type: etut), salt okunur.
9. **Telefon kullanım izni + senkronizasyon durumu** — aşağıda ayrı bölüm.
10. **Profil & Ayarlar** — hesap bilgisi, izin yönetimi, cihaz listesi, çıkış.

Veri alanlarının tam şeması: [data-model.md](../data-model.md) (`daily_checkin`,
`study_session`, `question_log`, `phone_usage_log`, `student_device`,
`mock_exam_subject_result`, `homework_assignment` tabloları).

## Telefon kullanım verisi (öncelikli, "kesinlikle" istenen özellik)

- Android `UsageStatsManager` API'si ile toplanır — bunun için kullanıcının
  Ayarlar'dan elle vermesi gereken özel bir izin var: **"Usage Access"**
  (`PACKAGE_USAGE_STATS`, normal runtime permission değil, `Settings.ACTION_USAGE_ACCESS_SETTINGS`
  intent'iyle sistem ayarlarına yönlendirilir). Uygulama içi "İzin İsteği"
  ekranı bunu açıklayıp kullanıcıyı bu ayara yönlendirir.
- **Sadece üç alan toplanır: tarih, uygulama adı, kullanım süresi** (PDF §9).
  Mesaj/fotoğraf/video/mikrofon/kamera **asla** — bkz. [AGENTS.md](../../AGENTS.md)
  değişmez kurallar.
- Arka planda periyodik olarak (örn. günde bir, `WorkManager` ile) toplanır,
  `phone_usage_log` tablosuna senkronize edilir. Her kayıt bir
  `client_record_id` (cihazda üretilen UUID) taşır — `(tenant_id,
  client_record_id)` unique constraint idempotency sağlıyor (aynı kayıt
  tekrar gönderilse bile çift kayıt oluşmaz, bkz. data-model.md).
- `student_device` tablosuna cihaz kaydı (`device_identifier` — Android
  `Settings.Secure.ANDROID_ID` kullanılabilir, gerçek IMEI/seri no gerekmiyor,
  gizlilik için gereksiz bir tanımlayıcı toplanmamalı).
- **Telefon yeniden başlatıldığında:** uygulama `BOOT_COMPLETED` sonrasında yalnızca
  WorkManager işlerini yeniden planlar. Telefon kapalıyken kullanım olmadığı için
  yapay boşluk/veri üretilmez; kullanıcı cihazı açıp kilidi açtıktan sonra bir
  sonraki iş, son başarılı senkronizasyon noktasından itibaren UsageStats
  özetini okur. Receiver doğrudan ağ çağrısı yapmaz ve Usage Access iznini
  kendiliğinden açamaz. Android uygulaması kısıtlanmış durumdaysa boot yayını
  gecikebilir; uygulama bir sonraki açılışta işleri yine kontrol eder.

## Offline kuyruk (PDF §10, §30)

İnternet yokken: `daily_checkin`, `study_session`, `question_log`,
`phone_usage_log` kayıtları yerel bir Room (SQLite) veritabanında kuyruğa
alınır, her birine bir `client_record_id` atanır. Bağlantı geldiğinde
`WorkManager` bu kuyruğu Supabase'e gönderir. Sunucu tarafı zaten
`client_record_id` ile idempotent upsert yapacak şekilde tasarlı — Android
tarafının tek sorumluluğu her kayda **bir kere** id üretmek ve tekrar
denemelerde aynı id'yi kullanmak.
- **Dayanıklılık:** cihaz yeniden başlatıldığında, uygulama güncellendiğinde veya
  saat dilimi/sistem saati değiştiğinde receiver yalnızca önceden izin verilmiş
  yerel hatırlatıcıyı ve ağ kısıtlı senkron işini yeniden planlar. Ağ aktarımı
  receiver içinde değil WorkManager'da yapılır.

## Faz 2 alt-adımları (önerilen sıra)

1. **2.1 — İskelet + Auth:** Android Studio projesi, Compose kurulumu,
   `supabase-kt` bağlantısı, Giriş ekranı, oturum durumuna göre
   Splash→Giriş/Ana Sayfa yönlendirmesi.
2. **2.2 — Temel veri ekranları:** Ana Sayfa, Günlük Bildirim, Çalışma/Soru
   Kaydı, Ödevler, Deneme Sonuçları, Etüt (hepsi doğrudan Supabase
   Postgrest çağrıları, offline kuyruk henüz yok).
3. **2.3 — Offline kuyruk:** Room + WorkManager, `client_record_id`
   idempotency, bağlantı koptuğunda/geldiğinde test.
4. **2.4 — Telefon kullanım verisi:** Usage Access izni akışı,
   `UsageStatsManager` okuma, periyodik senkron.
5. **2.5 — Play Store hazırlığı:** imzalama, gizlilik politikası linki,
   store listing (PDF §11 — APK manuel dağıtım ana yöntem değil).

## Kapsam dışı

- Native iOS öğrenci uygulaması (PDF §21, §29)
- Mesaj/fotoğraf/video/mikrofon/kamera erişimi (asla)
- Hesap doğrulama (claim) ekranı (web'de zaten var)
- Ayrı bir Android API/backend servisi (doğrudan Supabase'e bağlanılıyor)

## Git çalışma şekli

[AGENTS.md](../../AGENTS.md)'deki çoklu araç kuralı gereği: Codex bu işi ayrı
bir dizinde (`android/`) yaptığı ve web/Next.js dosyalarına dokunmadığı için
aynı branch üzerinde çalışmak dosya çakışması yaratmaz. Tek dikkat noktası:
`STATE.md`'ye her ikisi de ekleme yaptığı için, push etmeden önce
`git pull --rebase` ile güncel hali çekmek küçük bir metin çakışmasını (iki
oturumun aynı satıra tarihli girdi eklemesi) önler.

## Bitiş kriterleri

- [ ] Tüm ekranlar `flows/android-student.md`'ye uygun şekilde çalışıyor
- [ ] Offline kayıt + senkronizasyon + idempotency test edilmiş (aynı kayıt iki kez
      gönderilirse çift kayıt oluşmuyor)
- [ ] Telefon kullanım verisi sadece izin verilen minimal alanları topluyor
- [ ] Yeniden başlatma / uygulama güncellemesi / saat dilimi değişiminde işlerin
      yeniden planlandığı; kapalı cihaz süresi için veri üretilmediği test edildi
- [ ] Play Store'a yayınlanmaya hazır (imzalama, gizlilik politikası linki, vs.)
