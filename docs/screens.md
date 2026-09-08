# Ekran envanteri

## Web mevcut
Giriş/hata/çıkış; yetkili öğrenci listesi/ad-sınıf arama; profil; telefon günü/cihazı/kategori filtresi ve azalan süre listesi; veri yok/kapalı izin; akademik kayıt listesi; çalışma/soru/günlük formu; öğretmen deneme/ödev/etüt formu; rehberlik özel not; admin pending onayı; gizlilik dialog'u. Mobil390px ve masaüstü tasarım. Gösterimler sentetik geliştirme verisidir.

## Android kaynak kapsamı
Sunucu/kurum/kod/parola girişi; Bugün başlangıcı; online çalışma ekleme; paylaşım açıklaması,onay/ret/iptal; OS kullanım erişimi; sync durumu; çıkış. APK build başarısı gerçek cihaz doğrulaması değildir.

## Tam MVP için bekleyen ekranlar
A01 davet, A02 aydınlatma/temsil, A03 kayıt, A04 onay bekleme, A05 kurtarma, A06–09 çalışma/soru/günlük geçmiş/düzeltme, A10 ödev teslim/doğrulama, A11 deneme detay, A12 etüt takvimi, A13 cihazlar/çakışma, A14 export/silme talepleri.
W01 personel MFA, W06 şube/sınıf/dönem/personel, W07 davet, W08 CSV import/önizleme/hata, W09 haklar/retention, W10 ayarlar, W11 system admin kurum/abonelik/sağlık (öğrenci içeriği yok), W12 audit.

## Tasarım şartı
Sistem sans,açık tema,mavi vurgu,8px aralık,44px hedef,görünür odak,semantik label,renkten bağımsız durum. Her veri kaynak/gün/kapsam içerir. Eksik≠0. Cihazlar birleştirilmez. Sınırlı ölçüm etiketi zorunlu. İzin ret erişilebilir; risk/başarı damgası yok. Her ekranda loading/empty/error/offline/tekrar çözümü planlanır.
