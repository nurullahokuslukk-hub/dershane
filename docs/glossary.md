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
| Deneme (sınavı) | Öğrencinin katıldığı deneme sınavı ve sonucu | `mock_exam`, `mock_exam_subject_result` |
| Etüt | Gözetimli/planlı çalışma seansı, katılım takibi yapılır | `study_session` (tür: etüt) |
| Soru çözme | Öğrencinin çözdüğü soru sayısı kaydı | `question_log` |
| Günlük bildirim | Öğrencinin günlük durum/öz-bildirimi | `daily_checkin` |
| Rehberlik görüşmesi | Rehberlik öğretmeni ile öğrenci arasındaki görüşme kaydı | `guidance_session` |
| Rehberlik notu | Rehberlik öğretmeninin öğrenci hakkında yazdığı not | `guidance_note` |
| Telefon kullanım verisi | Android'den senkronize edilen uygulama/süre kaydı | `phone_usage_log` |
| Hesap doğrulama kodu (claim code) | Roster'a toplu eklenmiş bir kişinin kendi e-posta/telefon+şifresini belirleyip hesabını aktifleştirmesini sağlayan tek kullanımlık kod | `account_claim_code` |
| Tenant izolasyonu | Bir dershanenin verisinin başka dershaneden görülememesi kuralı | backend authorization katmanı |
| Erken uyarı | Veri değişiminin rehberliğe görünür kılınması (otomatik karar değil) | — (Faz 4, AI katmanı) |
| Roster | Bir dershaneden PDF/Excel ile gelen öğrenci/öğretmen listesi (isim, sınıf, atama) | toplu içe aktarma ekranları |
| Doğrulanmamış hesap | Roster'dan oluşturulmuş ama kişi tarafından henüz claim edilmemiş hesap | `user_account.status = unclaimed` |

Yeni bir terim ortaya çıktığında (kod yazarken veya akış belgelerken) buraya eklenir —
aynı kavram için farklı isimler (örn. hem "etüt" hem "study block") kullanılmaz.
