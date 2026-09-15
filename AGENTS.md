---
title: Yapay zeka ajanları için çalışma sözleşmesi
description: Bu repoda çalışan her AI kodlama aracının (Claude Code, Codex, ChatGPT vb.) uyması gereken kurallar — tek kaynak.
status: active
updated_at: 2026-09-16
---

# Dershane Öğrenci Takip Sistemi — AI Ajan Kuralları

Bu dosya, bu repoda çalışan **her** AI kodlama aracı için tek kaynak: Claude Code
`CLAUDE.md` üzerinden (`@AGENTS.md` importu ile) otomatik okur; Codex/ChatGPT gibi
`AGENTS.md` konvansiyonunu izleyen araçlar bu dosyayı doğrudan okur. Amaç: aylarca
sürecek bu projede, hangi araç çalışırsa çalışsın, oturumlar arasında bağlam
kaybını önlemek ve tekrar eden hataları engellemek.

**Birden fazla araç aynı repoda çalışıyorsa:** sırayla çalışın (bir araç bitirip
commit/push etsin, diğeri güncel hali çeksin) — aynı anda paralel çalışmak git
çakışmalarına (merge conflict) yol açar. Paralel çalışmak gerekiyorsa ayrı git
branch'leri kullanın, aynı dosyaları aynı anda düzenlemeyin.

## Her oturumun başında

1. [docs/index.md](docs/index.md) oku — güncel faz, durum ve linkler burada.
2. [STATE.md](STATE.md) dosyasının son 5-10 girdisini oku — en son ne yapıldı, ne kaldı.
3. Aktif fazın dosyasını oku (`docs/phases/`) — o fazın kapsamı ve "bitti" tanımı.
4. Eğer üzerinde çalışılacak konu `docs/open-questions.md` içinde açık bir soruya
   bağlıysa, önce onu gündeme getir; varsayım yapıp ilerleme.

## Her oturumun sonunda (anlamlı bir ilerleme olduysa)

1. [STATE.md](STATE.md) içine tarihli, tek paragraflık bir satır ekle (append-only,
   var olan girdileri değiştirme/silme). Format aşağıda.
2. Eğer faz durumu değiştiyse (`planned → in-progress → done`) ilgili
   `docs/phases/*.md` dosyasının frontmatter'ındaki `status` alanını güncelle.
3. Eğer bir açık soru cevaplandıysa: `docs/open-questions.md`'den kaldır,
   `docs/decisions/NNNN-*.md` olarak kayıt aç (ADR formatı, şablon: `0000-template.md`).
4. `docs/index.md` içindeki "Şu an neredeyiz" bölümünü güncel duruma göre düzelt.

Bunlar otomatik bir script tarafından değil, bizzat oturumu yürüten ajan tarafından
yapılır — bu proje bir "multi-agent orchestrator" çatısı değil, zaman içinde farklı
AI araç oturumlarının aynı belgeleri okuyup güncellediği bir sistemdir. Alt-agent
(Explore/Plan/general-purpose) sadece paralel araştırma veya büyük context'i ana
oturumdan izole etmek için kullanılır; kalıcı durumu asla kendi başına tutmaz —
her zaman STATE.md / docs'a yazar.

## STATE.md giriş formatı

```
## 2026-09-15 — Faz 0 iskeleti kuruldu
Docs ailesi (index, kickoff, phases, decisions, flows) oluşturuldu. Sıradaki adım:
Android öğrenci akışının ekran ekran dokümante edilmesi (docs/flows/android-student.md).
```

Tek satır başlık + kısa paragraf yeterli. Uzun teknik detay ilgili doc dosyasına gider,
STATE.md sadece "ne oldu, sırada ne var" özetidir.

## Değişmez kurallar (üründen)

Bunlar `docs/source/urun-tanimi-v1.0.pdf` içindeki ürün tanımından türetildi ve
faz ne olursa olsun geçerlidir:

- **Tenant izolasyonu backend'de zorunlu.** Frontend'de bir şeyi gizlemek güvenlik
  değildir. Her veri erişiminde tenant_id kontrolü backend authorization katmanında
  yapılır — asla sadece query filtresi/varsayım ile değil.
- **RBAC beş rol:** System Admin, Dershane Admin, Rehberlik, Öğretmen, Öğrenci.
  Rehberlik ve Öğretmen sadece **yetkili oldukları** öğrencileri görür, tümünü değil.
- **Telefon kullanım verisi minimal tutulur:** sadece tarih/uygulama/süre. Mesaj,
  fotoğraf, mikrofon, kamera gibi verilere asla ihtiyaç yok — bunu genişletme.
- **Felsefe:** "Gözetim değil rehberlik." UI metinleri, bildirimler ve özellik
  kararları öğrenciyi suçlayıcı/izleyici değil, destekleyici bir dille kurulur.
- **KVKK'yı sona bırakma.** Yeni bir veri kategorisi eklerken: ne toplanıyor, neden,
  kim erişiyor, ne kadar saklanıyor sorularını `docs/open-questions.md` veya
  `docs/decisions/` üzerinden görünür tut.
- **Dershane başına ayrı kod tabanı yok.** Özelleştirme tenant config / feature flag
  ile yapılır.

## Faz kapısı

Bir sonraki fazın kod/iskelet işine **başlamadan önce**, aktif fazın
`docs/phases/*.md` dosyasındaki "Bitiş kriterleri" karşılanmış ve `status: done`
olmalı. Faz 0 tamamlanmadan (Android akışı + Web akışı + veri modeli belgelenmeden)
gerçek uygulama kodu (Next.js/API/Android proje iskeleti) oluşturulmaz.

## Bekleyen protokol kararı

Kullanıcıyla checkpoint bazlı bağımsız review fikri konuşuldu (her faz teslimatı/
commit öncesi taze bağlamla bu dosyadaki kurallara karşı kontrol) — mutabık
kalındı ama henüz kurulmadı, kullanıcı "daha sonra" dedi. Detay:
[docs/phases/phase-0-wireframes.md](docs/phases/phase-0-wireframes.md) → "Ertelenen
karar". Bu konu tekrar gündeme geldiğinde burada somut bir protokol maddesi
haline getirilecek.

## Teknik yığın

Next.js (App Router, TypeScript) tek uygulama — web paneli + API Route
Handler'ları · Supabase (managed PostgreSQL + Auth, EU/Frankfurt) · Vercel
hosting (EU/Frankfurt). Ayrı bir backend servisi yok. Detay ve gerekçe:
[decisions/0002-teknik-mimari.md](docs/decisions/0002-teknik-mimari.md).

## Kaynak doküman

Ürünün tek yetkili tanımı: [docs/source/urun-tanimi-v1.0.pdf](docs/source/urun-tanimi-v1.0.pdf).
Özet/işlenmiş hali: [docs/00-kickoff.md](docs/00-kickoff.md). Çelişki olursa PDF esas alınır,
kickoff dosyası güncellenir.

<!-- Next.js'in kendi `next dev`/`next build` süreci, bu dosyanın altına kendi
agent-rules bloğunu (Next.js 16 API değişiklikleri uyarısı) otomatik ekleyip
günceller — bu normaldir, silmeyin, elle düzenlemeyin. -->
