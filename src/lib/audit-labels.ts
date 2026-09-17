// audit_log.action değerlerinin insan okunur karşılıkları. Hem işlem kayıtları
// ekranı hem dashboard'daki "son işlemler" kartı bunu kullanıyor — iki yerde
// ayrı ayrı tutulursa biri güncellenip diğeri unutuluyor.
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  "tenant.create": "Dershane oluşturuldu",
  "branch.create": "Şube oluşturuldu",
  "branch.update": "Şube güncellendi",
  "class_group.create": "Sınıf oluşturuldu",
  "class_group.update": "Sınıf güncellendi",
  "teacher.create": "Öğretmen eklendi",
  "teacher.update": "Öğretmen güncellendi",
  "guidance.create": "Rehberlik kullanıcısı eklendi",
  "guidance.update": "Rehberlik kullanıcısı güncellendi",
  "claim_code.renew": "Doğrulama kodu yenilendi",
  "roster.import": "Roster toplu içe aktarıldı",
  "mock_exam.create": "Deneme oluşturuldu",
  "exam_results.import": "Deneme sonuçları içe aktarıldı",
};
