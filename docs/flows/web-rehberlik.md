---
title: "Akış: Web — Rehberlik"
description: Rehberlik rolünün web panelindeki tüm ekranları ve akışı — ürünün en kritik paneli.
status: done
updated_at: 2026-09-15
---

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

### Sekme: Deneme Sonuçları

**Gösterilen veri:** `mock_exam` + `mock_exam_subject_result` listesi, zaman
içindeki net trendi (grafik).

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
