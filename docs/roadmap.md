# Geliştirme yol haritası

Tahmin:2 geliştirici + kısmi QA/hukukla10–12 hafta; ekip/dış onaylara bağlı,teslim garantisi değil.

1. **S0 / bu teslim:** ürün kararları,yerel web/API/telemetri,testler,native Android başlangıcı,tasarım. Tam ürün değil.
2. **S1 / hafta1–2:** PostgreSQL repository/migration/RLS runtime negatif testleri; kurum/şube/sınıf/atama; davet-onay,kurtarma,MFA. Kabul:iki tenant/roller arasında kaçak yok,onaysız veri yok.
3. **S2 / hafta3–4:** normalize akademik schema,deneme ders sonuçları/ceza böleni/revision,ödev atama-teslim-doğrulama,etüt,CSV validation/idempotency. Kabul:çift import/yanlış ders/izinsiz işlem testleri.
4. **S3 / hafta5–6:** Android gerçek cihaz izin/offline testleri;tüm öğrenci ekranları;akademik offline kuyruk;refresh/Keystore;401/409 çözüm. Kabul:restart/ağ kaybı/hesap değişiminde kayıp/sızıntı yok.
5. **S4 / hafta7–8:** veli/temsil/hukuk,disclosure sürümleri,talep/silme/retention worker,not/eylem ayrımı,backup restore. Kabul:iptal,silme,restore manifesti testleri.
6. **S5 / hafta9–10:** Play target36/Data safety/hesap silme/politika kapıları,yük/güvenlik,staging,küçük gönüllü pilot. Telefon verisi ayrıca onaylanmadan açılmaz.
7. **S6 / hafta11–12:** OEM/çoklu pencere/gün/saat/çoklu cihaz ölçüm doğrulaması,kategori sürümleme,pilot geri bildirim,ticari fiyat.

**Done:**kod+test+tenant/atama/izin negatif test+UI mobil/desktop/hata/boş+belge+migration uyumluluğu. Merge≠deploy. Dış onay yoksa yayın işi bitmez.
İlk sonraki iş:Postgres adaptörü ve gerçek RLS testleri;paralelde Android cihaz izin/sync matrisi. Gerçek veri bu kapılardan ve hukuktan önce alınmaz.
