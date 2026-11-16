CREATE TABLE public.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  client_id text NOT NULL,
  name text NOT NULL DEFAULT 'Ảnh kỷ niệm',
  size bigint NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT 'image/jpeg',
  storage_path text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.photos TO authenticated;
GRANT ALL ON public.photos TO service_role;

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own photos" ON public.photos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert own photos" ON public.photos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own photos" ON public.photos
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete own photos" ON public.photos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX photos_user_created_idx ON public.photos (user_id, created_at DESC);

CREATE POLICY "Owners read own photo files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'love-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners upload own photo files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'love-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners update own photo files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'love-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete own photo files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'love-photos' AND (storage.foldername(name))[1] = auth.uid()::text);