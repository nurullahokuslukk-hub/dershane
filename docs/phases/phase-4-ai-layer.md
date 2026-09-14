---
title: "Faz 4 — AI Katmanı"
description: Erken uyarı analizi, rehberlik özeti ve olağan dışı değişim tespiti — ilk sürümün zorunlu parçası değil.
status: planned
updated_at: 2026-09-15
---

# Faz 4 — AI Katmanı

## Neden en son?

PDF §18: "AI ilk sürümün zorunlu parçası değildir." Öncelik sırası: veriyi doğru
toplamak → doğru saklamak → doğru göstermek → zaman serisini oluşturmak → *sonrasında*
AI analiz katmanı. Faz 0-3 bu ön koşulları karşılamadan bu faz başlamaz.

## Kapsam (öngörü — kapsam kesin değil, bkz. open-questions.md)

- Öğrenci değişimlerini özetleme
- Rehberlik özeti (görüşme öncesi hazırlık için)
- Geçmiş veri analizi
- Olağan dışı değişim tespiti (örn. çalışma süresi + soru sayısı düşerken telefon
  kullanımı artışı — PDF §17)

## Değişmez kural

Sistem öğrenciyi otomatik olarak başarısız ilan etmez, karar rehberlik öğretmenindedir
(PDF §17). AI çıktısı her zaman **öneri/görünürlük** amaçlıdır, otomatik aksiyon değil.

## Bitiş kriterleri

Bu faz başlamadan önce `open-questions.md`'deki "AI analizinin kesin kapsamı" sorusu
çözülmüş ve `decisions/`e yazılmış olmalı — bitiş kriterleri o karara göre burada
detaylandırılacak.
