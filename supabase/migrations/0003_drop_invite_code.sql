-- 0003_drop_invite_code.sql
-- invite_code, account_claim_code ile değiştirildi (bkz.
-- decisions/0003-toplu-kayit-ve-claim-akisi.md). Kodda hiçbir referansı yok
-- (grep ile doğrulandı) — güvenle kaldırılıyor.

drop table if exists invite_code;
