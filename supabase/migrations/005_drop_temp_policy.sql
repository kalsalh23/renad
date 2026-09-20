-- حذف سياسة الرفع المؤقتة بعد اكتمال البيانات الأولية (أمان)
drop policy if exists "renad seed temp" on storage.objects;
