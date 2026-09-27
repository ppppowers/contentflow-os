-- 0032 — Keep the Claude-written image prompt on each piece, so it can be copied
-- into ChatGPT when OpenAI image generation isn't set up or is out of credits.
alter table public.content_pieces
  add column if not exists image_prompt text;
