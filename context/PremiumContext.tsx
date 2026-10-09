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
    setIsPremium(true);
    setIsTrial(true);
    setActivePlanId('annual');
  };

  const setPremium = (value: boolean) => {
    if (value) {
      setIsPremium(true);
      setIsTrial(true);
      setActivePlanId('annual');
    } else {
      setIsPremium(value);
      setIsTrial(false);
      setActivePlanId(null);
      setExpiresAt(null);
    }
  };

  const applyEntitlement = (result: BillingResult) => {
    // Activar Pro inmediatamente en modo prueba
    setIsPremium(true);
    setIsTrial(true);
    setActivePlanId('annual');
    setExpiresAt(result.entitlement.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
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
      // Cancelación real: desactivar premium al final del período actual
      // (en el mock, cancelSubscription devuelve INACTIVE)
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
