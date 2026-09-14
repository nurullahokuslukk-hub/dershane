---
title: Akış belgesi formatı
description: Her flows/*.md dosyasının uyacağı ortak yapı — tutarlılık için.
status: active
updated_at: 2026-09-15
---

# Akış Belgesi Formatı

Her rol/akış dosyası şu yapıda olur:

```markdown
## Ekran: <Ekran adı>

**Amaç:** Bu ekran ne için var.
**Erişim:** Hangi rol(ler) girebilir.

**Gösterilen veri:**
- alan1
- alan2

**Aksiyonlar:**
- Aksiyon adı → sonucu / gittiği ekran

**Hata/uç durumlar:**
- Örn: liste boşsa ne gösterilir
```

Ekranlar, kullanıcının gerçekte izleyeceği sıraya göre yazılır (bir akış diyagramı
gibi okunmalı). Her "Aksiyonlar" satırındaki hedef ekran, dosya içinde bir üst
başlık olarak mevcut olmalı (veya başka bir flow dosyasına link).

Bu format `data-model.md` ile birebir örtüşmeli: bir ekranda gösterilen her alan,
`data-model.md`'de bir karşılığa sahip olmalı (yoksa data-model'e eklenir).
