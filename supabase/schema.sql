-- Run ONCE in your Supabase project's SQL Editor. No public read/write policies.
create table if not exists public.leads (
 id text primary key check (id ~ '^[a-f0-9]{64}$'),
 type text not null check (type in ('rider','captain')),
 name text not null check (length(name) between 2 and 80),
 email text not null check (length(email) <= 254),
 area text not null check (length(area) between 1 and 100),
 vehicle text check (vehicle in ('Car','Scooty','Not yet')),
 licence text check (licence in ('Yes','Not yet')),
 consent boolean not null check (consent),
 adult boolean not null check (adult),
 "consentVersion" text not null,
 created timestamptz not null default now()
);
alter table public.leads enable row level security;
revoke all on table public.leads from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, delete on public.leads to service_role;
