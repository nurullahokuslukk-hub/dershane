---
title: "Akış: Öğrenci Kayıt & Onay"
description: Davet kodundan admin onayına kadar, admin ve öğrenci tarafını birlikte kapsayan uçtan uca akış.
status: not-started
updated_at: 2026-09-15
---

# Akış: Öğrenci Kayıt & Onay

Format: [flows/_format.md](_format.md) — ama bu belge çift taraflı (admin + öğrenci)
olduğu için her adımda "kim yapıyor" belirtilir. Kaynak: PDF §7, §30.

## PDF §7'deki önerilen akış (ham)

1. Dershane sisteme alınır. *(system admin)*
2. Dershane admin hesabı oluşturulur. *(system admin)*
3. Şube ve sınıflar oluşturulur. *(dershane admin)*
4. Öğrenci davet kodu/linki oluşturulur. *(dershane admin)*
5. Öğrenci davet ile kayıt olur. *(öğrenci, Android)*
6. Öğrenci bilgilerini tamamlar. *(öğrenci, Android)*
7. Dershane admin kontrol eder. *(dershane admin, web)*
8. Admin öğrenciyi onaylar. *(dershane admin, web)*
9. Öğrenci doğru dershane/sınıfa bağlanır. *(sistem)*

## Uç durumlar (PDF §30 — cevaplanmış)

- **Öğrenci yanlış dershaneye kayıt olursa?** → Davet kodu/linki ve dershane admin
  onayı ile engellenir.
- **Öğrenci uygulamayı silerse?** → Sunucudaki veriler otomatik silinmez.
- **Öğrenci telefonunu değiştirirse?** → Veri telefona değil hesaba bağlı.
- **İki Android cihazı varsa?** → Ayrı cihaz kayıtları tutulabilir.

> **Doldurulmadı — bu ham liste [_format.md](_format.md) yapısına göre ekran/aksiyon
> seviyesine indirgenecek** (her adımın hangi ekranda, hangi alanlarla gerçekleştiği).
