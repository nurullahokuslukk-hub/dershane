# Veri sözlüğü ve üretim normalizasyonu

## Mevcut SQLite şeması (çalışan)
Kesin DDL: apps/api/src/store.ts. Kimlikler UUID metni; timestamp ISO8601; tenant_id bütün tenant verilerinde zorunlu. FK'ler SQLite foreign_keys=ON ile etkin. Bu şema PostgreSQL migration'ı değildir.

- tenants: id PK, slug unique, name, telemetry (varsayılan0; demo seed1).
- users: id PK, tenant_id FK, login, name, role, password_hash, active; unique(tenant,login) ve(tenant,id).
- students: id PK, tenant_id, user_id, name, class_name, status; unique(tenant,user), composite user FK.
- assignments: tenant_id, staff_id, student_id composite PK ve tenant-scoped FK'ler.
- sessions: token_hash PK, user_id FK, csrf, expires(epoch ms).
- consents: tenant_id+student_id PK, version, enabled, notice_version, granted_at.
- devices: id PK, tenant_id, student_id, installation_id; unique tenant/student/installation.
- batches: tenant_id+student_id+id PK, payload_hash, created_at; ham payload içermez.
- snapshots: tenant_id+student_id+device_id+day PK, revision, window_start, window_end, quality.
- usage: tenant_id+student_id+device_id+day+package PK, seconds; snapshot FK cascade. Kategori sunucu kataloğundan türetilir.
- records: id PK, tenant_id, student_id, actor_id, client_id, kind, day, payload JSON, payload_hash, source, created_at; unique(tenant,actor,client).
- notes: id PK, tenant_id, student_id, body, created_at. Yazar audit üzerinden; üretimde author_id ve revision ayrı alan.
- audit: id PK, tenant_id, actor_id, action, subject, created_at; hassas içerik yok.

## PostgreSQL hedef alanları (S1/S2; henüz uygulanmadı)
Her tenant tabloda id UUID,tenant_id UUID,created_at/updated_at timestamptz,created_by UUID; unique(tenant,id), dar FK ve RLS. Mutable kayıtlar revision integer. Para numeric/kuruş; gün date; süre integer saniye/dakika açık birimli.

1. academic_years: name, starts_on, ends_on, status.
2. branches: name, code, active; classes: branch_id,academic_year_id,name,grade,active.
3. enrollments: student_id,class_id,valid_from,valid_until,status; aktif üyelik tekilliği ve tarih çakışma kontrolü.
4. invitations: token_hash,class_id,expires_at,used_at,revoked_at,approved_by; enrollment_approvals: student_id,actor_id,decision,reason,at.
5. staff_scopes: staff_id,student_id veya class_id,valid_from,valid_until; rol ve kapsam ayrı.
6. exams: title,type,occurred_on,academic_year_id; exam_tests: exam_id,subject,question_count,penalty_divisor; exam_results: student_id,test_id,correct,wrong,blank,net,revision,source; toplam soru tutarlılığı.
7. homework: class_id/target_scope,teacher_id,subject,title,description,due_at; homework_submissions: homework_id,student_id,reported_state,reported_at,verified_by,verified_at,revision.
8. tutoring_sessions: teacher_id,branch_id,subject,starts_at,ends_at,capacity; attendance: session_id,student_id,state,recorded_by,recorded_at.
9. study_entries: student_id,subject,local_day,minutes,client_id,source,revision_of; question_entries: aynı + count; checkins: student_id,local_day,state,revision.
10. guidance_notes: student_id,author_id,occurred_at,private_body,revision; guidance_actions: student_id,owner_id,text,due_on,share_with_student,status.
11. privacy_notices: version,purpose,content_hash,effective_at; representation_records: student_id,representative_reference,verified_by,verified_at,legal_basis_reference (gereksiz kimlik kopyası yok).
12. consent_events: student_id,purpose,version,notice_version,decision,occurred_at,actor_id; current_consent projection. Revocation immutable event.
13. app_catalog: package_name,label,category_id,catalog_version,reviewed_at; usage snapshot stored category_version. Bilinmeyen pakete otomatik hassas çıkarım yok.
14. data_requests: student_id,request_type,verified_at,status,completed_at; deletion_manifests: scope_hash,deleted_at,backup_expiry; retention_jobs: category,cutoff,status,counts.
15. outbox: tenant_id,event_type,aggregate_id,payload_minimal,available_at,attempts,processed_at; generic notification preferences: user_id,channel,enabled,quiet_hours.
16. tenant_settings: feature,enabled,policy_approval_reference,version; subscriptions: tenant_id,plan,active_student_limit,starts_on,ends_on,status (ilk pilot manuel).

Bir rolün tenant tablosuna erişebilmesi tüm sütunları görmesi demek değildir. Notlar ve kullanım verisi ayrı yetki filtreli repository/view'lerden gelir. Postgres'te cihaz için(tenant,student,device) composite FK, runtime-role RLS ve migration testleri üretim öncesi zorunludur.
