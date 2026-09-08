# API v1

Base `/api/v1`;JSON. Web cookie+Origin/CSRF;Android login'de `X-Client: android`,devamında `Authorization: Bearer …`. Tenant/rol body'den alınmaz. Localhost HTTP geliştirme içindir.

- POST /auth/login {tenant,login,password} → web csrf/cookie;Android accessToken/expiresIn.
- GET /me;POST /auth/logout {}.
- GET /students;GET /students/:id → rol filtreli profil/records/notes/usage/snapshots.
- POST /students/:id/records {clientRecordId,kind,day,payload}. Student:study/questions {subject,value},checkin {state}. Teacher:exam {title,correct,wrong,blank,divisor},homework/attendance {title,state}.
- POST /students/:id/notes {body}:atanmış rehberlik. POST /students/:id/approve {}:admin/pending.
- GET /consent;POST /consent {enabled,noticeVersion:"2026-09-v1"}:kendi aktif öğrenci hesabı.
- POST /devices {installationId:UUIDv4} → id.
- POST /usage/batches {batchId,deviceId,consentVersion,day,revision,windowStart,windowEnd,timezone:"Europe/Istanbul",quality:"partial"|"complete"|"limited",apps:[{packageName,seconds}]}.

Snapshot aynı cihaz/günün tamamını değiştirir;kategori istemciden gönderilemez. UUID+canonical hash tekilleştirme.403 izin/rol,404 erişilemeyen,409 conflict/stale,422 validation,429 rate limit,5xx geçici hata. Android ack almadan kuyruğu silmez. windowStart izin tarihinden önce olamaz. En fazla250 uygulama/batch,128KiB body,7 gün eski ölçüm.
Profil sınırları:2000 usage satırı/300 akademik/50 not/100 snapshot. Pagination/export henüz yok;uzun dönem tamlığı garanti değildir.
