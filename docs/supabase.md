# Supabase kararı ve mevcut sınır

Öneri: PostgreSQL + Supabase Auth. Hosted bölge seçimi, sözleşmeler ve KVKK/yurt dışı aktarım incelemesi tamamlanırsa yönetilen Supabase; Türkiye'de barındırma şartsa self-host PostgreSQL/Supabase değerlendirilmeli. Tek başına EU bölgesi KVKK uygunluk belgesi değildir.

## Bu değişiklik
14 tablo, üyelik/atama tabanlı RLS, birleşik tenant/öğrenci/cihaz anahtarları, PostgreSQL 17 üzerinde rol/tenant/anon/öz-yetki yükseltme testleri. CI bootstrap auth.uid stub'ı sadece test içindir; migration gerçek Supabase Auth bekler. Test sonucu GitHub Actions'ta doğrulanmalıdır.

## Bilerek kapalı
Supabase client yazımları henüz açılmadı. Bu kaynak, çalışan Node/SQLite uygulamasının Supabase'e bağlandığı anlamına gelmez. Auth UI, refresh/MFA/recovery, transactional RPC upload/idempotency/consent, akademik yazım, gerçek proje provisioning ve deploy halen tamamlanmalıdır. Çalışan akademik domain Node servisindedir. Service-role/secret key istemciye asla konulmaz.

Migration boş/staging projeye gözden geçirilerek uygulanmalı; canlı migration veya proje oluşturulmadı. Proje seçimi ve güvenli bağlantı yetkilendirmesi olmadan canlı hizmete bağlanılamaz.

Resmî kaynaklar:
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/deployment/going-into-prod
- https://supabase.com/docs/guides/security/gdpr-compliance

CI geçmesi yalnız test edilen izolasyonun kanıtıdır; Supabase Auth uçtan uca testi veya KVKK onayı değildir.
