# Supabase Setup Instructions

## 1. Database Setup

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `backend/database/schema.sql`
4. Click **Run** to execute the SQL script

This will create all necessary tables:
- `storytellers`
- `stories`
- `media`
- `translations`
- `illustrations`
- `tags`
- `story_tags`

## 2. Storage Bucket Setup

1. In your Supabase dashboard, go to **Storage**
2. Click **New bucket**
3. Create a bucket named `media`
4. Set it to **Public bucket** (so files can be accessed via public URLs)
5. Click **Create bucket**

## 3. Storage Policies (Optional - for security)

If you want to restrict access, you can set up Row Level Security (RLS) policies:

```sql
-- Allow public read access to media files
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT
USING (bucket_id = 'media');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
```

For the MVP, public access is fine as mentioned in the requirements.

## 4. Verify Setup

After setup, you can verify by:

1. **Check tables:** Go to **Table Editor** and verify all tables exist
2. **Check storage:** Go to **Storage** and verify the `media` bucket exists
3. **Test connection:** Your backend should connect automatically using the credentials in `.env`

## 5. Environment Variables

Make sure your `.env` files have:
- `SUPABASE_URL`: Your project URL
- `SUPABASE_ANON_KEY`: Your anon/public key

These are already configured in the provided `.env` files.
