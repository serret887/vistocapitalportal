-- Visto Capital Partner Portal Database Schema

-- Create user_profiles table for basic user information
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create partner_profiles table for onboarding information
create table partner_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  partner_type text check (partner_type in ('wholesaler', 'investor', 'real_estate_agent', 'marketing_partner')),
  phone_number text,
  monthly_deal_volume integer,
  transaction_volume numeric,
  transaction_types text[], -- e.g., ['Fix and Flip', 'Rental', 'Multifamily']
  license_number text, -- only required for real estate agents
  license_state text, -- only required for real estate agents
  onboarded boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add RLS (Row Level Security) policies
alter table user_profiles enable row level security;
alter table partner_profiles enable row level security;

-- User profiles policies
create policy "Users can view own profile" on user_profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on user_profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on user_profiles
  for insert with check (auth.uid() = id);

-- Partner profiles policies
create policy "Users can view their own partner profile" on partner_profiles
  for select using (auth.uid() = user_id);

create policy "Users can insert their own partner profile" on partner_profiles
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own partner profile" on partner_profiles
  for update using (auth.uid() = user_id);

-- Function to automatically create user_profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create user_profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
