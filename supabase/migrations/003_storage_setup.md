# Migration 003 — Supabase Storage Setup

Supabase Storage buckets **không thể tạo bằng SQL**. Làm thủ công theo hướng dẫn sau.

---

## 1. Tạo 2 buckets trong Supabase Dashboard

Vào: **Supabase Dashboard → Storage → New bucket**

### Bucket 1: `ban-ve-images`
- Name: `ban-ve-images`
- ✅ Public bucket (ảnh bìa cần truy cập công khai)
- File size limit: 5 MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

### Bucket 2: `ban-ve-files`
- Name: `ban-ve-files`  
- ✅ Public bucket (PDF và CAD — URL thẳng, không cần signed URL cho Phase 1)
- File size limit: 50 MB
- Allowed MIME types: `application/pdf, application/octet-stream`

---

## 2. Tạo Storage Policies

Sau khi tạo bucket, vào từng bucket → **Policies** → tạo các policy sau:

### Bucket `ban-ve-images`

```sql
-- Ai cũng đọc được (public)
CREATE POLICY "Public read ban-ve-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'ban-ve-images');

-- Chỉ CMS user mới upload được
CREATE POLICY "CMS upload ban-ve-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ban-ve-images'
  AND auth.uid() IS NOT NULL
);

-- CMS user có thể xóa file của mình (hoặc quan_ly xóa tất)
CREATE POLICY "CMS delete ban-ve-images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ban-ve-images'
  AND auth.uid() IS NOT NULL
);
```

### Bucket `ban-ve-files`

```sql
-- Ai cũng đọc được (public PDF)
CREATE POLICY "Public read ban-ve-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'ban-ve-files');

-- Chỉ CMS user mới upload được
CREATE POLICY "CMS upload ban-ve-files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ban-ve-files'
  AND auth.uid() IS NOT NULL
);

-- CMS user có thể xóa
CREATE POLICY "CMS delete ban-ve-files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ban-ve-files'
  AND auth.uid() IS NOT NULL
);
```

> **Lưu ý Phase 1**: File PDF được serve qua public URL. Nếu cần kiểm soát truy cập  
> (chỉ cho người đã điền form tải được), upgrade lên **Signed URLs** ở Sprint sau:  
> - Đổi `ban-ve-files` thành **private bucket**  
> - Cập nhật `src/app/api/leads/route.ts` để gọi `createSignedUrl(path, 72*3600)`

---

## 3. Kiểm tra

Sau khi setup, thử upload 1 ảnh bìa qua form `/cms/ban-ve/them-moi` và kiểm tra:
- Ảnh xuất hiện trong `ban-ve-images` bucket
- Public URL hoạt động (copy URL từ Storage → mở trực tiếp)
