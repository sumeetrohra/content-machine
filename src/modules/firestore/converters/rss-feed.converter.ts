import {
  serverTimestamp,
  type FieldValue,
  type FirestoreDataConverter,
  type Timestamp,
} from 'firebase/firestore';
import { rssFeedSchema } from '@/shared/schemas/rss-feed.schema';
import type { TRssFeed } from '@/shared/types/content-idea.types';
import { isoToTs, tsToIso } from '../timestamp';

export type TRssFeedDb = {
  accountId: string;
  name: string;
  url: string;
  isActive: boolean;
  lastFetchedAt: Timestamp | null;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
};

export const rssFeedConverter: FirestoreDataConverter<TRssFeed, TRssFeedDb> = {
  toFirestore(modelObject) {
    const app = modelObject as TRssFeed;
    return {
      accountId: app.accountId,
      name: app.name,
      url: app.url,
      isActive: app.isActive,
      lastFetchedAt: isoToTs(app.lastFetchedAt),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
  },
  fromFirestore(snap) {
    const d = snap.data() as TRssFeedDb;
    return rssFeedSchema.parse({
      id: snap.id,
      accountId: d.accountId,
      name: d.name,
      url: d.url,
      isActive: d.isActive,
      lastFetchedAt: tsToIso(d.lastFetchedAt),
      createdAt: tsToIso(d.createdAt) ?? '',
      updatedAt: tsToIso(d.updatedAt) ?? '',
    });
  },
};
