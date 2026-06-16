-- 0001 — Extensions + enum types
-- ContentFlow OS — Phase 2

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";     -- case-insensitive email

-- Tenancy / identity
create type user_role as enum ('owner', 'admin', 'writer', 'client');

-- Clients
create type client_status as enum ('active', 'paused', 'churned');

-- Intake
create type intake_type as enum (
  'business_update', 'promotion', 'event', 'testimonial',
  'new_service', 'volunteer_story', 'customer_story', 'announcement'
);

-- Content pipeline state machine
create type project_status as enum (
  'intake_received', 'research_complete', 'draft_generated', 'internal_review',
  'client_review', 'revision_requested', 'approved', 'scheduled', 'sent', 'archived'
);

-- Agents
create type agent_name as enum (
  'account_manager', 'research', 'strategist', 'newsletter',
  'seo_blog', 'social', 'human_editor', 'compliance', 'delivery'
);
create type run_status as enum ('queued', 'running', 'succeeded', 'failed');

-- Content channels
create type content_channel as enum (
  'newsletter', 'blog', 'facebook', 'linkedin',
  'instagram', 'sms', 'website_announcement'
);

-- Approvals
create type approval_stage as enum ('internal', 'client');
create type approval_decision as enum ('pending', 'approved', 'changes_requested');

-- Revenue
create type subscription_status as enum ('active', 'past_due', 'paused', 'cancelled');
create type revenue_event_type as enum ('charge', 'refund', 'adjustment');
create type payment_status as enum ('paid', 'pending', 'failed');
