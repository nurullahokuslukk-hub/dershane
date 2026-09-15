---
title: "0003 — Toplu roster kaydı ve hesap doğrulama (claim) akışı"
description: Öğrenci/öğretmen kaydının davet-koduyla-self-servis yerine toplu içe aktarma + kişinin kendi hesabını doğrulaması modeline geçişi.
status: accepted
updated_at: 2026-09-16
---

# 0003 — Toplu Roster Kaydı ve Hesap Doğrulama (Claim) Akışı

**Durum:** kabul edildi
**Tarih:** 2026-09-16

## Bağlam

Gerçek iş akışı şu şekilde ortaya çıktı: kullanıcı (sistem admin) anlaştığı her
dershaneden öğrenci/öğretmen listesini (ad, soyad, sınıf, hangi öğretmen hangi
sınıfa giriyor) PDF olarak alıyor ve **kendisi** tüm dershaneler için sisteme
giriyor — dershanenin kendi personeli tek tek kayıt olmuyor. Bu, Faz 0'da
tasarlanan "öğrenci davet koduyla kendi kaydını oluşturur, admin onaylar"
modelinden farklı: kayıt sistem admin'den başlıyor, öğrenciden değil.

## Karar

Kayıt iki bağımsız adıma ayrıldı:

1. **Roster içe aktarma** (sistem admin/dershane admin) — isim, sınıf, rol,
   öğretmen-sınıf ataması gibi bilgiler toplu olarak girilir/yüklenir. Bu adımda
   **auth hesabı oluşmaz** — `user_account` satırı `status: unclaimed` olarak
   oluşur, giriş bilgisi (e-posta/telefon/şifre) yoktur.
2. **Hesap doğrulama (claim)** — her roster satırı için bir `account_claim_code`
   üretilir. Kişi (öğrenci/öğretmen) bu kodu `/claim` ekranında girer, kendi
   e-posta/telefon ve şifresini belirler; bu an itibariyle gerçek bir Supabase
   Auth hesabı oluşur ve `user_account.status: active` olur.

Bunun için `user_account.id` artık `auth.users.id`'ye bağlı değil (önceden
öyleydi) — bağımsız bir uuid. Yeni `auth_user_id` (nullable) kolonu, claim
tamamlandığında dolduruluyor. RLS yardımcı fonksiyonları (`current_tenant_id()`,
`is_system_admin()`) buna göre güncellendi (`auth_user_id = auth.uid()`).

Detay: [supabase/migrations/0002_account_claim_flow.sql](../../supabase/migrations/0002_account_claim_flow.sql).

## Gerekçe

- **Şifre yükü sistem admin'de olmamalı** — hem operasyonel yük (yüzlerce kişi
  için şifre üretip dağıtmak) hem güvenlik açısından (bir kişinin şifresini bir
  başkasının bilmesi) kötü. Claim akışı bu sorumluluğu kişinin kendisine
  bırakıyor.
- **Roster verisi (isim/sınıf/atama) ile kimlik doğrulama verisi (e-posta/
  telefon/şifre) farklı kaynaklardan geliyor** — PDF'ler genelde ilkini
  içeriyor, ikincisini değil. İkisini aynı adımda zorunlu tutmak toplu içe
  aktarmayı imkânsızlaştırırdı.
- **Eski "davet kodu + admin onayı" modeli hâlâ kavramsal olarak benzer**
  (tek kullanımlık kod ile bir kayda bağlanma) — bu yüzden mimari zaten buna
  hazırdı, sadece kodun neyi temsil ettiği değişti (sınıfa genel davet →
  belirli bir roster satırına özel doğrulama kodu).

## Sonuçlar

- [docs/flows/student-registration-flow.md](../flows/student-registration-flow.md)
  ve [docs/flows/web-dershane-admin.md](../flows/web-dershane-admin.md)
  güncellenmesi gerekiyor (eski "Davet Kodu Oluştur" / "Bekleyen Onaylar"
  ekranları bu modele göre yeniden yazılacak — henüz yapılmadı, bkz. STATE.md).
- [docs/data-model.md](../data-model.md) `user_account` ve yeni
  `account_claim_code` tablosuyla güncellendi.
- Roster toplu içe aktarma **arayüzü** (CSV/Excel yükleme ekranı) henüz
  yazılmadı — bu ADR sadece veri modelini ve claim akışını (kod → hesap)
  kapsıyor. Sıradaki iş bu arayüzün eklenmesi.
