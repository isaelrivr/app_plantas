import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { loadSecureJSON, saveSecureJSON, STORAGE_KEYS } from '../services/storage';
import {
  BillingPlan,
  BillingPlanId,
  BillingResult,
  DEFAULT_BILLING_PLANS,
  purchasePlan,
  restorePurchases,
  cancelSubscription,
  initializeBilling,
  getCurrentCustomerInfo,
  addCustomerInfoUpdateListener,
  extractProEntitlement,
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
      // Verificar si la fecha persistida no ha expirado
      const isExpired = stored.expiresAt ? new Date(stored.expiresAt).getTime() <= Date.now() : false;
      if (!isExpired && stored.isPremium) {
        setIsPremium(true);
        setIsTrial(!!stored.isTrial);
        setActivePlanId(stored.activePlanId ?? null);
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

  // 2. Inicialización de RevenueCat y sincronización de entitlement real
  useEffect(() => {
    let active = true;

    const bootstrapBilling = async () => {
      await initializeBilling();
      const { plans: dynPlans } = await fetchDynamicPlans();
      if (active && dynPlans.length > 0) {
        setPlans(dynPlans);
      }

      // Validar suscripción en vivo con RevenueCat
      const customerInfo = await getCurrentCustomerInfo();
      if (customerInfo && active) {
        const ent = extractProEntitlement(customerInfo);
        setIsPremium(ent.active);
        setIsTrial(ent.isTrial);
        setActivePlanId(ent.planId);
        setExpiresAt(ent.expiresAt);
      }
    };

    void bootstrapBilling();

    const unsubscribe = addCustomerInfoUpdateListener((customerInfo) => {
      if (!active) return;
      const ent = extractProEntitlement(customerInfo);
      setIsPremium(ent.active);
      setIsTrial(ent.isTrial);
      setActivePlanId(ent.planId);
      setExpiresAt(ent.expiresAt);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // 3. Persistencia segura del último estado verificado
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

  /**
   * Concede Pro ÚNICAMENTE si la transacción fue exitosa, el entitlement está activo
   * y la fecha de expiración no ha vencido.
   */
  const applyEntitlement = (result: BillingResult) => {
    if (result.success && result.entitlement.active) {
      const isNotExpired =
        !result.entitlement.expiresAt ||
        new Date(result.entitlement.expiresAt).getTime() > Date.now();

      if (isNotExpired) {
        setIsPremium(true);
        setIsTrial(result.entitlement.isTrial);
        setActivePlanId(result.entitlement.planId);
        setExpiresAt(result.entitlement.expiresAt);
        return;
      }
    }

    // Revocar estado Pro si la compra falló o expiró
    setIsPremium(false);
    setIsTrial(false);
    setActivePlanId(null);
    setExpiresAt(null);
  };

  const togglePremium = () => {
    if (isPremium) {
      setIsPremium(false);
      setIsTrial(false);
      setActivePlanId(null);
      setExpiresAt(null);
    } else {
      setIsPremium(true);
      setIsTrial(true);
      setActivePlanId('annual');
    }
  };

  const setPremium = (value: boolean) => {
    setIsPremium(value);
    if (!value) {
      setIsTrial(false);
      setActivePlanId(null);
      setExpiresAt(null);
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
        plans,
        togglePremium,
        setPremium,
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
