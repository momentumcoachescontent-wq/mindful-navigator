-- Check if the bucket exists and is public
SELECT * FROM storage.buckets WHERE name = 'audio-library';

-- Check RLS policies for the bucket
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
