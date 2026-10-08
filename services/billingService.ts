/**
 * Plantae Billing Service (MOCK)
 *
 * Toda la lógica de compra vive AQUÍ y no en los componentes de UI, de modo que
 * al conectar RevenueCat solo se reemplaza la implementación interna de estas
 * funciones (purchasePlan / restorePurchases) sin tocar las pantallas.
 *
 * CONEXIÓN REAL (RevenueCat):
 * 1. npx expo install react-native-purchases
 * 2. Crea los productos en App Store Connect / Google Play Console con los
 *    productId de BILLING_PLANS (plantae_premium_monthly / plantae_premium_annual).
 * 3. En un Development Build, inicializa:
 *      Purchases.configure({ apiKey: '<REVENUECAT_PUBLIC_SDK_KEY>' });
 * 4. Reemplaza el cuerpo de `purchasePlan` por:
 *      const offerings = await Purchases.getOfferings();
 *      const pkg = offerings.current?.availablePackages.find(...);
 *      const { customerInfo } = await Purchases.purchasePackage(pkg);
 *      return { success: hasPremium(customerInfo) };
 *    y `restorePurchases` por `await Purchases.restorePurchases()`.
 *
 * NOTA DE SEGURIDAD: la SDK key pública de RevenueCat es segura en el cliente;
 * las llaves de App Store/Play y de validación de recibos van en Firebase
 * Cloud Functions / el servidor de RevenueCat, nunca en el bundle.
 */

export type BillingPlanId = 'monthly' | 'annual';

export interface BillingPlan {
  id: BillingPlanId;
  title: string;
  productId: string;
  /** Precio de referencia mostrado al usuario */
  priceLabel: string;
  pricePerMonthLabel: string;
  periodLabel: string;
  /** Solo en el plan anual */
  savingsLabel?: string;
  badge?: string;
  /** Días de prueba gratis */
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

export const PREMIUM_ENTITLEMENT_ID = 'Plantae Pro';

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: 'annual',
    title: 'Anual',
    productId: 'plantae_premium_annual',
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
    productId: 'plantae_premium_monthly',
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
 * Inicia la compra/prueba de un plan.
 * MOCK: simula latencia y devuelve un entitlement activo con periodo de prueba.
 */
export async function purchasePlan(planId: BillingPlanId): Promise<BillingResult> {
  const plan = getPlanById(planId);
  await simulateLatency(900);
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
 * Restaura compras previas del usuario.
 * MOCK: en este entorno no hay compras guardadas (siempre inactivo).
 */
export async function restorePurchases(): Promise<BillingResult> {
  await simulateLatency(800);
  return {
    success: true,
    entitlement: { ...INACTIVE },
  };
}

/**
 * Cancela la suscripción activa (solo para pruebas internas).
 */
export async function cancelSubscription(): Promise<BillingEntitlement> {
  await simulateLatency(400);
  return { ...INACTIVE };
}

export const getInactiveEntitlement = (): BillingEntitlement => ({ ...INACTIVE });
