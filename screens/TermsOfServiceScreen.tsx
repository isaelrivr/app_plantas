import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { useTranslation } from '../i18n';
import { Card } from '../components/Card';
import { useFeedback } from '../context/FeedbackContext';

const PUBLIC_URL = 'https://ecoscan.app/terminos';

export const TermsOfServiceScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { showToast } = useFeedback();

  const handleShareUrl = async () => {
    try {
      Haptics.selectionAsync();
      await Share.share({
        title: t('Términos de Servicio de EcoScan'),
        url: PUBLIC_URL,
        message: PUBLIC_URL,
      });
    } catch {
      showToast({ message: PUBLIC_URL, type: 'info' });
    }
  };

  const handleOpenBrowser = () => {
    Linking.openURL(PUBLIC_URL).catch(() => {
      showToast({ message: PUBLIC_URL, type: 'info' });
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: Platform.OS === 'ios' ? 12 : 16 },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={t('Volver')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
          <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>{t('Atrás')}</Text>
        </TouchableOpacity>
        <Text style={[typography.headline, { color: colors.textPrimary }]}>{t('Términos de uso')}</Text>
        <TouchableOpacity
          onPress={handleShareUrl}
          style={styles.actionHeaderBtn}
          accessibilityRole="button"
          accessibilityLabel={t('Compartir enlace público')}
        >
          <Ionicons name="share-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxxl }}>
        {/* ENCABEZADO */}
        <Card elevated style={{ marginBottom: spacing.md }}>
          <View style={styles.badgeRow}>
            <Ionicons name="document-text" size={24} color={colors.primary} />
            <Text style={[typography.headline, { color: colors.primary, marginLeft: 8 }]}>
              {t('Términos y Condiciones')}
            </Text>
          </View>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 22 }]}>
            {t('Al descargar y utilizar EcoScan aceptas los siguientes términos de servicio, pensados para proteger tanto tu experiencia como la integridad de la plataforma.')}
          </Text>
          <TouchableOpacity onPress={handleOpenBrowser} style={{ marginTop: spacing.sm }}>
            <Text style={[typography.caption1, { color: colors.primary, fontWeight: '700' }]}>
              {PUBLIC_URL} ↗
            </Text>
          </TouchableOpacity>
        </Card>

        {/* 1. OBJETO Y PROPÓSITO INFORMATIVO */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: 6 }]}>
            {t('1. Propósito Informativo y Educativo')}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
            {t('EcoScan es una herramienta de asistencia botánica orientada al cuidado doméstico de plantas. Aunque utilizamos algoritmos avanzados de reconocimiento y bases botánicas contrastadas, las recomendaciones de riego y toxicidad tienen fin orientativo y no sustituyen el dictamen de un veterinario o botánico certificado.')}
          </Text>
        </Card>

        {/* 2. PLANES Y SUSCRIPCIÓN PRO */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: 6 }]}>
            {t('2. Planes Free y Suscripción Pro')}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
            {t('La versión Free permite identificar hasta 3 especies por día y organizar hasta 5 plantas en tu jardín de forma gratuita e indefinida. El plan EcoScan Pro desbloquea identificaciones ilimitadas, diagnósticos foliares y eliminación de anuncios mediante suscripción mensual o anual con 7 días de prueba.')}
          </Text>
        </Card>

        {/* 3. RENOVACIÓN Y CANCELACIÓN */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: 6 }]}>
            {t('3. Renovación y Cancelación Transparente')}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
            {t('El pago se gestiona directamente por Google Play o Apple App Store. La suscripción se renueva de forma automática salvo que la canceles al menos 24 horas antes del fin del periodo actual. Puedes cancelar o cambiar tu suscripción en cualquier momento desde los ajustes de tu cuenta de Google Play o Apple ID.')}
          </Text>
        </Card>

        {/* 4. PROPIEDAD INTELECTUAL */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: 6 }]}>
            {t('4. Propiedad del Contenido')}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
            {t('Tus fotos y notas pertenecen exclusivamente a ti. EcoScan se reserva los derechos sobre la marca, el código fuente, la interfaz de usuario y las bases de datos botánicas compiladas en la aplicación.')}
          </Text>
        </Card>

        {/* 5. CONTACTO */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: 6 }]}>
            {t('5. Soporte y Consultas Legales')}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
            {t('Para cualquier consulta relacionada con los términos de servicio:')}
          </Text>
          <Text style={[typography.headline, { color: colors.primary, marginTop: 4 }]}>
            legal@ecoscan.app
          </Text>
        </Card>

        <Text style={[typography.caption2, { color: colors.textTertiary, textAlign: 'center', lineHeight: 18 }]}>
          {t('Última actualización: Octubre 2026 · Versión 1.0.0')}
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', minHeight: 48, minWidth: 48 },
  actionHeaderBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
});
