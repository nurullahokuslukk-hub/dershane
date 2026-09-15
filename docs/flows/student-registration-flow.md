---
title: "Akış: Öğrenci Kayıt & Onay"
description: Davet kodundan admin onayına kadar, admin ve öğrenci tarafını birlikte kapsayan uçtan uca akış.
status: done
updated_at: 2026-09-15
---

# Akış: Öğrenci Kayıt & Onay

Bu belge çift taraflı (admin + öğrenci) olduğu için her adımda "kim, hangi ekranda"
belirtilir; ekranların kendisi ilgili rol dosyasında tanımlı, burada sadece sıra ve
geçiş koşulları var. Kaynak: PDF §7, §30.

## Uçtan uca akış

1. **Dershane sisteme alınır.** *(system admin — Faz 1'de detaylandırılacak,
   MVP'de manuel/system admin panelinden)*
2. **Dershane admin hesabı oluşturulur.** *(system admin)*
3. **Şube ve sınıflar oluşturulur.**
   *(Dershane Admin → [web-dershane-admin.md](web-dershane-admin.md) "Şube Ekle/
   Düzenle" → "Sınıf Ekle/Düzenle")*
4. **Öğrenci davet kodu/linki oluşturulur.**
   *(Dershane Admin → [web-dershane-admin.md](web-dershane-admin.md) "Davet Kodu
   Oluştur" — hedef şube/sınıf seçilir, kod üretilir)*
5. **Öğrenci davet ile kayıt olur.**
   *(Öğrenci, Android → [android-student.md](android-student.md) "Davet Kodu
   Girişi" — deep link ile geldiyse kod otomatik dolu, kod geçerliliği kontrol
   edilir)*
6. **Öğrenci bilgilerini tamamlar.**
   *(Öğrenci, Android → [android-student.md](android-student.md) "Profil
   Tamamlama" — ad/soyad/doğum tarihi/iletişim bilgisi girilir, `student_profile`
   + `user_account` (status: pending) oluşturulur)*
7. **Dershane admin kontrol eder.**
   *(Dershane Admin → [web-dershane-admin.md](web-dershane-admin.md) "Bekleyen
   Onaylar" — öğrenci burada listede görünür; öğrenci taraf ise
   [android-student.md](android-student.md) "Onay Bekleniyor" ekranında bekler)*
8. **Admin öğrenciyi onaylar (veya reddeder).**
   *(Dershane Admin → "Bekleyen Onaylar" ekranındaki "Onayla"/"Reddet" aksiyonu —
   onaylanırsa `user_account.status: active` olur)*
9. **Öğrenci doğru dershane/sınıfa bağlanır.**
   *(Sistem — `student_profile.class_group_id`/`branch_id` davet kodundan
   itibaren zaten set edilmiştir; onay sadece durumu aktifleştirir. Öğrenci
   tarafında bir sonraki senkronizasyon/yenilemede "Onay Bekleniyor" ekranından
   **Ana Sayfa**'ya geçiş tetiklenir.)*

## Uç durumlar (PDF §30)

- **Öğrenci yanlış dershaneye kayıt olursa?** → Davet kodu belirli bir tenant'a
  bağlı olduğu için zaten mümkün değil; admin onay adımı (7-8) ikinci bir
  savunma katmanıdır.
- **Öğrenci uygulamayı silerse?** → `user_account`/`student_profile` sunucuda
  kalır, otomatik silinmez. Yeniden kurulumda **Giriş** ekranından devam eder.
- **Öğrenci telefonunu değiştirirse?** → Veri `student_id`'ye bağlı, cihaza değil
  (`student_device` ayrı tablo). Yeni cihazdan giriş yapması yeterli.
- **İki Android cihazı varsa?** → `student_device` bire-çok ilişki, her cihaz ayrı
  kayıt.
- **Davet kodu süresi dolmuşsa/kullanılmışsa?** → "Davet Kodu Girişi" ekranında
  hata, admin'den yeni kod istenmesi gerekir.

## Bitiş durumu

İçerik dolduruldu; referans verdiği ekranlar (`web-dershane-admin.md` "Bekleyen
Onaylar"/"Davet Kodu Oluştur", `android-student.md` "Davet Kodu Girişi"/"Profil
Tamamlama"/"Onay Bekleniyor") ile birlikte kullanıcı onayı bekliyor. Onaylanınca
`status: done` yapılacak.
