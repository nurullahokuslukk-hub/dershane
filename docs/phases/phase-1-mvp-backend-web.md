---
title: "Faz 1 — MVP Backend & Web Panel"
description: Multi-tenant backend, PostgreSQL veri modeli ve responsive web panelinin (admin/rehberlik/öğretmen) inşası.
status: planned
updated_at: 2026-09-15
---

# Faz 1 — MVP Backend & Web Panel

## Ön koşul

[Faz 0](phase-0-wireframes.md) `status: done` olmalı — özellikle `data-model.md` ve
web akış belgeleri tamamlanmış olmalı.

## Kapsam (PDF §14, §15, §16, §28)

- Backend API (framework kararı burada verilecek — bkz. açık soru: hosting/DB)
- PostgreSQL veri modeli, tenant_id her tabloda zorunlu
- RBAC: System Admin, Dershane Admin, Rehberlik, Öğretmen (Öğrenci rolü Faz 2'de
  Android ile birlikte, ama backend endpoint'leri burada hazırlanabilir)
- Backend authorization katmanında tenant izolasyonu (frontend'de gizleme yeterli
  değil — bkz. [CLAUDE.md](../../CLAUDE.md) değişmez kurallar)
- Dershane/şube/sınıf yönetimi
- Öğrenci kayıt onay akışı (admin tarafı)
- Rehberlik paneli: öğrenci listesi, öğrenci profili, geçmiş veriler
- Deneme sonuçları, ödevler, çalışma süreleri, soru sayıları — CRUD + görüntüleme
- Authentication (yöntem: açık soru, Faz 1 başlamadan karara bağlanmalı)

## Kapsam dışı

- Android uygulaması ve telefon kullanım verisi senkronizasyonu (Faz 2)
- AI/erken uyarı otomasyonu (Faz 4) — ilk sürümde otomatik kırmızı/sarı/yeşil sistem
  zorunlu değil (PDF §16)
- Gelişmiş audit/rate limiting sertleştirmesi (Faz 3'te derinleştirilir, temel
  güvenlik burada da var olmalı)

## Bitiş kriterleri

- [ ] Multi-tenant veri modeli migration'ları çalışıyor
- [ ] RBAC + tenant izolasyonu her endpoint'te test edilmiş (bir dershane diğerinin
      verisini hiçbir şekilde göremiyor)
- [ ] Web panel: dershane admin, rehberlik, öğretmen akışları `flows/` belgelerine
      uygun şekilde çalışıyor
- [ ] Authentication yöntemi kararı `decisions/`e yazılmış ve uygulanmış
