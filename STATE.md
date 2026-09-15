---
title: Proje durumu (append-only log)
description: Oturumlar arası tek gerçek kaynak — en son ne yapıldı, sırada ne var.
status: active
updated_at: 2026-09-15
---

# STATE

Bu dosyaya sadece **ekleme** yapılır, geçmiş girdiler değiştirilmez/silinmez.
En yeni girdi en üstte. Format için [CLAUDE.md](CLAUDE.md) → "STATE.md giriş formatı".

---

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
