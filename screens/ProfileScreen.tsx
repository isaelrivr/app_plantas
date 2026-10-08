import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme';
import { usePremium } from '../context/PremiumContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/ErrorBanner';
import { SkeletonBox } from '../components/SkeletonLoader';

export const ProfileScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const navigation = useNavigation<any>();
  const { isPremium, price } = usePremium();
  const colorScheme = useColorScheme();

  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setProfileLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleTogglePremium = () => {
    navigation.navigate('Paywall');
  };

  const retryProfile = () => {
    setErrorMessage(null);
    setProfileLoading(true);
    setTimeout(() => setProfileLoading(false), 600);
  };

  const benefits = [
    {
      title: 'Diagnósticos ilimitados por IA',
      desc: 'Escanea tantas plantas como desees sin límites diarios.',
      icon: 'sparkles' as const,
    },
    {
      title: 'Consejos de Clima y Ubicación',
      desc: 'Alertas en tiempo real adaptadas a la temperatura y humedad de tu ciudad.',
      icon: 'partly-sunny' as const,
    },
    {
      title: 'Detección temprana de plagas y hongos',
      desc: 'Identifica manchas en hojas antes de que dañen toda la planta.',
      icon: 'medkit' as const,
    },
    {
      title: 'Calendario inteligente de riego',
      desc: 'Notificaciones automáticas basadas en el clima local.',
      icon: 'alarm' as const,
    },
    {
      title: 'Soporte botánico prioritario',
      desc: 'Consulta directa con especialistas en jardinería.',
      icon: 'chatbubbles' as const,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxxl }}
    >
      <ScreenHeader
        title="Perfil"
        subtitle="Ajustes y Suscripción"
      />

      {/* TARJETA DE ESTADO DE SUSCRIPCIÓN */}
      {errorMessage && (
        <ErrorBanner
          message={errorMessage}
          onRetry={profileLoading ? retryProfile : handleTogglePremium}
          style={{ marginBottom: spacing.md }}
        />
      )}

      {profileLoading ? (
        <Card elevated style={{ marginBottom: spacing.lg }} accessible={true} accessibilityLabel="Cargando datos de la suscripción">
          <SkeletonBox width="45%" height={22} borderRadius={6} />
          <SkeletonBox width="70%" height={26} borderRadius={6} style={{ marginTop: 12 }} />
          <SkeletonBox width="100%" height={16} borderRadius={6} style={{ marginTop: 16 }} />
          <SkeletonBox width="100%" height={16} borderRadius={6} style={{ marginTop: 8 }} />
          <SkeletonBox width="100%" height={44} borderRadius={12} style={{ marginTop: 20 }} />
        </Card>
      ) : (
      <Card
        elevated
        style={[
          styles.planCard,
          {
            borderColor: isPremium ? colors.premiumGold : colors.border,
            backgroundColor: isPremium ? colors.premiumGoldLight : colors.surface,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <View style={styles.planHeader}>
          <View>
            <Badge
              label={isPremium ? 'PLAN PRO ACTIVO' : 'PLAN BÁSICO GRATUITO'}
              variant={isPremium ? 'premium' : 'neutral'}
              icon={
                <Ionicons
                  name={isPremium ? 'sparkles' : 'person'}
                  size={13}
                  color={isPremium ? colors.premiumGold : colors.textSecondary}
                />
              }
            />
            <Text
              style={[
                typography.title1,
                {
                  color: colors.textPrimary,
                  marginTop: spacing.xs,
                  fontWeight: '700',
                },
              ]}
            >
              {isPremium ? 'Plantae Pro' : 'Plantae Free'}
            </Text>
          </View>

          <View style={styles.priceContainer}>
            <Text
              style={[
                typography.title2,
                { color: isPremium ? colors.premiumGold : colors.primary, fontWeight: '700' },
              ]}
            >
              {isPremium ? 'Activo' : price}
            </Text>
            {!isPremium && (
              <Text style={[typography.caption2, { color: colors.textTertiary, textAlign: 'right' }]}>
                facturación mensual
              </Text>
            )}
          </View>
        </View>

        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.md, lineHeight: 22 },
          ]}
        >
          {isPremium
            ? '¡Gracias por apoyar a Plantae! Disfrutas de análisis botánicos avanzados y recomendaciones inteligentes ilimitadas.'
            : 'Desbloquea recomendaciones inteligentes de clima, diagnósticos botánicos ilimitados y alertas de riego.'}
        </Text>

        {/* Botón para abrir la pantalla de planes */}
        <Button
          title={isPremium ? 'Gestionar mi plan Pro' : 'Explorar Plantae Pro'}
          onPress={handleTogglePremium}
          variant={isPremium ? 'secondary' : 'premium'}
          size="md"
          icon={
            <Ionicons
              name={isPremium ? 'settings-outline' : 'sparkles'}
              size={18}
              color={isPremium ? colors.textPrimary : '#1C1C1E'}
            />
          }
          accessibilityLabel={isPremium ? 'Gestionar mi plan Pro' : 'Ver planes de Plantae Pro'}
        />
      </Card>
      )}

      {/* ACCESO A AJUSTES */}
      <Card style={{ marginBottom: spacing.lg }}>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => navigation.navigate('Settings')}
          accessibilityRole="button"
          accessibilityLabel="Abrir los ajustes de la aplicación"
        >
          <View style={{ flex: 1 }}>
            <Text style={[typography.body, { color: colors.textPrimary }]}>Ajustes de la aplicación</Text>
            <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
              Tema, idioma, notificaciones y privacidad
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </Card>

      {/* BENEFICIOS DE PREMIUM */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text
          style={[
            typography.headline,
            { color: colors.textPrimary, marginBottom: spacing.sm, paddingHorizontal: spacing.xxs },
          ]}
        >
          Beneficios incluidos en Plantae Pro
        </Text>

        <Card>
          {benefits.map((item, index) => (
            <View key={index}>
              <View
                style={styles.benefitItem}
                accessible={true}
                accessibilityLabel={`${item.title}. ${item.desc}. ${isPremium ? 'Incluido en tu plan' : 'Requiere plan Pro'}`}
              >
                <View
                  style={[
                    styles.benefitIconBox,
                    {
                      backgroundColor: isPremium ? colors.premiumGoldLight : colors.primaryLight,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={isPremium ? colors.premiumGold : colors.primary}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={[typography.headline, { color: colors.textPrimary, fontSize: 16 }]}>
                    {item.title}
                  </Text>
                  <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
                    {item.desc}
                  </Text>
                </View>
                {isPremium ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                ) : (
                  <Ionicons name="lock-closed" size={16} color={colors.textTertiary} />
                )}
              </View>
              {index < benefits.length - 1 && (
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </Card>
      </View>

      {/* DETALLES DE SISTEMA Y ENTORNO */}
      <Text
        style={[
          typography.headline,
          { color: colors.textPrimary, marginBottom: spacing.sm, paddingHorizontal: spacing.xxs },
        ]}
      >
        Detalles de la Aplicación
      </Text>

      <Card style={{ marginBottom: spacing.xl }}>
        <View style={styles.settingRow}>
          <Text style={[typography.body, { color: colors.textPrimary }]}>Tema del sistema</Text>
          <Text style={[typography.subheadline, { color: colors.textSecondary }]}>
            {colorScheme === 'dark' ? 'Oscuro (Dark Mode)' : 'Claro (Light Mode)'}
          </Text>
        </View>

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <View style={styles.settingRow}>
          <Text style={[typography.body, { color: colors.textPrimary }]}>Versión</Text>
          <Text style={[typography.subheadline, { color: colors.textSecondary }]}>
            1.0.0 (Expo SDK 57)
          </Text>
        </View>

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <View style={styles.settingRow}>
          <Text style={[typography.body, { color: colors.textPrimary }]}>Base de datos botánica</Text>
          <Text style={[typography.subheadline, { color: colors.textSecondary }]}>
            Mock Local (Listo para Firebase)
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  planCard: {
    borderWidth: 1.5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  benefitIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    width: '100%',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
});
