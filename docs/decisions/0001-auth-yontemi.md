---
title: "0001 — Öğrenci ve personel authentication yöntemi"
description: Giriş yönteminin (kod/şifre/OTP) netleştirilmesi — open-questions.md madde 1'in çözümü.
status: accepted
updated_at: 2026-09-15
---

# 0001 — Öğrenci ve Personel Authentication Yöntemi

**Durum:** kabul edildi
**Tarih:** 2026-09-15

## Soru

`open-questions.md` madde 1: öğrenci authentication yöntemi netleşmemişti (öğrenci
kodu, davet kodu, e-posta/telefon, şifre veya OTP kombinasyonlarından hangisi).

## Karar

Kayıt (tenant'a bağlanma) ile giriş (kimlik doğrulama) birbirinden ayrılır:

- **Davet kodu/linki** — sadece kayıt sırasında **bir kere** kullanılır, öğrenciyi
  doğru dershane/şube/sınıfa bağlar (PDF §7). Login credential'ı değildir, kayıttan
  sonra işlevi biter.
- **Giriş** — `auth_identifier` (e-posta **veya** telefon numarası, `identifier_type`
  alanıyla ayırt edilir) + şifre. Tüm roller (öğrenci, öğretmen, rehberlik, admin,
  system admin) aynı mekanizmayı kullanır.
- **OTP/SMS doğrulama MVP'de yok.** SMS gateway (Netgsm/Twilio vb.) entegrasyonu ek
  maliyet ve vendor bağımlılığı getirir; ilk sürüm için gerekli değil.
- **Şifremi unuttum:** e-posta ile kendi kendine sıfırlama; sadece telefon numarası
  olan kullanıcılar için dershane admin'e "kullanıcı şifresini sıfırla" yetkisi
  verilir (destek yükünü azaltmak için).

## Gerekçe

- E-posta + şifre en yaygın desteklenen, en ucuz, kütüphane desteği en geniş
  yöntemdir — bootstrap aşamasında SMS maliyeti/vendor bağımlılığı istenmiyor.
- Öğrencinin e-postası olmayabilir (yaş grubu) → telefon numarasını alternatif
  identifier olarak kabul etmek, dershane admin'in kayıt sırasında elindeki bilgiye
  göre esneklik sağlar; iki alanı da zorunlu tutmak gereksiz sürtünme yaratır.
- Davet kodunu login credential'ından ayırmak: kod sızsa bile (tek kullanımlık +
  süre sınırlı) hesap ele geçirilemez; ayrıca "öğrenci yanlış dershaneye kayıt
  olursa?" (PDF §30) riski davet kodu + admin onayı ikilisiyle zaten karşılanıyor,
  login yöntemi bu riske ek bir katkı sağlamıyor — ayrı tutmak karmaşıklığı azaltıyor.

## Sonuçlar

- `user_account` tablosu: `auth_identifier`, `identifier_type` (`email`/`phone`),
  `password_hash`. Detay: [data-model.md](../data-model.md) → Kurumsal bilgiler.
- **İleride OTP eklenmek istenirse:** `user_account`'a dokunmadan yeni bir
  `otp_challenge` tablosu ve alternatif bir giriş endpoint'i eklenir — mevcut şifre
  tabanlı girişi bozmadan, opsiyonel ikinci yöntem olarak eklenir. Şema bu yüzden
  şimdiden OTP'yi öngörmeye çalışmıyor (YAGNI) ama eklenmesini de zorlaştırmıyor.
- [flows/android-student.md](../flows/android-student.md) → Giriş ekranı bu karara
  göre güncellendi.
- `open-questions.md` madde 1 kaldırıldı.
