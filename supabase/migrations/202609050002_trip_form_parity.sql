-- Preserve the organizer's selected type across drafts and publication.
alter table public.trip_drafts add column event_kind text not null default 'outdoor'
 check(event_kind in ('outdoor','indoor','social','service','admin','travel'));
alter table public.trips add column event_kind text not null default 'outdoor'
 check(event_kind in ('outdoor','indoor','social','service','admin','travel'));
