/**
 * EcoScan Billing & Subscriptions Service (Simulación Interactiva para Demostración Académica)
 *
 * En esta versión demo / académica para presentación universitaria:
 * 1. No se requiere backend de RevenueCat ni pasarelas de pago reales.
 * 2. Simula el flujo completo de compra in-app con retardo natural (1.5s) y feedback nativo.
 * 3. Provee persistencia local de los entitlements Pro seleccionados.
 */

export type BillingPlanId = 'monthly' | 'annual';

export interface BillingPlan {
  id: BillingPlanId;
  title: string;
  productId: string;
  priceLabel: string;
  pricePerMonthLabel: string;
  periodLabel: string;
  savingsLabel?: string;
  badge?: string;
  trialDays: number;
}

export interface BillingEntitlement {
  active: boolean;
  planId: BillingPlanId | null;
  isTrial: boolean;
  expiresAt: string | null;
}

export interface BillingResult {
  success: boolean;
  cancelled?: boolean;
  entitlement: BillingEntitlement;
  errorMessage?: string;
}

export const PRIMARY_ENTITLEMENT_ID = 'pro';
export const FALLBACK_ENTITLEMENT_ID = 'EcoScan Pro';

export const DEFAULT_BILLING_PLANS: BillingPlan[] = [
  {
    id: 'annual',
    title: 'Anual (Demo)',
    productId: 'ecoscan_pro_annual',
    priceLabel: '$399 MXN',
    pricePerMonthLabel: '$33.25 MXN / mes',
    periodLabel: 'por año',
    savingsLabel: 'Ahorra 43% · 7 días de prueba',
    badge: 'Recomendado',
    trialDays: 7,
  },
  {
    id: 'monthly',
    title: 'Mensual (Demo)',
    productId: 'ecoscan_pro_monthly',
    priceLabel: '$59 MXN',
    pricePerMonthLabel: '$59 MXN / mes',
    periodLabel: 'por mes',
    trialDays: 0,
  },
];

export const BILLING_PLANS = DEFAULT_BILLING_PLANS;

const INACTIVE: BillingEntitlement = {
  active: false,
  planId: null,
  isTrial: false,
  expiresAt: null,
};

/** En entorno demo, el servicio de suscripción simulada está siempre disponible */
export function isBillingAvailable(): boolean {
  return true;
}

/** Extrae el estado del entitlement de un objeto compatible */
export function extractProEntitlement(data: unknown): BillingEntitlement {
  if (data && typeof data === 'object' && (data as any).active) {
    return {
      active: true,
      planId: (data as any).planId ?? 'annual',
      isTrial: !!(data as any).isTrial,
      expiresAt: (data as any).expiresAt ?? null,
    };
  }
  return { ...INACTIVE };
}

/** Inicialización de la simulación de compras */
export async function initializeBilling(_appUserId?: string): Promise<boolean> {
  return true;
}

/** Devuelve los planes dinámicos disponibles para el paywall */
export async function fetchDynamicPlans(): Promise<{ plans: BillingPlan[]; offerings: any }> {
  return {
    plans: DEFAULT_BILLING_PLANS,
    offerings: null,
  };
}

/**
 * Simula la compra de un plan en la tienda:
 * 1. Simula un retardo de red de 1.5s mostrando ActivityIndicator.
 * 2. Concede Pro con fecha de expiración a 1 año.
 */
export async function purchasePlan(planId: BillingPlanId): Promise<BillingResult> {
  // Retardo de 1.5 segundos simulando comunicación con Google Play / App Store
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const entitlement: BillingEntitlement = {
    active: true,
    planId,
    isTrial: planId === 'annual',
    expiresAt: oneYearFromNow,
  };

  return {
    success: true,
    cancelled: false,
    entitlement,
  };
}

/**
 * Simula la restauración de compras anteriores
 */
export async function restorePurchases(): Promise<BillingResult> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const entitlement: BillingEntitlement = {
    active: true,
    planId: 'annual',
    isTrial: false,
    expiresAt: oneYearFromNow,
  };

  return {
    success: true,
    cancelled: false,
    entitlement,
  };
}

export async function getCurrentCustomerInfo(): Promise<any> {
  return null;
}

export function addCustomerInfoUpdateListener(_callback: (info: any) => void): () => void {
  return () => {};
}

export async function cancelSubscription(): Promise<BillingEntitlement> {
  return { ...INACTIVE };
}

export const getInactiveEntitlement = (): BillingEntitlement => ({ ...INACTIVE });
