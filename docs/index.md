---
title: Doküman merkezi
description: Projenin tüm belgelerine giriş noktası ve güncel durum özeti.
status: active
updated_at: 2026-09-15
---

# Dershane Öğrenci Takip ve Erken Uyarı Sistemi — Doküman Merkezi

Her oturuma buradan başla. Ayrıntılar için [CLAUDE.md](../CLAUDE.md).

## Şu an neredeyiz

**Aktif faz:** [Faz 0 — Akış & Veri Modeli Belgelendirmesi](phases/phase-0-wireframes.md)
(`status: in-progress`)

**Sıradaki iş:** [flows/android-student.md](flows/android-student.md) ilk taslağı
yazıldı — kullanıcı gözden geçirip onaylamalı (özellikle giriş/auth ekranı,
`open-questions.md`'deki auth kararına bağlı). Ardından web panel akışları
(`web-dershane-admin.md`, `web-rehberlik.md`, `web-ogretmen.md`) doldurulacak.

**Kod durumu:** Henüz yok. Faz 0 bitmeden (bkz. faz dosyasındaki bitiş kriterleri)
uygulama iskeleti kurulmayacak.

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
