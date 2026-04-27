export type EContentSource = 'manual' | 'rss';
export type EContentStatus = 'idea' | 'accepted' | 'rejected';
export type EContentFormat = 'text' | 'markdown' | 'html';
export type ETimeFilter = 'week' | 'month' | 'year' | 'all';
export type EPipelineStatus = 'embedded' | 'deduped' | 'scored' | 'failed';
export type EPlatform = 'youtube' | 'linkedin' | 'twitter';

export type TSuggestedFormat = {
  platform: EPlatform;
  format: string;
  why: string;
};

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
  pipelineStatus: EPipelineStatus | null;
  pipelineError: string | null;
  viralityScore: number | null;
  viralityReason: string | null;
  dedupSimilarity: number | null;
  dedupAgainstId: string | null;
  suggestedFormats: TSuggestedFormat[] | null;
};

export type TChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type TDraft = {
  id: string;
  accountId: string;
  articleId: string;
  platform: EPlatform;
  format: string;
  body: string;
  model: string;
  chatId: string;
  createdAt: string;
  updatedAt: string;
};

export type TChat = {
  id: string;
  accountId: string;
  articleId: string;
  draftId: string;
  platform: EPlatform;
  format: string;
  model: string;
  createdAt: string;
  updatedAt: string;
};

export type TAppConfig = {
  accountId: string;
  persona: string;
  viralityRubric: string;
  dedupThreshold: number;
  lookbackDays: number;
  dailyAcceptedCap: number;
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
