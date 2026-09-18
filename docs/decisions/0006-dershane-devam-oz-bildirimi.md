---
title: "0006 — Dershane devam bilgisi öğrenci öz-bildirimi ile toplanır"
description: Günlük "dershaneye gittin mi?" sorusu, giriş/çıkış saati ve bu verinin ne olmadığı.
status: accepted
updated_at: 2026-09-17
---

# 0006 — Dershane Devam Bilgisi Öğrenci Öz-Bildirimi ile Toplanır

## Bağlam

Rehberliğin öğrenciyle konuşurken ihtiyaç duyduğu en temel bilgilerden biri
öğrencinin dershaneye gelip gelmediği ve ne kadar kaldığı. Bu bilgiyi toplamanın
üç yolu vardı:

1. **Konum takibi (GPS/geofence)** — cihazın dershane binasında olup olmadığını
   otomatik ölçmek.
2. **Kurum tarafı yoklama** — turnike/kart sistemi veya öğretmenin yoklaması.
3. **Öğrencinin kendi beyanı** — uygulamada günlük bir soru.

## Karar

**Öğrenci öz-bildirimi (3).** Android uygulaması günde bir kez "Bugün
dershaneye gittin mi?" sorusunu sorar. Öğrenci "gittim" derse giriş saatini,
akşam ~20.00'deki hatırlatmadan sonra da çıkış saatini girebilir.

Veri `daily_dershane_presence` tablosunda tutulur, `report_source` alanı
`student_self_report` değerini alır.

## Gerekçe

- **Konum takibi reddedildi.** AGENTS.md'deki değişmez kural açık: telefon
  verisi *minimal* tutulur (tarih/uygulama/süre) ve felsefe "gözetim değil
  rehberlik". Sürekli konum, öğrencinin dershane dışındaki hayatını da
  görünür kılar — ürünün amacı bu değil. KVKK açısından da konum, özel nitelikli
  olmasa bile çok daha ağır bir veri kategorisi; toplamamak en temiz çözüm.
- **Kurum tarafı yoklama şu an mümkün değil.** Dershanelerin turnike/kart
  altyapısı standart değil, her dershane için ayrı entegrasyon gerekir — bu,
  "dershane başına ayrı kod tabanı yok" kuralıyla çelişir. İleride bir dershane
  kendi yoklama verisini sağlarsa `report_source` alanına yeni bir değer
  (`institution_record`) eklemek yeterli olacak şekilde tasarlandı.
- Öz-bildirim aynı zamanda öğrenciyi kendi düzenine dair **düşünmeye** davet
  ediyor; bu, ürünün rehberlik felsefesiyle uyumlu.

## Bunun ne OLMADIĞI (uygulama kuralı)

Bu veri **kesin devam kanıtı değildir** ve **disiplin verisi olarak
kullanılamaz**. Doğrulanmamış bir beyandır: öğrenci yanlış hatırlayabilir,
girmeyi unutabilir, ya da olduğundan farklı yazabilir. Bu yüzden:

- Arayüzde her zaman **"Öğrencinin beyanı"** kaynağı görünür.
- Bu veriden **otomatik puan, devamsızlık skoru, "yalan tespiti" ya da otomatik
  disiplin sonucu üretilmez.** Rehberlik ekranında sadece ham kayıtlar ve
  *destekleyici* konuşma önerileri gösterilir (örn. "Bu hafta düzenini konuşmak
  ister misiniz?").
- Veri eksikliği (bildirim girilmemiş gün) bir suçlama olarak sunulmaz;
  "uygulamayı kullanmakta zorlanıyor olabilir" gibi nötr bir okuma sunulur.

## Sonuçlar

- Yeni tablo: `daily_dershane_presence`
  (bkz. `supabase/migrations/0006_daily_dershane_presence.sql`,
  [data-model.md](../data-model.md)).
- Günde bir kayıt: `UNIQUE (tenant_id, student_id, attendance_date)`.
  Offline kuyruk için ayrıca `UNIQUE (tenant_id, client_record_id)` — diğer
  cihaz kaynaklı tablolarla aynı idempotency kuralı.
- Rehberlik öğrenci profilinde **"Dershane düzeni"** bölümü
  (`/rehberlik/students/[id]`).
- Android tarafı (Codex): günlük soru + akşam ~20.00 çıkış saati hatırlatması,
  bkz. [flows/android-student.md](../flows/android-student.md).

## KVKK notu

Toplanan alanlar: tarih, gitti/gitmedi, giriş saati, çıkış saati, kayıt kaynağı
ve idempotency kimliği. Konum ve serbest not yok. Erişen: öğrencinin kendisi, kendisine atanmış rehberlik kullanıcısı,
dershane admini. Saklama süresi Faz 3'te (KVKK sertleştirmesi) diğer
kategorilerle birlikte kararlaştırılacak.
