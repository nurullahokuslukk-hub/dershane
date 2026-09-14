---
title: "Faz 3 — KVKK & Sertleştirme"
description: Hukuki süreçler, veri minimizasyonu, audit log, rate limiting ve genel güvenlik sertleştirmesi.
status: planned
updated_at: 2026-09-15
---

# Faz 3 — KVKK & Sertleştirme

## Neden ayrı bir faz (ve neden sona bırakılmıyor)?

PDF §19: "KVKK ürünün sonuna bırakılmayacaktır." Bu fazın kod-sonrası bir eklenti
olmadığını, Faz 0-2 boyunca zaten gözetilmesi gereken kuralların (bkz.
[CLAUDE.md](../../CLAUDE.md) değişmez kurallar) burada resmileştirildiğini not et.
Gerçek anlamda "sona bırakılan" şey hukuki süreçlerin kesinleştirilmesi ve
sertleştirme denetimidir — veri minimizasyonu ilkesi baştan itibaren geçerli.

## Kapsam (PDF §19, §20)

- Hangi verinin toplandığı / neden / kim erişiyor / ne kadar saklanıyor / nasıl
  siliniyor / güvenliği nasıl sağlanıyor — her veri kategorisi için netleştirme
- Veli/öğrenci bilgilendirme ve izin akışı (öğrenciler reşit değil)
- Ürün sağlayıcısı ve dershanenin hukuki rollerinin netleştirilmesi (uzman hukukçu)
- Audit log, rate limiting, secret yönetimi, database backup
- Hassas verilerin loglara yazılmaması denetimi
- Token/session güvenliği denetimi

## Bitiş kriterleri

- [ ] Her veri kategorisi için retention süresi `decisions/`de kayıtlı
- [ ] Veli bilgilendirme/izin akışı tasarlanmış ve uygulanmış
- [ ] Audit log tüm kritik aksiyonları (veri erişimi, silme, rol değişikliği) kaydediyor
- [ ] Rate limiting ve secret yönetimi production'da aktif
- [ ] Hukuki değerlendirme tamamlanmış (harici — uzman hukukçu)
