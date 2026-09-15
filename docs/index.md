---
title: Doküman merkezi
description: Projenin tüm belgelerine giriş noktası ve güncel durum özeti.
status: active
updated_at: 2026-09-15
---

# Dershane Öğrenci Takip ve Erken Uyarı Sistemi — Doküman Merkezi

Her oturuma buradan başla. Ayrıntılar için [CLAUDE.md](../CLAUDE.md).

## Şu an neredeyiz

**Faz 0** ([Akış & Veri Modeli Belgelendirmesi](phases/phase-0-wireframes.md))
kullanıcı tarafından onaylandı (2026-09-15), `status: done`.

**Aktif faz:** [Faz 1 — MVP Backend & Web Panel](phases/phase-1-mvp-backend-web.md)
(`status: in-progress`). Teknik mimari kararlaştırıldı:
[decisions/0002-teknik-mimari.md](decisions/0002-teknik-mimari.md).

**Kod durumu:** Next.js proje iskeleti çalışıyor — auth (Supabase), rol bazlı
yönlendirme, giriş/şifremi-unuttum ekranları, üç panel stub'ı (admin/rehberlik/
öğretmen), tam DB şeması + RLS migration'ı hazır
([supabase/migrations/0001_init.sql](../supabase/migrations/0001_init.sql)).
Gerçek Supabase/Vercel hesabı **kullanıcı tarafından** açılmalı, adımlar:
[guides/supabase-vercel-kurulum.md](guides/supabase-vercel-kurulum.md). Sıradaki
kod işi: rol panellerinin gerçek içerikle doldurulması (flows/*.md'ye göre).

## Doküman ailesi

| Dosya | Amaç |
|---|---|
| [00-kickoff.md](00-kickoff.md) | Ürünün özet tanımı, hedef karar, kapsam dışı liste |
| [open-questions.md](open-questions.md) | Henüz karara bağlanmamış sorular |
| [decisions/](decisions/) | Karara bağlanmış sorular (ADR formatında, kalıcı) |
| [glossary.md](glossary.md) | Türkçe domain terimleri (dershane, etüt, deneme, vs.) |
| [phases/](phases/) | Faz planı — her fazın kapsamı ve bitiş kriterleri |
| [flows/](flows/) | Rol bazlı ekran/kullanıcı akışı belgeleri |
| [data-model.md](data-model.md) | Veritabanında tutulacak tüm veri alanları |
| [source/](source/) | Orijinal ürün tanımı PDF'i (tek yetkili kaynak) |

## Faz haritası

1. **Faz 0 — Akış & Veri Modeli** *(aktif)* — kod yok, sadece belge
2. **Faz 1 — MVP Backend & Web** — API, PostgreSQL, admin/rehberlik/öğretmen web paneli
3. **Faz 2 — Android** — öğrenci uygulaması, senkronizasyon, telefon kullanım verisi
4. **Faz 3 — KVKK & Sertleştirme** — hukuki süreçler, audit log, rate limiting, backup
5. **Faz 4 — AI Katmanı** — özet/erken uyarı analizi (zorunlu değil, sona bırakıldı)

Detaylar: [docs/phases/](phases/)

## Yaşayan dosyalar (nasıl güncel tutulur)

- [STATE.md](../STATE.md) — append-only oturum günlüğü, her oturum sonunda bir girdi eklenir.
- Bu dosya (`docs/index.md`) — anlık durum panosu, üzerine yazılır (append değil).
- [open-questions.md](open-questions.md) — sorular karara bağlandıkça buradan silinip
  `decisions/`e taşınır.
- Faz dosyalarının frontmatter'ındaki `status` alanı (`planned`/`in-progress`/`done`)
  ilerledikçe güncellenir.

Güncelleme mekanizması bir arka plan scripti değil — bu kuralları her Claude Code
oturumu [CLAUDE.md](../CLAUDE.md)'deki protokole göre kendisi uygular.
