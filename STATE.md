---
title: Proje durumu (append-only log)
description: Oturumlar arası tek gerçek kaynak — en son ne yapıldı, sırada ne var.
status: active
updated_at: 2026-09-15
---

# STATE

Bu dosyaya sadece **ekleme** yapılır, geçmiş girdiler değiştirilmez/silinmez.
En yeni girdi en üstte. Format için [AGENTS.md](AGENTS.md) → "STATE.md giriş formatı".

---

## 2026-09-16 — Faz B: Roster toplu içe aktarma tamamlandı

Kullanıcı migration 0003+0004'ü çalıştırdı, Sentry hesabı açıp DSN/org/proje
bilgilerini verdi (`.env.local`'e eklendi). Sentry'nin olayı yakaladığı
`__sentry_captured__` işaretiyle doğrulandı, ağ isteğini doğrudan
göremedim — kullanıcıdan sentry.io panelinden teyit etmesini istedim.

**Güvenlik kararı:** Plandaki `xlsx` (SheetJS) bağımlılığı **kullanılmadı** —
npm'deki güncel sürümde (0.18.5, son npm sürümü) düzeltilmemiş yüksek önemli
açıklar var (prototip kirlenmesi, ReDoS), SheetJS yamaları sadece kendi
CDN'lerinden dağıtıyor. Bunun yerine **sadece CSV** desteği + `papaparse`
(0 güvenlik açığı) kullanıldı — kapsam bilinçli olarak daraltıldı, Excel
dosyaları "Farklı Kaydet → CSV" ile tek adımda dönüştürülebiliyor.

**Kurulanlar:**
- `src/lib/import/{types,validators,parse-csv,roster-schema}.ts` — CSV parse,
  satır doğrulama, sınıf adı eşleştirme (sıfır eşleşme → hata, birden fazla
  eşleşme → öğrenci satırlarında satır-içi seçim kutusu; öğretmen satırlarında
  birden fazla sınıf olabildiği için basitleştirilip hata + şube adı ekleme
  talebi olarak çözüldü).
- `src/components/import/ImportPreviewTable.tsx` — genel önizleme tablosu.
- `src/components/admin/RosterImportClient.tsx` + `src/app/admin/import/roster/page.tsx`
  — mod seçimi (öğrenci/öğretmen), şablon indirme, yükle → önizle → onayla.
- `src/app/api/admin/import/roster/route.ts` — sunucu tarafında sınıfların
  tenant'a ait olduğunu yeniden doğrular, toplu insert (user_account →
  student_profile/teacher_class_assignment → account_claim_code), ara adım
  başarısız olursa user_account'ları geri alır (rollback).
- `public/templates/roster-{ogrenci,ogretmen}-sablon.csv`.
- `docs/admin/audit-log/page.tsx`'e "roster.import" etiketi ve kayıt sayısı
  gösterimi eklendi.

**Test:** Dosya seçme diyaloğu tarayıcı otomasyon aracıyla tetiklenemiyor
(bilinen sınırlama) — client-side önizleme ekranı görsel olarak
doğrulanamadı. Bunun yerine kritik kısım (sunucu route'u) gerçek oturumdan
doğrudan `fetch` ile test edildi: geçerli 2 öğrenci + 1 öğretmen satırı
başarıyla oluşturuldu (doğru `class_group_id`/`branch_id`/`birth_date` ile),
geçersiz `classId` doğru şekilde reddedildi (hiçbir kayıt oluşmadı — kısmi
oluşturma yok), oluşturulan öğrencinin claim kodu gerçek `/claim` akışından
geçirildi ve doğru "öğrenci web panelini kullanamaz" mesajına ulaştı. Test
verileri temizlendi. `npm run build` temiz.

**Sırada:** Faz C (deneme sonucu toplu içe aktarma) → Faz D (rehberlik
ekranında gösterme).

---

## 2026-09-16 — Ölçek/karışıklık sağlamlaştırması: tekillik kısıtları + audit log + Sentry

Kullanıcı Faz B'ye acele etmeden önce, tamamlanan Faz A'ya "yüz binlerce
kullanıcı" ölçeğinde çöküş/karışıklık olmaması için ne eklenebileceğini sordu.
Önerilen ve onaylanan 3 madde uygulandı (mimari değişikliği gerekmiyordu —
Next.js+Supabase+Vercel yığını bu ölçek için yeterli, asıl risk "herkesin aynı
anda sonuç sayfasına hücum etmesi" — bu, Faz C/D tasarımına cache stratejisi
olarak not edildi, henüz kod yok):

1. **`supabase/migrations/0004_integrity_and_audit.sql`**: `branch(tenant_id,
   name)` ve `class_group(branch_id, name)` üzerinde unique constraint — çift
   gönderim/ağ tekrarıyla mükerrer şube/sınıf oluşmasını DB seviyesinde
   imkansız kılar. Ayrıca `audit_log` tablosu (tenant izolasyonlu RLS).
2. **`src/lib/audit.ts`** (`logAudit`, best-effort — hata olursa asıl işlemi
   engellemez) tüm admin mutasyon route'larına (tenant/branch/class/teacher/
   guidance create+update, claim code renew) eklendi.
3. **`src/app/admin/audit-log/page.tsx`**: son 100 işlem kaydını gösteren
   basit bir ekran, nav'a eklendi.
4. **Sentry** (`@sentry/nextjs`) kuruldu: `instrumentation.ts`,
   `instrumentation-client.ts`, `next.config.ts` sarmalandı,
   `src/app/global-error.tsx` eklendi. DSN boşken sessizce no-op — hesap
   açılmadan uygulama bozulmaz. Kurulum adımları
   [guides/supabase-vercel-kurulum.md](docs/guides/supabase-vercel-kurulum.md)'ye
   eklendi (Sentry hesabı da kullanıcı tarafından açılmalı, ben açamam).

Migration 0003 + 0004 kullanıcı tarafından henüz SQL Editor'de çalıştırılmadı.
Tarayıcıda test edildi: audit_log tablosu yokken bile branch oluşturma
sorunsuz çalıştı (best-effort tasarım doğrulandı), test verisi temizlendi.
`npm run build` temiz.

**Not:** Kullanıcı "kodu çalıştırdım ama tasarımdan memnun değilim, Codex ile
değiştireceğim" dedi — kendi test tenant'ı ("başarı") oluşturdu, dokunulmadı.
Görsel tasarım (Tailwind, sistemsiz) bilinçli bir MVP kararıydı, iş mantığı
(API/DB) arayüzden ayrık olduğu için Codex ile sadece görünüm değişikliği
riski düşük.

**Sırada:** Kullanıcı onay verirse Faz B (roster toplu içe aktarma).

---

## 2026-09-16 — Plan modu: kapsamlı yol haritası + Faz A (yönetim CRUD) tamamlandı ve doğrulandı

Kullanıcı plan moduna geçti, deneme sonuçları yükleme/gösterme + "diğer her şeyi
de düşün" istedi. Explore + Plan alt-ajanlarıyla mevcut durum incelendi, kullanıcıyla
4 soruda netleşen kararlar (deneme sonuçları sadece toplu Excel/CSV, sistem/dershane
admin yükler, sadece net/trend gösterimi — otomatik risk skoru yok, sıra: CRUD →
roster içe aktarma → deneme sonucu içe aktarma → rehberlik gösterimi) ışığında
`~/.claude/plans/ba-ar-yla-al-t-ancak-t-m-serene-cocke.md` yazıldı ve onaylandı.
Plan 4 fazlı: **A** dershane/şube/sınıf/personel yönetimi CRUD, **B** roster toplu
içe aktarma, **C** deneme sonucu toplu içe aktarma, **D** rehberlik ekranında
gösterme (sadece Deneme Sonuçları sekmesi, diğer sekmeler ayrı tur).

**Faz A tamamlandı ve tarayıcıda gerçek Supabase'e karşı uçtan uca doğrulandı:**
- `src/lib/auth/viewer.ts` (`getViewer`/`requireRole`/`checkRoleApi`),
  `src/lib/tenant-context.ts` (`getActiveTenantId`/`resolveWriteTenantId` —
  system_admin çoklu tenant için `active_tenant_id` cookie, asla yetki kararı
  için güvenilmez), `src/lib/roster/claim-code.ts`.
- `src/app/admin/layout.tsx` + `TenantSwitcher` + `AppShell`'e `nav`/`rightSlot`
  eklendi (artık gerçek bir sidebar var).
- CRUD: Dershane (tenant) oluşturma, Şube, Sınıf, Öğretmen (+ sınıf ataması),
  Rehberlik (+ öğrenci ataması, sınıf bazlı toplu seçim), Doğrulanmamış Hesaplar
  (kod görüntüle/kopyala/yenile), Dashboard gerçek sayılarla.
- **Önemli teknik ders:** Supabase/PostgREST embed'lerinde `unique` constraint'i
  olan FK'ler (örn. `account_claim_code.user_account_id`) tekil **nesne** döner,
  `array` değil — ilk denemede bunu yanlış tipleyip boş görünen kod alanına yol
  açtı, düzeltildi. İleride benzer embed'lerde bu ayrıma dikkat.
- Uçtan uca test: dershane oluştur → şube → sınıf → öğretmen ekle (unclaimed +
  claim code) → `/claim` ile gerçek hesap doğrulama → gerçek giriş → `/ogretmen`'e
  doğru yönlendirme. Rehberlik oluşturma da (öğrencisiz) test edildi. Test verisi
  (Cizre Test Dershanesi) sonra temizlendi.
- `npm run build` her adımda temiz. Commit + push edilecek (sıradaki adım).

**Migration borcu:** `supabase/migrations/0003_drop_invite_code.sql` yazıldı ama
kullanıcı henüz SQL Editor'de çalıştırmadı — acil değil (hiçbir şey buna bağlı
değil), müsait olduğunda Faz D'nin `0004_mock_exam_totals_view.sql`'iyle
birlikte tek seferde istenecek.

**Sırada:** Faz B — roster toplu içe aktarma (`xlsx` bağımlılığı,
`src/lib/import/*`, iki şablon, önizleme/eşleştirme ekranı, `/admin/import/roster`).

---

## 2026-09-16 — GitHub'a push edildi, claim akışı (0003) koda döküldü

Repo [github.com/nurullahokuslukk-hub/dershane](https://github.com/nurullahokuslukk-hub/dershane)'a
push edildi (`origin/master`).

Kullanıcı ile netleşen model uygulandı:
[decisions/0003-toplu-kayit-ve-claim-akisi.md](docs/decisions/0003-toplu-kayit-ve-claim-akisi.md).
`supabase/migrations/0002_account_claim_flow.sql` yazıldı: `user_account.id`
artık `auth.users.id`'den bağımsız (yeni `auth_user_id` nullable kolon claim
anında dolar), `auth_identifier`/`identifier_type` nullable, `status` artık
`unclaimed`/`active`/`suspended`, yeni `account_claim_code` tablosu (eski
`invite_code`'un yerini alıyor — kod artık sınıfa değil belirli bir roster
satırına özel). RLS yardımcı fonksiyonları `auth_user_id` üzerinden
güncellendi.

Kod tarafı: `src/lib/supabase/admin.ts` (service_role server client),
`src/app/claim/page.tsx` + `src/app/api/claim/route.ts` (kod + e-posta/telefon
+ şifre → hesap aktifleştirme), `src/proxy.ts`'e `/claim` ve `/api/claim`
public path olarak eklendi, `src/app/page.tsx`/`admin`/`rehberlik`/`ogretmen`
sayfalarındaki sorgular `id` yerine `auth_user_id` kullanacak şekilde
güncellendi, `scripts/create-system-admin.mjs` yeni şemaya uyarlandı.
`npm run build` temiz geçti. Docs güncellendi: `data-model.md`,
`student-registration-flow.md` (tamamen yeniden yazıldı), `web-dershane-admin.md`
("Doğrulanmamış Hesaplar" + "Toplu İçe Aktar" ekranları — ikincisi henüz
tasarlanmadı), `android-student.md`'ye eskimiş-olduğu notu eklendi (Faz 2'de
yeniden yazılacak).

**Henüz yapılmadı / sırada:**
1. Kullanıcı `0002_account_claim_flow.sql`'i Supabase SQL Editor'de
   çalıştıracak (ben doğrudan SQL çalıştıramıyorum, sadece service_role ile
   REST/Auth API'ye erişimim var).
2. Migration sonrası uçtan uca test: mevcut system_admin girişi hâlâ
   çalışıyor mu (auth_user_id backfill ile), ve tam claim akışı (roster satırı
   + kod → `/claim` → giriş) manuel olarak (SQL ile örnek roster satırı
   eklenerek) doğrulanacak.
3. **Toplu İçe Aktar ekranının kendisi henüz yazılmadı** — bu asıl istenen
   özellik, claim akışı sadece onun ön koşuluydu.

---

## 2026-09-16 — AGENTS.md eklendi (Codex/ChatGPT ile ortak çalışma için), kural dosyası tek kaynağa indirildi

Kullanıcı ChatGPT/Codex'i de bu projede geliştirmeye katmak istiyor. Bu araçlar
`CLAUDE.md`'yi değil `AGENTS.md` konvansiyonunu okuyor; iki ayrı dosyada aynı
kuralları elle senkron tutmak yerine, Next.js'in kendi `next dev`/`next build`
sürecinin kullandığı yöntem benimsendi: **AGENTS.md artık tek kaynak** (eski
CLAUDE.md içeriğinin birebir taşınmış hali + çoklu-araç koordinasyon notu:
aynı anda paralel çalışmayın, sırayla commit/push edin). `CLAUDE.md` artık
sadece `@AGENTS.md` içeriyor — Claude Code bunu otomatik olarak AGENTS.md'nin
içeriğiyle doldurur. Bundan sonra kural değişiklikleri **AGENTS.md**'de yapılır,
CLAUDE.md'ye dokunulmaz (Next.js'in kendi agent-rules bloğu zaten CLAUDE.md
değil AGENTS.md'nin sonuna ekleniyor, bu yüzden de tutarlı).

Kullanıcı ayrıca GitHub'a bir hesap bağladığını söyledi ama bu oturumda ne `gh`
CLI ne de bir GitHub MCP bağlayıcısı bulunamadı, `git remote` boş — muhtemelen
masaüstü uygulamasının başka bir yerinde yapılan bir bağlantı, bu oturumdan
push edilemiyor. Kullanıcıdan boş bir GitHub reposu oluşturup linkini vermesi
istendi.

**Sırada:** GitHub repo linki gelince `git remote add` + push (onayla). Ayrıca
kullanıcının önceki mesajında anlattığı iş akışı (system admin olarak kendisi
tüm dershanelerin öğrenci/öğretmen verisini PDF'lerden toplu girecek) için
somut bir plan/yaklaşım netleştirilecek — kullanıcı önceki çoktan seçmeli
soruları yanıtlamadı, konuşarak netleştirilecek.

## 2026-09-15 — Migration hatası düzeltildi, .env.local gerçek Supabase bilgileriyle dolduruldu

Kullanıcı Supabase projesini kurdu (proje ref: `jswuhyejyxzfewziicbv`) ve
`0001_init.sql`'i çalıştırdı, hata aldı: `relation "public.user_account" does
not exist` — `current_tenant_id()`/`is_system_admin()` fonksiyonları dosyanın
başında, `user_account` tablosu henüz oluşturulmadan tanımlanmıştı. Fonksiyonlar
dosyanın sonuna, tüm tablolardan sonra (RLS bölümünün hemen öncesine) taşındı —
artık `user_account`'a referans verdiklerinde tablo zaten var.

`.env.local` kullanıcının verdiği anon/service_role anahtarlarıyla dolduruldu.
Kullanıcı "Project URL" olarak dashboard linkini
(`supabase.com/dashboard/project/...`) verdi — asıl API URL'i (`https://
jswuhyejyxzfewziicbv.supabase.co`) proje ref'inden inşa edildi, dashboard
linki API URL'i olarak kullanılamaz.

**Sırada:** Kullanıcı düzeltilmiş `0001_init.sql`'i SQL Editor'de tekrar
çalıştıracak. Ardından `npm run dev` ile gerçek Supabase'e karşı uçtan uca test
edilecek — ama henüz hiçbir kullanıcı yok (ilk system_admin nasıl
oluşturulacak, sıradaki karar).

## 2026-09-15 — Next.js proje iskeleti kuruldu, çalıştığı doğrulandı

`create-next-app` ile scaffold (TypeScript, App Router, Tailwind) alınıp mevcut
docs/CLAUDE.md/STATE.md/.git korunarak projeye entegre edildi
(`.gitignore` Next.js konvansiyonlarıyla birleştirilerek yeniden yazıldı — eski
frontmatter'lı format korundu). Eklenenler:

- `supabase/migrations/0001_init.sql` — data-model.md'deki tüm tablolar, ortak
  yardımcı fonksiyonlar (`current_tenant_id()`, `is_system_admin()`), her
  tenant-scoped tabloda RLS tenant izolasyon politikası.
- `src/lib/supabase/{client,server}.ts` — Supabase browser/server client'ları
  (`@supabase/ssr`).
- `src/proxy.ts` (Next.js 16'da `middleware.ts` yerine `proxy.ts` — deprecation
  uyarısı üzerine `@next/codemod` ile değil elle taşındı) — oturum tazeleme +
  girişsiz kullanıcıyı `/login`'e yönlendirme.
- `src/app/login`, `/forgot-password` — docs/flows/web-common.md'ye uygun.
- `src/app/page.tsx` — role göre `/admin`, `/rehberlik`, `/ogretmen`'e
  yönlendirme merkezi; öğrenci rolü ve onay bekleyen hesaplar için mesaj.
- `src/app/{admin,rehberlik,ogretmen}/page.tsx` — rol korumalı stub dashboard'lar
  (`AppShell` ortak layout bileşeni: topbar + çıkış).
- `.env.example`, `docs/guides/supabase-vercel-kurulum.md` — kullanıcının kendi
  açması gereken Supabase/Vercel hesapları için adım adım rehber (hesap açma
  bana yasak bir aksiyon, kullanıcı yapmalı).
- `data-model.md` düzeltildi: `user_account.password_hash` kaldırıldı — şifre
  Supabase Auth (`auth.users`) tarafından yönetiliyor, ayrıca saklanmıyor.

`npm run build` temiz geçti, `npm run dev` ile tarayıcıda doğrulandı: `/` →
`/login` yönlendirmesi, giriş formu, şifremi-unuttum formu, `/api/health`
çalışıyor. Gerçek Supabase kimlik bilgileri olmadığı için uçtan uca giriş
(gerçek kullanıcıyla) henüz test edilmedi — bu, kullanıcı Supabase projesini
kurunca yapılacak.

**Sırada:** Kullanıcı `docs/guides/supabase-vercel-kurulum.md` adımlarını
tamamlayacak (Supabase projesi + migration + `.env.local`). Ardından: ilk
system_admin kullanıcısının nasıl oluşturulacağı kararlaştırılacak, sonra rol
panellerinin gerçek içeriği (dashboard verileri, CRUD ekranları) doldurulacak.

## 2026-09-15 — Teknik mimari kararlaştırıldı

[decisions/0002-teknik-mimari.md](docs/decisions/0002-teknik-mimari.md): tek
Next.js uygulaması (TypeScript, App Router, web + API Route Handler'lar) — ayrı
backend servisi yok; Supabase (managed Postgres + Auth), Vercel hosting, ikisi de
EU/Frankfurt bölgesinde (KVKK için "orta yol": kesin hukuki karar Faz 3'te, ama
şimdiden AB içi barındırma). Supabase Auth, ADR 0001'deki e-posta/telefon+şifre
kararıyla native uyumlu olduğu için kendi auth altyapımızı yazmıyoruz. RLS,
backend authorization'ın yerine değil yanına ikinci savunma katmanı olarak
eklenecek. Offline senkronizasyon: Room/SQLite kuyruk + WorkManager, API'ye
`client_record_id` ile idempotent gönderim (mekanizma zaten data-model.md'de
tanımlıydı, burada hangi bileşenin uygulayacağı netleşti).

`open-questions.md`'den "Kesin hosting/database sağlayıcısı" kaldırıldı.
`phase-1-mvp-backend-web.md` bu karara göre güncellendi. `CLAUDE.md`'ye kısa bir
"Teknik yığın" özeti eklendi.

**Sırada:** Next.js proje iskeletinin kurulması (uygulama, Supabase bağlantısı,
ilk migration'lar) — bu noktadan sonra artık kod yazılıyor olacak.

## 2026-09-15 — Faz 0 onaylandı, Faz 1 başladı

Kullanıcı tüm `flows/*.md` ve `data-model.md`'yi onayladı. `phase-0-wireframes.md`
`status: done`, tüm flow dosyaları ve `data-model.md` `status: done` olarak
işaretlendi. `docs/index.md` aktif faz Faz 1'e güncellendi, `phase-1-mvp-backend-
web.md` `status: in-progress`.

**Sırada:** Teknik mimari kararları — backend dili/framework, hosting/database
sağlayıcısı, offline senkronizasyon protokolü (PDF §10, §32 madde 9 "kesin
hosting/database sağlayıcısı" açık sorusunu da çözecek).

## 2026-09-15 — Web panel akışları ve kayıt akışı dolduruldu, Faz 0 içerik olarak tamam

`docs/flows/web-common.md` (ortak giriş + layout, tekrar önlemek için ayrı dosya),
`web-dershane-admin.md` (dashboard, şube/sınıf, öğrenci onay kuyruğu, davet kodu,
öğretmen/rehberlik atama, tenant ayarları), `web-rehberlik.md` (öğrenci listesi +
merkezi öğrenci profili: genel bakış/deneme/çalışma-etüt/ödev/telefon/günlük
bildirim/görüşme sekmeleri + görüşme-not ekleme), `web-ogretmen.md` (sınıflarım,
ödev oluşturma/durum, deneme sonucu toplu giriş, etüt planlama/katılım) dolduruldu.
`student-registration-flow.md` PDF §7'deki 9 adım, zaten tanımlı admin/öğrenci
ekranlarına link vererek somutlaştırıldı.

`docs/phases/phase-0-wireframes.md` bitiş kriterleri güncellendi: içerik
maddelerinin hepsi işaretlendi, sadece "kullanıcı onayı" ve `status: done` adımı
kaldı. Ayrıca kullanıcıyla konuşulan "checkpoint bazlı bağımsız review" fikri
(her faz/commit öncesi taze bağlamla `CLAUDE.md` kurallarına karşı kontrol) o
dosyaya not olarak eklendi — mutabık kalındı ama mekanizma henüz kurulmadı,
"daha sonra" ele alınacak.

**Sırada:** Kullanıcı tüm `flows/*.md` + `data-model.md`'yi gözden geçirip
onaylayacak → Faz 0 `done` → Faz 1 (backend + web MVP) teknik mimari kararlarıyla
başlayacak.

## 2026-09-15 — Auth kararı ve veri modeli netleştirildi

`docs/decisions/0001-auth-yontemi.md`: öğrenci/personel girişi e-posta veya telefon
+ şifre olarak kararlaştırıldı (davet kodu sadece kayıtta, login credential'ı
değil); OTP MVP'de yok, ileride ek bir yöntem olarak eklenebilir şekilde
tasarlandı. `open-questions.md` madde 1 kaldırıldı.

`docs/data-model.md` tüm kategorileriyle dolduruldu (tenant/branch/class_group/
user_account/student_profile/student_device/invite_code, mock_exam +
mock_exam_subject_result, homework + homework_assignment, study_session +
planned_study_block, question_log, daily_checkin, phone_usage_log,
guidance_session + guidance_note). İki konsolidasyon kararı verildi: "Deneme" ve
"Ders bazlı sonuçlar" tek yapıya (mock_exam_subject_result), "Çalışma süreleri" ve
"Etüt katılımı" tek yapıya (study_session + type alanı) indirgendi — gerekçeler
dosya içinde. Genel kurallar: rol/durum alanları native enum değil TEXT+CHECK,
tüm cihaz-kaynaklı kayıtlarda `client_record_id` ile idempotency, audit_log Faz
3'e bilinçli olarak ertelendi.

`flows/android-student.md`: Giriş, Günlük Bildirim, Deneme Sonuçları ekranları bu
kararlara göre güncellendi, placeholder'lar kaldırıldı.

**Sırada:** Kullanıcı bu kararları ve android-student.md'yi gözden geçirecek;
onaylanırsa web panel akışlarına (`web-dershane-admin.md`, `web-rehberlik.md`,
`web-ogretmen.md`) ve `student-registration-flow.md`'ye geçilecek.

## 2026-09-15 — Android öğrenci akışı ilk taslağı yazıldı

[docs/flows/android-student.md](docs/flows/android-student.md) onboarding (splash,
giriş, davet kodu, profil tamamlama, onay bekleniyor), ana kullanım (günlük
bildirim, çalışma/soru kaydı, ödevler, deneme sonuçları, etüt), telefon kullanım
senkronizasyonu (izin ekranı, durum) ve profil/ayarlar ekranlarıyla dolduruldu
(`status: in-progress` — kullanıcı onayı bekliyor). Giriş ekranının kesin alanları
auth yöntemi kararına bağlı, bu netleşmeden `done` işaretlenmeyecek. Git deposu
başlatılıp ilk commit (`c739423`) atıldı.

**Sırada:** Kullanıcı android-student.md'yi gözden geçirecek; onaylanırsa
`web-dershane-admin.md`, `web-rehberlik.md`, `web-ogretmen.md` akışlarına geçilecek.

## 2026-09-15 — Proje iskeleti kuruldu (Faz 0 başladı)

`urun-tanimi-v1.0.pdf` incelendi, `docs/source/` altına kopyalandı. Docs ailesi
oluşturuldu: `docs/index.md` (hub), `docs/00-kickoff.md` (özet ürün tanımı),
`docs/open-questions.md` (PDF §32'deki 9 açık soru), `docs/glossary.md`,
`docs/phases/` (5 faz: 0-wireframes, 1-mvp-backend-web, 2-android, 3-kvkk-hardening,
4-ai-layer), `docs/decisions/` (ADR şablonu), `docs/flows/` (rol bazlı akış
dosyaları, henüz boş iskelet). `CLAUDE.md` ile oturum protokolü ve değişmez
kurallar tanımlandı. Eski `.env`/`.env.example`/`.gitignore` (önceki bir taslaktan
kalma, Next.js+API+Postgres öngörüyordu) silindi — Faz 0 kod içermeyeceği için
gereksizdi, Faz 1'de yeniden ve bilinçli şekilde kurulacak. Git deposu henüz
başlatılmadı.

**Sırada:** `docs/flows/android-student.md` ve `docs/flows/web-*.md` dosyalarının
ekran ekran doldurulması (PDF §35 madde 1-2), ardından `docs/data-model.md`
(madde 3).
