import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import { loadSecureJSON, saveSecureJSON, STORAGE_KEYS } from '../services/storage';
import {
  BillingPlan,
  BillingPlanId,
  BillingResult,
  DEFAULT_BILLING_PLANS,
  purchasePlan,
  restorePurchases,
  cancelSubscription,
  fetchDynamicPlans,
} from '../services/billingService';
import { t as tGlobal } from '../i18n';

interface PremiumContextType {
  isPremium: boolean;
  /** El acceso actual proviene de un periodo de prueba gratis */
  isTrial: boolean;
  activePlanId: BillingPlanId | null;
  expiresAt: string | null;
  /** `true` cuando el estado Premium persistido ya se cargó desde disco */
  isHydrated: boolean;
  /** Hay una operación de compra/restauración en curso */
  purchaseLoading: boolean;
  price: string;
  plans: BillingPlan[];
  togglePremium: () => void;
  setPremium: (value: boolean) => void;
  resetToFree: () => void;
  purchase: (planId: BillingPlanId) => Promise<BillingResult>;
  restore: () => Promise<BillingResult>;
  cancel: () => Promise<void>;
  refreshOfferings: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

interface PersistedPremium {
  isPremium: boolean;
  isTrial: boolean;
  activePlanId: BillingPlanId | null;
  expiresAt: string | null;
}

const DEFAULT_PREMIUM: PersistedPremium = {
  isPremium: false,
  isTrial: false,
  activePlanId: null,
  expiresAt: null,
};

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isTrial, setIsTrial] = useState<boolean>(false);
  const [activePlanId, setActivePlanId] = useState<BillingPlanId | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [plans, setPlans] = useState<BillingPlan[]>(DEFAULT_BILLING_PLANS);

  const monthlyPlan = plans.find((p) => p.id === 'monthly') ?? DEFAULT_BILLING_PLANS[1];
  const price = `${monthlyPlan.priceLabel}/mes`;

  // 1. Hidratación inicial desde almacenamiento local seguro
  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await loadSecureJSON<PersistedPremium>(STORAGE_KEYS.premium, DEFAULT_PREMIUM);
      if (!active) return;
      const isExpired = stored.expiresAt ? new Date(stored.expiresAt).getTime() <= Date.now() : false;
      if (!isExpired && stored.isPremium) {
        setIsPremium(true);
        setIsTrial(!!stored.isTrial);
        setActivePlanId(stored.activePlanId ?? 'annual');
        setExpiresAt(stored.expiresAt ?? null);
      } else {
        setIsPremium(false);
        setIsTrial(false);
        setActivePlanId(null);
        setExpiresAt(null);
      }
      setIsHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // 2. Persistencia segura del estado Pro cuando cambie
  useEffect(() => {
    if (!isHydrated) return;
    void saveSecureJSON<PersistedPremium>(STORAGE_KEYS.premium, {
      isPremium,
      isTrial,
      activePlanId,
      expiresAt,
    });
  }, [isHydrated, isPremium, isTrial, activePlanId, expiresAt]);

  const refreshOfferings = async () => {
    const { plans: dynPlans } = await fetchDynamicPlans();
    if (dynPlans.length > 0) {
      setPlans(dynPlans);
    }
  };

  const togglePremium = () => {
    if (isPremium) {
      setIsPremium(false);
      setIsTrial(false);
      setActivePlanId(null);
      setExpiresAt(null);
    } else {
      setIsPremium(true);
      setIsTrial(false);
      setActivePlanId('annual');
      setExpiresAt(new Date(Date.now() + 365 * 86400 * 1000).toISOString());
    }
  };

  const resetToFree = () => {
    setIsPremium(false);
    setIsTrial(false);
    setActivePlanId(null);
    setExpiresAt(null);
    Alert.alert(
      tGlobal('EcoScan Demo Académica'),
      tGlobal('Se ha restablecido la aplicación a la versión Gratuita (Free).')
    );
  };

  const setPremium = (value: boolean) => {
    setIsPremium(value);
    if (!value) {
      setIsTrial(false);
      setActivePlanId(null);
      setExpiresAt(null);
    } else {
      setActivePlanId('annual');
      setExpiresAt(new Date(Date.now() + 365 * 86400 * 1000).toISOString());
    }
  };

  const purchase = async (planId: BillingPlanId): Promise<BillingResult> => {
    setPurchaseLoading(true);
    try {
      const result = await purchasePlan(planId);
      if (result.success && result.entitlement.active) {
        setIsPremium(true);
        setIsTrial(result.entitlement.isTrial);
        setActivePlanId(result.entitlement.planId);
        setExpiresAt(result.entitlement.expiresAt);

        Alert.alert(
          tGlobal('¡EcoScan Pro Activado! 🌿'),
          tGlobal(
            'Has adquirido la suscripción Pro (Modo Demo Académico). Todas las herramientas avanzadas están desbloqueadas.'
          )
        );
      }
      return result;
    } finally {
      setPurchaseLoading(false);
    }
  };

  const restore = async (): Promise<BillingResult> => {
    setPurchaseLoading(true);
    try {
      const result = await restorePurchases();
      if (result.success && result.entitlement.active) {
        setIsPremium(true);
        setIsTrial(false);
        setActivePlanId(result.entitlement.planId);
        setExpiresAt(result.entitlement.expiresAt);

        Alert.alert(
          tGlobal('Compras Restauradas'),
          tGlobal('Se restauró con éxito el acceso a EcoScan Pro para la demostración.')
        );
      }
      return result;
    } finally {
      setPurchaseLoading(false);
    }
  };

  const cancel = async () => {
    setPurchaseLoading(true);
    try {
      await cancelSubscription();
      setIsPremium(false);
      setIsTrial(false);
      setActivePlanId(null);
      setExpiresAt(null);
    } finally {
      setPurchaseLoading(false);
    }
  };

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        isTrial,
        activePlanId,
        expiresAt,
        isHydrated,
        purchaseLoading,
        price,
        plans,
        togglePremium,
        setPremium,
        resetToFree,
        purchase,
        restore,
        cancel,
        refreshOfferings,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium(): PremiumContextType {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error(tGlobal('usePremium debe utilizarse dentro de un PremiumProvider'));
  }
  return context;
}
