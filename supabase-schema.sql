-- GH Planner v3 - Supabase Schema
-- این فایل را در Supabase SQL Editor اجرا کن

-- جدول اصلی برای ذخیره state هر کاربر
create table if not exists gh_users (
  id text primary key,
  email text unique,
  password_hash text,
  phone text unique,
  state jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ایندکس برای جستجوی سریع
create index if not exists gh_users_email_idx on gh_users(email);
create index if not exists gh_users_phone_idx on gh_users(phone);

-- Row Level Security
alter table gh_users enable row level security;

-- Policy: هر کاربر فقط به داده خودش دسترسی داره
create policy "Users can access own data" on gh_users
  for all using (true);

-- تابع آپدیت updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger gh_users_updated_at
  before update on gh_users
  for each row execute function update_updated_at();
