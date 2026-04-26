export type EContentSource = 'manual' | 'rss';
export type EContentStatus = 'idea' | 'accepted' | 'rejected';
export type EContentFormat = 'text' | 'markdown' | 'html';
export type ETimeFilter = 'week' | 'month' | 'year' | 'all';

export type TContentIdea = {
  id: string;
  account_id: string;
  title: string | null;
  content: string;
  content_format: EContentFormat;
  status: EContentStatus;
  source: EContentSource;
  rss_feed_id: string | null;
  source_url: string | null;
  author: string | null;
  published_at: string | null;
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
};

export type TRssFeed = {
  id: string;
  account_id: string;
  name: string;
  url: string;
  last_fetched_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TCreateIdeaInput = {
  content: string;
  content_format: EContentFormat;
  title?: string;
};

export type TCreateFeedInput = {
  name: string;
  url: string;
};
