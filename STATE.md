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

## 2026-09-18 — Faz 2 Android ilk teslimi web rehberlik akışıyla birleştirildi

Native Kotlin/Compose öğrenci uygulaması; Supabase Auth doğrulaması, günlük
dershane devam öz-bildirimi, 20.00 civarı yerel çıkış hatırlatması, Room/KSP
tabanlı idempotent offline-kuyruk altyapısı ve yeniden başlatma/uygulama
güncellemesi/saat dilimi değişiminde WorkManager işlerini yeniden planlayan
receiver ile depoya alındı. `0005_android_student_rls.sql` ve canlı şemayla
uyumlu `0006_daily_dershane_presence.sql` artık repo içinde; web rehberlik
ekranı ile aynı tabloyu kullanır. Android derlemesi başarıyla doğrulandı.
Sıradaki iş: ekran kayıtlarını offline kuyruğa bağlamak ve UsageStatsManager
telefon kullanım toplama akışını tamamlamak.

## 2026-09-17 — Faz D: Rehberlik paneli + "Dershane düzeni" (devam öz-bildirimi)

Rehberlik paneli stub'dan çıkarıldı: `/rehberlik` (atanmış öğrenci listesi, son
görüşme tarihiyle) ve `/rehberlik/students/[id]` (öğrenci profili). Profilde üç
bölüm: **Dershane düzeni**, **Deneme sonuçları**, **Görüşmeler ve notlar**
(`guidance_note`/`guidance_session`, tek formda birleştirildi —
`POST /api/rehberlik/notes`). Çalışma/ödev/telefon bölümleri bilinçli olarak
yazılmadı: o kategorilerde veri üretecek Android henüz yayında değil, boş sekme
göstermek yerine ertelendi.

**Yetki:** rehberlik yalnızca `guidance_student_assignment` ile kendisine
atanmış öğrenciyi görür. `src/lib/guidance/access.ts` tek kapı; hem sayfa hem
API her istekte atamayı yeniden doğruluyor, URL'deki id'ye asla güvenilmiyor.
Tarayıcıda doğrulandı: atanmamış öğrencinin sayfası **404**, o öğrenciye not
yazma denemesi **403**, rehberlik hesabıyla `/admin/students` → `/rehberlik`'e
yönlendirme.

**Dershane düzeni** (karar:
[decisions/0006-dershane-devam-oz-bildirimi.md](docs/decisions/0006-dershane-devam-oz-bildirimi.md)):
son 30 günün kayıtları — tarih, gittim/gitmedim, giriş, çıkış ve her satırda
**"Öğrencinin beyanı"** kaynağı. Üstte gün sayıları + ortalama kalış. Puan,
devamsızlık yüzdesi, "tutarsız beyan" uyarısı, otomatik disiplin çıktısı **yok**;
bunun yerine nazik konuşma sinyalleri ("Bu hafta düzenini konuşmak ister
misiniz?" / "Bu bir devamsızlık göstergesi değil — öğrenci uygulamayı kullanmayı
unutuyor olabilir"). Bu kuralı kod seviyesinde sabitlemek için sinyal metinlerini
test ediyoruz (`presence.test.ts`: üretilen hiçbir metinde "devamsız/ceza/uyarı/
yalan/puan" geçmiyor).

**Ciddi bir hata yakalandı ve düzeltildi.** `daily_dershane_presence` tablosu
kullanıcının Supabase projesinde **zaten uygulanmıştı** ama migration dosyası
depoya hiç girmemişti; ben tabloyu `presence_date`/`left_at`/`note` sütunlarıyla
varsaymıştım, canlı şema ise `attendance_date`/`departed_at` kullanıyor ve `note`
içermiyor. PostgREST bu sorguya hata döndürüyordu, ama kodum yalnızca "tablo yok"
hata kodlarına baktığı için hatayı yutup **"bu öğrenci henüz hiç devam bildirimi
girmemiş"** yazdırıyordu — rehberliğe sessizce yanlış bilgi. İki düzeltme:
(1) canlı şema PostgREST OpenAPI ile okunup kod ve migration birebir ona
hizalandı; (2) artık **herhangi bir** sorgu hatası yutulmuyor, bölüm "veri yok"
demek yerine "yüklenemedi" diyor.

`supabase/migrations/0006_daily_dershane_presence.sql` bu yüzden bir
*yeniden yapılandırma*: sütun adları canlı veritabanından alındı (uydurulmadı),
tamamen guard'lı (mevcut DB'de no-op, sıfırdan kurulan projede doğru tabloyu
kurar). RLS kısmı bilinçli olarak generic `tenant_isolation`'dan farklı: Android
ayrı backend olmadan doğrudan Supabase'e bağlandığı için, generic politika bir
öğrencinin **tüm dershanenin** devam bilgisini okumasına izin verirdi. Bunun
yerine `presence_student_own` (öğrenci sadece kendi satırları) +
`presence_staff_read` (personel salt okuma) var.

**Test altyapısı eklendi** (kullanıcı "ilgili testleri çalıştır" dedi, repoda hiç
test yoktu): yeni bağımlılık **yok** — Node'un yerleşik `node --test` koşucusu +
`scripts/test-alias-hook.mjs` (tsconfig'deki `@/` alias'ını Node'a tanıtan küçük
resolve hook'u). 20 test: devam özeti/sinyalleri, deneme sonucu satır doğrulama
(virgüllü ondalık, aynı isimli öğrenci, mükerrer satır), deneme gruplama.
`npm test`, ayrıca `npm run check` (test + tsc + build).

**Doğrulama için kullanıcının Supabase projesine test verisi girildi** (`başarı`
dershanesi): 3 test öğrencisi, bir deneme + sonuçları, 18 gün devam kaydı ve
`rehberlik.test@example.com` / `Rehberlik.123` ile doğrulanmış bir rehberlik
hesabı. Test sırasında oluşan mükerrer deneme kaydı silindi. Kullanıcı isterse
bu test verisi temizlenebilir.

**Sırada:** 0007 migration'ının Supabase'de çalıştırılması; rehberlik profilinde
net trend grafiği; Android'den gerçek veri gelmeye başlayınca çalışma/ödev/
telefon bölümleri. Ayrıca 0005 (Android RLS) hâlâ depoda yok — Codex push
edince ya da kullanıcı çalıştırdığı SQL'i verince depoya alınmalı.

## 2026-09-17 — Admin paneli tamamlandı: tasarım sistemi + öğrenci ekranları + Faz C (deneme sonuçları)

Kullanıcı "önce admin sayfasını komple, fazlarını eksiksiz tamamla" dedi. Üç iş
birlikte yapıldı.

**1) Ortak tasarım sistemi** (kullanıcının "görsel tasarım çok basit" geri
bildirimi): `globals.css`'e renk tokenları eklendi (surface/border/muted/brand/
success/warning/danger, karanlık mod aynı isimleri yeniden tanımlıyor — artık
bileşenlerde `dark:` varyantı yazılmıyor). `src/components/ui/` altında
paylaşılan primitifler: `styles.ts` (buton/input/tablo sınıf demetleri), `Card`,
`PageHeader`, `Badge`, `EmptyState`, `Pagination`. `AppShell` yenilendi: marka
işareti, kullanıcı çipi, ve `SideNav` (tek client parçası — `usePathname` ile
aktif bağlantı vurgusu) ile Genel/Kurum/Kişiler/Akademik/Sistem başlıklı gruplu
menü + "Doğrulanmamış" üzerinde bekleyen iş rozeti. Tüm admin ekranları,
`/login`, `/claim`, `/forgot-password` bu tokenlara taşındı.

**2) Öğrenci ekranları** (admin panelindeki en büyük boşluktu — öğrenci
listesi hiç yoktu, sayaç `/admin/classes`'a link veriyordu): `/admin/students`
(isimle arama + sınıf filtresi + 50'şerli **sunucu taraflı sayfalama**;
`user_account` taban tablo, `student_profile!inner` ile bağlanıyor) ve
`/admin/students/[id]` (hesap durumu/claim kodu, rehberlik ataması, denemeye
göre gruplanmış ders bazlı sonuçlar + toplam net).

**3) Faz C — deneme sonucu toplu içe aktarma:** `/admin/exams` (+`new`, `[id]`),
`/admin/import/exam-results`, `POST /api/admin/mock-exams`,
`POST /api/admin/import/exam-results`, `src/lib/import/exam-schema.ts`,
`public/templates/deneme-sonuc-sablon.csv`. Roster ile aynı altyapı
(CSV + `ImportPreviewTable`). Kararlar: **net dosyadan olduğu gibi alınıyor,
yeniden hesaplanmıyor** (ceza katsayısı sınav türüne göre değişiyor, ikinci bir
doğruluk kaynağı yaratmak istemedik); aynı dosyadaki tekrar eden (öğrenci+ders)
satırları önizlemede hata olarak işaretleniyor (yoksa upsert sessizce birini
ezerdi); `(mock_exam_id, student_id, subject)` üzerinde upsert, yani düzeltilmiş
dosya tekrar yüklenince çift kayıt değil güncelleme oluyor; 5000 satır üst
sınırı, 500'lük parçalar halinde yazım.

**Tarayıcıda uçtan uca doğrulandı** (gerçek Supabase, `başarı` dershanesi):
3 test öğrencisi roster API'siyle oluşturuldu → deneme oluşturuldu → 6 sonuç
satırı yüklendi → **aynı yükleme ikinci kez yapıldığında çift kayıt oluşmadı**
(deneme detayında hâlâ 3 öğrenci) → başka tenant'ın öğrenci id'si gönderildiğinde
400 "Bazı öğrenciler bu dershaneye ait değil" döndü → öğrenci detayında sonuçlar
ve toplam net doğru göründü. Bu sırada bir hata yakalanıp düzeltildi: dashboard
"öğrencilerin %-67'si hesabını aktifleştirdi" yazıyordu — doğrulanmamış hesap
sayacı tüm rolleri kapsıyor, öğrenci oranına bölünemezdi; ayrı bir sorgu eklendi.

**Yeni migration: `0007_exam_integrity_and_indexes.sql` — Supabase SQL
Editor'da çalıştırılmalı.** İçeriği: `mock_exam (tenant_id, name, exam_date)`
tekillik kısıtı (tarayıcı testinde aynı denemenin iki kez oluşturulabildiği
doğrulandı, kısıt olmadan engellenmiyor) + admin sorgularının dayandığı 6 indeks
(öğrenci listesi isme göre sıralı sayfalanıyor, deneme detayı tek denemenin tüm
satırlarını çekiyor — yüz binlerce kayıtta seq scan'e düşerdi).

**Numaralandırma notu:** `0005` ve `0006` bu depoda YOK. Kullanıcı "0005 Android
RLS uygulandı" ve "0006 daily_dershane_presence uygulanmalı" dedi ama Codex
henüz hiçbir şey push etmemiş (`origin/master` = `e681fde`, `android/` dizini
yok). Bu yüzden benim migration'ım 0007 numarasını aldı; 0005/0006 yerleri
Codex'in push'u (veya kullanıcının çalıştırdığı SQL'in depoya alınması) için
boş bırakıldı.

**Sırada:** Faz D — rehberlik paneli (atanmış öğrenci listesi + öğrenci profili),
ve içinde kullanıcının istediği "Dershane düzeni" (günlük devam öz-bildirimi)
bölümü. Bunun `daily_dershane_presence` tablosu henüz depoda olmadığı için
migration'ı da yazılacak.

## 2026-09-17 — Roster içe aktarma sayfası netleştirildi, sistem admin için genel arama eklendi

Kullanıcı roster içe aktarma sayfasındaki "şablon indir" adımının neden
gerektiğini anlamadığını belirtti (sistem PDF'i kendisi okuyamıyor, şablon
sadece format örneği — bu hiç açıklanmamıştı). `RosterImportClient.tsx`'e
3 adımlı ("1) İndir 2) Doldur 3) Yükle") açık bir açıklama kutusu eklendi.

Kullanıcı ayrıca admin panelinin "çok basit" kaldığını, örnek olarak "kayıtlı
tüm dershaneleri, öğrenci isimlerini görebilmek, dershane arama" istediğini
belirtti — bu somut isteğe karşılık **`/admin/search`** eklendi (sadece
system_admin): tüm dershanelerde dershane adı VEYA kişi adı arama, sonuçta
"Bu dershaneye geç" ile o dershanenin bağlamına atlama. RLS zaten
`is_system_admin()` için tenant_id filtresini kaldırdığından bu sorgular ekstra
bir yetki mekanizması gerektirmedi. Tarayıcıda test edildi: "açı" dershanesi
arandı, bulundu, "Bu dershaneye geç" ile TenantSwitcher'ın context'i doğru
değişti. `npm run build` temiz.

Kullanıcı ayrıca genel olarak sistemin "yerlerde" ve "kusurlu" hissettiğini,
diğer ekranların (özellikle Android/Flutter öğrenci uygulaması) ne zaman
kurulacağını sordu ve bu kısmı Codex'e yaptıracağını, benden Codex için bir
"prompt" hazırlamamı istedi (öğrenci telefon kullanım verisi kesinlikle
alınmalı). Bu konuşulan ama henüz üzerinde çalışılmayan bir konu — devam eden
sohbette Flutter/native karar netleştirilip Faz 2 (Android) dokümanı
detaylandırılıp Codex'e verilecek bir brief hazırlanacak.

**Sırada:** Kullanıcının cevabına göre ya Faz C (deneme sonucu içe aktarma)
ya da Faz 2 (Android/Codex brief) hazırlığı.

## 2026-09-17 — Faz 2 (Android) Codex için hazırlandı; Faz 0'daki Android akış belgesi güncel modele düzeltildi

Kullanıcı native Android/Kotlin'e karar verdi (Flutter değil) —
[decisions/0005-android-native-kotlin.md](docs/decisions/0005-android-native-kotlin.md).
Ayrıca "gelişmiş admin paneli" isteğinin iki parçası netleşti: (1) görsel
tasarım şu an çok sade — Claude/web tarafında ayrıca ele alınacak, Codex'in
işi değil; (2) daha fazla veri görünürlüğü zaten Faz C/D'nin kapsamında, yeni
bir şey değil.

**Kritik düzeltme:** [flows/android-student.md](docs/flows/android-student.md)'nin
onboarding bölümü (Davet Kodu Girişi/Profil Tamamlama/Onay Bekleniyor) Faz
0'da, eski davet-kodu-self-servis modeli için yazılmıştı — decision 0003 ile
kayıt modeli tamamen değişti (roster toplu içe aktarma + web'de `/claim`).
Bu üç ekran kaldırıldı; Android artık sadece düz bir Giriş ekranı içeriyor,
hesap doğrulama (claim) tamamen web'de kalıyor, Android'de karşılığı yok.
Bu düzeltme yapılmadan Codex'e brief verilseydi, artık var olmayan bir akış
için ekran inşa ederdi. `student-registration-flow.md` da güncellendi (roster
içe aktarma artık `status: done`, önceki "henüz yazılmadı" notu kaldırıldı).

[phases/phase-2-android.md](docs/phases/phase-2-android.md) Codex'in kendi
başına başlayabileceği kadar detaylandırıldı: mimari karar (ayrı backend yok,
doğrudan aynı Supabase projesine `supabase-kt` ile bağlanma — RLS zaten tenant
izolasyonunu web ile aynı şekilde uyguluyor), telefon kullanım verisi detayı
(`UsageStatsManager`, Usage Access izni, `WorkManager` periyodik senkron),
offline kuyruk (Room + `client_record_id` idempotency, mekanizma zaten
data-model.md'de tanımlıydı), 5 alt-adımlık öneri sırası (iskelet+auth → temel
ekranlar → offline kuyruk → telefon verisi → Play Store hazırlığı), ve
git çalışma notu (ayrı `android/` dizini, dosya çakışması yok, sadece
STATE.md'ye ekleme yaparken `git pull --rebase` önerisi).

`.gitignore`'daki eski Flutter kalıntısı (`.dart_tool/`) native Android/Gradle
girdileriyle (`android/local.properties`, `android/.gradle/`, vs.)
değiştirildi.

**Sırada:** Kullanıcıya Codex'e verilecek kısa bir prompt metni hazırlanacak
(bu mesajın sonunda). Web tarafında Faz C (deneme sonucu içe aktarma) devam
edecek — Android işi Codex'e geçtiği için artık gerçekten paralel ilerlenebilir.

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
