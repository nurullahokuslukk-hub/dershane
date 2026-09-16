-- 0004_integrity_and_audit.sql
-- Kaynak: kullanıcıyla konuşulan "ölçek/karışıklık" değerlendirmesi (bkz.
-- STATE.md). İki bağımsız iyileştirme:
--   1) Çift gönderim/ağ tekrar denemesiyle oluşabilecek mükerrer şube/sınıf
--      kayıtlarını DB seviyesinde imkansız kılmak.
--   2) Admin mutasyonlarını (kim, ne zaman, neyi değiştirdi) izlenebilir
--      kılmak — CRUD yüzeyi hâlâ küçükken eklemek, büyüdükten sonra
--      eklemekten çok daha ucuz.

-- ---------------------------------------------------------------------------
-- 1) Tekillik kısıtları
-- ---------------------------------------------------------------------------

-- Aynı dershanede iki kez aynı isimde şube oluşturulamaz.
alter table branch
  add constraint branch_tenant_name_unique unique (tenant_id, name);

-- Aynı şubede iki kez aynı isimde sınıf oluşturulamaz — farklı şubelerde
-- aynı isim (örn. iki farklı şubede "12-A") bilinçli olarak serbest bırakıldı,
-- roster içe aktarmada bunun için satır-içi belirsizlik çözümü tasarlandı
-- (bkz. plan: Faz B).
alter table class_group
  add constraint class_group_branch_name_unique unique (branch_id, name);

-- ---------------------------------------------------------------------------
-- 2) Audit log
-- ---------------------------------------------------------------------------

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id) on delete cascade,
  actor_user_account_id uuid references user_account(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;
create policy tenant_isolation on audit_log
  using (tenant_id = current_tenant_id() or is_system_admin())
  with check (tenant_id = current_tenant_id() or is_system_admin());

create index audit_log_tenant_created_at_idx
  on audit_log (tenant_id, created_at desc);
