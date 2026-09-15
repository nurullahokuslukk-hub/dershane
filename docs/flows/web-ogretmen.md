---
title: "Akış: Web — Öğretmen"
description: Öğretmen rolünün web panelindeki tüm ekranları ve akışı.
status: done
updated_at: 2026-09-15
---

# Akış: Web — Öğretmen

Format: [flows/_format.md](_format.md). Ortak giriş/layout:
[web-common.md](web-common.md). Kaynak: PDF §5 (rol tanımı).

Not: Android kullanan öğretmenler bu fonksiyonlara uygulamadan da erişebilir
(PDF §4-A). Mobil karşılığı ayrı belgelenmedi — ekranların alan/aksiyon içeriği
aynı kalacağı için, mobil tasarım gerektiğinde bu dosya referans alınır.

## Ekran: Sınıflarım

**Amaç:** Öğretmenin atanmış olduğu sınıfları görmesi
(`teacher_class_assignment`).
**Erişim:** Öğretmen.

**Gösterilen veri:** Atanmış sınıf listesi, öğrenci sayısı.

**Aksiyonlar:**
- Bir sınıfa tıkla → **Sınıf Öğrenci Listesi**

## Ekran: Sınıf Öğrenci Listesi

**Amaç:** Bir sınıftaki öğrencileri listelemek.
**Erişim:** Öğretmen (yalnızca atanmış sınıf).

**Gösterilen veri:** Ad soyad, son ödev durumu özeti.

**Aksiyonlar:**
- Bir öğrenciye tıkla → **Öğrenci Detayı (öğretmen görünümü)**

## Ekran: Öğrenci Detayı (öğretmen görünümü)

**Amaç:** Öğretmenin yetkili olduğu akademik verileri görmesi — rehberlik
panelinin aksine burada sadece akademik veri var (telefon kullanımı, günlük
bildirim, rehberlik notları **görünmez** — RBAC, PDF §15).
**Erişim:** Öğretmen (yalnızca atanmış sınıftaki öğrenci).

**Gösterilen veri:**
- Deneme sonuçları (`mock_exam_subject_result`)
- Ödev durumları (`homework_assignment`)
- Etüt katılımı (`study_session`, type=etut)

## Ekran: Ödev Oluştur

**Amaç:** Sınıfa toplu ödev atamak (`homework`).
**Erişim:** Öğretmen.

**Gösterilen veri / alanlar:** sınıf (atanmışlardan seçilir), ders, başlık,
açıklama, son tarih.

**Aksiyonlar:**
- Kaydet → sınıftaki her öğrenci için otomatik `homework_assignment` (status:
  pending) oluşturulur → **Ödev Listesi**

## Ekran: Ödev Listesi

**Amaç:** Öğretmenin oluşturduğu ödevleri ve öğrenci bazlı tamamlanma durumunu
görmesi.
**Erişim:** Öğretmen.

**Gösterilen veri:** Ödev başlığı, sınıf, son tarih, tamamlanma oranı
(X/Y öğrenci yaptı).

**Aksiyonlar:**
- Bir ödeve tıkla → öğrenci bazlı durum listesi (kimin yaptığı/yapmadığı)

## Ekran: Deneme Sonucu Gir

**Amaç:** Bir sınıf için deneme sonuçlarını toplu girmek (`mock_exam` +
`mock_exam_subject_result`).
**Erişim:** Öğretmen.

**Gösterilen veri / alanlar:**
- Deneme adı, tarih, tür (`mock_exam`)
- Sınıftaki her öğrenci için ders bazlı doğru/yanlış/boş girişi (tablo/grid arayüz)

**Aksiyonlar:**
- Kaydet → **Ödev Listesi** benzeri bir "Deneme Listesi" görünümüne döner
  (öğrencinin kendi deneme sonuçlarını görmesi:
  [android-student.md](android-student.md) → Deneme Sonuçları ekranı)

## Ekran: Etüt Planla

**Amaç:** Sınıf için etüt planlamak (`planned_study_block`).
**Erişim:** Öğretmen.

**Gösterilen veri / alanlar:** sınıf, tarih/saat, süre.

**Aksiyonlar:** Kaydet → **Etüt Katılım Girişi**'nde görünür hale gelir

## Ekran: Etüt Katılım Girişi

**Amaç:** Planlanan bir etüt için öğrenci bazlı katılım durumu girmek
(`study_session`, type=etut, `attendance_status`).
**Erişim:** Öğretmen.

**Gösterilen veri:** Planlanan etüde ait sınıf öğrenci listesi.

**Aksiyonlar:**
- Her öğrenci için katıldı/katılmadı/geç işaretle → Kaydet
