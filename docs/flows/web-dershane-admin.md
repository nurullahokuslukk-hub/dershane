---
title: "Akış: Web — Dershane Admin"
description: Dershane Admin rolünün web panelindeki tüm ekranları ve akışı.
status: in-progress
updated_at: 2026-09-15
---

# Akış: Web — Dershane Admin

Format: [flows/_format.md](_format.md). Ortak giriş/layout:
[web-common.md](web-common.md). Kaynak: PDF §5 (rol tanımı), §7 (kayıt akışı admin
tarafı), §13 (dershaneye özelleştirme).

## Ekran: Dashboard

**Amaç:** Dershane admin'in giriş sonrası ilk gördüğü özet ekran.
**Erişim:** Dershane Admin.

**Gösterilen veri:**
- Toplam öğrenci sayısı, şube/sınıf sayısı
- Bekleyen öğrenci onayı sayısı (rozet)
- Öğretmen/rehberlik kullanıcı sayısı

**Aksiyonlar:**
- Bekleyen onaylar rozetine tıkla → **Bekleyen Onaylar**
- Sidebar üzerinden diğer ekranlara git

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

**Gösterilen veri:**
- Ad soyad, sınıf/şube, durum (pending/active/suspended)
- Filtre: şube, sınıf, durum

**Aksiyonlar:**
- Bir öğrenciye tıkla → **Öğrenci Detayı**
- "Toplu içe aktar" → **Toplu İçe Aktar**

## Ekran: Öğrenci Detayı (admin görünümü)

**Amaç:** Bir öğrencinin temel bilgilerini yönetmek — **akademik veriler burada
değil**, bu ekran sadece hesap/idari yönetim içindir (akademik detay için
[web-rehberlik.md](web-rehberlik.md) veya [web-ogretmen.md](web-ogretmen.md)).
**Erişim:** Dershane Admin.

**Gösterilen veri:**
- Ad soyad, doğum tarihi, sınıf/şube, durum
- Kayıtlı cihazlar (`student_device` listesi)
- Auth identifier (e-posta/telefon) — salt okunur

**Aksiyonlar:**
- Sınıf/şube değiştir
- Durumu askıya al/aktif et
- Şifre sıfırla (telefon-only kullanıcılar için, bkz.
  [decisions/0001-auth-yontemi.md](../decisions/0001-auth-yontemi.md))
- Cihaz kaydını sil (öğrenci cihaz değiştirdiyse, PDF §30)

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
