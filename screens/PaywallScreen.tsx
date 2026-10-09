import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ErrorBanner } from '../components/ErrorBanner';
import { usePremium } from '../context/PremiumContext';
import { BILLING_PLANS, BillingPlanId } from '../services/billingService';
import { useTranslation } from '../i18n';

interface ComparisonRow {
  label: string;
  free: string | boolean;
  pro: string | boolean;
}

const COMPARISON: ComparisonRow[] = [
  { label: 'Identificaciones con IA', free: '3 por día', pro: 'Ilimitadas' },
  { label: 'Plantas en Mi Jardín', free: '5 plantas', pro: 'Ilimitadas' },
  { label: 'Mapa de hábitat animado', free: false, pro: true },
  { label: 'Diagnóstico de plagas', free: false, pro: true },
  { label: 'Clima personalizado', free: false, pro: true },
  { label: 'Calendario de riego', free: true, pro: true },
  { label: 'Diario de crecimiento', free: true, pro: true },
  { label: 'Asistente de plantas', free: true, pro: true },
];

export const PaywallScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const navigation = useNavigation<any>();
  const { isPremium, purchase, restore, purchaseLoading, expiresAt } = usePremium();
  const { t } = useTranslation();

  const [selectedPlan, setSelectedPlan] = useState<BillingPlanId>('annual');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePurchase = async () => {
    try {
      Haptics.selectionAsync();
      setErrorMessage(null);
      const result = await purchase(selectedPlan);
      if (result.success) {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        // Cerrar paywall inmediatamente tras activar Pro
        navigation.goBack();
      } else if (!result.cancelled) {
        setErrorMessage(result.errorMessage ?? t('No se pudo completar la compra.'));
      }
    } catch {
      setErrorMessage(t('No se pudo completar la compra. Inténtalo de nuevo.'));
    }
  };

  const handleRestore = async () => {
    try {
      setErrorMessage(null);
      const result = await restore();
      if (result.entitlement.active) {
        setSuccess(true);
      } else {
        Alert.alert(t('Restaurar compras'), t('No encontramos compras previas asociadas a tu cuenta.'));
      }
    } catch {
      setErrorMessage(t('No se pudieron restaurar las compras.'));
    }
  };

  const renderValue = (value: string | boolean, isPro: boolean) => {
    if (value === false) {
      return <Ionicons name="close" size={18} color={colors.textTertiary} />;
    }
    if (value === true) {
      return <Ionicons name="checkmark-circle" size={18} color={isPro ? colors.primary : colors.textSecondary} />;
    }
    return (
      <Text style={[typography.caption1, { color: isPro ? colors.primary : colors.textSecondary, fontWeight: '600' }]}>
        {t(value)}
      </Text>
    );
  };

  if (success || isPremium) {
    // Cerrar automáticamente si ya es Premium
    navigation.goBack();
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxxl }}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel={t('Cerrar')}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={26} color={colors.textSecondary} />
          </TouchableOpacity>
          <Badge
            label={t('PRUEBA 7 DÍAS GRATIS')}
            variant="premium"
            icon={<Ionicons name="sparkles" size={13} color={colors.premiumGold} />}
          />
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.premiumGoldLight }]}>
            <Ionicons name="leaf" size={40} color={colors.premiumGold} />
          </View>
          <Text style={[typography.largeTitle, { color: colors.textPrimary, textAlign: 'center', marginTop: spacing.md }]}>
            Plantae Pro
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }]}>
            {t('Cuida tus plantas como un experto: análisis ilimitados, clima local y diagnóstico de plagas.')}
          </Text>
        </View>

        {errorMessage ? (
          <ErrorBanner message={errorMessage} onRetry={handlePurchase} style={{ marginBottom: spacing.md }} />
        ) : null}

        {/* PLANES */}
        <View style={styles.plansRow}>
          {BILLING_PLANS.map((plan) => {
            const selected = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedPlan(plan.id);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Plan ${plan.title}, ${plan.priceLabel} ${plan.periodLabel}`}
                style={[
                  styles.planOption,
                  {
                    borderColor: selected ? colors.premiumGold : colors.border,
                    backgroundColor: selected ? colors.premiumGoldLight : colors.surface,
                    borderRadius: layout.borderRadius.lg,
                  },
                ]}
              >
                {plan.badge ? <Badge label={plan.badge} variant="premium" style={styles.planBadge} /> : null}
                <Text style={[typography.headline, { color: colors.textPrimary }]}>{plan.title}</Text>
                <Text style={[typography.title2, { color: selected ? colors.premiumGold : colors.textPrimary, fontWeight: '800' }]}>
                  {plan.priceLabel}
                </Text>
                <Text style={[typography.caption1, { color: colors.textTertiary }]}>{plan.pricePerMonthLabel}</Text>
                {plan.savingsLabel ? (
                  <Text style={[typography.caption1, { color: colors.primary, fontWeight: '700', marginTop: 4 }]}>
                    {plan.savingsLabel}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* COMPARATIVA */}
        <Text style={[typography.headline, { color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
          Free vs. Pro
        </Text>
        <Card style={{ padding: 0 }}>
          <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
            <Text style={[typography.footnote, { color: colors.textSecondary, flex: 1 }]}>Función</Text>
            <Text style={[typography.footnote, { color: colors.textSecondary, width: 84, textAlign: 'center' }]}>Free</Text>
            <Text style={[typography.footnote, { color: colors.premiumGold, width: 84, textAlign: 'center', fontWeight: '700' }]}>
              Pro
            </Text>
          </View>
          {COMPARISON.map((row, index) => (
            <View
              key={row.label}
              style={[styles.tableRow, index < COMPARISON.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
            >
              <Text style={[typography.footnote, { color: colors.textPrimary, flex: 1 }]}>{row.label}</Text>
              <View style={[styles.tableCell, { width: 84 }]}>{renderValue(row.free, false)}</View>
              <View style={[styles.tableCell, { width: 84 }]}>{renderValue(row.pro, true)}</View>
            </View>
          ))}
        </Card>

        <Button
          title={`Probar 7 días gratis`}
          onPress={handlePurchase}
          loading={purchaseLoading}
          variant="premium"
          size="lg"
          style={{ marginTop: spacing.lg }}
          icon={!purchaseLoading ? <Ionicons name="sparkles" size={18} color="#1C1C1E" /> : undefined}
        />
        <Text style={[typography.caption1, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm }]}>
          Luego {BILLING_PLANS.find((p) => p.id === selectedPlan)?.priceLabel}{' '}
          {BILLING_PLANS.find((p) => p.id === selectedPlan)?.periodLabel}. Cancela cuando quieras.
        </Text>

        <TouchableOpacity
          onPress={handleRestore}
          accessibilityRole="button"
          accessibilityLabel="Restaurar compras"
          style={styles.restoreButton}
        >
          <Text style={[typography.subheadline, { color: colors.primary, fontWeight: '600' }]}>
            Restaurar compras
          </Text>
        </TouchableOpacity>

        <Text style={[typography.caption2, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.md, lineHeight: 16 }]}>
          El pago se cargará a tu cuenta de la tienda al confirmar. La suscripción se renueva automáticamente salvo que se cancele al menos 24 h antes del final del periodo. Gestiona o cancela en los ajustes de tu tienda. Al continuar aceptas los Términos de uso y la Política de privacidad.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
  },
  closeButton: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  hero: { alignItems: 'center', marginTop: 16, marginBottom: 8 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plansRow: { flexDirection: 'row', gap: 12 },
  planOption: {
    flex: 1,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    minHeight: 150,
  },
  planBadge: { marginBottom: 8 },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tableCell: { alignItems: 'center', justifyContent: 'center' },
  restoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 8,
  },
});
