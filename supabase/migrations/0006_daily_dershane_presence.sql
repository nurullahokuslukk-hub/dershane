-- 0006_daily_dershane_presence.sql
-- Kaynak: decisions/0006-dershane-devam-oz-bildirimi.md
--
-- Öğrencinin günlük "bugün dershaneye gittin mi?" öz-bildirimi. Konum
-- doğrulaması YOK — bu kesin bir devam kanıtı değil, öğrencinin beyanı
-- (report_source = 'student_self_report'). Disiplin verisi olarak
-- kullanılmaz; rehberlik ekranında yalnızca konuşma başlatıcı bir sinyal
-- olarak gösterilir.
--
-- DURUM NOTU (2026-09-17): bu tablo kullanıcının Supabase projesinde ZATEN
-- uygulanmış durumda (canlı şema PostgREST OpenAPI ile doğrulandı) ama
-- migration dosyası depoya hiç girmemişti. Bu dosya, canlı şemanın birebir
-- karşılığıdır — sütun adları canlıdan alındı (`attendance_date`,
-- `departed_at`), uydurulmadı. Tamamen guard'lı: mevcut veritabanında
-- çalıştırılırsa hiçbir şeyi değiştirmez, sıfırdan kurulan bir projede ise
-- tabloyu doğru şekilde oluşturur.

-- ---------------------------------------------------------------------------
-- Tablo
-- ---------------------------------------------------------------------------

create table if not exists daily_dershane_presence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  student_id uuid not null references student_profile(id) on delete cascade,
  attendance_date date not null,

  -- Öğrencinin cevabı: true = gittim, false = gitmedim.
  attended boolean not null,

  -- Saatler yalnızca "gittim" cevabında anlamlı. Timezone'suz `time`:
  -- öğrencinin beyan ettiği yerel saat, attendance_date ile birlikte okunur.
  -- Çıkış saati akşam (~20.00) hatırlatmasından sonra girildiği için
  -- giriş dolu, çıkış boş bir ara durum normaldir.
  arrived_at time,
  departed_at time,

  -- İleride bir dershane kendi yoklama verisini sağlarsa buraya yeni bir
  -- değer eklenir (örn. 'institution_record'); TEXT+CHECK tercihi tam da
  -- bunun için (bkz. data-model.md ortak kurallar).
  report_source text not null default 'student_self_report',

  -- Offline kuyruk idempotency'si — diğer cihaz kaynaklı tablolarla aynı kural.
  client_record_id uuid not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Günde bir kayıt kuralı DB seviyesinde.
  unique (tenant_id, student_id, attendance_date),
  unique (tenant_id, client_record_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'presence_report_source_check'
  ) then
    alter table daily_dershane_presence
      add constraint presence_report_source_check
      check (report_source in ('student_self_report'));
  end if;

  -- "Gitmedim" denmişse saat girilmiş olamaz.
  if not exists (
    select 1 from pg_constraint where conname = 'presence_times_only_when_attended'
  ) then
    alter table daily_dershane_presence
      add constraint presence_times_only_when_attended
      check (attended or (arrived_at is null and departed_at is null));
  end if;
end $$;

drop trigger if exists set_updated_at on daily_dershane_presence;
create trigger set_updated_at before update on daily_dershane_presence
  for each row execute function set_updated_at();

-- Rehberlik ekranı: bir öğrencinin son N gününü tarihe göre çekiyor.
create index if not exists daily_presence_student_date_idx
  on daily_dershane_presence (tenant_id, student_id, attendance_date desc);

-- ---------------------------------------------------------------------------
-- RLS yardımcıları
--
-- 0001/0002'deki current_tenant_id() / is_system_admin() yalnızca tenant
-- izolasyonu yapıyor. Android uygulaması ayrı bir backend olmadan doğrudan
-- Supabase'e bağlandığı için (bkz. phases/phase-2-android.md), öğrencinin
-- SADECE kendi satırlarını görmesi de DB seviyesinde garanti edilmeli —
-- aksi halde bir öğrenci kendi dershanesindeki tüm öğrencilerin devam
-- bilgisini okuyabilirdi. Bu yüzden bu tabloda generic `tenant_isolation`
-- politikası KULLANILMIYOR, role göre ayrılmış iki politika var.
-- ---------------------------------------------------------------------------

create or replace function current_user_role()
returns text as $$
  select role from public.user_account where auth_user_id = auth.uid();
$$ language sql stable security definer;

create or replace function current_student_id()
returns uuid as $$
  select sp.id
  from public.student_profile sp
  join public.user_account ua on ua.id = sp.user_id
  where ua.auth_user_id = auth.uid();
$$ language sql stable security definer;

-- ---------------------------------------------------------------------------
-- Politikalar
-- ---------------------------------------------------------------------------

alter table daily_dershane_presence enable row level security;

-- Öğrenci: yalnızca kendi satırlarını okur/yazar.
drop policy if exists presence_student_own on daily_dershane_presence;
create policy presence_student_own on daily_dershane_presence
  for all
  using (student_id = current_student_id())
  with check (
    student_id = current_student_id()
    and tenant_id = current_tenant_id()
  );

-- Personel (dershane_admin / rehberlik / öğretmen): kendi dershanesindeki
-- kayıtları okur. Rehberliğin yalnızca ATANMIŞ öğrencileri görmesi kuralı
-- uygulama katmanında uygulanıyor (bkz. src/lib/guidance/access.ts) —
-- AGENTS.md'deki "RLS tenant izolasyonu, ince yetki backend'de" ayrımı.
drop policy if exists presence_staff_read on daily_dershane_presence;
create policy presence_staff_read on daily_dershane_presence
  for select
  using (
    is_system_admin()
    or (
      tenant_id = current_tenant_id()
      and current_user_role() in ('dershane_admin', 'rehberlik', 'ogretmen')
    )
  );

-- Eski/çakışan bir generic politika varsa kaldır — yukarıdaki iki politika
-- yeterli, generic tenant_isolation öğrencinin tüm dershaneyi okumasına
-- izin verirdi (permissive politikalar OR'lanır).
drop policy if exists tenant_isolation on daily_dershane_presence;
