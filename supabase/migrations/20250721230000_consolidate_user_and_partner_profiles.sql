-- Consolidate user_profiles and partner_profiles into a single partner_profiles table
-- This eliminates redundancy since every user in the system is a partner

-- First, add the user profile fields to partner_profiles
ALTER TABLE partner_profiles 
ADD COLUMN first_name text,
ADD COLUMN last_name text,
ADD COLUMN email text;

-- Update partner_profiles with data from user_profiles
UPDATE partner_profiles 
SET 
  first_name = up.first_name,
  last_name = up.last_name,
  email = up.email
FROM user_profiles up
WHERE partner_profiles.user_id = up.id;

-- Make the new fields NOT NULL after populating them
ALTER TABLE partner_profiles 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL,
ALTER COLUMN email SET NOT NULL;

-- Drop the user_profiles table since it's now redundant
DROP TABLE user_profiles;

-- Update the trigger function to create partner_profiles instead of user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.partner_profiles (user_id, first_name, last_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger will continue to work with the updated function
-- No need to recreate the trigger since it references the function by name

-- Update RLS policies to work with the consolidated table
-- Drop old policies (use IF EXISTS to avoid errors)
DROP POLICY IF EXISTS "Users can view own profile" ON partner_profiles;
DROP POLICY IF EXISTS "Users can insert their own partner profile" ON partner_profiles;
DROP POLICY IF EXISTS "Users can update their own partner profile" ON partner_profiles;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own partner profile" ON partner_profiles;
DROP POLICY IF EXISTS "Users can insert their own partner profile" ON partner_profiles;
DROP POLICY IF EXISTS "Users can update their own partner profile" ON partner_profiles;

-- Create new consolidated policies
CREATE POLICY "Users can view their own partner profile" ON partner_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own partner profile" ON partner_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own partner profile" ON partner_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Add a unique constraint on user_id to ensure one profile per user
ALTER TABLE partner_profiles 
ADD CONSTRAINT partner_profiles_user_id_unique UNIQUE (user_id); 