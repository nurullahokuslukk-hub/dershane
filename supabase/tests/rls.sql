\set ON_ERROR_STOP on
begin;
insert into auth.users select ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from unnest(array[101,102,103,104,105,106,204]) n;
insert into public.school_tenants values('00000000-0000-4000-8000-000000000001','Synthetic A'),('00000000-0000-4000-8000-000000000002','Synthetic B');
insert into public.school_memberships select '00000000-0000-4000-8000-000000000001'::uuid,('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,r,true from (values(101,'admin'),(102,'counselor'),(103,'teacher'),(104,'student'),(105,'student'),(106,'counselor')) x(n,r);
insert into public.school_memberships values('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000204','student',true);
insert into public.school_students values
('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000104','Student A','12A','active'),
('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000302','00000000-0000-4000-8000-000000000105','Student A2','12A','active'),
('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000401','00000000-0000-4000-8000-000000000204','Student B','12A','active');
insert into public.school_assignments select '00000000-0000-4000-8000-000000000001'::uuid,'00000000-0000-4000-8000-000000000301'::uuid,('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from unnest(array[102,103]) n;
insert into public.school_exams(tenant_id,student_id,created_by,client_id,title,type,day) select tenant_id,id,user_id,gen_random_uuid(),'Synthetic exam','TYT','2026-01-01' from public.school_students;
insert into public.school_notes(tenant_id,student_id,body) select tenant_id,id,'Synthetic confidential note' from public.school_students;
insert into public.school_devices(tenant_id,student_id,id,installation_id) select tenant_id,id,id,gen_random_uuid() from public.school_students;
insert into public.school_usage_snapshots select tenant_id,id,id,'2026-01-01',1,1,'2026-01-01 00:00:00+03','2026-01-01 01:00:00+03','limited' from public.school_students;
insert into public.school_usage_apps select tenant_id,id,id,'2026-01-01','com.example.learning',60 from public.school_students;
do $$begin if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname like 'school_%' and c.relkind='r' and not c.relrowsecurity) then raise exception 'RLS missing';end if;end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000104',true);
do $$begin
 if (select count(*) from public.school_exams)<>1 then raise exception 'Student exam isolation';end if;
 if (select count(*) from public.school_usage_apps)<>1 then raise exception 'Student usage isolation';end if;
 if (select count(*) from public.school_notes)<>0 then raise exception 'Student private notes leak';end if;
 if (select count(*) from public.school_memberships)<>1 then raise exception 'Membership leak';end if;
 if private.school_role('00000000-0000-4000-8000-000000000002') is not null then raise exception 'Cross tenant role';end if;
 begin update public.school_memberships set role='admin';raise exception 'Self promotion allowed';exception when insufficient_privilege then null;end;
 begin insert into public.school_memberships values('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000104','admin',true);raise exception 'Membership insert allowed';exception when insufficient_privilege then null;end;
 begin delete from public.school_exams;raise exception 'Client deletes allowed';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000102',true);
do $$begin if (select count(*) from public.school_exams)<>1 or (select count(*) from public.school_usage_apps)<>1 or (select count(*) from public.school_notes)<>1 then raise exception 'Assigned counselor rights';end if;end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000103',true);
do $$begin if (select count(*) from public.school_exams)<>1 then raise exception 'Teacher academic read';end if;if exists(select 1 from public.school_usage_apps) or exists(select 1 from public.school_notes) then raise exception 'Teacher privacy leak';end if;end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000101',true);
do $$begin if (select count(*) from public.school_exams)<>2 then raise exception 'Admin tenant scope';end if;if exists(select 1 from public.school_usage_apps) or exists(select 1 from public.school_notes) then raise exception 'Admin privacy leak';end if;end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000106',true);
do $$begin if exists(select 1 from public.school_exams) or exists(select 1 from public.school_usage_apps) or exists(select 1 from public.school_notes) then raise exception 'Unassigned access';end if;end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000204',true);
do $$begin if (select count(*) from public.school_exams)<>1 then raise exception 'Second tenant own read';end if;if exists(select 1 from public.school_exams where tenant_id='00000000-0000-4000-8000-000000000001') then raise exception 'Cross tenant leak';end if;end$$;
select set_config('request.jwt.claim.sub','',true);
do $$begin if exists(select 1 from public.school_exams) then raise exception 'Null auth leaks';end if;end$$;
set local role anon;
do $$begin begin perform 1 from public.school_exams;raise exception 'Anonymous read allowed';exception when insufficient_privilege then null;end;end$$;
reset role;
do $$begin begin insert into public.school_usage_snapshots values('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000302','2026-01-02',1,1,'2026-01-02 00:00+03','2026-01-02 01:00+03','limited');raise exception 'Cross student device FK allowed';exception when foreign_key_violation then null;end;end$$;
rollback;
\echo 'PostgreSQL RLS read isolation and fail-closed write assertions passed.'
