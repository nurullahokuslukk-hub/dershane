---
title: Sözlük
description: Domain terimlerinin tutarlı kullanımı için referans — kod, doküman ve UI metinlerinde aynı terimler kullanılmalı.
status: active
updated_at: 2026-09-15
---

# Sözlük

| Terim | Anlamı | Kod/DB'de karşılığı (öneri) |
|---|---|---|
| Dershane | Bir tenant; sisteme abone olan kurum | `tenant` |
| Şube | Dershanenin fiziksel/organizasyonel alt birimi | `branch` |
| Sınıf | Öğrencilerin gruplandığı eğitim birimi (örn. 12-A) | `class_group` |
| Deneme (sınavı) | Öğrencinin katıldığı deneme sınavı ve sonucu | `mock_exam`, `mock_exam_result` |
| Etüt | Gözetimli/planlı çalışma seansı, katılım takibi yapılır | `study_session` (tür: etüt) |
| Soru çözme | Öğrencinin çözdüğü soru sayısı kaydı | `question_log` |
| Günlük bildirim | Öğrencinin günlük durum/öz-bildirimi | `daily_checkin` |
| Rehberlik görüşmesi | Rehberlik öğretmeni ile öğrenci arasındaki görüşme kaydı | `guidance_session` |
| Rehberlik notu | Rehberlik öğretmeninin öğrenci hakkında yazdığı not | `guidance_note` |
| Telefon kullanım verisi | Android'den senkronize edilen uygulama/süre kaydı | `phone_usage_log` |
| Davet kodu/linki | Öğrencinin doğru dershane/sınıfa kaydolmasını sağlayan mekanizma | `invite_code` |
| Tenant izolasyonu | Bir dershanenin verisinin başka dershaneden görülememesi kuralı | backend authorization katmanı |
| Erken uyarı | Veri değişiminin rehberliğe görünür kılınması (otomatik karar değil) | — (Faz 4, AI katmanı) |

Yeni bir terim ortaya çıktığında (kod yazarken veya akış belgelerken) buraya eklenir —
aynı kavram için farklı isimler (örn. hem "etüt" hem "study block") kullanılmaz.
