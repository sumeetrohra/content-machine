import {
  collection,
  doc,
  type DocumentData,
  type FirestoreDataConverter,
} from 'firebase/firestore';
import { db } from '@/modules/firebase';
import type { TCollectionDef } from './types';

export const defineCollection = <
  TApp extends { id: string },
  TDb extends DocumentData,
>(
  name: string,
  converter: FirestoreDataConverter<TApp, TDb>,
): TCollectionDef<TApp, TDb> => ({
  name,
  converter,
  ref: () => collection(db, name).withConverter(converter),
  docRef: (id: string) => doc(db, name, id).withConverter(converter),
});
