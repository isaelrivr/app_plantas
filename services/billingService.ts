/**
 * EcoScan Billing & Subscriptions Service (RevenueCat Architecture)
 *
 * Arquitectura unificada para compras in-app y suscripciones Premium.
 *
 * En entornos de producción (Development Build / Standalone):
 * - Se conecta con RevenueCat (`react-native-purchases`) mediante las claves públicas por plataforma.
 * - Gestiona el entitlement 'EcoScan Pro'.
 *
 * En desarrollo local / Expo Go:
 * - Detecta automáticamente la ausencia del módulo nativo o de claves y conmuta
 *   al simulador de pruebas sin romper el flujo de la aplicación ni la UI.
 */

import { Platform } from 'react-native';

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

export const PREMIUM_ENTITLEMENT_ID = 'EcoScan Pro';

// Claves públicas de RevenueCat (seguras en cliente; se pueden sobrescribir vía variables de entorno)
export const REVENUECAT_KEYS = {
  apple: process.env.EXPO_PUBLIC_RC_APPLE || '',
  google: process.env.EXPO_PUBLIC_RC_GOOGLE || '',
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: 'annual',
    title: 'Anual',
    productId: 'ecoscan_pro_annual',
    priceLabel: '$249 MXN',
    pricePerMonthLabel: '$20.75 MXN / mes',
    periodLabel: 'por año',
    savingsLabel: 'Ahorra 28% vs. mensual',
    badge: 'Mejor precio',
    trialDays: 7,
  },
  {
    id: 'monthly',
    title: 'Mensual',
    productId: 'ecoscan_pro_monthly',
    priceLabel: '$29 MXN',
    pricePerMonthLabel: '$29 MXN / mes',
    periodLabel: 'por mes',
    trialDays: 7,
  },
];

export const getPlanById = (id: BillingPlanId): BillingPlan =>
  BILLING_PLANS.find((p) => p.id === id) ?? BILLING_PLANS[0];

const INACTIVE: BillingEntitlement = {
  active: false,
  planId: null,
  isTrial: false,
  expiresAt: null,
};

let isConfigured = false;

async function getPurchasesModule(): Promise<any> {
  try {
    // @ts-expect-error dependencia nativa opcional en Expo Go
    const mod = await import('react-native-purchases');
    return mod.default || mod;
  } catch {
    return null;
  }
}

/**
 * Inicializa RevenueCat si el SDK nativo y las claves están presentes.
 */
export async function initializeBilling(): Promise<boolean> {
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_KEYS.apple : REVENUECAT_KEYS.google;
  if (!apiKey) {
    // Modo simulación de desarrollo local
    return false;
  }

  try {
    const Purchases = await getPurchasesModule();
    if (!Purchases) {
      isConfigured = false;
      return false;
    }
    Purchases.configure({ apiKey });
    isConfigured = true;
    return true;
  } catch {
    // Expo Go o entorno web
    isConfigured = false;
    return false;
  }
}

const simulateLatency = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const expiryFor = (plan: BillingPlan, from: Date = new Date()): string => {
  const d = new Date(from);
  if (plan.id === 'annual') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString();
};

/**
 * Inicia la compra o periodo de prueba de un plan Pro.
 */
export async function purchasePlan(planId: BillingPlanId): Promise<BillingResult> {
  const plan = getPlanById(planId);

  if (isConfigured) {
    try {
      const Purchases = await getPurchasesModule();
      if (!Purchases) throw new Error('RevenueCat no disponible');
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;

      if (!currentOffering) {
        throw new Error('No hay ofertas disponibles en RevenueCat.');
      }

      const targetPkg =
        planId === 'annual' ? currentOffering.annual : currentOffering.monthly;

      if (!targetPkg) {
        throw new Error(`Paquete ${planId} no encontrado en RevenueCat.`);
      }

      const { customerInfo } = await Purchases.purchasePackage(targetPkg);
      const isPro = typeof customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== 'undefined';

      return {
        success: isPro,
        entitlement: {
          active: isPro,
          planId: isPro ? planId : null,
          isTrial: false,
          expiresAt: customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]?.expirationDate ?? null,
        },
      };
    } catch (error: any) {
      if (error?.userCancelled) {
        return { success: false, cancelled: true, entitlement: { ...INACTIVE } };
      }
      return {
        success: false,
        errorMessage: error?.message || 'Error al procesar la compra',
        entitlement: { ...INACTIVE },
      };
    }
  }

  // Fallback de desarrollo local / Expo Go
  await simulateLatency(800);
  return {
    success: true,
    entitlement: {
      active: true,
      planId: plan.id,
      isTrial: plan.trialDays > 0,
      expiresAt: expiryFor(plan),
    },
  };
}

/**
 * Restaura compras previas del usuario en la tienda.
 */
export async function restorePurchases(): Promise<BillingResult> {
  if (isConfigured) {
    try {
      const Purchases = await getPurchasesModule();
      if (!Purchases) throw new Error('RevenueCat no disponible');
      const customerInfo = await Purchases.restorePurchases();
      const isPro = typeof customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== 'undefined';

      return {
        success: true,
        entitlement: {
          active: isPro,
          planId: isPro ? 'annual' : null,
          isTrial: false,
          expiresAt: customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]?.expirationDate ?? null,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        errorMessage: error?.message || 'No se pudieron restaurar las compras',
        entitlement: { ...INACTIVE },
      };
    }
  }

  // Fallback simulado
  await simulateLatency(600);
  return {
    success: true,
    entitlement: { ...INACTIVE },
  };
}

export async function cancelSubscription(): Promise<BillingEntitlement> {
  await simulateLatency(300);
  return { ...INACTIVE };
}

export const getInactiveEntitlement = (): BillingEntitlement => ({ ...INACTIVE });
