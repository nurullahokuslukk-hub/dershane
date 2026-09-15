-- 0001_init.sql
-- Kaynak: docs/data-model.md, docs/decisions/0001-auth-yontemi.md, 0002-teknik-mimari.md
--
-- Not: auth.users Supabase Auth tarafından yönetilir (şifre hash'i dahil).
-- user_account.id = auth.users.id; şifre burada ayrıca saklanmaz.
-- Öğretmen/rehberlik/admin/öğrenci kaydı sırasında önce auth.users'a (Supabase
-- Auth API ile), sonra aynı id ile user_account'a satır eklenir — uygulama
-- katmanının sorumluluğu (bkz. docs/flows/student-registration-flow.md).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Ortak yardımcılar
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Kurumsal bilgiler
-- ---------------------------------------------------------------------------

create table tenant (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'suspended')),
  feature_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on tenant
  for each row execute function set_updated_at();

create table branch (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  name text not null,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on branch
  for each row execute function set_updated_at();

create table class_group (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  branch_id uuid not null references branch(id) on delete cascade,
  name text not null,
  academic_year text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on class_group
  for each row execute function set_updated_at();

-- id = auth.users.id (Supabase Auth). tenant_id yalnızca system_admin için null.
create table user_account (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references tenant(id) on delete cascade,
  role text not null check (role in ('system_admin', 'dershane_admin', 'rehberlik', 'ogretmen', 'ogrenci')),
  auth_identifier text not null,
  identifier_type text not null check (identifier_type in ('email', 'phone')),
  full_name text not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_required_unless_system_admin
    check (tenant_id is not null or role = 'system_admin')
);
create trigger set_updated_at before update on user_account
  for each row execute function set_updated_at();

create table student_profile (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  user_id uuid not null unique references user_account(id) on delete cascade,
  class_group_id uuid not null references class_group(id),
  branch_id uuid not null references branch(id),
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on student_profile
  for each row execute function set_updated_at();

create table student_device (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  student_id uuid not null references student_profile(id) on delete cascade,
  device_identifier text not null,
  platform text not null default 'android',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (tenant_id, device_identifier)
);

create table teacher_class_assignment (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  teacher_user_id uuid not null references user_account(id) on delete cascade,
  class_group_id uuid not null references class_group(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (teacher_user_id, class_group_id)
);

create table guidance_student_assignment (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  guidance_user_id uuid not null references user_account(id) on delete cascade,
  student_id uuid not null references student_profile(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (guidance_user_id, student_id)
);

create table invite_code (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  code text not null unique,
  branch_id uuid not null references branch(id),
  class_group_id uuid references class_group(id),
  status text not null default 'active' check (status in ('active', 'used', 'expired')),
  created_by_user_id uuid not null references user_account(id),
  expires_at timestamptz not null,
  used_by_user_id uuid references user_account(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Deneme sınavları
-- ---------------------------------------------------------------------------

create table mock_exam (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  name text not null,
  exam_date date not null,
  exam_type text,
  created_at timestamptz not null default now()
);

create table mock_exam_subject_result (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  mock_exam_id uuid not null references mock_exam(id) on delete cascade,
  student_id uuid not null references student_profile(id) on delete cascade,
  subject text not null,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  blank_count integer not null default 0,
  net numeric(6, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (mock_exam_id, student_id, subject)
);

-- ---------------------------------------------------------------------------
-- Ödevler
-- ---------------------------------------------------------------------------

create table homework (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  class_group_id uuid not null references class_group(id) on delete cascade,
  subject text not null,
  title text not null,
  description text,
  due_date date not null,
  created_by_user_id uuid not null references user_account(id),
  created_at timestamptz not null default now()
);

create table homework_assignment (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  homework_id uuid not null references homework(id) on delete cascade,
  student_id uuid not null references student_profile(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'done', 'late', 'excused')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (homework_id, student_id)
);
create trigger set_updated_at before update on homework_assignment
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Çalışma süreleri ve etüt katılımı
-- ---------------------------------------------------------------------------

create table planned_study_block (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  class_group_id uuid not null references class_group(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer not null,
  created_by_user_id uuid not null references user_account(id),
  created_at timestamptz not null default now()
);

create table study_session (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  student_id uuid not null references student_profile(id) on delete cascade,
  type text not null check (type in ('serbest', 'etut')),
  planned_block_id uuid references planned_study_block(id),
  subject text,
  duration_minutes integer not null,
  occurred_at timestamptz not null default now(),
  attendance_status text check (attendance_status in ('katildi', 'katilmadi', 'gec')),
  client_record_id uuid not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, client_record_id),
  constraint attendance_only_for_etut
    check (type = 'etut' or attendance_status is null)
);

-- ---------------------------------------------------------------------------
-- Çözülen soru sayıları
-- ---------------------------------------------------------------------------

create table question_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  student_id uuid not null references student_profile(id) on delete cascade,
  subject text not null,
  topic text,
  question_count integer not null check (question_count > 0),
  occurred_at timestamptz not null default now(),
  client_record_id uuid not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, client_record_id)
);

-- ---------------------------------------------------------------------------
-- Günlük bildirimler
-- ---------------------------------------------------------------------------

create table daily_checkin (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  student_id uuid not null references student_profile(id) on delete cascade,
  checkin_date date not null,
  mood_score smallint check (mood_score between 1 and 5),
  note text,
  client_record_id uuid not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, student_id, checkin_date),
  unique (tenant_id, client_record_id)
);

-- ---------------------------------------------------------------------------
-- Telefon kullanım istatistikleri
-- ---------------------------------------------------------------------------

create table phone_usage_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  student_id uuid not null references student_profile(id) on delete cascade,
  device_id uuid not null references student_device(id) on delete cascade,
  usage_date date not null,
  app_name text not null,
  duration_minutes integer not null check (duration_minutes >= 0),
  client_record_id uuid not null,
  synced_at timestamptz not null default now(),
  unique (tenant_id, client_record_id)
);

-- ---------------------------------------------------------------------------
-- Rehberlik görüşmeleri
-- ---------------------------------------------------------------------------

create table guidance_session (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  student_id uuid not null references student_profile(id) on delete cascade,
  guidance_user_id uuid not null references user_account(id),
  occurred_at timestamptz not null default now(),
  summary text not null,
  next_step text,
  created_at timestamptz not null default now()
);

create table guidance_note (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  student_id uuid not null references student_profile(id) on delete cascade,
  guidance_user_id uuid not null references user_account(id),
  note text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-Level Security — tenant izolasyonu (ikinci savunma katmanı)
--
-- Bu politikalar yalnızca tenant bazlı izolasyonu garanti eder. Rol bazlı ince
-- yetkilendirme (örn. rehberlik sadece atanmış öğrenciyi görür, öğrenci sadece
-- kendi verisini görür) backend authorization katmanında (Route Handler'larda)
-- uygulanır — bkz. CLAUDE.md "tenant izolasyonu backend'de zorunlu" kuralı.
-- Faz 1 ilerledikçe gerekirse tabloya özel ek politikalar eklenebilir.
--
-- current_tenant_id() / is_system_admin() burada, tablolardan SONRA
-- tanımlanıyor çünkü user_account'a referans veriyorlar (ilk sürümde
-- fonksiyonlar en başa konulmuştu, user_account henüz yokken "relation
-- public.user_account does not exist" hatasıyla migration'ı bozmuştu — bkz.
-- STATE.md). SECURITY DEFINER ile tanımlanıyor ki RLS'in kendisiyle çakışıp
-- sonsuz döngüye girmesin.
-- ---------------------------------------------------------------------------

create or replace function current_tenant_id()
returns uuid as $$
  select tenant_id from public.user_account where id = auth.uid();
$$ language sql stable security definer;

create or replace function is_system_admin()
returns boolean as $$
  select exists (
    select 1 from public.user_account
    where id = auth.uid() and role = 'system_admin'
  );
$$ language sql stable security definer;

do $$
declare
  t text;
  tenant_scoped_tables text[] := array[
    'branch', 'class_group', 'user_account', 'student_profile', 'student_device',
    'teacher_class_assignment', 'guidance_student_assignment', 'invite_code',
    'mock_exam', 'mock_exam_subject_result', 'homework', 'homework_assignment',
    'planned_study_block', 'study_session', 'question_log', 'daily_checkin',
    'phone_usage_log', 'guidance_session', 'guidance_note'
  ];
begin
  foreach t in array tenant_scoped_tables loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy tenant_isolation on %I
         using (tenant_id = current_tenant_id() or is_system_admin())
         with check (tenant_id = current_tenant_id() or is_system_admin())',
      t
    );
  end loop;
end $$;

-- tenant tablosunun kendisi: herkes kendi tenant'ını görebilir, system_admin hepsini.
alter table tenant enable row level security;
create policy tenant_self_or_admin on tenant
  using (id = current_tenant_id() or is_system_admin())
  with check (is_system_admin());
