---
title: "Akış: Web — Ortak Ekranlar"
description: Tüm web rolleri (dershane admin, rehberlik, öğretmen) için ortak giriş ve layout ekranları.
status: done
updated_at: 2026-09-15
---

# Akış: Web — Ortak Ekranlar

Format: [flows/_format.md](_format.md). Rol bazlı dosyalar (`web-dershane-admin.md`,
`web-rehberlik.md`, `web-ogretmen.md`) bu ekranları tekrar tanımlamaz, buraya link
verir — aynı ekranın üç yerde farklı yazılıp zamanla birbirinden sapmasını önlemek
için.

## Ekran: Giriş

**Amaç:** Tüm web rolleri için ortak giriş. Yöntem:
[decisions/0001-auth-yontemi.md](../decisions/0001-auth-yontemi.md).
**Erişim:** Herkes.

**Gösterilen veri / girilecek alanlar:**
- Kimlik alanı (e-posta veya telefon)
- Şifre

**Aksiyonlar:**
- Giriş yap → `role` alanına göre yönlendirme:
  - `dershane_admin` → Dershane Admin **Dashboard**
  - `rehberlik` → Rehberlik **Öğrenci Listesi**
  - `ogretmen` → Öğretmen **Sınıflarım**
  - `system_admin` → Sistem Paneli *(PDF §2'de "gerekli durumlarda" olarak
    geçiyor, MVP'de detaylı belgelenmedi — Faz 1 kapsamında gerekirse ayrı
    dosya açılır)*
- "Şifremi unuttum" → **Şifremi Unuttum**

**Hata/uç durumlar:**
- Hatalı giriş → rate limiting (bkz. [CLAUDE.md](../../CLAUDE.md))
- Onay bekleyen/reddedilmiş kullanıcı (öğretmen/rehberlik daveti admin onayı
  gerektiriyorsa) → durum mesajı

## Ekran: Şifremi Unuttum

**Amaç:** E-posta ile şifre sıfırlama linki gönderme.
**Erişim:** Herkes.

**Gösterilen veri:** E-posta alanı.

**Aksiyonlar:**
- Gönder → onay mesajı, e-postadaki link ile **Yeni Şifre Belirle**'ye gider

**Hata/uç durumlar:**
- Telefon numarasıyla kayıtlı, e-postası olmayan kullanıcı → burada çözülemez,
  dershane admin'e yönlendirme mesajı (bkz. [decisions/0001-auth-yontemi.md](../decisions/0001-auth-yontemi.md))

## Ortak Layout

Tüm rol bazlı ekranlar bu iskelet içinde render edilir:

- **Topbar:** dershane adı (tenant branding), giriş yapan kullanıcının adı, çıkış
  butonu
- **Sidebar:** role göre değişen menü (her rol dosyasında o role özel menü
  öğeleri listelenir)
- **Tenant izolasyonu (UI notu):** sidebar/menüde hangi öğelerin görüneceği rol
  bazlı belirlenir ama bu **sadece kullanılabilirlik** içindir — gerçek erişim
  kontrolü backend'de yapılır (bkz. [CLAUDE.md](../../CLAUDE.md) — "frontend'de
  bir butonu gizlemek güvenlik değildir")

## Çıkış

**Aksiyon:** Çıkış yap → token/session temizlenir → **Giriş**
