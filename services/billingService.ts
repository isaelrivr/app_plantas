/**
 * EcoScan Billing & Subscriptions Service (RevenueCat)
 *
 * Integración oficial con RevenueCat (`react-native-purchases`) para compras
 * in-app y suscripciones Premium en iOS y Android.
 *
 * Principios de seguridad y compliance:
 * 1. Pro se concede ÚNICAMENTE si el entitlement 'pro' (o 'EcoScan Pro') está activo y no expirado.
 * 2. Cero fallbacks de "success: true" en entornos sin claves: maneja errores reales.
 * 3. Precios y ofertas dinámicos obtenidos directamente de RevenueCat (`offerings.current`).
 */

import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';

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

// Claves públicas de RevenueCat (configurables vía variables de entorno públicas)
export const REVENUECAT_KEYS = {
  apple: (process.env.EXPO_PUBLIC_RC_APPLE ?? '').trim(),
  google: (process.env.EXPO_PUBLIC_RC_GOOGLE ?? '').trim(),
};

export const DEFAULT_BILLING_PLANS: BillingPlan[] = [
  {
    id: 'annual',
    title: 'Anual',
    productId: 'ecoscan_pro_annual',
    priceLabel: 'Consultar precio',
    pricePerMonthLabel: 'Mejor tarifa anual',
    periodLabel: 'por año',
    savingsLabel: 'Ahorro anual disponible',
    badge: 'Recomendado',
    trialDays: 7,
  },
  {
    id: 'monthly',
    title: 'Mensual',
    productId: 'ecoscan_pro_monthly',
    priceLabel: 'Consultar precio',
    pricePerMonthLabel: 'Facturación mensual',
    periodLabel: 'por mes',
    trialDays: 0,
  },
];

const INACTIVE: BillingEntitlement = {
  active: false,
  planId: null,
  isTrial: false,
  expiresAt: null,
};

let isConfigured = false;

/** Verifica si la plataforma nativa soporta RevenueCat y si hay claves configuradas */
export function isBillingAvailable(): boolean {
  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
  const hasKey = Platform.OS === 'ios' ? REVENUECAT_KEYS.apple.length > 0 : REVENUECAT_KEYS.google.length > 0;
  return isNative && hasKey;
}

/**
 * Valida un objeto CustomerInfo de RevenueCat y extrae el estado del entitlement.
 * Pro se concede ÚNICAMENTE si 'pro' está activo y su fecha de expiración es válida en el futuro.
 */
export function extractProEntitlement(customerInfo: CustomerInfo | null | undefined): BillingEntitlement {
  if (!customerInfo || !customerInfo.entitlements || !customerInfo.entitlements.active) {
    return { ...INACTIVE };
  }

  const entitlement =
    customerInfo.entitlements.active[PRIMARY_ENTITLEMENT_ID] ??
    customerInfo.entitlements.active[FALLBACK_ENTITLEMENT_ID];

  if (!entitlement) {
    return { ...INACTIVE };
  }

  // Si tiene fecha de expiración, validamos que no esté vencida
  if (entitlement.expirationDate) {
    const expiresTime = new Date(entitlement.expirationDate).getTime();
    if (Number.isFinite(expiresTime) && expiresTime <= Date.now()) {
      return { ...INACTIVE };
    }
  }

  const isTrial = entitlement.periodType === 'TRIAL';
  const product = (entitlement.productIdentifier || '').toLowerCase();
  const planId: BillingPlanId = product.includes('annual') || product.includes('year') ? 'annual' : 'monthly';

  return {
    active: true,
    planId,
    isTrial,
    expiresAt: entitlement.expirationDate ?? null,
  };
}

/**
 * Inicializa el SDK de RevenueCat.
 * Debe ser invocado durante el arranque de la app en App.tsx / PremiumContext.
 */
export async function initializeBilling(appUserId?: string): Promise<boolean> {
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_KEYS.apple : REVENUECAT_KEYS.google;

  if (!apiKey || (Platform.OS !== 'ios' && Platform.OS !== 'android')) {
    isConfigured = false;
    return false;
  }

  try {
    Purchases.configure({
      apiKey,
      appUserID: appUserId || undefined,
    });
    isConfigured = true;
    return true;
  } catch (error) {
    console.warn('[RevenueCat] No se pudo inicializar Purchases:', error);
    isConfigured = false;
    return false;
  }
}

/**
 * Obtiene las ofertas vigentes de RevenueCat y las convierte en planes dinámicos con moneda local.
 */
export async function fetchDynamicPlans(): Promise<{ plans: BillingPlan[]; offerings: PurchasesOfferings | null }> {
  if (!isConfigured) {
    return { plans: DEFAULT_BILLING_PLANS, offerings: null };
  }

  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;

    if (!current) {
      return { plans: DEFAULT_BILLING_PLANS, offerings };
    }

    const plans: BillingPlan[] = [];

    // Paquete Anual
    if (current.annual) {
      const pkg = current.annual;
      const product = pkg.product;
      const trialDays = product.introPrice && product.introPrice.periodUnit === 'DAY' ? product.introPrice.periodNumberOfUnits : 7;
      plans.push({
        id: 'annual',
        title: 'Anual',
        productId: product.identifier,
        priceLabel: product.priceString,
        pricePerMonthLabel: `${(product.price / 12).toFixed(2)} ${product.currencyCode} / mes`,
        periodLabel: 'por año',
        savingsLabel: 'Mejor valor anual',
        badge: 'Recomendado',
        trialDays: trialDays > 0 ? trialDays : 7,
      });
    }

    // Paquete Mensual
    if (current.monthly) {
      const pkg = current.monthly;
      const product = pkg.product;
      plans.push({
        id: 'monthly',
        title: 'Mensual',
        productId: product.identifier,
        priceLabel: product.priceString,
        pricePerMonthLabel: `${product.priceString} / mes`,
        periodLabel: 'por mes',
        trialDays: 0,
      });
    }

    return {
      plans: plans.length > 0 ? plans : DEFAULT_BILLING_PLANS,
      offerings,
    };
  } catch (error) {
    console.warn('[RevenueCat] Error al obtener ofertas:', error);
    return { plans: DEFAULT_BILLING_PLANS, offerings: null };
  }
}

/**
 * Inicia la compra de un paquete en RevenueCat.
 */
export async function purchasePlan(planId: BillingPlanId): Promise<BillingResult> {
  if (!isConfigured) {
    return {
      success: false,
      errorMessage: 'El servicio de compras no está configurado. Revisa las credenciales de RevenueCat.',
      entitlement: { ...INACTIVE },
    };
  }

  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;

    if (!current) {
      return {
        success: false,
        errorMessage: 'No hay ofertas de suscripción disponibles en este momento.',
        entitlement: { ...INACTIVE },
      };
    }

    const targetPkg: PurchasesPackage | undefined =
      planId === 'annual' ? (current.annual ?? undefined) : (current.monthly ?? undefined);

    if (!targetPkg) {
      return {
        success: false,
        errorMessage: `El plan ${planId} no está disponible en la tienda.`,
        entitlement: { ...INACTIVE },
      };
    }

    const { customerInfo } = await Purchases.purchasePackage(targetPkg);
    const entitlement = extractProEntitlement(customerInfo);

    return {
      success: entitlement.active,
      entitlement,
    };
  } catch (error: any) {
    if (error?.userCancelled) {
      return { success: false, cancelled: true, entitlement: { ...INACTIVE } };
    }
    return {
      success: false,
      errorMessage: error?.message || 'Error al procesar la compra en la tienda.',
      entitlement: { ...INACTIVE },
    };
  }
}

/**
 * Restaura las compras existentes en la tienda.
 */
export async function restorePurchases(): Promise<BillingResult> {
  if (!isConfigured) {
    return {
      success: false,
      errorMessage: 'El servicio de compras no está configurado.',
      entitlement: { ...INACTIVE },
    };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    const entitlement = extractProEntitlement(customerInfo);

    return {
      success: entitlement.active,
      entitlement,
    };
  } catch (error: any) {
    return {
      success: false,
      errorMessage: error?.message || 'No se pudieron restaurar las compras anteriores.',
      entitlement: { ...INACTIVE },
    };
  }
}

/** Obtiene la información del cliente actual */
export async function getCurrentCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isConfigured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

/** Añade un listener para cambios en el estado de la suscripción */
export function addCustomerInfoUpdateListener(callback: (info: CustomerInfo) => void): () => void {
  if (!isConfigured) return () => {};
  try {
    const listener = (info: CustomerInfo) => callback(info);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      try {
        Purchases.removeCustomerInfoUpdateListener(listener);
      } catch {}
    };
  } catch {
    return () => {};
  }
}

export async function cancelSubscription(): Promise<BillingEntitlement> {
  return { ...INACTIVE };
}

export const getInactiveEntitlement = (): BillingEntitlement => ({ ...INACTIVE });
export const BILLING_PLANS = DEFAULT_BILLING_PLANS;
