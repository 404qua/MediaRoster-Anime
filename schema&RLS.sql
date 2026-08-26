-- ===============
-- Schema Setup & Reset
-- ===============
begin;

-- Remove the previous schema so this file can be run repeatedly from a clean state.
drop table if exists public.watchlist cascade;
drop table if exists public.users cascade;
drop function if exists public.prevent_joined_at_change() cascade;
drop function if exists public.prevent_watchlist_identity_change() cascade;

create table public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    username varchar(100) not null unique,
    bio varchar(500),
    watchlist_public boolean not null default false,
    joined_at timestamptz not null default now(),

    constraint username_format
        check (username ~ '^[A-Za-z0-9_]{1,100}$')
);

create index idx_users_username on public.users(username);

create table public.watchlist (
    user_id uuid not null references public.users(id) on delete cascade,
    type text not null,
    id bigint not null,
    status text not null default 'none',
    added_at timestamptz not null default now(),

    primary key (user_id, type, id),

    constraint watchlist_type_valid
        check (type in (
            'anime', 'manga', 'tv_show', 'web_series', 'book',
            'music', 'game', 'movie', 'podcast', 'audiobook'
        )),
    constraint watchlist_id_valid
        check (id between 1 and 9999999999),
    constraint watchlist_status_valid
        check (status in ('none', 'watching', 'completed', 'plan_to_watch', 'on_hold', 'dropped'))
);

create index idx_watchlist_user_id on public.watchlist(user_id);

alter table public.users enable row level security;
alter table public.watchlist enable row level security;

-- Profiles are readable by everyone, including unauthenticated visitors.
create policy "Anyone can read profiles"
on public.users for select
to anon, authenticated
using (true);

create policy "Users can create own profile"
on public.users for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update own profile"
on public.users for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can delete own profile"
on public.users for delete
to authenticated
using (id = auth.uid());

-- Watchlists are readable by everyone only when the owner has opted in, or if the viewer is the owner.
create policy "Anyone can read public watchlists"
on public.watchlist for select
to anon, authenticated
using (
    user_id = auth.uid()
    or exists (
        select 1
        from public.users
        where users.id = watchlist.user_id
          and users.watchlist_public = true
    )
);

create policy "Users can create own watchlist entries"
on public.watchlist for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own watchlist entries"
on public.watchlist for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own watchlist entries"
on public.watchlist for delete
to authenticated
using (user_id = auth.uid());

create or replace function public.prevent_joined_at_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.joined_at is distinct from old.joined_at then
        raise exception 'joined_at cannot be changed';
    end if;
    return new;
end;
$$;

create trigger prevent_joined_at_change
before update on public.users
for each row execute function public.prevent_joined_at_change();

create or replace function public.prevent_watchlist_identity_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.user_id is distinct from old.user_id
       or new.type is distinct from old.type
       or new.id is distinct from old.id
       or new.added_at is distinct from old.added_at then
        raise exception 'watchlist identity fields cannot be changed';
    end if;
    return new;
end;
$$;

create trigger prevent_watchlist_identity_change
before update on public.watchlist
for each row execute function public.prevent_watchlist_identity_change();

grant usage on schema public to anon, authenticated;
grant select on table public.users, public.watchlist to anon;
grant select, insert, update, delete on table public.users, public.watchlist to authenticated;

alter default privileges in schema public
grant select on tables to anon;
alter default privileges in schema public
grant select, insert, update, delete on tables to authenticated;

commit;