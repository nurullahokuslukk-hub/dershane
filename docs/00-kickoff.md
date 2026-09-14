---
title: Kickoff paketi
description: Ürünün özetlenmiş tanımı — tek yetkili kaynak olan PDF'in kod-öncesi referans özeti.
status: active
updated_at: 2026-09-15
---

# Kickoff Paketi

Kaynak: [urun-tanimi-v1.0.pdf](source/urun-tanimi-v1.0.pdf) (8 Eylül 2026, v1.0).
Çelişki durumunda PDF esastır, bu dosya PDF'e göre güncellenir.

## Ürün özeti

Dershanelerin öğrencilerinin akademik performansını, çalışma düzenini, ödevlerini,
deneme sonuçlarını, etüt/katılım durumunu, günlük durum bildirimlerini ve izin verilen
Android telefon kullanım verilerini tek bir öğrenci profilinde, zaman içinde birleştiren
öğrenci takip ve rehberlik destek sistemi.

**Amaç öğrenciyi gözetlemek değil** — akademik performans ciddi şekilde düşmeden önce
çalışma düzenindeki değişimi rehberlik birimine görünür kılmaktır.

## Nihai karar (PDF §34)

| Alan | Karar |
|---|---|
| Hedef müşteri | Dershaneler (SaaS, abonelik) |
| Hedef kullanıcılar | Öğrenci, Öğretmen, Rehberlik, Dershane Admin, (System Admin) |
| Öğrenci platformu | Android (native iOS yok — ilk aşamada) |
| Personel platformu | Responsive Web + gerektiğinde Android |
| Dağıtım | Google Play Store (APK manuel dağıtım ana yöntem değil) |
| Mimari | Multi-tenant SaaS, tek database, backend'de zorunlu tenant izolasyonu |
| Ana gelir modeli | Dershanelerden SaaS ücreti (reklam değil) |
| Ana güvenlik kuralı | Dershaneler birbirinin verisini asla göremez |
| Ana felsefe | Gözetim değil rehberlik desteği |
| İlk hedef pazar | Cizre — ama Cizre'ye özel kodlanmayacak, Türkiye geneline satılabilir olacak |

## Kullanıcı rolleri (PDF §5)

- **System Admin** — sistem geneli yönetim
- **Dershane Admin** — şube/sınıf/öğrenci/öğretmen/rehberlik yönetimi, öğrenci onayı
- **Rehberlik** — yetkili olduğu öğrencilerin tarihsel verisi + rehberlik görüşmeleri
- **Öğretmen** — yetkili öğrenciler için ödev/deneme/akademik kayıt yönetimi
- **Öğrenci** — kendi verisi: çalışma, soru, günlük bildirim, ödev durumu

## Veri akışı (PDF §3)

```
Öğrenci → Deneme sonuçları → Ödevler → Etüt → Çalışma → Soru çözme
        → Günlük bildirim → Telefon kullanımı → Rehberlik görüşmeleri
```

## MVP kapsamı (PDF §28)

- **Dershane:** oluşturma, admin hesabı, şube, sınıf
- **Kullanıcı:** admin, öğretmen, rehberlik, öğrenci (RBAC)
- **Öğrenci:** kayıt, profil, günlük bildirim, çalışma kaydı, soru sayısı, ödev,
  deneme sonuçları, temel telefon kullanım verisi
- **Rehberlik:** öğrenci listesi, profil, geçmiş veriler (deneme/çalışma/ödev/telefon/
  günlük bildirim), rehberlik notları
- **Sistem:** multi-tenant, RBAC, API, database, authentication, tenant isolation, sync

## MVP kapsamı DIŞI (PDF §29)

Native iOS öğrenci uygulaması · gelişmiş AI · karmaşık tahmin modelleri · reklam
sistemi · gelişmiş veli uygulaması · gereksiz sosyal özellikler · dershane başına ayrı
kod tabanı · gereksiz telefon izinleri (mesaj/foto/video/mikrofon/kamera — asla).

## Telefon kullanım verisi — ilk hedef (PDF §9)

Sadece: **tarih / uygulama / kullanım süresi**. Örnek: `2026-09-05 / YouTube / 82 dk`.

## Geliştirme sırası (PDF §33, §35)

Kodlamadan önce netleştirilecekler: ürün tanımı → kullanıcılar → kullanıcı akışları →
veri modeli → yetki modeli → telefon verisi → öğrenci kayıt sistemi → rehberlik paneli
→ dershane paneli → KVKK/veri politikası → teknik mimari → MVP kapsamı.

PDF §35'e göre kod yazmaya geçmeden önce **üç konu** kesinleşmeli:
1. Öğrenci Android uygulamasının tüm ekranları ve kullanıcı akışı
2. Web panelinin tüm ekranları ve kullanıcı akışı
3. Database'de tutulacak bütün veri alanları

→ Bu üçü [Faz 0](phases/phase-0-wireframes.md)'ın bitiş kriterleridir.

## Satış konumlandırması (PDF §25)

❌ "Öğrencinin telefonunu takip eden uygulama" **değil**.
✅ "Öğrencinin çalışma ve akademik performansındaki değişimleri tek panelden
görmenizi sağlayan rehberlik destek sistemi."

Bu, UI metni ve pazarlama dili kararlarında referans alınacak.
