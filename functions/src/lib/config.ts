import { FieldValue } from 'firebase-admin/firestore';
import { db } from './admin';
import { DEFAULT_PERSONA, DEFAULT_VIRALITY_RUBRIC } from './persona';

export type TAppConfig = {
  accountId: string;
  persona: string;
  viralityRubric: string;
  dedupThreshold: number;
  lookbackDays: number;
  dailyAcceptedCap: number;
};

export const APP_CONFIG_DEFAULTS = {
  persona: DEFAULT_PERSONA,
  viralityRubric: DEFAULT_VIRALITY_RUBRIC,
  dedupThreshold: 0.85,
  lookbackDays: 30,
  dailyAcceptedCap: 6,
} as const;

export async function getAppConfig(accountId: string): Promise<TAppConfig> {
  const snap = await db.collection('appConfig').doc(accountId).get();
  if (!snap.exists) {
    return { accountId, ...APP_CONFIG_DEFAULTS };
  }
  const data = snap.data() as Partial<TAppConfig>;
  return {
    accountId,
    persona: data.persona ?? APP_CONFIG_DEFAULTS.persona,
    viralityRubric: data.viralityRubric ?? APP_CONFIG_DEFAULTS.viralityRubric,
    dedupThreshold:
      typeof data.dedupThreshold === 'number'
        ? data.dedupThreshold
        : APP_CONFIG_DEFAULTS.dedupThreshold,
    lookbackDays:
      typeof data.lookbackDays === 'number'
        ? data.lookbackDays
        : APP_CONFIG_DEFAULTS.lookbackDays,
    dailyAcceptedCap:
      typeof data.dailyAcceptedCap === 'number'
        ? data.dailyAcceptedCap
        : APP_CONFIG_DEFAULTS.dailyAcceptedCap,
  };
}

export async function ensureAppConfig(accountId: string): Promise<TAppConfig> {
  const ref = db.collection('appConfig').doc(accountId);
  const snap = await ref.get();
  if (snap.exists) {
    return getAppConfig(accountId);
  }
  await ref.set({
    accountId,
    ...APP_CONFIG_DEFAULTS,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { accountId, ...APP_CONFIG_DEFAULTS };
}
