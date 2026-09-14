---
title: "Faz 0 — Akış & Veri Modeli Belgelendirmesi"
description: Kod yazılmadan önce tüm ekran akışlarının ve veri modelinin markdown olarak belgelenmesi.
status: in-progress
updated_at: 2026-09-15
---

# Faz 0 — Akış & Veri Modeli Belgelendirmesi

**Kod yok.** Bu fazın tek çıktısı markdown belgeler. Amaç: PDF §35'te belirtilen üç
konuyu kesinleştirmek, böylece Faz 1'e "ne inşa edeceğimizi bilerek" girmek.

## Kapsam

1. Android öğrenci uygulamasının tüm ekranları ve kullanıcı akışı
   → [flows/android-student.md](../flows/android-student.md)
2. Web panelinin tüm ekranları ve kullanıcı akışı (4 rol: dershane admin, rehberlik,
   öğretmen, system admin)
   → [flows/web-dershane-admin.md](../flows/web-dershane-admin.md),
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

- [ ] `flows/android-student.md` — her ekran, o ekrandaki alanlar/aksiyonlar ve bir
      sonraki ekrana geçiş koşulları yazılı
- [ ] `flows/web-dershane-admin.md`, `web-rehberlik.md`, `web-ogretmen.md` — aynı
      detay seviyesinde
- [ ] `flows/student-registration-flow.md` — PDF §7'deki 9 adımlık akış ekran/aksiyon
      seviyesine indirgenmiş
- [ ] `data-model.md` — PDF §8'deki her veri kategorisi için somut alan listesi
      (tablo adı + kolonlar + ilişkiler, henüz migration değil)
- [ ] Bu süreçte ortaya çıkan her belirsizlik `open-questions.md`'ye eklenmiş
      (sessizce varsayım yapılmamış)
- [ ] `status: done` olarak işaretlenmiş

Bittiğinde `docs/index.md`'deki "Aktif faz" satırı Faz 1'e güncellenir.
