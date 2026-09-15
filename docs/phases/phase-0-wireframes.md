---
title: "Faz 0 — Akış & Veri Modeli Belgelendirmesi"
description: Kod yazılmadan önce tüm ekran akışlarının ve veri modelinin markdown olarak belgelenmesi.
status: done
updated_at: 2026-09-15
---

# Faz 0 — Akış & Veri Modeli Belgelendirmesi

**Kod yok.** Bu fazın tek çıktısı markdown belgeler. Amaç: PDF §35'te belirtilen üç
konuyu kesinleştirmek, böylece Faz 1'e "ne inşa edeceğimizi bilerek" girmek.

## Kapsam

1. Android öğrenci uygulamasının tüm ekranları ve kullanıcı akışı
   → [flows/android-student.md](../flows/android-student.md)
2. Web panelinin tüm ekranları ve kullanıcı akışı (dershane admin, rehberlik,
   öğretmen — ortak ekranlar ayrı dosyada, system admin MVP'de detaylandırılmadı,
   bkz. [flows/web-common.md](../flows/web-common.md))
   → [flows/web-common.md](../flows/web-common.md),
     [flows/web-dershane-admin.md](../flows/web-dershane-admin.md),
     [flows/web-rehberlik.md](../flows/web-rehberlik.md),
     [flows/web-ogretmen.md](../flows/web-ogretmen.md)
3. Öğrenci kayıt akışı (davet → onay) — ayrı belge çünkü admin + öğrenci tarafını
   birlikte kapsıyor
   → [flows/student-registration-flow.md](../flows/student-registration-flow.md)
4. Database'de tutulacak bütün veri alanları
   → [data-model.md](../data-model.md)

## Kapsam dışı

- Gerçek kod, proje iskeleti, paket kurulumları
- Görsel tasarım/Figma dosyaları (sadece metinsel ekran/alan/aksiyon listesi)
- Teknik mimari kararları (hosting, framework seçimi) — bunlar Faz 1'e ait

## Bitiş kriterleri

- [x] `flows/android-student.md` — her ekran, o ekrandaki alanlar/aksiyonlar ve bir
      sonraki ekrana geçiş koşulları yazılı *(içerik tam, kullanıcı onayı bekliyor)*
- [x] `flows/web-common.md`, `web-dershane-admin.md`, `web-rehberlik.md`,
      `web-ogretmen.md` — aynı detay seviyesinde *(içerik tam, kullanıcı onayı
      bekliyor)*
- [x] `flows/student-registration-flow.md` — PDF §7'deki 9 adımlık akış ekran/aksiyon
      seviyesine indirgenmiş *(içerik tam, kullanıcı onayı bekliyor)*
- [x] `data-model.md` — PDF §8'deki her veri kategorisi için somut alan listesi
      (tablo adı + kolonlar + ilişkiler, henüz migration değil) *(içerik tam,
      kullanıcı onayı bekliyor)*
- [x] Bu süreçte ortaya çıkan belirsizlikler `open-questions.md`'ye eklendi / auth
      sorusu [decisions/0001-auth-yontemi.md](../decisions/0001-auth-yontemi.md)
      ile çözüldü
- [x] Kullanıcı tüm `flows/*.md` ve `data-model.md`'yi gözden geçirip onayladı
      (2026-09-15)
- [x] `status: done` olarak işaretlenmiş

Bittiğinde `docs/index.md`'deki "Aktif faz" satırı Faz 1'e güncellenir.

## Ertelenen karar (Faz 0 kapsamı dışı, not olarak tutuluyor)

Kullanıcı ile "her yaptığımı denetleyen ayrı bir kontrol/review sohbeti" fikri
konuşuldu; checkpoint bazlı bağımsız review (her faz teslimatı/commit öncesi taze
bağlamla `CLAUDE.md` kurallarına karşı kontrol) üzerinde mutabık kalındı ama
mekanizma henüz kurulmadı — "daha sonra" ele alınacak. Kurulduğunda bu bilgi
[CLAUDE.md](../../CLAUDE.md)'ye bir protokol maddesi olarak eklenecek.
