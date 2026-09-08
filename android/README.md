# Native Android · v0.2 geliştirme

Kotlin/Activity Views; Android 10+ (minSdk 29), compile/target 36, AGP 8.9.2, Kotlin 2.1.20, Gradle 8.11.1, JDK 17. Yeni öğrenci ekranları: Bugün, Deneme, Planım ve Telefon; sonuç okuma ve ödev teslimi. Akademik işler online.

## Derleme
Android Studio ile klasörü açın veya Gradle 8.11.1 ile:
```sh
gradle -p android --no-daemon testDebugUnitTest assembleDebug
```
GitHub Actions, unit test ve debug APK işini çalıştırır; güncel sonucun kanıtı PR #5'in Android kontrolüdür. Artifact `dershane-development-apk`, 5 gün tutulur. Mağaza imzalı yayın değildir. Fiziksel cihaz/emülatör ölçüm testi yapılmış sayılmaz.

## Yerel API bağlantısı
Bilgisayarda seed ve API'yi başlatın. `adb reverse tcp:3100 tcp:3100` ardından debug URL `http://127.0.0.1:3100` kullanın. Bu önerilen kurulum Host kontrolünü korur; burada fiziksel cihazda uygulanıp doğrulanmadı. Release yalnız HTTPS kabul eder.

## Kullanım paylaşımı
Öğrenci onayı → cihaz kaydı → Android kullanım erişimi → cihazda olaylardan süre hesaplama → Keystore ile şifreli SQLite kuyruk → WorkManager → sunucu. Yalnız uygulama/paket, süre, cihaz/gün ve kalite bilgisi; içerik/fotoğraf/konum alınmaz. İptalde yerel toplama/kuyruk durur; offline sunucu iptali bağlantı geldiğinde iletilir. Kullanım izni toplama ve aktarım öncesinde kontrol edilir.

Oturum dolarsa yerel toplama durur, kuyruk temizlenir ve yeniden giriş açılır; bu, sunucudaki onayın iptal edildiği iddiası değildir. Bekleyen sunucu iptali varsa farklı hesaba geçmeden önce önceki öğrenciyle giriş yapıp iptal tamamlanır. Activity kapandıktan sonra eski ağ cevabı UI açmaz.

## Açık kapılar
Tam offline akademik kuyruk; 409/422 çözüm ekranları; Auth refresh/recovery/MFA; davet/veli akışı; tüm web ekranlarıyla eşitlik; uzun offline geçmiş. Worker bugün/dünü yeniden hesaplar, uzun kapalı dönemin bütün günlerini tamamlamaz. Ölçüm `limited`; OEM/pil/çoklu pencere/eksik OS olayları kesinliği etkiler. Yeniden kurulum yeni cihazdır; cihaz birleştirme UI'si yok. Gerçek cihaz matrisi, hukuki süreçler ve Play kapıları olmadan gerçek veriyle dağıtmayın.
