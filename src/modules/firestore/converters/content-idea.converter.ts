import {
  serverTimestamp,
  type FieldValue,
  type FirestoreDataConverter,
  type Timestamp,
  type VectorValue,
} from 'firebase/firestore';
import { contentIdeaSchema } from '@/shared/schemas/content-idea.schema';
import type {
  EContentFormat,
  EContentSource,
  EContentStatus,
  TContentIdea,
} from '@/shared/types/content-idea.types';
import { isoToTs, tsToIso } from '../timestamp';

export type TContentIdeaDb = {
  accountId: string;
  title: string | null;
  content: string;
  contentFormat: EContentFormat;
  status: EContentStatus;
  source: EContentSource;
  rssFeedId: string | null;
  sourceUrl: string | null;
  author: string | null;
  publishedAt: Timestamp | null;
  embedding: VectorValue | null;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
};

export const contentIdeaConverter: FirestoreDataConverter<
  TContentIdea,
  TContentIdeaDb
> = {
  toFirestore(modelObject) {
    // Firestore types `modelObject` as PartialWithFieldValue to support set+merge,
    // but our client only ever calls with a complete TContentIdea (id/createdAt/
    // updatedAt are placeholder strings the converter discards).
    const app = modelObject as TContentIdea;
    return {
      accountId: app.accountId,
      title: app.title,
      content: app.content,
      contentFormat: app.contentFormat,
      status: app.status,
      source: app.source,
      rssFeedId: app.rssFeedId,
      sourceUrl: app.sourceUrl,
      author: app.author,
      publishedAt: isoToTs(app.publishedAt),
      embedding: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
  },
  fromFirestore(snap) {
    const d = snap.data() as TContentIdeaDb;
    return contentIdeaSchema.parse({
      id: snap.id,
      accountId: d.accountId,
      title: d.title,
      content: d.content,
      contentFormat: d.contentFormat,
      status: d.status,
      source: d.source,
      rssFeedId: d.rssFeedId,
      sourceUrl: d.sourceUrl,
      author: d.author,
      publishedAt: tsToIso(d.publishedAt),
      createdAt: tsToIso(d.createdAt) ?? '',
      updatedAt: tsToIso(d.updatedAt) ?? '',
    });
  },
};
