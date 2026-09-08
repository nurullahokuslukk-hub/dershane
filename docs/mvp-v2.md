# Akademik API ve sınırlar

Mevcut `/api/v1` cookie/CSRF veya bearer katmanını kullanır. Öğrenci kendi kayıtlarını, personel yalnız yetkili kapsamını görür.

| Yöntem | Yol | İşlem |
|---|---|---|
| GET | /students/:id/academics | Deneme/ödev/etüt |
| POST | /students/:id/exams | Atanmış öğretmen/rehberlik sonuç girişi |
| POST | /students/:id/tasks | Ödev atama |
| POST | /students/:id/tasks/:taskId/transition | Teslim veya personel incelemesi |
| POST | /students/:id/sessions | Etüt planlama |
| POST | /students/:id/sessions/:sessionId/attendance | Personel katılımı |

Create işlemlerinde UUID `clientId`; aynı actor/kurum/clientId için aynı içerik tekrar kabul edilir, farklı içerik 409'dur. Ödev/katılım değişikliği `version` gerektirir; eski sürüm 409 döner. Bağlantı kopup cevabı kaybolan transition için otomatik başarılı replay yoktur; yenileyip güncel durum kontrol edilir.

Deneme: `title`, `type` (TYT/AYT), `day` ve tam dört `subjects`. Her ders `name`, `correct`, `wrong`, `blank`, `divisor` içerir; C+W+B kapasiteye eşit olmalıdır. İsteğe bağlı `topics` girdileri `name`, `wrong`, `blank` alır; konu toplamı ders toplamını aşamaz. Web formu ders başına bir konu notu, API en fazla 30 konu kabul eder. Net sunucuda hesaplanır ve negatif olabilir. TYT, AYT Sayısal ve AYT Eşit Ağırlık desteklenir.

Grafikler sınav türü + ders/soru dağılımı + ceza böleni aynı olan sonuçları karşılaştırır. Yerleştirme puanı, başarı sırası veya telefon verisinden başarı tahmini üretilmez. Girilmeyen konu dağılımı tamamlanmış gibi gösterilmez.

Yerel adapter son 500 denemeyi döndürür; aynı gün SQLite ekleme sırası kullanılır. Ödev/etüt de en fazla 500 kayıtla sınırlı; tam sayfalama henüz yok. Legacy flat exam/homework/attendance kayıtları otomatik olarak normalize tablolara taşınmaz; yeni personel UI'si normalize modülleri kullanır. Eski çalışma/soru/günlük kayıt yolu korunur.

Supabase migration bir read-only güvenlik temelidir. Çalışan servis halen SQLite geliştirme adaptörüdür. Üretim RPC/repository'si bu domain sözleşmelerinin pozitif/negatif/idempotency testlerini geçmeden devreye alınmaz.
