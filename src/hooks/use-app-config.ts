import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/modules/firebase';
import { useAuthUser } from '@/shared/stores/auth.store';
import type { TAppConfig } from '@/shared/types/content-idea.types';

const APP_CONFIG_KEY = 'app-config';

function configFromDoc(accountId: string, data: DocumentData): TAppConfig {
  return {
    accountId,
    persona: (data.persona as string) ?? '',
    viralityRubric: (data.viralityRubric as string) ?? '',
    dedupThreshold: (data.dedupThreshold as number) ?? 0.85,
    lookbackDays: (data.lookbackDays as number) ?? 30,
    dailyAcceptedCap: (data.dailyAcceptedCap as number) ?? 6,
  };
}

export const useAppConfig = () => {
  const user = useAuthUser();
  return useQuery({
    queryKey: [APP_CONFIG_KEY, user?.uid],
    queryFn: async (): Promise<TAppConfig | null> => {
      if (!user) return null;
      const ref = doc(db, 'appConfig', user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return configFromDoc(user.uid, snap.data());
    },
    enabled: !!user,
  });
};

export const useSeedAppConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<TAppConfig> => {
      const fn = httpsCallable<
        Record<string, never>,
        Omit<TAppConfig, 'accountId'> & { created: boolean }
      >(functions, 'seedAppConfig');
      const res = await fn({});
      return {
        accountId: '',
        persona: res.data.persona,
        viralityRubric: res.data.viralityRubric,
        dedupThreshold: res.data.dedupThreshold,
        lookbackDays: res.data.lookbackDays,
        dailyAcceptedCap: res.data.dailyAcceptedCap,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APP_CONFIG_KEY] });
    },
  });
};

export const useUpdateAppConfig = () => {
  const user = useAuthUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<TAppConfig>): Promise<void> => {
      if (!user) throw new Error('Not authenticated');
      const ref = doc(db, 'appConfig', user.uid);
      await setDoc(
        ref,
        {
          ...updates,
          accountId: user.uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APP_CONFIG_KEY] });
    },
  });
};
