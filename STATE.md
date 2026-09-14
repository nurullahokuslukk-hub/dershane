---
title: Proje durumu (append-only log)
description: Oturumlar arası tek gerçek kaynak — en son ne yapıldı, sırada ne var.
status: active
updated_at: 2026-09-15
---

# STATE

Bu dosyaya sadece **ekleme** yapılır, geçmiş girdiler değiştirilmez/silinmez.
En yeni girdi en üstte. Format için [CLAUDE.md](CLAUDE.md) → "STATE.md giriş formatı".

---

## 2026-09-15 — Android öğrenci akışı ilk taslağı yazıldı

[docs/flows/android-student.md](docs/flows/android-student.md) onboarding (splash,
giriş, davet kodu, profil tamamlama, onay bekleniyor), ana kullanım (günlük
bildirim, çalışma/soru kaydı, ödevler, deneme sonuçları, etüt), telefon kullanım
senkronizasyonu (izin ekranı, durum) ve profil/ayarlar ekranlarıyla dolduruldu
(`status: in-progress` — kullanıcı onayı bekliyor). Giriş ekranının kesin alanları
auth yöntemi kararına bağlı, bu netleşmeden `done` işaretlenmeyecek. Git deposu
başlatılıp ilk commit (`c739423`) atıldı.

**Sırada:** Kullanıcı android-student.md'yi gözden geçirecek; onaylanırsa
`web-dershane-admin.md`, `web-rehberlik.md`, `web-ogretmen.md` akışlarına geçilecek.

## 2026-09-15 — Proje iskeleti kuruldu (Faz 0 başladı)

`urun-tanimi-v1.0.pdf` incelendi, `docs/source/` altına kopyalandı. Docs ailesi
oluşturuldu: `docs/index.md` (hub), `docs/00-kickoff.md` (özet ürün tanımı),
`docs/open-questions.md` (PDF §32'deki 9 açık soru), `docs/glossary.md`,
`docs/phases/` (5 faz: 0-wireframes, 1-mvp-backend-web, 2-android, 3-kvkk-hardening,
4-ai-layer), `docs/decisions/` (ADR şablonu), `docs/flows/` (rol bazlı akış
dosyaları, henüz boş iskelet). `CLAUDE.md` ile oturum protokolü ve değişmez
kurallar tanımlandı. Eski `.env`/`.env.example`/`.gitignore` (önceki bir taslaktan
kalma, Next.js+API+Postgres öngörüyordu) silindi — Faz 0 kod içermeyeceği için
gereksizdi, Faz 1'de yeniden ve bilinçli şekilde kurulacak. Git deposu henüz
başlatılmadı.

**Sırada:** `docs/flows/android-student.md` ve `docs/flows/web-*.md` dosyalarının
ekran ekran doldurulması (PDF §35 madde 1-2), ardından `docs/data-model.md`
(madde 3).
