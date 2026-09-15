---
title: Açık sorular
description: Henüz karara bağlanmamış konular. Bir soru cevaplandığında buradan silinir ve decisions/ altına ADR olarak taşınır.
status: active
updated_at: 2026-09-15
---

# Açık Sorular

Kaynak: PDF §32. Bir soru çözüldüğünde: bu listeden kaldır → `docs/decisions/NNNN-*.md`
olarak kaydet (şablon: [decisions/0000-template.md](decisions/0000-template.md)) →
[docs/index.md](index.md)'i güncelle.

- [ ] **Telefon kullanım verisinin kesin granülerliği** — uygulama bazlı mı, kategori
      bazlı mı, gün içi saat dilimi kırılımı var mı?
- [ ] **Her veri kategorisinin saklama süresi** — deneme sonucu, çalışma kaydı, telefon
      verisi, günlük bildirim için ayrı ayrı retention süresi.
- [ ] **KVKK kapsamındaki hukuki roller ve süreçler** — veri sorumlusu/veri işleyen
      ayrımı, ürün sağlayıcısı ile dershane arasındaki sözleşme yapısı (uzman hukukçu
      görüşü gerekli).
- [ ] **Veli bilgilendirme/izin akışı** — öğrenciler reşit değil, veli onayı nasıl
      alınacak, hangi aşamada.
- [ ] **AI analizinin kesin kapsamı** — Faz 4 kapsamına girecek özellikler netleşmedi
      (bkz. [phases/phase-4-ai-layer.md](phases/phase-4-ai-layer.md)).
- [ ] **Fiyatlandırma** — öğrenci başına / aktif öğrenci / paket bazlı / aylık / yıllık
      modellerinden hangisi, hangi rakamlarla.
- [ ] **Bildirim sisteminin ayrıntıları** — push/SMS/e-posta, kime, hangi tetikleyicide.

## Bu listeye ne zaman soru eklenir?

Faz 0-1 sırasında yeni bir belirsizlik ortaya çıkarsa (örn. bir ekran akışını
tasarlarken netleşmemiş bir kural fark edilirse) buraya eklenir — varsayım yapıp
sessizce ilerlenmez.
