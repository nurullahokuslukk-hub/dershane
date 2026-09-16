---
title: "Akış: Toplu Roster Kaydı & Hesap Doğrulama"
description: Sistem admin'in dershane PDF'lerinden toplu öğrenci/öğretmen girmesinden, kişinin kendi hesabını claim etmesine kadar uçtan uca akış.
status: done
updated_at: 2026-09-17
---

# Akış: Toplu Roster Kaydı & Hesap Doğrulama

**Bu akış [decisions/0003-toplu-kayit-ve-claim-akisi.md](../decisions/0003-toplu-kayit-ve-claim-akisi.md)
ile eski davet-kodu-self-servis modelinin yerini aldı.** Kayıt öğrenciden değil
sistem admin'den (veya dershane admin'den) başlıyor: PDF'ten gelen roster
(isim, sınıf, öğretmen ataması) toplu girilir, sonra her kişi kendi hesabını
kendi bilgileriyle doğrular.

## Uçtan uca akış

1. **Dershane sisteme alınır.** *(system admin, MVP'de manuel/system admin
   panelinden)*
2. **Şube ve sınıflar oluşturulur.**
   *(Sistem admin veya Dershane Admin → [web-dershane-admin.md](web-dershane-admin.md)
   "Şube Ekle/Düzenle" → "Sınıf Ekle/Düzenle")*
3. **Roster toplu içe aktarılır.**
   *(Sistem admin veya Dershane Admin → [`/admin/import/roster`](../../src/app/admin/import/roster/page.tsx).
   PDF'teki ad/soyad/sınıf/rol/öğretmen-sınıf ataması bir CSV şablonuna
   (`public/templates/roster-*.csv`) aktarılıp yüklenir — sadece CSV, bkz.
   [decisions/0004-csv-only-import.md](../decisions/0004-csv-only-import.md).)*
   Her satır için:
   - `user_account` oluşturulur, `status: unclaimed`, `auth_user_id: null`
     (henüz giriş bilgisi yok)
   - Öğrenciyse `student_profile` oluşturulur
   - Öğretmense `teacher_class_assignment` oluşturulur
   - Her satır için bir `account_claim_code` üretilir (30 gün geçerli)
4. **Doğrulama kodu kişiye iletilir.**
   *(Dershane üzerinden — kağıt liste, WhatsApp, vs.; sistemin kendisi şu an
   bunu otomatik göndermiyor, bkz. open-questions.md "Bildirim sisteminin
   ayrıntıları")*
5. **Kişi hesabını doğrular (claim).**
   *(Öğrenci/Öğretmen → [`/claim`](../../src/app/claim/page.tsx) — kodu girer,
   kendi e-posta/telefon + şifresini belirler → `POST /api/claim`)*
6. **Hesap aktifleşir.**
   *(Sistem — `user_account.auth_user_id` doldurulur, `status: active` olur,
   `account_claim_code.status: used` olur → kişi artık **Giriş** ekranından
   normal şekilde giriş yapabilir)*

## Uç durumlar

- **Kod başka biri tarafından ele geçirilirse?** → Kod tek kullanımlıktır
  (`status: used` sonrası tekrar kullanılamaz); süre dolarsa (`expires_at`)
  yeni kod üretilmesi gerekir.
- **Kişi hesabını hiç doğrulamazsa?** → `user_account` `unclaimed` kalır,
  hiçbir zorunluluk/otomatik silme yok — dershane admin istediğinde yeni kod
  üretebilir (arayüz henüz yok, bkz. Sırada).
- **Öğrenci telefonunu değiştirirse?** → Veri `student_id`'ye bağlı, cihaza
  değil (`student_device` ayrı tablo). Claim tek seferlik olduğu için bu durumu
  etkilemez.
- **İki Android cihazı varsa?** → `student_device` bire-çok ilişki, her cihaz
  ayrı kayıt.
- **Aynı roster verisi yanlışlıkla iki kez içe aktarılırsa?** → Henüz bir
  tekilleştirme kuralı yok (örn. isim+sınıf bazlı) — toplu içe aktarma
  ekranı tasarlanırken çözülecek açık nokta.

## Durum

Bu akışın tamamı (roster içe aktarma + claim) yazıldı ve uçtan uca test
edildi (bkz. STATE.md 2026-09-16/17). Kalan açık nokta: aynı roster verisinin
yanlışlıkla iki kez içe aktarılmasına karşı tekilleştirme kuralı yok (yukarıda
"Uç durumlar" listesinde işaretli) — düşük öncelikli, gerçek kullanımda sorun
çıkarsa ele alınacak.
