---
title: "Faz 2 — Android Öğrenci Uygulaması"
description: Öğrenci hesabı, günlük bildirim, çalışma/soru kayıtları ve izinli telefon kullanım verisi senkronizasyonu.
status: planned
updated_at: 2026-09-15
---

# Faz 2 — Android Öğrenci Uygulaması

## Ön koşul

[Faz 1](phase-1-mvp-backend-web.md) `status: done` — backend API ve auth hazır olmalı.

## Kapsam (PDF §4-A, §9, §10, §11, §12)

- Öğrenci hesabı ve `flows/android-student.md`'de belgelenen tüm ekranlar
- Günlük bildirim, çalışma kaydı, soru çözme kaydı, ödev durumu
- İzin verilmiş telefon kullanım verisi senkronizasyonu (sadece tarih/uygulama/süre)
- Offline kuyruk + idempotency (internet yokken kayıt, bağlantı gelince senkron —
  PDF §10, §30)
- Google Play Store dağıtımı (APK manuel dağıtım ana yöntem değil — PDF §11)
- Android kullanan öğretmenler için temel öğretmen fonksiyonları (PDF §4-A son satır)

## Kapsam dışı

- Native iOS öğrenci uygulaması (PDF §21, §29 — yapılmayacak)
- Mesaj/fotoğraf/video/mikrofon/kamera erişimi (asla — bkz. [CLAUDE.md](../../CLAUDE.md))

## Bitiş kriterleri

- [ ] Tüm ekranlar `flows/android-student.md`'ye uygun şekilde çalışıyor
- [ ] Offline kayıt + senkronizasyon + idempotency test edilmiş (aynı kayıt iki kez
      gönderilirse çift kayıt oluşmuyor)
- [ ] Telefon kullanım verisi sadece izin verilen minimal alanları topluyor
- [ ] Play Store'a yayınlanmaya hazır (imzalama, gizlilik politikası linki, vs.)
