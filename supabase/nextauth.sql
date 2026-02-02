-- NextAuth schema for Supabase (Postgres)
-- Run this in Supabase SQL Editor.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  email_verified timestamptz,
  image text,
  created_at timestamptz default now()
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  provider text not null,
  provider_account_id text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  created_at timestamptz default now(),
  unique (provider, provider_account_id)
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  session_token text not null unique,
  user_id uuid not null references users(id) on delete cascade,
  expires timestamptz not null,
  created_at timestamptz default now()
);

create table if not exists verification_tokens (
  identifier text not null,
  token text not null unique,
  expires timestamptz not null,
  unique (identifier, token)
);

create index if not exists accounts_user_id_idx on accounts(user_id);
create index if not exists sessions_user_id_idx on sessions(user_id);
