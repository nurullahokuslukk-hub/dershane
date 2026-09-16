---
title: Codex için Android başlangıç prompt'u
description: Kullanıcının Codex'e olduğu gibi verebileceği kopyala-yapıştır metin.
status: active
updated_at: 2026-09-17
---

# Codex İçin Android Başlangıç Prompt'u

Kullanıcı bu metni Codex'e (proje bu repo açıkken) olduğu gibi verebilir. Prompt
kısa tutuldu çünkü asıl detay zaten repodaki dokümanlarda — Codex onları okuyacak.

```
Bu depoda birden fazla AI aracı (Claude Code, sen) çalışıyor. Önce AGENTS.md
dosyasını oku — ortak kurallar orada. Sonra docs/index.md ve STATE.md'nin
son birkaç girdisini oku.

Görevin: Faz 2 — native Android (Kotlin) öğrenci uygulamasını sıfırdan
geliştirmek. Tam brief burada: docs/phases/phase-2-android.md — bunu baştan
sona oku, sonra ekran ekran detay için docs/flows/android-student.md'yi oku.
Veri şeması için docs/data-model.md'ye, teknik karar gerekçesi için
docs/decisions/0005-android-native-kotlin.md'ye bak.

Özet (detay yukarıdaki dosyalarda): ayrı bir backend YAZMA — uygulama
doğrudan aynı Supabase projesine bağlanacak (supabase-kt kütüphanesi ile),
aynı Auth, aynı tablolar, aynı RLS. Bağlantı bilgileri:

SUPABASE_URL = https://jswuhyejyxzfewziicbv.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3VoeWVqeXh6ZmV3emlpY2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MjMyMTksImV4cCI6MjEwNDk5OTIxOX0.kI0242sXnyLz2UdO92AZt7wAZZRCxYrR5fCsnDXOLH0

(Bu anon key public'e açık bir key, gizli değil — Supabase'in kendi
tasarımı gereği client uygulamalara gömülür, gerçek güvenlik RLS ile
sağlanıyor. Bunu android/local.properties'e yaz, git'e girmesin —
.gitignore'da zaten android/local.properties hariç tutuluyor.)

Telefon kullanım verisi ("kesinlikle" istenen özellik) için
UsageStatsManager + Usage Access izni + WorkManager ile periyodik senkron
kullan — detay phase-2-android.md'de.

android/ dizini altında yeni bir Android Studio projesi olarak başla.
phase-2-android.md'deki 5 alt-adımı (2.1 İskelet+Auth → 2.2 Temel ekranlar
→ 2.3 Offline kuyruk → 2.4 Telefon verisi → 2.5 Play Store hazırlığı)
sırayla takip et, önce 2.1'i bitir.

Her oturum sonunda AGENTS.md'deki protokole göre STATE.md'ye bir girdi ekle
(append-only, mevcut girdileri silme/değiştirme). Push etmeden önce
`git pull --rebase` yap — Claude Code aynı anda web tarafında çalışıyor
olabilir, STATE.md'de küçük bir metin çakışması olursa elle birleştir.
```

## Notlar (kullanıcı için, prompt'un dışında)

- Bu anon key public olduğu için prompt içinde paylaşmak güvenlik riski
  değil — ama yine de bu dosyayı (`docs/guides/codex-android-prompt.md`)
  genel/herkese açık bir yere postalama gibi bir şey yapma, sadece Codex'e ver.
- `service_role` anahtarını (**asla**) Codex'e verme — Android uygulamasının
  buna ihtiyacı yok, sadece anon key yeterli (RLS zaten yetkilendirmeyi
  hallediyor).
