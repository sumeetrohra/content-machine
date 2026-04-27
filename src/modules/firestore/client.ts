import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type CollectionReference,
  type DocumentData,
  type Query,
  type QueryConstraint,
  type Unsubscribe,
  type UpdateData,
  type WithFieldValue,
} from 'firebase/firestore';
import type { TCollectionDef, TCreate, TUpdate } from './types';

const add = async <TApp extends { id: string }, TDb extends DocumentData>(
  c: TCollectionDef<TApp, TDb>,
  data: TCreate<TApp>,
): Promise<TApp> => {
  // Converter strips id/createdAt/updatedAt and sets serverTimestamp on writes;
  // these placeholders only exist to satisfy TApp's compile-time shape.
  const ref = await addDoc(c.ref(), {
    ...data,
    id: '',
    createdAt: '',
    updatedAt: '',
  } as WithFieldValue<TApp>);
  const snap = await getDoc(ref);
  const out = snap.data();
  if (!out) {
    throw new Error(`Document ${ref.id} not found after add`);
  }
  return out;
};

const set = async <TApp extends { id: string }, TDb extends DocumentData>(
  c: TCollectionDef<TApp, TDb>,
  id: string,
  data: TCreate<TApp>,
): Promise<void> => {
  await setDoc(c.docRef(id), {
    ...data,
    id,
    createdAt: '',
    updatedAt: '',
  } as WithFieldValue<TApp>);
};

const update = async <TApp extends { id: string }, TDb extends DocumentData>(
  c: TCollectionDef<TApp, TDb>,
  id: string,
  patch: TUpdate<TApp>,
): Promise<void> => {
  await updateDoc(c.docRef(id), {
    updatedAt: serverTimestamp(),
    ...patch,
  } as unknown as UpdateData<TDb>);
};

const getById = async <TApp extends { id: string }, TDb extends DocumentData>(
  c: TCollectionDef<TApp, TDb>,
  id: string,
): Promise<TApp | null> => {
  const snap = await getDoc(c.docRef(id));
  return snap.exists() ? snap.data() : null;
};

const list = async <TApp extends { id: string }, TDb extends DocumentData>(
  c: TCollectionDef<TApp, TDb>,
  ...constraints: QueryConstraint[]
): Promise<TApp[]> => {
  const ref = c.ref();
  const q = constraints.length > 0 ? query(ref, ...constraints) : ref;
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
};

const queryDocs = async <TApp extends { id: string }, TDb extends DocumentData>(
  c: TCollectionDef<TApp, TDb>,
  build: (ref: CollectionReference<TApp, TDb>) => Query<TApp, TDb>,
): Promise<TApp[]> => {
  const snap = await getDocs(build(c.ref()));
  return snap.docs.map(d => d.data());
};

const remove = async <TApp extends { id: string }, TDb extends DocumentData>(
  c: TCollectionDef<TApp, TDb>,
  id: string,
): Promise<void> => {
  await deleteDoc(c.docRef(id));
};

const subscribe = <TApp extends { id: string }, TDb extends DocumentData>(
  c: TCollectionDef<TApp, TDb>,
  build: (ref: CollectionReference<TApp, TDb>) => Query<TApp, TDb>,
  cb: (rows: TApp[]) => void,
): Unsubscribe =>
  onSnapshot(build(c.ref()), snap => {
    cb(snap.docs.map(d => d.data()));
  });

export const firestoreClient = {
  add,
  set,
  update,
  getById,
  list,
  queryDocs,
  remove,
  subscribe,
};
