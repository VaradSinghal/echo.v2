-- Add user_type column to profiles table
-- Differentiates between 'developer' (GitHub OAuth) and 'business' (Google OAuth)
alter table public.profiles
  add column if not exists user_type text default 'developer' not null;

-- Add a check constraint
alter table public.profiles
  add constraint profiles_user_type_check
  check (user_type in ('developer', 'business'));
