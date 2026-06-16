-- seed.sql — ContentFlow OS demo data (local/dev)
-- Runs as the migration/service role, so RLS is bypassed.
-- Profiles require auth.users rows (created on real signup), so created_by/author
-- fields are left null here. Business data is fully seeded for dashboard demos.

do $$
declare
  v_agency   uuid := '00000000-0000-0000-0000-0000000a9e0c';
  v_pkg_grow uuid := gen_random_uuid();
  v_pkg_pro  uuid := gen_random_uuid();
  v_cli_a    uuid := gen_random_uuid();
  v_cli_b    uuid := gen_random_uuid();
  v_sub_a    uuid := gen_random_uuid();
  v_sub_b    uuid := gen_random_uuid();
  v_subm_a   uuid := gen_random_uuid();
  v_proj_a   uuid := gen_random_uuid();
begin
  -- Tenant
  insert into public.agencies (id, name, slug, plan)
  values (v_agency, 'Internal Agency', 'internal', 'internal')
  on conflict (id) do nothing;

  -- Packages
  insert into public.packages (id, agency_id, name, monthly_price, deliverables) values
    (v_pkg_grow, v_agency, 'Growth', 750.00,
      '["newsletter","blog","social"]'::jsonb),
    (v_pkg_pro,  v_agency, 'Pro',    1500.00,
      '["newsletter","blog","social","sms","website_announcement"]'::jsonb);

  -- Clients
  insert into public.clients (id, agency_id, name, website_url, industry, status) values
    (v_cli_a, v_agency, 'Riverside Community Foundation', 'https://riverside.example', 'Nonprofit', 'active'),
    (v_cli_b, v_agency, 'Hearth & Oak Furniture',         'https://hearthoak.example',  'Retail',    'active');

  -- Brand profiles (note the banned phrases the Human Editor enforces)
  insert into public.brand_profiles
    (agency_id, client_id, voice_summary, tone_descriptors, audience, banned_phrases, reading_level) values
    (v_agency, v_cli_a,
      'Warm, plainspoken Executive Director voice. Community-first, concrete, never corporate.',
      array['warm','direct','grateful','local'],
      'Local donors, volunteers, and partner orgs in the Riverside area.',
      array['unlock the power of','game-changing','leverage','elevate','moreover','furthermore','in conclusion'],
      'grade 7'),
    (v_agency, v_cli_b,
      'Knowledgeable shop-owner voice. Craft-focused, honest about materials, a little wry.',
      array['crafted','honest','practical','wry'],
      'Homeowners 30-55 who value durable, well-made furniture.',
      array['revolutionary','cutting-edge','transform','fast-paced world','game-changing'],
      'grade 8');

  -- Contacts
  insert into public.client_contacts (agency_id, client_id, name, email, title, is_primary) values
    (v_agency, v_cli_a, 'Dana Whitfield', 'dana@riverside.example', 'Executive Director', true),
    (v_agency, v_cli_b, 'Marcus Lund',    'marcus@hearthoak.example','Owner',              true);

  -- Subscriptions (drive MRR)
  insert into public.subscriptions
    (id, agency_id, client_id, package_id, monthly_amount, status, current_period_start, current_period_end) values
    (v_sub_a, v_agency, v_cli_a, v_pkg_grow,  750.00, 'active', date_trunc('month', now())::date, (date_trunc('month', now()) + interval '1 month - 1 day')::date),
    (v_sub_b, v_agency, v_cli_b, v_pkg_pro,  1500.00, 'active', date_trunc('month', now())::date, (date_trunc('month', now()) + interval '1 month - 1 day')::date);

  -- Revenue events (paid → LTV/MRR demo)
  insert into public.revenue_events (agency_id, client_id, subscription_id, type, amount, payment_status) values
    (v_agency, v_cli_a, v_sub_a, 'charge',  750.00, 'paid'),
    (v_agency, v_cli_b, v_sub_b, 'charge', 1500.00, 'paid');

  -- Intake for client A
  insert into public.intake_submissions (id, agency_id, client_id, period, status)
  values (v_subm_a, v_agency, v_cli_a, date_trunc('month', now())::date, 'submitted');

  insert into public.intake_items (agency_id, submission_id, type, title, body) values
    (v_agency, v_subm_a, 'event', 'Annual Volunteer Dinner',
      'Volunteer appreciation dinner on the 18th at the community hall. Expecting 120 guests.'),
    (v_agency, v_subm_a, 'testimonial', 'Food pantry thank-you',
      'A family wrote to thank the pantry team for help during a hard month.'),
    (v_agency, v_subm_a, 'announcement', 'New after-school program',
      'Launching a free after-school tutoring program in September.');

  -- A content project entering the pipeline
  insert into public.content_projects (id, agency_id, client_id, submission_id, period, title, status)
  values (v_proj_a, v_agency, v_cli_a, v_subm_a, date_trunc('month', now())::date,
          'Riverside — Monthly Newsletter', 'intake_received');
end $$;
