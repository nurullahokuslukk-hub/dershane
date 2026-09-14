---
title: "Akış: Android — Öğrenci"
description: Öğrenci rolünün Android uygulamasındaki tüm ekranları ve akışı.
status: in-progress
updated_at: 2026-09-15
---

# Akış: Android — Öğrenci

Format: [flows/_format.md](_format.md). Kaynak: PDF §4-A, §9, §16 (öğrenciye görünen
kısım), §30 (uç durumlar).

Kayıt akışının admin onayı ile kesişen kısmı ayrı belgede:
[student-registration-flow.md](student-registration-flow.md) — bu dosya oradan
"Öğrenci doğru dershane/sınıfa bağlanır" adımından sonrasını, yani öğrencinin
uygulamayı **gündelik kullanımını** kapsar.

> **İlk taslak — henüz onaylanmadı.** Auth yöntemi (giriş ekranı detayları) açık
> soru olduğu için o ekranlar placeholder. Gözden geçirip düzelt, sonra
> `status: done` yap.

## Onboarding

### Ekran: Splash

**Amaç:** Oturum kontrolü — token var mı, geçerli mi.
**Erişim:** Herkes (uygulama açılışı).

**Aksiyonlar:**
- Geçerli token var → **Ana Sayfa**'ya yönlendir
- Token yok / süresi dolmuş → **Giriş**'e yönlendir
- Öğrenci kayıtlı ama admin onayı bekliyor (durum sunucudan gelir) → **Onay Bekleniyor**'a yönlendir

### Ekran: Giriş

**Amaç:** Kayıtlı öğrencinin uygulamaya giriş yapması.
**Erişim:** Herkes.

**Gösterilen veri:** —

**Aksiyonlar:**
- Giriş yap → **Ana Sayfa**
- "Davet kodum var, hesabım yok" → **Davet Kodu Girişi**

**Açık nokta:** Giriş yöntemi (`open-questions.md` → "Öğrenci authentication yöntemi")
netleşmeden bu ekranın alan listesi (kullanıcı adı/şifre mi, telefon+OTP mi)
kesinleştirilemez. Karar verilince burası güncellenecek.

**Hata/uç durumlar:**
- Hatalı giriş → hata mesajı, deneme sayısı sınırlandırılabilir (bkz. güvenlik: rate
  limiting, [CLAUDE.md](../../CLAUDE.md))

### Ekran: Davet Kodu Girişi

**Amaç:** Dershane admin'den alınan davet kodu/linki ile kayıt başlatma.
**Erişim:** Hesabı olmayan yeni kullanıcı.

**Gösterilen veri:**
- davet kodu (deep link ile geldiyse otomatik dolu)

**Aksiyonlar:**
- Kod geçerli → **Profil Tamamlama**
- Kod geçersiz/süresi dolmuş → hata, admin ile iletişime geçme yönlendirmesi

Detay: [student-registration-flow.md](student-registration-flow.md) adım 4-5.

### Ekran: Profil Tamamlama

**Amaç:** Öğrencinin temel bilgilerini girmesi.
**Erişim:** Davet koduyla gelen yeni kullanıcı.

**Gösterilen veri (doldurulacak alanlar):**
- ad, soyad
- doğum tarihi (veli onayı akışı için gerekebilir — bkz. açık soru)
- sınıf/şube (davetten otomatik gelebilir veya seçim gerekebilir)
- iletişim bilgisi (auth yöntemine bağlı)

**Aksiyonlar:**
- Kaydet → **Onay Bekleniyor**

### Ekran: Onay Bekleniyor

**Amaç:** Dershane admin onayı beklenirken bilgilendirme; uygulamanın diğer
kısımlarına erişimi engeller.
**Erişim:** Onay bekleyen öğrenci.

**Gösterilen veri:**
- Durum mesajı ("Kaydınız dershane yönetimi tarafından inceleniyor")

**Aksiyonlar:**
- Yenile (pull-to-refresh) → onay durumu kontrol edilir, onaylandıysa **Ana Sayfa**'ya geçer

**Hata/uç durumlar:**
- Admin reddederse → red nedeni gösterilir (varsa), yeniden davet kodu isteme
  yönlendirmesi

## Ana kullanım

### Ekran: Ana Sayfa

**Amaç:** Öğrencinin günlük özetini görmesi ve diğer ekranlara gitmesi (alt
navigasyon/hub).
**Erişim:** Onaylı öğrenci.

**Gösterilen veri:**
- Bugün günlük bildirim yapıldı mı (durum rozeti)
- Bu haftaki çalışma süresi / soru sayısı özeti
- Bekleyen ödev sayısı
- Yaklaşan/son deneme sonucu (varsa)

**Aksiyonlar:**
- Günlük bildirim yap → **Günlük Bildirim**
- Çalışma kaydı ekle → **Çalışma Kaydı Ekle**
- Soru kaydı ekle → **Soru Kaydı Ekle**
- Ödevler → **Ödev Listesi**
- Deneme sonuçları → **Deneme Sonuçları**
- Profil/Ayarlar → **Profil & Ayarlar**

### Ekran: Günlük Bildirim

**Amaç:** Öğrencinin günün durumunu kısa şekilde bildirmesi (`daily_checkin`).
**Erişim:** Onaylı öğrenci, günde 1 kez (ikinci girişte düzenleme moduna geçer).

**Gösterilen veri / girilecek alanlar:** *(data-model.md ile netleştirilecek — örn.
serbest metin mi, ruh hali/verimlilik skalası mı?)*

**Aksiyonlar:**
- Gönder → **Ana Sayfa**'ya dön, rozet güncellenir

**Hata/uç durumlar:**
- İnternet yoksa → yerel kuyruğa alınır, bağlantı gelince senkronize edilir
  (PDF §10, idempotency ile)

### Ekran: Çalışma Kaydı Ekle

**Amaç:** Serbest çalışma süresi kaydı girmek (`study_session`).
**Erişim:** Onaylı öğrenci.

**Gösterilen veri:**
- ders/konu (opsiyonel)
- süre
- tarih (varsayılan bugün)

**Aksiyonlar:**
- Kaydet → **Çalışma Geçmişi** veya **Ana Sayfa**

### Ekran: Çalışma Geçmişi

**Amaç:** Öğrencinin kendi geçmiş çalışma kayıtlarını görmesi.
**Erişim:** Onaylı öğrenci (kendi verisi).

**Gösterilen veri:**
- Tarih, süre, ders/konu listesi (kronolojik)

**Hata/uç durumlar:**
- Kayıt yoksa boş durum mesajı

### Ekran: Soru Kaydı Ekle

**Amaç:** Çözülen soru sayısını kaydetmek (`question_log`).
**Erişim:** Onaylı öğrenci.

**Gösterilen veri:**
- ders/konu
- soru sayısı
- tarih (varsayılan bugün)

**Aksiyonlar:**
- Kaydet → **Ana Sayfa**

### Ekran: Ödev Listesi

**Amaç:** Öğretmen tarafından atanan ödevleri görmek (`homework`).
**Erişim:** Onaylı öğrenci.

**Gösterilen veri:**
- Ödev başlığı, ders, son tarih, durum (yapıldı/yapılmadı/gecikti)

**Aksiyonlar:**
- Bir ödeve tıkla → **Ödev Detayı**
- Durumu "yapıldı" işaretle (hızlı aksiyon, listeden)

### Ekran: Ödev Detayı

**Amaç:** Tek bir ödevin detayını görmek/durumunu güncellemek.
**Erişim:** Onaylı öğrenci (sadece kendi ödevi).

**Gösterilen veri:**
- Açıklama, ders, öğretmen, son tarih, durum

**Aksiyonlar:**
- Durum güncelle → **Ödev Listesi**'ne dön

### Ekran: Deneme Sonuçları

**Amaç:** Öğrencinin kendi deneme sınav sonuçlarını zaman içinde görmesi
(`mock_exam_result`) — veri girişi burada değil, sadece görüntüleme (giriş
öğretmen/admin tarafından yapılır, bkz. [web-ogretmen.md](web-ogretmen.md)).
**Erişim:** Onaylı öğrenci (kendi verisi).

**Gösterilen veri:**
- Deneme adı/tarihi, ders bazlı sonuçlar, zaman içindeki trend (basit liste/grafik)

**Hata/uç durumlar:**
- Sonuç yoksa boş durum mesajı

### Ekran: Etüt Katılımı

**Amaç:** Öğrencinin kendi etüt katılım geçmişini görmesi.
**Erişim:** Onaylı öğrenci (kendi verisi).

**Gösterilen veri:**
- Etüt tarihi, katıldı/katılmadı durumu

*(Öğrenci burada kendi katılımını değiştiremez — katılım kaydı öğretmen/admin
tarafından girilir; bu ekran salt-okunur.)*

## Telefon kullanım verisi senkronizasyonu

### Ekran: İzin İsteği

**Amaç:** Android kullanım istatistikleri iznini (Usage Access) açıklayarak istemek.
**Erişim:** İlk kurulumda veya izin geri alınmışsa.

**Gösterilen veri:**
- Ne toplandığının açık açıklaması: "sadece tarih / uygulama adı / kullanım süresi
  — mesaj, fotoğraf, mikrofon veya kamera verisi **asla** toplanmaz" (PDF §9,
  [CLAUDE.md](../../CLAUDE.md) değişmez kural)

**Aksiyonlar:**
- İzin ver → sistem izin ekranına yönlendirir → **Ana Sayfa**
- Reddet → **Ana Sayfa** (uygulamanın geri kalanı çalışmaya devam eder, sadece bu
  veri kaynağı eksik kalır — telefon kullanımı amaç değil yardımcı veri kaynağı)

### Ekran: Senkronizasyon Durumu

**Amaç:** Telefon kullanım verisinin senkron durumunu göstermek (genelde arka
planda otomatik çalışır, bu ekran şeffaflık için).
**Erişim:** Onaylı öğrenci, izin verilmiş.

**Gösterilen veri:**
- Son senkron zamanı, bekleyen kayıt sayısı (offline kuyrukta varsa)

**Hata/uç durumlar:**
- İnternet yok → "bağlantı geldiğinde gönderilecek" mesajı (PDF §10, idempotency
  ile çift kayıt önlenir)

## Profil & Ayarlar

### Ekran: Profil & Ayarlar

**Amaç:** Hesap bilgileri, izinler, çıkış.
**Erişim:** Onaylı öğrenci.

**Gösterilen veri:**
- Ad, soyad, sınıf/şube (salt okunur — değişiklik admin üzerinden)
- Telefon kullanım izni durumu → **İzin İsteği**'ne link
- Cihaz yönetimi (PDF §30 — iki cihazı olabilir): kayıtlı cihaz(lar) listesi

**Aksiyonlar:**
- Çıkış yap → **Giriş**
- İzinleri yönet → **İzin İsteği**

**Hata/uç durumlar:**
- Öğrenci uygulamayı silip yeniden kurarsa → hesabı hâlâ var (veri hesaba bağlı,
  telefona değil — PDF §30), tekrar giriş yapması yeterli.
