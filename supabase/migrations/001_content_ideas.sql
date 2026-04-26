-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- Enums
CREATE TYPE content_source_type AS ENUM ('manual', 'rss');
CREATE TYPE content_status_type AS ENUM ('idea', 'accepted', 'rejected');
CREATE TYPE content_format_type AS ENUM ('text', 'markdown', 'html');

-- RSS Feeds (per account)
CREATE TABLE rss_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  last_fetched_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, url)
);

-- Content Ideas
CREATE TABLE content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  content_format content_format_type DEFAULT 'text',
  status content_status_type DEFAULT 'idea',
  source content_source_type DEFAULT 'manual',
  rss_feed_id UUID REFERENCES rss_feeds(id) ON DELETE SET NULL,
  source_url TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  embedding VECTOR(384),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast filtered queries
CREATE INDEX content_ideas_account_status_idx ON content_ideas(account_id, status);
CREATE INDEX content_ideas_created_at_idx ON content_ideas(created_at DESC);
CREATE INDEX content_ideas_embedding_idx ON content_ideas
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX content_ideas_fts_idx ON content_ideas
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || content));
CREATE INDEX rss_feeds_account_idx ON rss_feeds(account_id);

-- Row Level Security
ALTER TABLE rss_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_feeds" ON rss_feeds FOR ALL USING (auth.uid() = account_id);
CREATE POLICY "service_role_feeds" ON rss_feeds FOR ALL TO service_role USING (true);
CREATE POLICY "users_own_ideas" ON content_ideas FOR ALL USING (auth.uid() = account_id);
CREATE POLICY "service_role_ideas" ON content_ideas FOR ALL TO service_role USING (true);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER content_ideas_updated_at
  BEFORE UPDATE ON content_ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER rss_feeds_updated_at
  BEFORE UPDATE ON rss_feeds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Hybrid search RPC: combines full-text search with pgvector similarity
-- Falls back to FTS only when no embedding is provided
CREATE OR REPLACE FUNCTION search_content_ideas(
  p_account_id UUID,
  p_query TEXT DEFAULT '',
  p_embedding VECTOR(384) DEFAULT NULL,
  p_status content_status_type DEFAULT NULL,
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS SETOF content_ideas
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT *
  FROM content_ideas
  WHERE account_id = p_account_id
    AND (p_status IS NULL OR status = p_status)
    AND (p_from IS NULL OR created_at >= p_from)
    AND (p_to IS NULL OR created_at <= p_to)
    AND (
      p_query = ''
      OR to_tsvector('english', coalesce(title, '') || ' ' || content)
           @@ plainto_tsquery('english', p_query)
      OR (p_embedding IS NOT NULL AND embedding IS NOT NULL
          AND (embedding <=> p_embedding) < 0.5)
    )
  ORDER BY
    CASE WHEN p_embedding IS NOT NULL AND embedding IS NOT NULL
      THEN (embedding <=> p_embedding)
      ELSE 1
    END ASC,
    created_at DESC
  LIMIT p_limit;
$$;

-- pg_cron daily RSS fetch schedule
-- Run this manually after deploying Edge Functions and replacing placeholders:
--
-- SELECT cron.schedule(
--   'fetch-rss-daily',
--   '0 8 * * *',
--   $$
--     SELECT net.http_post(
--       url := 'https://<project-ref>.supabase.co/functions/v1/fetch-rss',
--       headers := '{"Authorization": "Bearer <service_role_key>", "Content-Type": "application/json"}'::jsonb,
--       body := '{}'::jsonb
--     )
--   $$
-- );
