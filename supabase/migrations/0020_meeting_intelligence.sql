-- 0020 — Voice Note & Meeting Intelligence
-- Analyzes TEXT transcripts (meeting transcripts, Zoom exports, call summaries,
-- voice-note transcripts) with Claude → Meeting Intelligence Reports extracting
-- stories / promotions / customer wins / content opportunities.
--
-- Note: Claude has no audio-transcription API and the platform is Claude-only, so
-- this layer consumes transcript TEXT. Audio files themselves live in intake
-- storage (Phase 6); their transcript is pasted/uploaded here.

create type meeting_source as enum ('transcript', 'zoom_export', 'call_summary', 'voice_note');

create table public.meeting_intelligence (
  id           uuid primary key default gen_random_uuid(),
  agency_id    uuid not null references public.agencies(id) on delete cascade,
  client_id    uuid not null references public.clients(id) on delete cascade,
  title        text not null,
  source_type  meeting_source not null default 'transcript',
  transcript   text not null default '',
  payload      jsonb not null default '{}'::jsonb,   -- full structured report
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index meeting_intelligence_client_idx on public.meeting_intelligence(client_id, created_at desc);

alter table public.meeting_intelligence enable row level security;
create policy meeting_intelligence_staff_all on public.meeting_intelligence
  for all using (agency_id = public.current_agency_id() and public.is_agency_staff())
  with check (agency_id = public.current_agency_id() and public.is_agency_staff());
