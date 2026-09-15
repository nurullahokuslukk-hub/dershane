---
title: Veri modeli
description: Veritabanında tutulacak tüm veri kategorileri ve alanları.
status: done
updated_at: 2026-09-15
---

# Veri Modeli

Kaynak: PDF §8 (ana veri kategorileri), §6 (multi-tenant yapı). Auth alanları için
[decisions/0001-auth-yontemi.md](decisions/0001-auth-yontemi.md). Bu dosya
kullanıcı onayı bekliyor; onaylanınca `status: done` yapılacak.

## Ortak kurallar

Bu kurallar tek tek her tabloda tekrar yazılmaz, hepsi için geçerlidir:

- Her tablo: `id`, `tenant_id` (system_admin hariç **zorunlu**, aşağıya bkz.),
  `created_at`, `updated_at`.
- **Tenant izolasyonu DB seviyesinde de desteklenir:** `tenant_id` her sorguda
  backend authorization katmanında filtrelenir (bkz. [CLAUDE.md](../CLAUDE.md));
  ayrıca mümkünse Postgres Row-Level Security ile ikinci bir savunma katmanı
  düşünülebilir (Faz 1 teknik mimari kararı).
- **Rol/durum alanları için native Postgres `ENUM` yerine `TEXT` + `CHECK`
  constraint (veya ayrı bir lookup tablosu) tercih edilir.** Native enum'a yeni
  değer eklemek production'da kısıtlı/transaction-unsafe olabiliyor; `CHECK`
  constraint'i değiştirmek sıradan bir migration'dır. Bu, "yeni bir rol/durum
  eklenince zorlanmama" gereksiniminin doğrudan karşılığı.
- **Idempotency (cihazdan gelen tüm kayıtlar için genel kural, PDF §10):**
  öğrenci cihazından senkronize edilen her kayıt (`daily_checkin`, `study_session`,
  `question_log`, `phone_usage_log`, ödev durum güncellemeleri) bir
  `client_record_id` (öğrenci cihazında üretilen UUID) taşır. `(tenant_id,
  client_record_id)` üzerinde unique constraint — aynı kayıt tekrar gönderilirse
  upsert/no-op yapılır, çift kayıt oluşmaz.
- Yeni bir yapılandırılmış alan eklenmek istendiğinde: nullable bir kolon eklemek
  yeterlidir, mevcut kayıtlar etkilenmez (breaking migration'dan kaçınma stratejisi).

## Kurumsal bilgiler

### `tenant` (dershane)
`id`, `name`, `slug`, `status` (active/suspended), `feature_flags` (jsonb —
PDF §13 tenant configuration/feature flag için).

### `branch` (şube)
`id`, `tenant_id`, `name`, `address` (opsiyonel).

### `class_group` (sınıf)
`id`, `tenant_id`, `branch_id`, `name` (örn. "12-A"), `academic_year`.

### `user_account`
`id` (= `auth.users.id`, Supabase Auth — **şifre burada değil, Supabase Auth
tarafından yönetilir**, bkz. [decisions/0002-teknik-mimari.md](decisions/0002-teknik-mimari.md)),
`tenant_id` (**nullable, yalnızca `role = system_admin` için** — system admin
tenant'lar üstü çalışır; diğer tüm roller için `NOT NULL` CHECK constraint'i ile
zorunlu), `role` (system_admin/dershane_admin/rehberlik/ogretmen/ogrenci),
`auth_identifier`, `identifier_type` (email/phone), `full_name`,
`status` (pending/active/suspended). Auth kararı:
[decisions/0001-auth-yontemi.md](decisions/0001-auth-yontemi.md).

### `student_profile`
`id`, `tenant_id`, `user_id` (FK → user_account, role=ogrenci), `class_group_id`,
`branch_id`, `birth_date` (veli bilgilendirme akışı ileride buna bağlanacak —
bkz. open-questions.md).

### `student_device`
`id`, `tenant_id`, `student_id`, `device_identifier`, `platform`, `first_seen_at`,
`last_seen_at`. Öğrencinin birden fazla cihazı olabilir (PDF §30) — bire-çok ilişki.

### `teacher_class_assignment`
`id`, `tenant_id`, `teacher_user_id`, `class_group_id`. RBAC: öğretmen sadece
atandığı sınıfları/öğrencileri görür.

### `guidance_student_assignment`
`id`, `tenant_id`, `guidance_user_id`, `student_id`. RBAC: rehberlik sadece
atandığı öğrencileri görür (sınıf değil öğrenci bazlı — PDF §30 "rehberlik bütün
öğrencileri görebilir mi? → Hayır, yalnızca yetkili olduğu öğrencileri").

### `invite_code`
`id`, `tenant_id`, `code`, `branch_id`, `class_group_id` (nullable), `status`
(active/used/expired), `created_by_user_id`, `expires_at`, `used_by_user_id`
(nullable).

## Deneme sınavları

PDF §8'de "Deneme sınavları" ve "Ders bazlı sonuçlar" ayrı maddeler olarak
listelenmiş; burada tek bir yapıya konsolide edildi çünkü ders bazlı sonuç,
denemenin doğal detay satırıdır — ayrı bir "genel sonuç" tablosu tutmak veriyi
çift kaynaklı hale getirirdi. Genel/toplam sonuç, ders bazlı satırlardan
hesaplanır (view veya uygulama katmanında).

### `mock_exam`
`id`, `tenant_id`, `name`, `exam_date`, `exam_type` (serbest metin/etiket — yeni
bir sınav türü eklemek için migration gerekmez).

### `mock_exam_subject_result`
`id`, `tenant_id`, `mock_exam_id`, `student_id`, `subject`, `correct_count`,
`wrong_count`, `blank_count`, `net` (hesaplanmış veya saklanmış).

## Ödevler

### `homework`
`id`, `tenant_id`, `class_group_id` (sınıfa toplu atama), `subject`, `title`,
`description`, `due_date`, `created_by_user_id` (öğretmen).

### `homework_assignment`
`id`, `tenant_id`, `homework_id`, `student_id`, `status` (pending/done/late/
excused), `completed_at`. Ödev tanımı ile öğrenci bazlı durumun ayrılması, hem
sınıfa toplu atamayı hem bireysel durumu aynı yapıda destekler.

## Çalışma süreleri ve etüt katılımı

PDF §8'de "Çalışma süreleri" ve "Etüt katılımı" ayrı maddeler; burada tek bir
`study_session` tablosu + etüt için ayrı bir planlama tablosu olarak tasarlandı.
Gerekçe: etüt, öğretmen tarafından **planlanan** ve katılımı takip edilen bir
çalışma türüdür; serbest çalışma öğrencinin kendi girdiğidir. İkisi de "ne kadar
çalıştı" sorusuna cevap verir, tek tablo + `type` alanı ile zaman serisi
(PDF §17) karşılaştırması kolaylaşır; ayrı tablolar olsaydı her analizde iki
tabloyu birleştirmek gerekirdi.

### `planned_study_block` (etüt planı)
`id`, `tenant_id`, `class_group_id`, `scheduled_at`, `duration_minutes`,
`created_by_user_id` (öğretmen/admin).

### `study_session`
`id`, `tenant_id`, `student_id`, `type` (serbest/etut), `planned_block_id`
(nullable, FK → planned_study_block, yalnızca type=etut için dolu),
`subject` (nullable), `duration_minutes`, `occurred_at`, `attendance_status`
(katıldı/katılmadı/geç — yalnızca type=etut için anlamlı), `client_record_id`
(idempotency, bkz. Ortak kurallar).

## Çözülen soru sayıları

### `question_log`
`id`, `tenant_id`, `student_id`, `subject`, `topic` (nullable), `question_count`,
`occurred_at`, `client_record_id`.

## Günlük bildirimler

PDF'de format belirtilmemiş; zaman serisi karşılaştırması yapılabilmesi için
(PDF §17: çalışma/soru düşerken telefon kullanımı artabilir gibi bir sinyal
üretebilmek adına) hafif yapılandırılmış bir alan + serbest not tercih edildi —
tamamen serbest metin trend analizine uygun değil, tamamen formsal ise
"gözetim değil rehberlik" felsefesiyle çelişecek kadar ağır olurdu.

### `daily_checkin`
`id`, `tenant_id`, `student_id`, `checkin_date`, `mood_score` (1-5, opsiyonel öz-
değerlendirme), `note` (serbest metin, opsiyonel), `client_record_id`.
`UNIQUE (tenant_id, student_id, checkin_date)` — günde bir kayıt kuralını DB
seviyesinde de zorunlu kılar.

## Telefon kullanım istatistikleri

### `phone_usage_log`
`id`, `tenant_id`, `student_id`, `device_id` (FK → student_device), `usage_date`,
`app_name`, `duration_minutes`, `client_record_id`, `synced_at`.
`UNIQUE (tenant_id, client_record_id)` — idempotency. Sadece bu üç alan: tarih,
uygulama, süre (PDF §9) — mesaj/foto/video/mikrofon/kamera verisi **hiçbir
tabloda tutulmaz** (bkz. [CLAUDE.md](../CLAUDE.md) değişmez kurallar).

## Rehberlik görüşmeleri

### `guidance_session` (formal görüşme)
`id`, `tenant_id`, `student_id`, `guidance_user_id`, `occurred_at`, `summary`,
`next_step` (nullable).

### `guidance_note` (hızlı not, görüşme dışı)
`id`, `tenant_id`, `student_id`, `guidance_user_id`, `note`, `created_at`.

## Kapsam dışı (Faz 3'e ertelendi)

`audit_log` (kritik aksiyonların kaydı — veri erişimi, silme, rol değişikliği) ve
rate limiting/secret yönetimi ile ilgili tablolar burada detaylandırılmadı; bunlar
[phases/phase-3-kvkk-hardening.md](phases/phase-3-kvkk-hardening.md) kapsamında
ayrıca tasarlanacak. Şimdiden tasarlamamak bilinçli bir tercih — MVP şemasını
şişirmeden, o faza geldiğinde generic bir `audit_log` tablosu (actor, action,
target, tenant_id, occurred_at) eklemek diğer tablolara dokunmadan mümkündür.
