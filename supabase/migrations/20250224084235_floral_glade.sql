/*
  # Add Storage for Manuals

  1. Storage
    - Create storage bucket for service manuals
    - Add storage policies for authenticated users
*/

-- Enable storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-manuals', 'service-manuals', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Authenticated users can view manuals"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'service-manuals');

CREATE POLICY "Authenticated users can upload manuals"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-manuals');

CREATE POLICY "Authenticated users can download manuals"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'service-manuals');

CREATE POLICY "Admins can delete manuals"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-manuals'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);