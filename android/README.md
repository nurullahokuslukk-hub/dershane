# Android geliştirme projesi

Native Kotlin, Android 10+ (minSdk 29), compile/target 36, AGP 8.9.2 / Kotlin 2.1.20 / Gradle 8.11.1 / JDK 17.
Bu ortamda Android SDK/Gradle ve paket erişimi olmadığından **derlenmedi, APK üretilmedi, cihaz testi yapılmadı**. Kaynak kodu başlangıcıdır; mağaza yayımlanabilir uygulama değildir.

## Derleme ve localhost denemesi
Android Studio ile bu klasörü açın. SDK 36 ve Gradle 8.11.1 kurun. Güvenilir Gradle kurulumundan `gradle wrapper --gradle-version 8.11.1` üretin (wrapper binary bu pakette yok). Ardından `./gradlew testDebugUnitTest assembleDebug`.
Web/API sunucusunu bilgisayarda başlatın. `adb reverse tcp:3100 tcp:3100` çalıştırın; Android debug URL'si `http://127.0.0.1:3100`. Bu, backend'in localhost/Host korumasını korur. Release yalnızca HTTPS kabul eder. Debug API adresine gerçek veri göndermeyin.

## Kaynakta bulunan akış
Öğrenci giriş → uygulama içi paylaşım onayı → cihaz kaydı → Android özel kullanım erişimi → UsageStatsManager olaylarından cihazda süre toplama → Keystore ile şifreli SQLite kuyruğu → WorkManager HTTPS/JSON → sunucu idempotency + kategori → web.
İptal yerel kuyruğu siler, toplamayı durdurur; offline iptal sunucuya bağlantı gelince iletilir. OS izni kapalıysa worker bunu gözlemlediğinde paylaşımı durdurur. Kontrol aralıkları nedeniyle sunucu iptali anlık garanti değildir. Yeni toplama ve her aktarım öncesi OS izni yeniden kontrol edilir.

## Bilinen eksikler
- Tüm öğrenci/öğretmen ekranları yok. Başlangıçta çalışma girişi ve kullanım paylaşımı ekranı var; çalışma girişi online (offline akademik kuyruk S3).
- Şube/davet/veli doğrulama/parola kurtarma/refresh rotation yok.
- 401/409/422 sonrası kuyruk çözüm ekranı yok; tekrar giriş/manuel destek gerektirir. 7 günden eski bekleyen kullanım kayıtları temizlenir.
- Permission açılışında kullanıcıya işletim sistemi izin penceresi zorla gösterilmez; ayrı düğmeyle açılır.
- ForegroundReducer tek ön plan yaklaşımıdır; çoklu pencere, eksik OS olayı, OEM/pil farkı kesin süreyi etkiler. `limited` kalitesiyle gönderilir. Paket etiketi sunucuda bilinmiyorsa paket adı / sınıflandırılmamış görünür.
- Bugün ve önceki gün yeniden hesaplanır; cihaz uzun süre kapalıysa tüm eski günler geri doldurulmaz. Eksik gün 0 gösterilmez.
- Telefon yeniden kurulumunda yeni cihaz kaydı oluşur; cihaz birleştirme UI'si henüz yok.
- Play Data safety, hesap silme akışı, hukuki süreçler ve gerçek cihaz testleri tamamlanmadan dağıtmayın.
