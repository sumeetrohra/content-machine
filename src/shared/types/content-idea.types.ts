export type EContentSource = 'manual' | 'rss';
export type EContentStatus = 'idea' | 'accepted' | 'rejected';
export type EContentFormat = 'text' | 'markdown' | 'html';
export type ETimeFilter = 'week' | 'month' | 'year' | 'all';

export type TContentIdea = {
  id: string;
  accountId: string;
  title: string | null;
  content: string;
  contentFormat: EContentFormat;
  status: EContentStatus;
  source: EContentSource;
  rssFeedId: string | null;
  sourceUrl: string | null;
  author: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TRssFeed = {
  id: string;
  accountId: string;
  name: string;
  url: string;
  lastFetchedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TCreateIdeaInput = {
  content: string;
  contentFormat: EContentFormat;
  title?: string;
};

export type TCreateFeedInput = {
  name: string;
  url: string;
};

export type TUpdateFeedInput = Partial<
  Pick<TRssFeed, 'name' | 'url' | 'isActive'>
>;
