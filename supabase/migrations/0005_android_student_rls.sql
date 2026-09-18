-- 0005_android_student_rls.sql
-- Android uygulaması aynı Supabase projesine doğrudan anon anahtarla bağlanır.
-- İstemcideki student_id filtresi güvenlik sınırı değildir; öğrenci rolü RLS ile
-- kendi satırlarıyla sınırlandırılır.

create or replace function current_user_account_id()
returns uuid as $$
  select id from public.user_account where auth_user_id = auth.uid();
$$ language sql stable security definer;

create or replace function is_student_user()
returns boolean as $$
  select exists (
    select 1 from public.user_account
    where auth_user_id = auth.uid() and role = 'ogrenci' and status = 'active'
  );
$$ language sql stable security definer;

do $$
declare
  t text;
  tables text[] := array[
    'user_account', 'student_profile', 'daily_checkin', 'study_session',
    'question_log', 'homework_assignment', 'homework', 'mock_exam_subject_result',
    'mock_exam', 'planned_study_block'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists tenant_isolation on public.%I', t);
    execute format(
      'create policy tenant_staff_isolation on public.%I for all
       using ((not is_student_user()) and (tenant_id = current_tenant_id() or is_system_admin()))
       with check ((not is_student_user()) and (tenant_id = current_tenant_id() or is_system_admin()))',
      t
    );
  end loop;
end $$;

create policy student_own_account on user_account for select
  using (is_student_user() and id = current_user_account_id());
create policy student_own_profile on student_profile for select
  using (is_student_user() and user_id = current_user_account_id());
create policy student_own_daily_checkin on daily_checkin for all
  using (is_student_user() and student_id in (select id from student_profile where user_id = current_user_account_id()))
  with check (is_student_user() and student_id in (select id from student_profile where user_id = current_user_account_id()));
create policy student_own_study_sessions on study_session for select
  using (is_student_user() and student_id in (select id from student_profile where user_id = current_user_account_id()));
create policy student_add_own_free_study on study_session for insert
  with check (is_student_user() and type = 'serbest' and student_id in (select id from student_profile where user_id = current_user_account_id()));
create policy student_own_questions on question_log for all
  using (is_student_user() and student_id in (select id from student_profile where user_id = current_user_account_id()))
  with check (is_student_user() and student_id in (select id from student_profile where user_id = current_user_account_id()));
create policy student_own_homework_assignment on homework_assignment for select
  using (is_student_user() and student_id in (select id from student_profile where user_id = current_user_account_id()));
create policy student_own_homework on homework for select
  using (is_student_user() and exists (
    select 1 from homework_assignment assignment join student_profile student on student.id = assignment.student_id
    where assignment.homework_id = homework.id and student.user_id = current_user_account_id()
  ));
create policy student_own_exam_results on mock_exam_subject_result for select
  using (is_student_user() and student_id in (select id from student_profile where user_id = current_user_account_id()));
create policy student_own_exams on mock_exam for select
  using (is_student_user() and exists (
    select 1 from mock_exam_subject_result result join student_profile student on student.id = result.student_id
    where result.mock_exam_id = mock_exam.id and student.user_id = current_user_account_id()
  ));
create policy student_own_planned_blocks on planned_study_block for select
  using (is_student_user() and class_group_id in (select class_group_id from student_profile where user_id = current_user_account_id()));
