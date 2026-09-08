# Dershane · v0.2.0-dev

**Yeni öğrenci deneyimi ve çalışan akademik geliştirme sürümü. Üretime hazır veya yol haritası tamamen bitmiş bir ürün değildir. Gerçek öğrenci verisi kullanmayın.**

## Çalıştır
Node.js 24.14+ (24.x):
```sh
npm run seed
npm start
# http://127.0.0.1:3100
npm test
```
Web/API için harici npm bağımlılığı gerekmez. Seed, rastgele giriş bilgilerini `.local/demo-credentials.json` içine yazar; mevcut veritabanını ezmez. Kurum: `cizre-demo`; roller: `ogrenci`, `ogretmen`, `rehberlik`, `admin`. Yalnız kurgusal veri vardır. `.local`, parolalar ve veritabanları Git'e alınmaz.

## v0.2'de çalışanlar
- Açık/lila yüzeyler, özgün çizgi ikonlar, mobil yüzen alt menü ve masaüstü çalışma alanı. Ücretli Iconly varlığı kullanılmadı.
- Öğrencide TYT/AYT deneme seçimi; toplam ve ders bazında doğru/yanlış/boş/net; aynı sınav dağılımı ve ceza böleninde gelişim grafiği.
- TYT, AYT Sayısal ve AYT Eşit Ağırlık sonuç girişi. Sunucuda soru toplamı doğrulaması, negatif net ve tekrar kayıt koruması. İsteğe bağlı ders/konu notu.
- Ödev atama → öğrenci teslimi → düzeltme/yeniden teslim → öğretmen doğrulaması; sürüm çakışması koruması.
- Etüt planı, çakışma kontrolü ve zaman kontrollü katılım işaretleme.
- Çalışma/soru/günlük kayıtlar; yalnız yetkili rehberlikte özel notlar; bekleyen öğrenci onayı.
- Native Android öğrenci ana ekranı, deneme sonuçları, plan/teslim ve ayrı telefon paylaşımı ekranı.
- İsteğe bağlı uygulama bazlı süre → cihaz/gün/sunucu kategorisi → atanmış rehberlik. Mesaj, fotoğraf, konum veya ekran içeriği alınmaz.

## Testler ve kanıt
50 Node testi; rol bazlı tarayıcı akışları; PostgreSQL 17 üzerinde RLS izolasyon testi; Android unit test ve debug derleme iş akışı. **Bir iş akışının bulunması testin geçtiği anlamına gelmez:** ilgili commit'in sonuçları [PR #5](https://github.com/nurullahokuslukk-hub/dershane/pull/5) ve [Actions](https://github.com/nurullahokuslukk-hub/dershane/actions) altında.

## Supabase kararı
Hedef: PostgreSQL + Supabase Auth. Bölge/sözleşme ve KVKK aktarım değerlendirmesine bağlı olarak hosted veya uygun self-host. 14 tabloluk RLS temeli ve negatif testleri hazır; **çalışan uygulama henüz Supabase'e bağlı değil**. Client yazımları kapalıdır. [Ayrıntılar](docs/supabase.md).

## Yayın engelleri
Supabase runtime/Auth/provisioning; davet ve kurum/şube/sınıf yönetimi; parola kurtarma/MFA/refresh; tam offline akademik kuyruk; sonuç düzeltme/CSV import; veli-temsil süreci; retention/backup/restore; fiziksel Android/OEM testleri; staging ve imzalı Play yayını açık iş olarak kalır. SQLite production modunda açılmaz.

[Teslim ve kurulum](TESLIM.md) · [Güncel kapsam ve kabul ölçütleri](docs/roadmap.md) · [Ekranlar](docs/screens.md) · [Android](android/README.md) · [Akademik API](docs/mvp-v2.md)
