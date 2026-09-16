---
title: "0004 — Toplu içe aktarmada sadece CSV (xlsx yok)"
description: Excel (.xlsx) desteği güvenlik nedeniyle bilinçli olarak kapsam dışı bırakıldı.
status: accepted
updated_at: 2026-09-16
---

# 0004 — Toplu İçe Aktarmada Sadece CSV

**Durum:** kabul edildi
**Tarih:** 2026-09-16

## Soru

Faz B planında hem `.csv` hem `.xlsx` desteklemek için `xlsx` (SheetJS) paketi
kullanılması öngörülmüştü.

## Karar

`xlsx` **kullanılmadı**. Toplu içe aktarma (roster ve ileride deneme sonuçları)
sadece **CSV** dosyalarını destekliyor, `papaparse` ile parse ediliyor.

## Gerekçe

npm'deki güncel `xlsx` sürümü (0.18.5 — npm'e yayınlanan son sürüm) düzeltilmemiş
yüksek önemli güvenlik açıkları taşıyor:
- Prototip kirlenmesi (Prototype Pollution)
- Regex tabanlı hizmet reddi (ReDoS)

SheetJS bu açıkların yamalarını artık npm registry'sine değil kendi CDN'lerine
yayınlıyor — yani npm üzerinden güncel/güvenli bir sürüm almak mümkün değil.
`papaparse` aynı işi (dosya parse) CSV için görüyor ve şu an bilinen bir güvenlik
açığı yok (`npm audit` temiz).

Kapsam daralması küçük: dershaneden PDF olarak gelen veriyi zaten elle bir
şablona aktarıyoruz (bkz. [0003-toplu-kayit-ve-claim-akisi.md](0003-toplu-kayit-ve-claim-akisi.md));
Excel dosyası olsa bile "Farklı Kaydet → CSV" tek adımlık bir işlem.

## Sonuçlar

- `src/lib/import/parse-csv.ts` sadece `.csv` kabul ediyor.
- Şablonlar (`public/templates/*.csv`) zaten CSV formatında, değişiklik gerekmedi.
- İleride gerçekten `.xlsx` desteği istenirse: SheetJS'in kendi CDN'inden
  (`https://cdn.sheetjs.com`) güncel sürüm kurulabilir — npm registry'den değil.
