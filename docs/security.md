# KVKK ve güvenlik yayın kapıları

Hukuki görüş/uygunluk belgesi değildir. Sağlayıcı/dershane rolleri,işleme dayanakları,çocukların temsili ve rızanın özgürlüğü uzman hukukçuyla belirlenir. Aydınlatma ve rıza ayrı. Android izni tek başına KVKK uygunluğu sağlamaz. Uygulama listesi hassas çıkarım yaratabilir;amaç/minimizasyon ayrıca incelenir.

## Saklama hedefleri — hukuki süre iddiası değil
Telefon30 gün;akademik aktif dönem+ayrılıştan sonra90 gün;rehberlik notu180 günde gereklilik değerlendirmesi;teknik log14 gün;audit180 gün;şifreli dönen backup30 gün. Hukuki muhafaza ayrı. Retention job henüz yok. Demo iptal kullanım snapshot/satırlarını siler;batch hash/audit metadata kalır. Restore sonrası silme manifesti üretimde uygulanmalıdır.

## Zorunlu kapılar
- [ ] Hukuki roller/dayanak/aydınlatma/temsil-veli/iptal/silme sözleşmeleri.
- [ ] Hosting,destek,log,backup,SDK için yurtdışı aktarım değerlendirmesi.
- [ ] Postgres runtime rolüyle RLS,IDOR,atama testleri ve composite FK.
- [ ] MFA/kurtarma/mobil refresh/hesap-device lifecycle.
- [ ] Gerçek Android:izin reddi/iptali,pil/OEM,eksik olay,saat/gün/çoklu cihaz,offline replay.
- [ ] Retention/silme manifesti,şifreli backup/restore.
- [ ] Yük,bağımsız güvenlik,erişilebilirlik,staging.
- [ ] Play Data safety/gizlilik/hesap silme,hedef yaş/API36,kapalı test/mağaza incelemesi.

## Resmi kaynaklar ·8 Eylül2026
https://developer.android.com/reference/android/app/usage/UsageStatsManager
https://support.google.com/googleplay/android-developer/answer/10144311?hl=en
https://support.google.com/googleplay/android-developer/answer/10787469?hl=en
https://support.google.com/googleplay/android-developer/answer/11926878?hl=en
https://www.kvkk.gov.tr/Icerik/2053/Yurtdisina-Aktarim
https://www.kvkk.gov.tr/Icerik/8143/Kisisel-Verilerin-Yurt-Disina-Aktarilmasi-Rehberi
Yayında yeniden kontrol ve hukuki uyarlama gerekir.
