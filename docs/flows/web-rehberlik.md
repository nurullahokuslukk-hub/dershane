---
title: "Akış: Web — Rehberlik"
description: Rehberlik rolünün web panelindeki tüm ekranları ve akışı — ürünün en kritik paneli.
status: done
updated_at: 2026-09-17
---

> **Uygulama durumu (2026-09-17):** Öğrenci Listesi (`/rehberlik`) ve Öğrenci
> Profili (`/rehberlik/students/[id]`) yazıldı. Profilde şu an **Dershane
> Düzeni**, **Deneme Sonuçları** ve **Görüşmeler & Notlar** bölümleri var.
> Çalışma/Etüt, Ödevler, Telefon Kullanımı ve Günlük Bildirimler bölümleri
> henüz yazılmadı — bu kategorilerde veri üretecek akış (Faz 2, Android)
> henüz yayında değil, boş sekme göstermek yerine ertelendi.

# Akış: Web — Rehberlik

Format: [flows/_format.md](_format.md). Ortak giriş/layout:
[web-common.md](web-common.md). Kaynak: PDF §16 (rehberlik paneli), §17 (erken
uyarı mantığı).

## Ekran: Öğrenci Listesi

**Amaç:** Rehberlik kullanıcısına atanmış öğrencileri listelemek
(`guidance_student_assignment` — yalnızca atanan öğrenciler, PDF §30).
**Erişim:** Rehberlik.

**Gösterilen veri:**
- Ad soyad, sınıf/şube
- Son rehberlik görüşmesi tarihi (varsa)
- *(İlk sürümde otomatik risk rengi yok — PDF §16 — bu yüzden burada kırmızı/
  sarı/yeşil gibi bir gösterge listelenmez)*

**Aksiyonlar:**
- Bir öğrenciye tıkla → **Öğrenci Profili**

## Ekran: Öğrenci Profili (merkezi ekran)

**Amaç:** PDF §16'da tanımlanan tüm bilgilerin tek öğrenci etrafında toplandığı
ana ekran — sekmeli/bölümlü yapı. "Bugünkü durum değil, geçmişten bugüne nasıl
değiştiği" (PDF §3) vurgusu her bölümde zaman serisi (liste + basit grafik)
şeklinde gösterilir.
**Erişim:** Rehberlik (yalnızca atanmış olduğu öğrenci).

**Üst bilgi (her sekmede sabit):** ad soyad, sınıf/şube.

### Sekme: Genel Bakış

**Gösterilen veri:**
- Son 7/30 gün özet: çalışma süresi toplamı, soru sayısı toplamı, ödev tamamlama
  oranı, telefon kullanım toplamı, günlük bildirim doluluk oranı
- Bu özetlerin trend yönü (artıyor/azalıyor — PDF §17'deki "çalışma düşerken
  telefon kullanımı artabilir" gibi ilişkileri **göstermek** için, otomatik
  yorumlamadan)

### Bölüm: Dershane Düzeni

Karar ve sınırları: [decisions/0006-dershane-devam-oz-bildirimi.md](../decisions/0006-dershane-devam-oz-bildirimi.md).
**Durum:** Yazıldı (2026-09-17).

**Gösterilen veri:** Son 30 günün `daily_dershane_presence` kayıtları —
tarih, gittim/gitmedim, giriş saati, çıkış saati ve her satırda kaynak:
**"Öğrencinin beyanı"**. Üstte özet: gittim/gitmedim/bildirim girilmemiş gün
sayıları ve giriş+çıkış dolu günlerin ortalama kalış süresi.

**Her zaman görünen uyarı:** bu bilgi öğrencinin kendi beyanıdır, konumla
doğrulanmaz, kesin devam kanıtı ya da disiplin verisi değildir.

**Konuşma sinyalleri (puan değil):** son bir haftada 3+ gün "gitmedim"
işaretlenmişse → *"Bu hafta düzenini konuşmak ister misiniz?"*; günlerin
çoğunda bildirim yoksa → *"Bu bir devamsızlık göstergesi değil — öğrenci
uygulamayı kullanmayı unutuyor ya da zorlanıyor olabilir."*; aksi halde nötr
bir bilgi. Saatler ters girilmişse (yazım hatası) satır "hatalı" diye
işaretlenmez, yalnızca ortalamaya katılmaz.

**Bilinçli olarak YOK:** devamsızlık yüzdesi/puanı, "tutarsız beyan" uyarısı,
otomatik disiplin çıktısı, kırmızı/sarı/yeşil renklendirme.

**Veri yüklenemezse:** bölüm "veri yok" demez — yüklenemediğini söyler.
(Şema uyuşmazlığında sessizce boş liste göstermek, rehberliğe yanlış bilgi
vermek olurdu; bu bir kez gerçekten oldu, bkz. STATE.md 2026-09-17.)

### Sekme: Deneme Sonuçları

**Durum:** Yazıldı (2026-09-17) — denemeye göre gruplanmış ders bazlı
D/Y/B/net tablosu + deneme başına toplam net.

**Gösterilen veri:** `mock_exam` + `mock_exam_subject_result` listesi, zaman
içindeki net trendi (grafik — henüz yazılmadı).

### Sekme: Çalışma & Etüt

**Gösterilen veri:** `study_session` listesi (tip: serbest/etüt), etüt katılım
durumu, zaman içindeki toplam süre trendi.

### Sekme: Ödevler

**Gösterilen veri:** `homework_assignment` listesi ve durumları (yapıldı/
yapılmadı/gecikti), tamamlama oranı trendi.

### Sekme: Telefon Kullanımı

**Gösterilen veri:** `phone_usage_log` — uygulama bazlı günlük/haftalık toplam
süre, zaman içindeki trend. Sadece tarih/uygulama/süre (PDF §9) — başka veri yok.

### Sekme: Günlük Bildirimler

**Gösterilen veri:** `daily_checkin` listesi — `mood_score` trendi (grafik) +
notlar (kronolojik liste).

### Sekme: Rehberlik Görüşmeleri & Notları

**Gösterilen veri:** `guidance_session` (formal görüşmeler) + `guidance_note`
(hızlı notlar), kronolojik.

**Aksiyonlar (bu sekmede):**
- Görüşme ekle → **Rehberlik Görüşmesi Ekle**
- Not ekle → **Rehberlik Notu Ekle**

**Hata/uç durumlar (tüm profil ekranı için):**
- Bir kategoride veri yoksa boş durum mesajı ("henüz veri yok" — suçlayıcı değil,
  bilgilendirici dil, bkz. [CLAUDE.md](../../CLAUDE.md) felsefe kuralı)

> **Not (2026-09-17):** Aşağıdaki iki ekran ayrı sayfa olarak değil, öğrenci
> profilindeki "Görüşmeler ve notlar" bölümünde tek bir formda birleştirildi
> (form üstündeki "Hızlı not / Görüşme kaydı" seçimiyle). Pratikte rehberlik
> ikisi arasında gidip geliyor, ayrı sayfalara bölmek gereksiz tıklamaydı.
> Kaydedilen veri ve tablolar değişmedi.

## Ekran: Rehberlik Görüşmesi Ekle

**Amaç:** Formal bir görüşmeyi kaydetmek (`guidance_session`).
**Erişim:** Rehberlik.

**Gösterilen veri / alanlar:** tarih/saat (varsayılan şimdi), özet, sonraki adım
(opsiyonel).

**Aksiyonlar:** Kaydet → **Öğrenci Profili** → Rehberlik Görüşmeleri sekmesi

## Ekran: Rehberlik Notu Ekle

**Amaç:** Görüşme dışı hızlı bir gözlem notu eklemek (`guidance_note`).
**Erişim:** Rehberlik.

**Gösterilen veri / alanlar:** not (serbest metin).

**Aksiyonlar:** Kaydet → **Öğrenci Profili** → Rehberlik Görüşmeleri sekmesi
