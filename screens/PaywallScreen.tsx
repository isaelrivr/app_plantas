import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Linking, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  detail?: string;
  free: string | boolean;
  pro: string | boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

const COMPARISON: ComparisonRow[] = [
  {
    icon: 'scan-outline',
    label: 'Identificaciones con IA',
    detail: 'Escaneo y reconocimiento botánico por foto',
    free: '3 por día',
    pro: 'Ilimitadas',
  },
  {
    icon: 'leaf-outline',
    label: 'Plantas en Mi Jardín',
    detail: 'Capacidad de plantas guardadas en tu colección',
    free: '5 plantas',
    pro: 'Ilimitadas',
  },
  {
    icon: 'medkit-outline',
    label: 'Diagnóstico de hojas y plagas',
    detail: 'Detección de hongos y remedios botánicos',
    free: false,
    pro: true,
  },
  {
    icon: 'partly-sunny-outline',
    label: 'Clima local en tiempo real',
    detail: 'Pronóstico y alertas climáticas de tu zona',
    free: false,
    pro: true,
  },
  {
    icon: 'water-outline',
    label: 'Riego adaptativo por clima',
    detail: 'Ajuste dinámico ante lluvia, frío o calor extremo',
    free: 'Fijo',
    pro: 'Dinámico',
  },
  {
    icon: 'chatbubbles-outline',
    label: 'Asistente botánico IA',
    detail: 'Consultas botánicas especializadas 24/7',
    free: '3 consultas',
    pro: 'Ilimitado',
  },
  {
    icon: 'images-outline',
    label: 'Diario de crecimiento y fotos',
    detail: 'Historial fotográfico y comparador Antes/Después',
    free: '1 foto/planta',
    pro: 'Ilimitado',
  },
  {
    icon: 'earth-outline',
    label: 'Mapa interactivo de hábitat',
    detail: 'Origen geográfico y clima natal de cada especie',
    free: false,
    pro: true,
  },
  {
    icon: 'home-outline',
    label: 'Zonas y habitaciones',
    detail: 'Organización por salas, terrazas y balcones',
    free: '1 zona',
    pro: 'Ilimitadas',
  },
  {
    icon: 'cloud-done-outline',
    label: 'Sincronización en la nube',
    detail: 'Respaldo seguro y acceso multidispositivo',
    free: 'Solo local',
    pro: 'Nube Pro',
  },
  {
    icon: 'wifi-outline',
    label: 'Modo sin conexión (Offline)',
    detail: 'Consulta fichas botánicas sin datos ni WiFi',
    free: false,
    pro: true,
  },
  {
    icon: 'apps-outline',
    label: 'Widgets de inicio',
    detail: 'Recordatorios de riego directo en tu pantalla',
    free: false,
    pro: true,
  },
  {
    icon: 'shield-checkmark-outline',
    label: 'Sin anuncios',
    detail: 'Experiencia fluida y 100% libre de publicidad',
    free: false,
    pro: true,
  },
  {
    icon: 'ribbon-outline',
    label: 'Soporte botánico prioritario',
    detail: 'Atención preferencial por nuestro equipo',
    free: 'Estándar',
    pro: 'Prioritario',
  },
];

const PRO_BULLETS = [
  { icon: 'scan-outline', text: 'Identificaciones ilimitadas de plantas y flores con IA' },
  { icon: 'medkit-outline', text: 'Diagnóstico de hojas enfermas, plagas y remedios prácticos' },
  { icon: 'partly-sunny-outline', text: 'Alertas de clima local y riego dinámico adaptativo' },
  { icon: 'chatbubbles-outline', text: 'Asistente botánico inteligente 24/7 para tus consultas' },
  { icon: 'cloud-done-outline', text: 'Copia de seguridad en la nube y sincronización' },
  { icon: 'shield-checkmark-outline', text: 'Experiencia 100% libre de anuncios y sin límites' },
] as const;

export const PaywallScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
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
      return (
        <View style={styles.valueIconBox}>
          <Ionicons name="close" size={18} color={colors.textTertiary} />
        </View>
      );
    }
    if (value === true) {
      return (
        <View style={[styles.valueIconBox, isPro && { backgroundColor: colors.primaryLight }]}>
          <Ionicons
            name="checkmark-circle"
            size={18}
            color={isPro ? colors.primary : colors.textSecondary}
          />
        </View>
      );
    }
    return (
      <View
        style={[
          styles.valueTextBox,
          {
            backgroundColor: isPro ? colors.premiumGoldLight : colors.surfaceSecondary,
            borderColor: isPro ? colors.premiumGold : colors.border,
          },
        ]}
      >
        <Text
          style={[
            typography.caption2,
            {
              color: isPro ? colors.textPrimary : colors.textSecondary,
              fontWeight: isPro ? '700' : '500',
              textAlign: 'center',
            },
          ]}
          numberOfLines={1}
        >
          {t(value)}
        </Text>
      </View>
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
      <ScrollView
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: Math.max(insets.bottom + 24, spacing.xxxl),
        }}
      >
        {/* BARRA SUPERIOR */}
        <View
          style={[
            styles.topBar,
            { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 8 : 12) },
          ]}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel={t('Cerrar')}
            style={({ pressed }) => [
              styles.closeButton,
              { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
            ]}
            android_ripple={{ color: colors.border, borderless: true, radius: 24 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={26} color={colors.textSecondary} />
          </Pressable>
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
        <Card
          variant="flat"
          style={{
            marginVertical: spacing.md,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: layout.borderRadius.lg,
            padding: spacing.md,
          }}
        >
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
              <Pressable
                key={plan.id}
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
                android_ripple={{ color: colors.premiumGold + '25' }}
                style={({ pressed }) => [
                  styles.planOption,
                  {
                    borderColor: selected ? colors.premiumGold : colors.border,
                    backgroundColor: selected ? colors.premiumGoldLight : colors.surface,
                    borderRadius: layout.borderRadius.lg,
                    overflow: 'hidden',
                    opacity: pressed && Platform.OS === 'ios' ? 0.85 : 1,
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
              </Pressable>
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

        {/* COMPARATIVA TRANSPARENTE ENTRE BÁSICO Y PREMIUM */}
        <View style={styles.comparisonHeaderRow}>
          <Text style={[typography.headline, { color: colors.textPrimary }]}>
            {t('Comparativa de Beneficios')}
          </Text>
          <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
            {t('Todo lo que obtienes entre el plan Básico y Premium')}
          </Text>
        </View>

        <Card
          variant="flat"
          style={{
            padding: 0,
            overflow: 'hidden',
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: layout.borderRadius.lg,
          }}
        >
          <View style={[styles.tableHeader, { borderBottomColor: colors.border, backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[typography.subheadline, { color: colors.textPrimary, flex: 1, fontWeight: '700' }]}>
              {t('Beneficio')}
            </Text>
            <View style={{ width: 78, alignItems: 'center' }}>
              <Text style={[typography.footnote, { color: colors.textSecondary, fontWeight: '700' }]}>
                {t('Básico')}
              </Text>
              <Text style={[typography.caption2, { color: colors.textTertiary }]}>{t('Free')}</Text>
            </View>
            <View
              style={{
                width: 88,
                alignItems: 'center',
                backgroundColor: colors.premiumGoldLight,
                paddingVertical: 4,
                borderRadius: layout.borderRadius.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="sparkles" size={12} color={colors.premiumGold} style={{ marginRight: 3 }} />
                <Text style={[typography.footnote, { color: colors.textPrimary, fontWeight: '800' }]}>
                  {t('Premium')}
                </Text>
              </View>
              <Text style={[typography.caption2, { color: colors.textSecondary, fontWeight: '700' }]}>{t('Pro')}</Text>
            </View>
          </View>

          {COMPARISON.map((row, index) => {
            const isLast = index === COMPARISON.length - 1;
            return (
              <View
                key={row.label}
                style={[
                  styles.tableRow,
                  !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  index % 2 === 1 && { backgroundColor: colors.surfaceSecondary + '35' },
                ]}
              >
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name={row.icon} size={16} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[typography.footnote, { color: colors.textPrimary, fontWeight: '600', flex: 1 }]}>
                      {t(row.label)}
                    </Text>
                  </View>
                  {row.detail ? (
                    <Text
                      style={[typography.caption2, { color: colors.textTertiary, marginTop: 2, marginLeft: 22 }]}
                      numberOfLines={2}
                    >
                      {t(row.detail)}
                    </Text>
                  ) : null}
                </View>

                <View style={[styles.tableCell, { width: 78 }]}>
                  {renderValue(row.free, false)}
                </View>

                <View
                  style={[
                    styles.tableCell,
                    {
                      width: 88,
                      backgroundColor: colors.premiumGoldLight + '25',
                      borderRadius: layout.borderRadius.sm,
                      paddingVertical: 2,
                    },
                  ]}
                >
                  {renderValue(row.pro, true)}
                </View>
              </View>
            );
          })}
        </Card>

        {/* RESTAURAR COMPRAS */}
        <Pressable
          onPress={handleRestore}
          accessibilityRole="button"
          accessibilityLabel={t('Restaurar compras')}
          android_ripple={{ color: colors.primary + '18' }}
          style={({ pressed }) => [
            styles.restoreButton,
            { borderRadius: 8, overflow: 'hidden', opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="refresh-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[typography.subheadline, { color: colors.primary, fontWeight: '600' }]}>
            {t('Restaurar compras')}
          </Text>
        </Pressable>

        {/* ENLACES LEGALES */}
        <View style={styles.legalLinksRow}>
          <Pressable
            onPress={handleShowTerms}
            accessibilityRole="button"
            accessibilityLabel={t('Términos de uso')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ minHeight: 48, justifyContent: 'center' }}
          >
            <Text style={[typography.caption2, { color: colors.textTertiary, textDecorationLine: 'underline' }]}>
              {t('Términos de uso')}
            </Text>
          </Pressable>
          <Text style={[typography.caption2, { color: colors.textTertiary, marginHorizontal: 8 }]}>·</Text>
          <Pressable
            onPress={handleShowPrivacy}
            accessibilityRole="button"
            accessibilityLabel={t('Política de privacidad')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ minHeight: 48, justifyContent: 'center' }}
          >
            <Text style={[typography.caption2, { color: colors.textTertiary, textDecorationLine: 'underline' }]}>
              {t('Política de privacidad')}
            </Text>
          </Pressable>
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
  comparisonHeaderRow: {
    marginTop: 24,
    marginBottom: 8,
  },
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
    paddingVertical: 12,
  },
  tableCell: { alignItems: 'center', justifyContent: 'center' },
  valueIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueTextBox: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
