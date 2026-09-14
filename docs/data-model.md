---
title: Veri modeli
description: Veritabanında tutulacak tüm veri kategorileri ve alanları — PDF §8'den türetilen iskelet, doldurulacak.
status: not-started
updated_at: 2026-09-15
---

# Veri Modeli

Kaynak: PDF §8 (ana veri kategorileri), §6 (multi-tenant yapı — her tabloda
`tenant_id` zorunlu). `flows/*.md` doldukça buradaki alan listeleri onlarla
çapraz kontrol edilecek (bir ekranda gösterilen her alan burada karşılığını bulmalı).

## Ortak kural

Her tablo (kullanıcıya ait veri tutan her tablo) şu alanları içerir:

- `id`
- `tenant_id` — **zorunlu**, backend authorization bunu her sorguda filtreler
- `created_at`, `updated_at`

## Kategoriler (doldurulacak)

Aşağıdaki her kategori için: tablo adı, alanlar, ilişkiler (foreign key), hangi
rollerin okuma/yazma yetkisi olduğu belirtilecek.

### Kurumsal bilgiler
> Dershane, şube, sınıf, kullanıcı-rol ilişkisi. — *doldurulmadı*

### Deneme sınavları
> `mock_exam`, `mock_exam_result` — genel sonuç + ders bazlı kırılım. — *doldurulmadı*

### Ders bazlı sonuçlar
> Deneme ile ilişkili mi, ayrı mı? — *doldurulmadı*

### Ödevler
> Atama, durum (yapıldı/yapılmadı/geç), hangi öğretmen atadı. — *doldurulmadı*

### Çalışma süreleri
> Serbest çalışma vs. etüt ayrımı var mı? — *doldurulmadı*

### Çözülen soru sayıları
> Ders bazlı mı, günlük toplam mı? — *doldurulmadı*

### Etüt katılımı
> Planlanan etüt + katılım kaydı. — *doldurulmadı*

### Günlük bildirimler
> Öğrencinin öz-bildirim formatı — serbest metin mi, yapılandırılmış mı? — *doldurulmadı*

### Telefon kullanım istatistikleri
> `phone_usage_log`: tarih, uygulama, süre (PDF §9). Cihaz kaydı ile ilişki
> (PDF §30 — öğrencinin iki cihazı olabilir). — *doldurulmadı*

### Rehberlik görüşmeleri
> `guidance_session` + `guidance_note`. — *doldurulmadı*

## Açık noktalar

Bu dosya doldurulurken karşılaşılan her belirsizlik (örn. "etüt katılımı ayrı bir
tablo mu, çalışma süresinin bir türü mü?") önce burada **not** olarak işaretlenir,
karara bağlanamıyorsa `open-questions.md`'ye taşınır.
