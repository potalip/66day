-- OWNER: studio agent. Public share links for finished renders (portfolio / social).
ALTER TABLE studio_renders ADD COLUMN share_slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS studio_renders_share ON studio_renders(share_slug) WHERE share_slug IS NOT NULL;
