import type {
  CollectionReference,
  DocumentData,
  DocumentReference,
  FieldValue,
  FirestoreDataConverter,
} from 'firebase/firestore';

export type TCollectionDef<
  TApp extends { id: string },
  TDb extends DocumentData,
> = {
  readonly name: string;
  readonly converter: FirestoreDataConverter<TApp, TDb>;
  readonly ref: () => CollectionReference<TApp, TDb>;
  readonly docRef: (id: string) => DocumentReference<TApp, TDb>;
};

export type TCreate<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

export type TUpdate<T> = {
  [K in keyof Omit<T, 'id'>]?: T[K] | FieldValue;
};
