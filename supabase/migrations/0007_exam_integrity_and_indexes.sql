-- 0007_exam_integrity_and_indexes.sql
-- Faz C (deneme sonucu toplu içe aktarma) için iki iş:
--   1) Aynı denemenin yanlışlıkla iki kez oluşturulmasını DB seviyesinde
--      engellemek (0004'teki şube/sınıf tekillik kısıtlarıyla aynı mantık).
--   2) Admin ekranlarının dayandığı sorgular için indeks — öğrenci listesi
--      isme göre sıralı sayfalanıyor, deneme detayı tek denemenin tüm
--      satırlarını çekiyor. Birkaç yüz kayıtta fark etmez, yüz binlerce
--      kayıtta seq scan'e düşer.
--
-- Not: bu dosya birden çok kez çalıştırılabilir (if not exists / guarded).

-- ---------------------------------------------------------------------------
-- 1) Tekillik
-- ---------------------------------------------------------------------------

-- Aynı dershanede aynı tarihte aynı isimde iki deneme olamaz.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'mock_exam_tenant_name_date_unique'
  ) then
    alter table mock_exam
      add constraint mock_exam_tenant_name_date_unique
      unique (tenant_id, name, exam_date);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) İndeksler
-- ---------------------------------------------------------------------------

-- /admin/exams — dershanenin denemeleri, en yeni tarih üstte.
create index if not exists mock_exam_tenant_date_idx
  on mock_exam (tenant_id, exam_date desc);

-- /admin/students/[id] — bir öğrencinin tüm deneme sonuçları.
-- (mock_exam_id ön eki zaten unique index tarafından karşılanıyor.)
create index if not exists mock_exam_result_tenant_student_idx
  on mock_exam_subject_result (tenant_id, student_id);

-- /admin/students — isme göre sıralı, role/duruma göre süzülen liste.
create index if not exists user_account_tenant_role_name_idx
  on user_account (tenant_id, role, full_name);

-- Menüdeki "doğrulanmamış" rozeti ve /admin/unclaimed sayımı.
create index if not exists user_account_tenant_status_idx
  on user_account (tenant_id, status);

-- Sınıf filtresi ve sınıf başına öğrenci sayımı.
create index if not exists student_profile_tenant_class_idx
  on student_profile (tenant_id, class_group_id);

-- Rehberliğin atanmış öğrencileri + öğrenci detayındaki ters yön.
create index if not exists guidance_assignment_student_idx
  on guidance_student_assignment (student_id);
create index if not exists guidance_assignment_tenant_guidance_idx
  on guidance_student_assignment (tenant_id, guidance_user_id);
