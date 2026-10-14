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
import { useTranslation } from '../i18n';

export const ProfileScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const navigation = useNavigation<any>();
  const { isPremium, price } = usePremium();
  const colorScheme = useColorScheme();
  const { t } = useTranslation();

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
      title: t('Diagnósticos ilimitados por IA'),
      desc: t('Escanea tantas plantas como desees sin límites diarios.'),
      icon: 'sparkles' as const,
    },
    {
      title: t('Consejos de Clima y Ubicación'),
      desc: t('Alertas en tiempo real adaptadas a la temperatura y humedad de tu ciudad.'),
      icon: 'partly-sunny' as const,
    },
    {
      title: t('Detección temprana de plagas y hongos'),
      desc: t('Identifica manchas en hojas antes de que dañen toda la planta.'),
      icon: 'medkit' as const,
    },
    {
      title: t('Calendario inteligente de riego'),
      desc: t('Notificaciones automáticas basadas en el clima local.'),
      icon: 'alarm' as const,
    },
    {
      title: t('Soporte botánico prioritario'),
      desc: t('Consulta directa con especialistas en jardinería.'),
      icon: 'chatbubbles' as const,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxxl }}
    >
      <ScreenHeader
        title={t('Yo')}
        subtitle={t('Tu espacio y preferencias')}
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
        <Card elevated style={{ marginBottom: spacing.lg }} accessible={true} accessibilityLabel={t('Cargando datos de la suscripción')}>
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
              label={isPremium ? t('PLAN PRO ACTIVO') : t('PLAN BÁSICO GRATUITO')}
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
              {isPremium ? 'EcoScan Pro' : 'EcoScan Free'}
            </Text>
          </View>

          <View style={styles.priceContainer}>
            <Text
              style={[
                typography.title2,
                { color: isPremium ? colors.premiumGold : colors.primary, fontWeight: '700' },
              ]}
            >
              {isPremium ? t('Activo') : price}
            </Text>
            {!isPremium && (
              <Text style={[typography.caption2, { color: colors.textTertiary, textAlign: 'right' }]}>
                {t('facturación mensual')}
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
            ? t('¡Gracias por apoyar a EcoScan! Disfrutas de análisis botánicos avanzados y recomendaciones inteligentes ilimitadas.')
            : t('Desbloquea recomendaciones inteligentes de clima, diagnósticos botánicos ilimitados y alertas de riego.')}
        </Text>

        {/* Botón para abrir la pantalla de planes */}
        <Button
          title={isPremium ? t('Gestionar mi plan Pro') : t('Explorar EcoScan Pro')}
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
          accessibilityLabel={isPremium ? t('Gestionar mi plan Pro') : t('Ver planes de EcoScan Pro')}
        />
      </Card>
      )}

      {/* ACCESO A LOGROS (LOGROS DENTRO DE YO) */}
      <Card style={{ marginBottom: spacing.md }}>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => navigation.navigate('Achievements')}
          accessibilityRole="button"
          accessibilityLabel={t('Mis Logros y Medallas')}
        >
          <View
            style={[
              styles.benefitIconBox,
              { backgroundColor: colors.primaryLight, marginRight: spacing.sm },
            ]}
          >
            <Ionicons name="trophy" size={22} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>
              {t('Mis Logros y Medallas')}
            </Text>
            <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
              {t('Revisa tu racha de cuidados y recompensas')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </Card>

      {/* ACCESO A AJUSTES */}
      <Card style={{ marginBottom: spacing.lg }}>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => navigation.navigate('Settings')}
          accessibilityRole="button"
          accessibilityLabel={t('Abrir los ajustes de la aplicación')}
        >
          <View
            style={[
              styles.benefitIconBox,
              { backgroundColor: colors.surfaceSecondary, marginRight: spacing.sm },
            ]}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>{t('Ajustes de la aplicación')}</Text>
            <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
              {t('Tema, idioma, notificaciones y privacidad')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </Card>

      {/* SECCIÓN DE AYUDA Y SOPORTE */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text
          style={[
            typography.headline,
            { color: colors.textPrimary, marginBottom: spacing.sm, paddingHorizontal: spacing.xxs },
          ]}
        >
          {t('Ayuda y Preguntas Frecuentes')}
        </Text>

        <Card>
          <View style={{ paddingVertical: spacing.xs }}>
            <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '700' }]}>
              {t('¿Cómo identifico una planta?')}
            </Text>
            <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 4, lineHeight: 20 }]}>
              {t('Toca el botón verde central "Escanear", apunta a la hoja o flor y toma una foto clara. EcoScan te dirá su especie y cuidados.')}
            </Text>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border, marginVertical: spacing.sm }]} />

          <View style={{ paddingVertical: spacing.xs }}>
            <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '700' }]}>
              {t('¿Cómo sé cuándo regar?')}
            </Text>
            <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 4, lineHeight: 20 }]}>
              {t('En la pestaña "Hoy" verás las plantas que necesitan agua cada día. También puedes consultar tu "Calendario de Cuidados".')}
            </Text>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border, marginVertical: spacing.sm }]} />

          <View style={{ paddingVertical: spacing.xs }}>
            <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '700' }]}>
              {t('¿Qué hago si mi planta tiene hojas amarillas?')}
            </Text>
            <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 4, lineHeight: 20 }]}>
              {t('Usa el modo "Mi planta está enferma" en el escáner para obtener un diagnóstico inmediato y remedios recomendados.')}
            </Text>
          </View>
        </Card>
      </View>

      {/* BENEFICIOS DE PREMIUM */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text
          style={[
            typography.headline,
            { color: colors.textPrimary, marginBottom: spacing.sm, paddingHorizontal: spacing.xxs },
          ]}
        >
          {t('Beneficios incluidos en EcoScan Pro')}
        </Text>

        <Card>
          {benefits.map((item, index) => (
            <View key={index}>
              <View
                style={styles.benefitItem}
                accessible={true}
                accessibilityLabel={`${item.title}. ${item.desc}. ${isPremium ? t('Incluido en tu plan') : t('Requiere plan Pro')}`}
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
        {t('Detalles de la Aplicación')}
      </Text>

      <Card style={{ marginBottom: spacing.xl }}>
        <View style={styles.settingRow}>
          <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Tema del sistema')}</Text>
          <Text style={[typography.subheadline, { color: colors.textSecondary }]}>
            {colorScheme === 'dark' ? t('Oscuro (Dark Mode)') : t('Claro (Light Mode)')}
          </Text>
        </View>

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <View style={styles.settingRow}>
          <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Versión')}</Text>
          <Text style={[typography.subheadline, { color: colors.textSecondary }]}>
            1.0.0
          </Text>
        </View>

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <View style={styles.settingRow}>
          <Text style={[typography.body, { color: colors.textPrimary }]}>{t('Base de datos botánica')}</Text>
          <Text style={[typography.subheadline, { color: colors.textSecondary }]}>
            {t('Catálogo integrado (sin conexión)')}
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
