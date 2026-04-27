import {
  collection,
  doc,
  type DocumentData,
  type FirestoreDataConverter,
} from 'firebase/firestore';
import { db } from '@/modules/firebase';
import type { TCollectionDef } from './types';

export const defineSubcollection = <
  TApp extends { id: string },
  TDb extends DocumentData,
>(
  parent: TCollectionDef<{ id: string }, DocumentData>,
  name: string,
  converter: FirestoreDataConverter<TApp, TDb>,
) => ({
  for: (parentId: string): TCollectionDef<TApp, TDb> => ({
    name: `${parent.name}/${parentId}/${name}`,
    converter,
    ref: () =>
      collection(db, parent.name, parentId, name).withConverter(converter),
    docRef: (id: string) =>
      doc(db, parent.name, parentId, name, id).withConverter(converter),
  }),
});
