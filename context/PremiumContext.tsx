import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { loadJSON, saveJSON, STORAGE_KEYS } from '../services/storage';
import {
  BillingPlanId,
  BillingResult,
  purchasePlan,
  restorePurchases,
  cancelSubscription,
} from '../services/billingService';

interface PremiumContextType {
  isPremium: boolean;
  /** El acceso actual proviene del periodo de prueba gratis */
  isTrial: boolean;
  activePlanId: BillingPlanId | null;
  expiresAt: string | null;
  /** `true` cuando el estado Premium persistido ya se cargó desde disco. */
  isHydrated: boolean;
  /** Hay una operación de compra/restauración en curso */
  purchaseLoading: boolean;
  price: string;
  togglePremium: () => void;
  setPremium: (value: boolean) => void;
  purchase: (planId: BillingPlanId) => Promise<BillingResult>;
  restore: () => Promise<BillingResult>;
  cancel: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

/** Caché del último estado de suscripción conocido. Fase 3 lo alimentará desde RevenueCat. */
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
  const price = '$29 MXN/mes';

  // Hidratación del estado Premium persistido.
  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await loadJSON<PersistedPremium>(STORAGE_KEYS.premium, DEFAULT_PREMIUM);
      if (!active) return;
      setIsPremium(!!stored.isPremium);
      setIsTrial(!!stored.isTrial);
      setActivePlanId(stored.activePlanId ?? null);
      setExpiresAt(stored.expiresAt ?? null);
      setIsHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persistencia del último estado conocido (sirve para uso offline en Fase 3).
  useEffect(() => {
    if (!isHydrated) return;
    void saveJSON<PersistedPremium>(STORAGE_KEYS.premium, {
      isPremium,
      isTrial,
      activePlanId,
      expiresAt,
    });
  }, [isHydrated, isPremium, isTrial, activePlanId, expiresAt]);

  const togglePremium = () => {
    setIsPremium((prev) => !prev);
  };

  const setPremium = (value: boolean) => {
    setIsPremium(value);
  };

  const applyEntitlement = (result: BillingResult) => {
    if (result.success && result.entitlement.active) {
      setIsPremium(true);
      setIsTrial(result.entitlement.isTrial);
      setActivePlanId(result.entitlement.planId);
      setExpiresAt(result.entitlement.expiresAt);
    }
  };

  const purchase = async (planId: BillingPlanId): Promise<BillingResult> => {
    setPurchaseLoading(true);
    try {
      const result = await purchasePlan(planId);
      applyEntitlement(result);
      return result;
    } finally {
      setPurchaseLoading(false);
    }
  };

  const restore = async (): Promise<BillingResult> => {
    setPurchaseLoading(true);
    try {
      const result = await restorePurchases();
      applyEntitlement(result);
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
        togglePremium,
        setPremium,
        purchase,
        restore,
        cancel,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium(): PremiumContextType {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium debe utilizarse dentro de un PremiumProvider');
  }
  return context;
}
