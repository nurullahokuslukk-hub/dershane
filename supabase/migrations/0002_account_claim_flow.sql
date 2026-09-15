-- 0002_account_claim_flow.sql
-- Kaynak: kullanıcıyla konuşulan "toplu roster içe aktarma + kişi kendi hesabını
-- claim code ile doğrular" akışı (bkz. STATE.md 2026-09-16).
--
-- Önceki tasarımda user_account.id = auth.users.id idi (hesap önce Supabase
-- Auth'ta oluşuyor, sonra profil ekleniyordu). Yeni akışta sistem admin (veya
-- dershane admin) önce ismi/sınıfı toplu yükler (auth hesabı YOK), kişi daha
-- sonra kendi claim code'uyla e-posta/telefon+şifre belirleyip hesabını
-- "claim" eder. Bu yüzden user_account.id artık bağımsız bir uuid;
-- auth_user_id nullable ve yalnızca claim edildiğinde dolar.

-- ---------------------------------------------------------------------------
-- user_account: id'yi auth.users'tan ayır, auth_user_id ekle
-- ---------------------------------------------------------------------------

alter table user_account drop constraint if exists user_account_id_fkey;
alter table user_account alter column id set default gen_random_uuid();

alter table user_account add column auth_user_id uuid unique references auth.users(id) on delete set null;
update user_account set auth_user_id = id where auth_user_id is null;

alter table user_account alter column auth_identifier drop not null;
alter table user_account alter column identifier_type drop not null;

alter table user_account drop constraint if exists user_account_status_check;
alter table user_account alter column status set default 'unclaimed';
update user_account set status = 'active' where status = 'pending';
alter table user_account add constraint user_account_status_check
  check (status in ('unclaimed', 'active', 'suspended'));

-- ---------------------------------------------------------------------------
-- account_claim_code: her roster satırı için tek kullanımlık doğrulama kodu
-- ---------------------------------------------------------------------------

create table account_claim_code (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  user_account_id uuid not null unique references user_account(id) on delete cascade,
  code text not null unique,
  status text not null default 'active' check (status in ('active', 'used', 'expired')),
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

alter table account_claim_code enable row level security;
create policy tenant_isolation on account_claim_code
  using (tenant_id = current_tenant_id() or is_system_admin())
  with check (tenant_id = current_tenant_id() or is_system_admin());

-- ---------------------------------------------------------------------------
-- RLS yardımcıları: artık id değil auth_user_id üzerinden eşleşiyor
-- ---------------------------------------------------------------------------

create or replace function current_tenant_id()
returns uuid as $$
  select tenant_id from public.user_account where auth_user_id = auth.uid();
$$ language sql stable security definer;

create or replace function is_system_admin()
returns boolean as $$
  select exists (
    select 1 from public.user_account
    where auth_user_id = auth.uid() and role = 'system_admin'
  );
$$ language sql stable security definer;
