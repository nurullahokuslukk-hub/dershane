---
title: "0005 — Öğrenci uygulaması: Native Android (Kotlin)"
description: Flutter değil native Android — telefon kullanım verisine doğrudan erişim ve PDF'teki orijinal karara sadakat için.
status: accepted
updated_at: 2026-09-17
---

# 0005 — Öğrenci Uygulaması: Native Android (Kotlin)

**Durum:** kabul edildi
**Tarih:** 2026-09-17

## Soru

Öğrenci uygulaması için Flutter mı yoksa native Android (Kotlin) mi
kullanılacağı netleşmemişti (kullanıcı ilk mesajında ikisini de belirtmişti).

## Karar

**Native Android, Kotlin, Jetpack Compose (UI).** Codex bu uygulamayı
geliştirecek (bkz. [phases/phase-2-android.md](../phases/phase-2-android.md)).

## Gerekçe

- PDF'teki orijinal karar zaten "Android" idi (§21, §34) — Flutter bunu
  değiştirmezdi, sadece ek bir soyutlama katmanı ekleyecekti.
- **Telefon kullanım verisi** (PDF §9, ürünün ayırt edici özelliklerinden
  biri) Android'in `UsageStatsManager` API'siyle toplanıyor — native Kotlin'de
  doğrudan erişim var, Flutter'da bunun için ek bir platform channel/plugin
  katmanı gerekirdi. Kullanıcı bu veriyi "kesinlikle" istediğini vurguladı —
  en az sürtünmeli yol native.
- Çapraz platform (iOS) ihtiyacı yok — PDF §21 native iOS öğrenci
  uygulamasını açıkça kapsam dışı bırakıyor, Flutter'ın "tek kod tabanı"
  avantajı burada değersiz.

## Sonuçlar

- `android/` dizini (yeni, repo kökünde) — Next.js projesiyle dosya çakışması
  yok, ayrı bir proje.
- Backend: ayrı bir Android API'si **yazılmayacak** — uygulama doğrudan aynı
  Supabase projesine (aynı URL/anon key, aynı Auth, aynı RLS) bağlanacak;
  `supabase-kt` (Kotlin Multiplatform Supabase istemcisi) kullanılacak. Web ve
  Android aynı "arka uca" bağlı — kullanıcının istediği "her şey köprü gibi
  bağlantılı" tam olarak bu.
- Detaylı ekran/veri/aşama planı: [phases/phase-2-android.md](../phases/phase-2-android.md).
