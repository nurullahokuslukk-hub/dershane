---
title: "Faz 1 — MVP Backend & Web Panel"
description: Multi-tenant backend, PostgreSQL veri modeli ve responsive web panelinin (admin/rehberlik/öğretmen) inşası.
status: in-progress
updated_at: 2026-09-15
---

# Faz 1 — MVP Backend & Web Panel

## Ön koşul

[Faz 0](phase-0-wireframes.md) `status: done` olmalı — özellikle `data-model.md` ve
web akış belgeleri tamamlanmış olmalı.

## Teknik yığın (bkz. [decisions/0002-teknik-mimari.md](../decisions/0002-teknik-mimari.md))

Next.js (App Router, TypeScript) — web paneli + API Route Handler'ları tek
uygulamada · Supabase (managed PostgreSQL + Auth), EU/Frankfurt bölgesi · Vercel
hosting, EU/Frankfurt bölgesi · RLS backend authorization'a ek ikinci savunma
katmanı.

## Kapsam (PDF §14, §15, §16, §28)

- Next.js API Route Handler'ları (ayrı bir backend servisi yok)
- PostgreSQL veri modeli ([data-model.md](../data-model.md)), tenant_id her
  tabloda zorunlu + RLS politikaları
- RBAC: System Admin, Dershane Admin, Rehberlik, Öğretmen (Öğrenci rolü Faz 2'de
  Android ile birlikte, ama backend endpoint'leri burada hazırlanabilir)
- Backend authorization katmanında tenant izolasyonu (frontend'de gizleme yeterli
  değil — bkz. [CLAUDE.md](../../CLAUDE.md) değişmez kurallar)
- Dershane/şube/sınıf yönetimi
- Öğrenci kayıt onay akışı (admin tarafı)
- Rehberlik paneli: öğrenci listesi, öğrenci profili, geçmiş veriler
- Deneme sonuçları, ödevler, çalışma süreleri, soru sayıları — CRUD + görüntüleme
- Authentication: Supabase Auth, e-posta veya telefon + şifre
  ([decisions/0001-auth-yontemi.md](../decisions/0001-auth-yontemi.md))

## Kapsam dışı

- Android uygulaması ve telefon kullanım verisi senkronizasyonu (Faz 2)
- AI/erken uyarı otomasyonu (Faz 4) — ilk sürümde otomatik kırmızı/sarı/yeşil sistem
  zorunlu değil (PDF §16)
- Gelişmiş audit/rate limiting sertleştirmesi (Faz 3'te derinleştirilir, temel
  güvenlik burada da var olmalı)

## İlerleme

Proje iskeleti kuruldu ve çalışıyor (bkz. STATE.md 2026-09-15): auth, rol bazlı
yönlendirme, DB şeması + RLS, üç panel stub'ı. Kullanıcı Supabase/Vercel hesabını
kurunca ([guides/supabase-vercel-kurulum.md](../guides/supabase-vercel-kurulum.md))
gerçek panel içerikleri (dashboard verileri, CRUD ekranları) doldurulacak.

## Bitiş kriterleri

- [ ] Multi-tenant veri modeli migration'ları çalışıyor
- [ ] RBAC + tenant izolasyonu her endpoint'te test edilmiş (bir dershane diğerinin
      verisini hiçbir şekilde göremiyor)
- [ ] Web panel: dershane admin, rehberlik, öğretmen akışları `flows/` belgelerine
      uygun şekilde çalışıyor
- [ ] Authentication yöntemi kararı `decisions/`e yazılmış ve uygulanmış
