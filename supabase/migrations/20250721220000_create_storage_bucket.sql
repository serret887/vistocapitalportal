-- Create the loan-documents storage bucket
insert into storage.buckets (id, name, public)
values ('loan-documents', 'loan-documents', true);

-- Allow authenticated users to upload files
create policy "Partners can upload files" on storage.objects
for insert with check (
  bucket_id = 'loan-documents' 
  and auth.role() = 'authenticated'
);

-- Allow partners to view their own files
create policy "Partners can view own files" on storage.objects
for select using (
  bucket_id = 'loan-documents' 
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] in (
    select p.id::text 
    from partner_profiles p 
    where p.user_id = auth.uid()
  )
);

-- Allow partners to delete their own files
create policy "Partners can delete own files" on storage.objects
for delete using (
  bucket_id = 'loan-documents' 
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] in (
    select p.id::text 
    from partner_profiles p 
    where p.user_id = auth.uid()
  )
);

-- Allow partners to update their own files (if needed)
create policy "Partners can update own files" on storage.objects
for update using (
  bucket_id = 'loan-documents' 
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] in (
    select p.id::text 
    from partner_profiles p 
    where p.user_id = auth.uid()
  )
); 