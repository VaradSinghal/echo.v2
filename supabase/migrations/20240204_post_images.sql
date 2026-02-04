-- Add image_url to posts table
alter table public.posts add column if not exists image_url text;

-- Ensure storage bucket policies (assuming the user created the bucket manually)
-- but we might need public access for reading if it's not handled.
-- We can add policy for authenticated users to upload to post_images bucket.

-- Policy for viewing images (public)
-- insert into storage.buckets (id, name, public) values ('post_images', 'post_images', true) on conflict do avoid;

-- create policy "Images are publicly accessible" on storage.objects
--   for select using (bucket_id = 'post_images');

-- create policy "Authenticated users can upload images" on storage.objects
--   for insert with check (
--     bucket_id = 'post_images' AND
--     auth.role() = 'authenticated'
--   );
