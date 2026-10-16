import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Linking, Image } from 'react-native';
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
import { useFeedback } from '../context/FeedbackContext';

interface ComparisonRow {
  label: string;
  free: string | boolean;
  pro: string | boolean;
}

const COMPARISON: ComparisonRow[] = [
  { label: 'Identificaciones con IA', free: '3 por día', pro: 'Ilimitadas' },
  { label: 'Plantas en Mi Jardín', free: '5 plantas', pro: 'Ilimitadas' },
  { label: 'Diagnóstico de hojas y plagas', free: false, pro: true },
  { label: 'Consejos de clima en tu zona', free: false, pro: true },
  { label: 'Sin anuncios', free: false, pro: true },
  { label: 'Calendario de riego básico', free: true, pro: true },
  { label: 'Diario de crecimiento', free: true, pro: true },
];

const PRO_BULLETS = [
  { icon: 'scan-outline', text: 'Identificaciones ilimitadas de plantas y flores' },
  { icon: 'medkit-outline', text: 'Diagnóstico de hojas enfermas y remedios prácticos' },
  { icon: 'partly-sunny-outline', text: 'Recordatorios de riego adaptados al clima de tu ciudad' },
  { icon: 'shield-checkmark-outline', text: 'Sin publicidad ni interrupciones' },
] as const;

export const PaywallScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const navigation = useNavigation<any>();
  const { isPremium, purchase, restore, purchaseLoading } = usePremium();
  const { t } = useTranslation();
  const { showToast, confirm } = useFeedback();

  const [selectedPlan, setSelectedPlan] = useState<BillingPlanId>('annual');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePurchase = async () => {
    try {
      Haptics.selectionAsync();
      setErrorMessage(null);
      const result = await purchase(selectedPlan);
      if (result.success) {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        showToast({
          message: t('¡Bienvenido a EcoScan Pro! Ya tienes acceso completo.'),
          type: 'success',
        });
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
      Haptics.selectionAsync();
      setErrorMessage(null);
      showToast({
        message: t('Buscando tus compras anteriores...'),
        type: 'info',
      });
      const result = await restore();
      if (result.entitlement.active) {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        showToast({
          message: t('¡Compras restauradas con éxito!'),
          type: 'success',
        });
        navigation.goBack();
      } else {
        showToast({
          message: t('No encontramos compras activas asociadas a tu cuenta.'),
          type: 'info',
        });
      }
    } catch {
      setErrorMessage(t('No se pudieron restaurar las compras.'));
    }
  };

  const handleShowTerms = () => {
    confirm({
      title: t('Términos de uso'),
      message: t('EcoScan ofrece planes de suscripción autorrenovables. Puedes cancelar en cualquier momento desde los ajustes de suscripción de tu cuenta de Google Play o Apple App Store.\n\nSitio oficial: ecoscan.app/terminos'),
      confirmText: t('Entendido'),
      cancelText: null,
    });
  };

  const handleShowPrivacy = () => {
    confirm({
      title: t('Política de privacidad'),
      message: t('Tus datos y fotos se procesan exclusivamente para brindarte información botánica y no se comparten con terceros ni se usan para publicidad.\n\nSitio oficial: ecoscan.app/privacidad'),
      confirmText: t('Entendido'),
      cancelText: null,
    });
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

  const selectedBillingPlan = BILLING_PLANS.find((p) => p.id === selectedPlan);

  useEffect(() => {
    if (isPremium) {
      navigation.goBack();
    }
  }, [isPremium, navigation]);

  if (isPremium) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxxl }}>
        {/* BARRA SUPERIOR */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel={t('Cerrar')}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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

        {/* HERO */}
        <View style={styles.hero}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.heroLogo}
            resizeMode="contain"
            accessible
            accessibilityLabel={t('Logotipo oficial de EcoScan Pro')}
          />
          <Text style={[typography.largeTitle, { color: colors.textPrimary, textAlign: 'center', marginTop: spacing.md }]}>
            EcoScan Pro
          </Text>
          <Text style={[typography.subheadline, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, lineHeight: 22 }]}>
            {t('Todo lo que necesitas para que tus plantas crezcan sanas y fuertes, sin límites.')}
          </Text>
        </View>

        {/* 4 VIÑETAS CLARAS */}
        <Card style={{ marginVertical: spacing.md }}>
          {PRO_BULLETS.map((bullet, idx) => (
            <View key={bullet.icon}>
              <View style={styles.bulletRow}>
                <View style={[styles.bulletIconBox, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name={bullet.icon} size={20} color={colors.primary} />
                </View>
                <Text style={[typography.body, { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm, fontWeight: '500' }]}>
                  {t(bullet.text)}
                </Text>
              </View>
              {idx < PRO_BULLETS.length - 1 && (
                <View style={[styles.separator, { backgroundColor: colors.border, marginVertical: 8 }]} />
              )}
            </View>
          ))}
        </Card>

        {errorMessage ? (
          <ErrorBanner message={errorMessage} onRetry={handlePurchase} style={{ marginBottom: spacing.md }} />
        ) : null}

        {/* SELECCIÓN DE PLANES */}
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
                accessibilityLabel={t('Plan {titulo}, {precio} {periodo}', {
                  titulo: t(plan.title),
                  precio: plan.priceLabel,
                  periodo: t(plan.periodLabel),
                })}
                style={[
                  styles.planOption,
                  {
                    borderColor: selected ? colors.premiumGold : colors.border,
                    backgroundColor: selected ? colors.premiumGoldLight : colors.surface,
                    borderRadius: layout.borderRadius.lg,
                  },
                ]}
              >
                {plan.badge ? <Badge label={t(plan.badge)} variant="premium" style={styles.planBadge} /> : null}
                <Text style={[typography.headline, { color: colors.textPrimary }]}>{t(plan.title)}</Text>
                <Text style={[typography.title2, { color: selected ? colors.premiumGold : colors.textPrimary, fontWeight: '800' }]}>
                  {plan.priceLabel}
                </Text>
                <Text style={[typography.caption1, { color: colors.textTertiary }]}>{t(plan.pricePerMonthLabel)}</Text>
                {plan.savingsLabel ? (
                  <Text style={[typography.caption1, { color: colors.primary, fontWeight: '700', marginTop: 4 }]}>
                    {t(plan.savingsLabel)}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* BOTÓN PRINCIPAL */}
        <Button
          title={selectedPlan === 'annual' ? t('Probar 7 días gratis') : t('Comenzar con Pro')}
          onPress={handlePurchase}
          loading={purchaseLoading}
          variant="premium"
          size="lg"
          style={{ marginTop: spacing.lg }}
          icon={!purchaseLoading ? <Ionicons name="sparkles" size={18} color="#1C1C1E" /> : undefined}
          accessibilityLabel={selectedPlan === 'annual' ? t('Probar 7 días gratis') : t('Comenzar con Pro')}
        />

        <Text style={[typography.caption1, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, fontWeight: '600' }]}>
          {selectedPlan === 'annual'
            ? t('7 días gratis. Luego {precio}/año. Cancela cuando quieras.', { precio: selectedBillingPlan?.priceLabel ?? '' })
            : t('{precio}/mes. Cancela cuando quieras.', { precio: selectedBillingPlan?.priceLabel ?? '' })}
        </Text>
        <Text style={[typography.caption2, { color: colors.textTertiary, textAlign: 'center', marginTop: 2 }]}>
          {t('Cancela fácilmente en cualquier momento desde Google Play o App Store.')}
        </Text>

        {/* COMPARATIVA TRANSPARENTE */}
        <Text style={[typography.headline, { color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
          {t('Comparativa')}
        </Text>
        <Card style={{ padding: 0 }}>
          <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
            <Text style={[typography.footnote, { color: colors.textSecondary, flex: 1 }]}>{t('Función')}</Text>
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
              <Text style={[typography.footnote, { color: colors.textPrimary, flex: 1 }]}>{t(row.label)}</Text>
              <View style={[styles.tableCell, { width: 84 }]}>{renderValue(row.free, false)}</View>
              <View style={[styles.tableCell, { width: 84 }]}>{renderValue(row.pro, true)}</View>
            </View>
          ))}
        </Card>

        {/* RESTAURAR COMPRAS */}
        <TouchableOpacity
          onPress={handleRestore}
          accessibilityRole="button"
          accessibilityLabel={t('Restaurar compras')}
          style={styles.restoreButton}
        >
          <Ionicons name="refresh-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[typography.subheadline, { color: colors.primary, fontWeight: '600' }]}>
            {t('Restaurar compras')}
          </Text>
        </TouchableOpacity>

        {/* ENLACES LEGALES */}
        <View style={styles.legalLinksRow}>
          <TouchableOpacity onPress={handleShowTerms} accessibilityRole="button" accessibilityLabel={t('Términos de uso')}>
            <Text style={[typography.caption2, { color: colors.textTertiary, textDecorationLine: 'underline' }]}>
              {t('Términos de uso')}
            </Text>
          </TouchableOpacity>
          <Text style={[typography.caption2, { color: colors.textTertiary, marginHorizontal: 8 }]}>·</Text>
          <TouchableOpacity onPress={handleShowPrivacy} accessibilityRole="button" accessibilityLabel={t('Política de privacidad')}>
            <Text style={[typography.caption2, { color: colors.textTertiary, textDecorationLine: 'underline' }]}>
              {t('Política de privacidad')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
  },
  closeButton: { width: 48, height: 48, alignItems: 'flex-start', justifyContent: 'center' },
  hero: { alignItems: 'center', marginTop: 12, marginBottom: 8 },
  heroLogo: {
    width: 90,
    height: 90,
    borderRadius: 20,
    alignSelf: 'center',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  bulletIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    width: '100%',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 16,
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
});
