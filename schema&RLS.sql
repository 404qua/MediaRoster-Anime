-- ===============
-- Table creation
-- ===============
create table public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    username varchar(100) not null,
    bio varchar(500),
    joined_at timestamptz not null default now(),

    constraint username_format
        check (username ~ '^[A-Za-z0-9_]{1,100}$')
);

create table public.watchlist (
    user_id uuid not null references public.users(id) on delete cascade,
    type text not null,
    id bigint not null,
    status text not null default 'none',
    added_at timestamptz not null default now(),

    primary key (user_id, type, id),

    constraint watchlist_type_valid
        check (
            type in (
                'anime',
                'manga',
                'tv_show',
                'web_series',
                'book',
                'music',
                'game',
                'movie',
                'podcast',
                'audiobook'
            )
        ),

    constraint watchlist_id_valid
        check (id between 1 and 9999999999),

    constraint watchlist_status_valid
        check (
            status in (
                'none',
                'watching',
                'completed'
            )
        )
);

-- ===
-- RLS
-- ===

-- ENABLE RLS

alter table public.users enable row level security;
alter table public.watchlist enable row level security;

-- USERS

create policy "Users can read own profile"
on public.users
for select
to authenticated
using (id = auth.uid());


create policy "Users can create own profile"
on public.users
for insert
to authenticated
with check (id = auth.uid());


create policy "Users can update own profile"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create or replace function public.prevent_joined_at_change()
returns trigger
language plpgsql
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
for each row
execute function public.prevent_joined_at_change();

-- WATCHLIST
create or replace function public.prevent_watchlist_identity_change()
returns trigger
language plpgsql
as $$
begin
    if new.user_id is distinct from old.user_id then
        raise exception 'user_id cannot be changed';
    end if;

    if new.mal_id is distinct from old.mal_id then
        raise exception 'mal_id cannot be changed';
    end if;

    if new.added_at is distinct from old.added_at then
        raise exception 'added_at cannot be changed';
    end if;

    return new;
end;
$$;


create trigger prevent_watchlist_identity_change
before update on public.watchlist
for each row
execute function public.prevent_watchlist_identity_change();


-- ============
-- permisions
-- ============
grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.users to authenticated;
grant select, insert, update, delete on table public.watchlist to authenticated;

alter default privileges in schema public 
grant select, insert, update, delete on tables to authenticated;