---
title: "Akış: Android — Öğrenci"
description: Öğrenci rolünün Android uygulamasındaki tüm ekranları ve akışı.
status: in-progress
updated_at: 2026-09-16
---

# Akış: Android — Öğrenci

Format: [flows/_format.md](_format.md). Kaynak: PDF §4-A, §9, §16 (öğrenciye görünen
kısım), §30 (uç durumlar).

Kayıt akışının admin onayı ile kesişen kısmı ayrı belgede:
[student-registration-flow.md](student-registration-flow.md) — bu dosya oradan
"Öğrenci doğru dershane/sınıfa bağlanır" adımından sonrasını, yani öğrencinin
uygulamayı **gündelik kullanımını** kapsar.

> **Onboarding bölümü güncellendi (2026-09-17).** [decisions/0003-toplu-kayit-ve-claim-akisi.md](../decisions/0003-toplu-kayit-ve-claim-akisi.md)
> ile kayıt modeli değişti: roster sistem admin/dershane admin tarafından
> toplu yükleniyor, öğrenci kendine verilen kodu **web'deki `/claim`
> sayfasında** (herhangi bir tarayıcıda, uygulama kurulu olmadan) kullanıp
> hesabını doğruluyor — bunun için Android'de ayrı bir ekran/akış **yok**.
> Uygulama sadece zaten doğrulanmış (claim edilmiş) bir hesapla girişi
> destekler. Eskiden burada olan "Davet Kodu Girişi / Profil Tamamlama / Onay
> Bekleniyor" ekranları bu yüzden kaldırıldı.

## Onboarding

### Ekran: Splash

**Amaç:** Oturum kontrolü — token var mı, geçerli mi.
**Erişim:** Herkes (uygulama açılışı).

**Aksiyonlar:**
- Geçerli token var → **Ana Sayfa**'ya yönlendir
- Token yok / süresi dolmuş → **Giriş**'e yönlendir

### Ekran: Giriş

**Amaç:** Doğrulanmış (claim edilmiş) bir öğrencinin uygulamaya giriş yapması.
Yöntem: [decisions/0001-auth-yontemi.md](../decisions/0001-auth-yontemi.md) —
e-posta **veya** telefon numarası + şifre. Web ile aynı Supabase Auth
altyapısı kullanılır, ayrı bir Android login sistemi yok.
**Erişim:** Herkes.

**Gösterilen veri / girilecek alanlar:**
- Kimlik alanı (e-posta veya telefon)
- Şifre
- Küçük bir bilgi notu: "Hesabın yok mu? Dershanenden aldığın kodu
  [site]/claim adresinde kullanarak önce hesabını doğrula." (uygulama içinde
  bir ekran değil, sadece yönlendirici metin — claim işlemi tarayıcıda olur)

**Aksiyonlar:**
- Giriş yap → **Ana Sayfa**
- "Şifremi unuttum" → e-posta ile sıfırlama linki (telefon-only kullanıcı ise
  dershane admin'den şifre sıfırlama istenir, bkz.
  [web-dershane-admin.md](web-dershane-admin.md) → Öğrenci Detayı)

**Hata/uç durumlar:**
- Hatalı giriş → hata mesajı, Supabase Auth'un kendi rate limiting'i geçerli
- Hesabı henüz claim edilmemiş biri email/şifre bilmediği için zaten giriş
  deneyemez — bu durum burada ayrıca ele alınmaz

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
**Erişim:** Onaylı öğrenci, günde 1 kez (ikinci girişte düzenleme moduna geçer —
`UNIQUE (tenant_id, student_id, checkin_date)`, bkz. [data-model.md](../data-model.md)).

**Gösterilen veri / girilecek alanlar:**
- Bugün nasıl geçti (1-5 skala, `mood_score`) — hafif, opsiyonel öz-değerlendirme
- Not (serbest metin, opsiyonel) — istemezse boş bırakabilir

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
(`mock_exam_subject_result`) — veri girişi burada değil, sadece görüntüleme
(sonuçlar sistem admin/dershane admin tarafından toplu yüklenir, bkz.
[decisions/0003-toplu-kayit-ve-claim-akisi.md](../decisions/0003-toplu-kayit-ve-claim-akisi.md)).
**Erişim:** Onaylı öğrenci (kendi verisi).

**Gösterilen veri:**
- Deneme adı/tarihi (`mock_exam`)
- Ders bazlı sonuçlar: doğru/yanlış/boş/net (`mock_exam_subject_result`, bkz.
  [data-model.md](../data-model.md))
- Genel net (ders bazlı sonuçlardan hesaplanır, ayrı bir kayıt değildir)
- Zaman içindeki trend (basit liste/grafik)

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
