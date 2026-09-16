---
title: Doküman merkezi
description: Projenin tüm belgelerine giriş noktası ve güncel durum özeti.
status: active
updated_at: 2026-09-15
---

# Dershane Öğrenci Takip ve Erken Uyarı Sistemi — Doküman Merkezi

Her oturuma buradan başla. Ayrıntılar için [AGENTS.md](../AGENTS.md).

## Şu an neredeyiz

**Faz 0** ([Akış & Veri Modeli Belgelendirmesi](phases/phase-0-wireframes.md))
kullanıcı tarafından onaylandı (2026-09-15), `status: done`.

**Aktif faz:** [Faz 1 — MVP Backend & Web Panel](phases/phase-1-mvp-backend-web.md)
(`status: in-progress`). Teknik mimari: [decisions/0002-teknik-mimari.md](decisions/0002-teknik-mimari.md).
Toplu kayıt/claim modeli: [decisions/0003-toplu-kayit-ve-claim-akisi.md](decisions/0003-toplu-kayit-ve-claim-akisi.md).

**Kod durumu:** Auth (Supabase, claim akışı), rol bazlı yönlendirme, audit log,
Sentry hepsi çalışıyor. **Faz A (yönetim CRUD) ve Faz B (roster toplu içe
aktarma) tamamlandı** — uçtan uca doğrulandı (bkz. STATE.md). Sadece CSV
destekleniyor, Excel değil (bkz. [decisions/0004-csv-only-import.md](decisions/0004-csv-only-import.md)).
Sırada: Faz C (deneme sonucu toplu içe aktarma) → Faz D (rehberlik ekranında
gösterme).
Detaylı plan ve gerekçe: STATE.md 2026-09-16 girdisi. Kurulum:
[guides/supabase-vercel-kurulum.md](guides/supabase-vercel-kurulum.md).

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
