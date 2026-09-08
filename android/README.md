# Android geliştirme sürümü

Native Kotlin · Android10+ · compile/target36 · AGP8.9.2/Kotlin2.1.20/Gradle8.11.1/JDK17.

## Doğrulanmış durum · 8 Eylül 2026
Yerel sandbox Android SDK içermiyordu. Bunun yerine GitHub Actions'ta `testDebugUnitTest assembleDebug` çalıştırıldı ve Android kontrolü **başarıyla tamamlandı**:
https://github.com/nurullahokuslukk-hub/dershane/actions/runs/34208040434/job/102002131588
Workflow debug APK'yı `dershane-development-apk` artifact'i olarak yükler; saklama5 gün. Bu APK geliştirme amaçlıdır; production backend/Play Store yayını değildir. Fiziksel cihaz/OEM/izin davranışı test edilmedi.

## Kurulum
Android Studio ile bu klasörü açın. SDK36, JDK17 ve Gradle8.11.1 gerekir. Güvenilir kurulumdan `gradle wrapper --gradle-version 8.11.1`; sonra `./gradlew testDebugUnitTest assembleDebug`. Wrapper binary kaynak paketinde yok; CI kurulu Gradle kullanır.
API'yi bilgisayarda başlatın; `adb reverse tcp:3100 tcp:3100`; debug uygulama adresi `http://127.0.0.1:3100`. Seed'deki `cizre-demo / ogrenci` hesabını kullanın. Böylece backend localhost/Host koruması korunur. Release yalnızca HTTPS. Gerçek öğrenci verisi kullanmayın.

## Akış
Giriş → ayrı paylaşım onayı → cihaz kaydı → Android kullanım erişimi → UsageStatsManager olaylarından cihazda süre toplama → Keystore şifreli SQLite kuyruk → WorkManager → tenant/izin/idempotency API → rehberlik paneli.
İlk OS izni verilmeden toplama başlamaz. Sonraki iptal worker tarafından görüldüğünde toplama/aktarım durur; yerel kuyruk temizlenir ve sunucu iptali online olduğunda iletilir. Sunucu iptali anlık garanti değildir. Her toplama ve aktarım öncesi OS izni yeniden kontrol edilir.

## Açık işler / sınırlar
- Tüm mobil ekranlar yok; çalışma girişi online. Davet/veli-temsil/MFA/kurtarma/refresh ve akademik offline kuyruk bekliyor.
- Worker ağ bağlantısı ile çalışır; bugün ve önceki günü yeniden hesaplar. Uzun offline dönemin tüm günlerini geri doldurmaz. Kuyruk, aktarım hatasında hazırlanmış batch'i korur. Eksik gün0 değildir.
- 401/409/422 için kullanıcıya çakışma çözüm ekranı henüz yok.7 günden eski bekleyen kullanım verisi temizlenir.
- Çoklu pencere/eksik OS olayı/OEM/pil/saat değişimi ölçümü etkileyebilir. Tek ön plan yaklaşımı `limited` kaliteyle iletilir; kesin ekran süresi değildir.
- Bilinmeyen paket sınıflandırılmamış; uygulama yeniden kurulumu/yeni giriş cihaz kaydı oluşturabilir. Cihaz birleştirme ekranı yok.
- KVKK/temsil süreci, hesap silme, retention/restore, gerçek cihaz testi ve Play Data safety/onayı tamamlanmadan gerçek öğrencilere dağıtmayın.
