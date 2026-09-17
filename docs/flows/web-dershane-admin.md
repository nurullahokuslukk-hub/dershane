---
title: "Akış: Web — Dershane Admin"
description: Dershane Admin rolünün web panelindeki tüm ekranları ve akışı.
status: in-progress
updated_at: 2026-09-17
---

# Akış: Web — Dershane Admin

Format: [flows/_format.md](_format.md). Ortak giriş/layout:
[web-common.md](web-common.md). Kaynak: PDF §5 (rol tanımı), §7 (kayıt akışı admin
tarafı), §13 (dershaneye özelleştirme).

## Ekran: Dashboard

**Amaç:** Dershane admin'in giriş sonrası ilk gördüğü özet ekran.
**Erişim:** Dershane Admin.

**Durum:** Yazıldı (2026-09-17) — `/admin`.

**Gösterilen veri:**
- Sayaç kartları: öğrenci, sınıf, şube, öğretmen, rehberlik, deneme
- Doğrulanmamış hesap uyarısı + öğrencilerin kaçının hesabını aktifleştirdiği
- Son denemeler (sonuç satırı sayısıyla), son işlemler (audit log)

**Sistem Admin için:** henüz dershane seçilmediyse aynı ekran dershane
listesini gösterir; "bu dershaneye geç" ile bağlam seçilir.

**Aksiyonlar:**
- Doğrulanmamış hesap rozeti/kartı → **Doğrulanmamış Hesaplar**
- Hızlı işlem: Roster Yükle / Deneme Sonucu Yükle
- Sidebar üzerinden diğer ekranlara git (menü Genel/Kurum/Kişiler/Akademik/
  Sistem başlıklarıyla gruplu)

## Ekran: Şube Listesi

**Amaç:** Şubeleri (`branch`) listelemek ve yönetmek.
**Erişim:** Dershane Admin.

**Gösterilen veri:** Şube adı, adres (opsiyonel), bağlı sınıf sayısı.

**Aksiyonlar:**
- Şube ekle → **Şube Ekle/Düzenle**
- Bir şubeye tıkla → **Şube Ekle/Düzenle** (düzenleme modu)

### Ekran: Şube Ekle/Düzenle

**Gösterilen veri / alanlar:** ad, adres (opsiyonel).
**Aksiyonlar:** Kaydet → **Şube Listesi**

## Ekran: Sınıf Listesi

**Amaç:** Sınıfları (`class_group`) listelemek ve yönetmek, şubeye göre filtreleme.
**Erişim:** Dershane Admin.

**Gösterilen veri:** Sınıf adı (örn. "12-A"), bağlı şube, akademik yıl, öğrenci
sayısı.

**Aksiyonlar:**
- Sınıf ekle → **Sınıf Ekle/Düzenle**
- Bir sınıfa tıkla → **Sınıf Detayı** (öğrenci listesi + öğretmen/rehberlik
  atamaları)

### Ekran: Sınıf Ekle/Düzenle

**Gösterilen veri / alanlar:** ad, şube, akademik yıl.
**Aksiyonlar:** Kaydet → **Sınıf Listesi**

## Ekran: Öğrenci Listesi

**Amaç:** Tüm öğrencileri (`student_profile`) görmek, filtrelemek.
**Erişim:** Dershane Admin.

**Durum:** Yazıldı (2026-09-17) — `/admin/students`.

**Gösterilen veri:**
- Ad soyad, sınıf, şube, doğum tarihi, hesap durumu
  (`unclaimed`/`active`/`suspended` — bkz.
  [decisions/0003-toplu-kayit-ve-claim-akisi.md](../decisions/0003-toplu-kayit-ve-claim-akisi.md))
- İsimle arama (`ilike`) + sınıf filtresi, 50'şerli sunucu taraflı sayfalama
  (liste yüz binlerce satıra çıkabilir, tümü tek seferde çekilmiyor)

**Aksiyonlar:**
- Bir öğrenciye tıkla → **Öğrenci Detayı**
- "Toplu içe aktar" → **Toplu İçe Aktar**

## Ekran: Öğrenci Detayı (admin görünümü)

**Amaç:** Bir öğrencinin hesabını ve akademik özetini tek yerde görmek.
Derinlemesine rehberlik görünümü (çalışma/telefon/görüşme sekmeleri) burada
değil, [web-rehberlik.md](web-rehberlik.md)'dedir.
**Erişim:** Dershane Admin, Sistem Admin.

**Durum:** Yazıldı (2026-09-17) — `/admin/students/[id]`.

**Gösterilen veri:**
- Hesap kartı: durum, giriş bilgisi (auth identifier), doğrulama kodu
  (yalnızca `unclaimed` ise), doğum tarihi, kayıt tarihi
- Rehberlik ataması: bu öğrenciyi hangi rehberlik kullanıcıları takip ediyor
- Deneme sonuçları: denemeye göre gruplanmış ders bazlı D/Y/B/net tablosu +
  deneme başına toplam net (en yeni deneme üstte)

**Henüz yazılmadı (ileride):**
- Kayıtlı cihazlar (`student_device`) — Faz 2 (Android) veri üretmeye
  başlayınca anlamlı olacak
- Sınıf/şube değiştirme, durumu askıya alma, şifre sıfırlama

## Ekran: Doğrulanmamış Hesaplar

**Amaç:** Roster'dan içe aktarılmış ama kişi henüz kendi hesabını claim
etmemiş kayıtları görmek (PDF §7'nin yerini alan yeni model — bkz.
[decisions/0003-toplu-kayit-ve-claim-akisi.md](../decisions/0003-toplu-kayit-ve-claim-akisi.md)
ve [student-registration-flow.md](student-registration-flow.md)). Artık bir
"onay" adımı yok — roster'a girmiş olmak zaten yeterli, kişi kendi kodunu
girdiğinde otomatik aktif olur. Bu ekran sadece görünürlük/takip içindir.
**Erişim:** Dershane Admin.

**Gösterilen veri:**
- `status: unclaimed` olan kullanıcılar: ad soyad, rol, sınıf/şube, claim
  kodunun süresi

**Aksiyonlar:**
- Kodu görüntüle/kopyala (dershaneye tekrar iletmek için)
- Süresi dolmuş kodu yenile

## Ekran: Toplu İçe Aktar

**Amaç:** Dershaneden gelen PDF'teki öğrenci/öğretmen listesini (ad, soyad,
sınıf, rol, hangi öğretmen hangi sınıfa giriyor) tek seferde yüklemek —
sistemin ana veri girişi yöntemi (tek tek "öğrenci ekle" formu yerine).
**Erişim:** Dershane Admin, Sistem Admin.

**Durum:** Yazıldı (2026-09-16) — `/admin/import/roster`. Sadece **CSV**
(Excel değil — bkz. [decisions/0004-csv-only-import.md](../decisions/0004-csv-only-import.md)
güvenlik gerekçesi). Akış: şablon indir → doldur → yükle → sistem satır satır
önizleme + hata/belirsizlik gösterir (örn. eksik/belirsiz sınıf, öğrenci
satırlarında satır-içi seçim kutusuyla çözülebilir) → onaylanırsa her satır
için `user_account` (`unclaimed`) + `student_profile`/`teacher_class_assignment`
+ `account_claim_code` oluşturulur.

**Aksiyonlar:**
- Şablon indir (öğrenci/öğretmen ayrı şablon)
- CSV yükle → önizleme (hatalı satırlar diğerlerini engellemez)
- Onayla → toplu oluşturma → Doğrulanmamış Hesaplar ekranına link

## Ekran: Denemeler

**Amaç:** Deneme sınavlarını (`mock_exam`) oluşturmak ve sonuç yüklenmiş
olanları görmek. Sonuçlar bir denemeye bağlandığı için sonuç yüklemeden önce
deneme kaydının var olması gerekir.
**Erişim:** Dershane Admin, Sistem Admin.

**Durum:** Yazıldı (2026-09-17) — `/admin/exams`, `/admin/exams/new`.

**Gösterilen veri:** Deneme adı, tarih, tür (TYT/AYT/LGS…), yüklenmiş sonuç
satırı sayısı.

**Aksiyonlar:**
- Yeni deneme (ad + tarih + tür) → **Denemeler**
- Bir denemeye tıkla → **Deneme Detayı**

### Ekran: Deneme Detayı

**Durum:** Yazıldı (2026-09-17) — `/admin/exams/[id]`.

**Gösterilen veri:**
- Ders bazlı dershane ortalaması (o denemedeki ortalama netler)
- Öğrenci × ders net matrisi + öğrenci başına toplam net, isme göre sıralı

**Bilinçli olarak yok:** sıralama/başarı puanı, otomatik risk skoru, renkli
"kırmızı öğrenci" işaretlemesi. Sadece sayı gösteriliyor — PDF §16 ve
AGENTS.md "gözetim değil rehberlik" kuralı.

## Ekran: Deneme Sonucu İçe Aktar

**Amaç:** Bir denemenin ders bazlı sonuçlarını toplu yüklemek. Sonuç girişi
öğretmen başına tek tek değil, admin tarafından deneme başına dosya
yüklenerek yapılıyor (kullanıcıyla konuşulan karar, bkz. STATE.md).
**Erişim:** Dershane Admin, Sistem Admin.

**Durum:** Yazıldı (2026-09-17) — `/admin/import/exam-results`. Roster içe
aktarmayla aynı altyapı (CSV + `ImportPreviewTable`).

**Şablon sütunları:** `ad_soyad, sinif_adi, ders, dogru, yanlis, bos, net`

**Kurallar:**
- **Net dosyadan olduğu gibi alınır, yeniden hesaplanmaz.** Ceza katsayısı
  sınav türüne/kuruma göre değişiyor; burada tekrar türetmek ikinci (ve
  muhtemelen yanlış) bir doğruluk kaynağı yaratırdı.
- Eşleştirme öğrenci adına göre; aynı isimde birden fazla öğrenci varsa
  satır-içi seçim kutusu çıkar (`sinif_adi` verilmişse önce onunla daraltılır).
- Aynı dosyadaki tekrar eden (öğrenci + ders) satırları önizlemede hata olarak
  işaretlenir — yoksa upsert sessizce birini ezerdi.
- Aynı dosya düzeltilip tekrar yüklenirse çift kayıt oluşmaz:
  `(mock_exam_id, student_id, subject)` üzerinde upsert.
- Sunucu tarafı `mockExamId` ve her `studentId`'nin tenant'a ait olduğunu
  yeniden doğrular (istemcide yapılan eşleştirmeye güvenilmez).
- Tek istekte en fazla 5000 satır, 500'lük parçalar halinde yazılır.

## Ekran: Genel Arama (yalnızca Sistem Admin)

**Amaç:** Hangi dershanede olduğunu bilmeden kişi/dershane aramak.
**Erişim:** Sistem Admin.

**Durum:** Yazıldı (2026-09-17) — `/admin/search`.

**Gösterilen veri:** Eşleşen dershaneler; eşleşen kişiler (ad, rol, dershane,
sınıf/şube, hesap durumu). Role göre süzme.

**Aksiyonlar:** "Bu dershaneye geç" → aktif dershane bağlamını değiştirir.
Öğrenci sonucuna tıkla → **Öğrenci Detayı**.

## Ekran: Öğretmen Listesi

**Amaç:** Öğretmen kullanıcılarını yönetmek ve sınıf atamak
(`teacher_class_assignment`).
**Erişim:** Dershane Admin.

**Gösterilen veri:** Ad soyad, atanmış sınıflar, durum.

**Aksiyonlar:**
- Öğretmen ekle (davet/hesap oluştur) → **Öğretmen Ekle/Ata**
- Bir öğretmene tıkla → sınıf atamalarını düzenle

### Ekran: Öğretmen Ekle/Ata

**Gösterilen veri / alanlar:** ad soyad, e-posta/telefon, atanacak sınıf(lar).
**Aksiyonlar:** Kaydet → **Öğretmen Listesi**

## Ekran: Rehberlik Listesi

**Amaç:** Rehberlik kullanıcılarını yönetmek ve öğrenci atamak
(`guidance_student_assignment` — sınıf değil **öğrenci bazlı**, PDF §30).
**Erişim:** Dershane Admin.

**Gösterilen veri:** Ad soyad, atanmış öğrenci sayısı, durum.

**Aksiyonlar:**
- Rehberlik kullanıcısı ekle → **Rehberlik Ekle/Ata**
- Bir kullanıcıya tıkla → atanmış öğrenci listesini düzenle (öğrenci ekle/çıkar)

### Ekran: Rehberlik Ekle/Ata

**Gösterilen veri / alanlar:** ad soyad, e-posta/telefon, atanacak öğrenci(ler)
(sınıf seçip topluca da eklenebilir, ama kayıt öğrenci bazlı tutulur).
**Aksiyonlar:** Kaydet → **Rehberlik Listesi**

## Ekran: Dershane Ayarları

**Amaç:** Tenant configuration / feature flag yönetimi (PDF §13 — dershane başına
ayrı kod tabanı yerine bu ekran üzerinden özelleştirme).
**Erişim:** Dershane Admin.

**Gösterilen veri / alanlar:**
- Aktif modüller (örn. telefon kullanım takibi açık/kapalı)
- `tenant.feature_flags` (jsonb) üzerinden yönetilen anahtar/değer listesi

**Aksiyonlar:**
- Bir özelliği aç/kapat → kaydet

**Hata/uç durumlar:**
- Bir modül kapatılırsa, o modüle ait ekranlar (örn. telefon kullanımı) diğer
  rollerin panelinden de gizlenir — ama backend endpoint'leri yine tenant kontrolü
  yapar (bkz. [CLAUDE.md](../../CLAUDE.md))
