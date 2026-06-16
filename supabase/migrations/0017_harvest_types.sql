-- 0017 — Content Harvesting: extend intake_type for Quick Action Cards
-- The Harvesting Dashboard captures into the existing intake_items store. Three
-- card types had no matching enum value — added here so captures stay precisely
-- typed (which feeds research/strategy quality downstream).
--
-- ADD VALUE only (not used in this migration) → safe inside the migration txn.

alter type intake_type add value if not exists 'project_complete';
alter type intake_type add value if not exists 'team_update';
alter type intake_type add value if not exists 'donor_story';
