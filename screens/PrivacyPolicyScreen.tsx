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

const PUBLIC_URL = 'https://ecoscan.app/privacidad';

export const PrivacyPolicyScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { showToast } = useFeedback();

  const handleShareUrl = async () => {
    try {
      Haptics.selectionAsync();
      await Share.share({
        title: t('Política de Privacidad de EcoScan'),
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
        <Text style={[typography.headline, { color: colors.textPrimary }]}>{t('Privacidad')}</Text>
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
        {/* ENCABEZADO Y RESUMEN */}
        <Card elevated style={{ marginBottom: spacing.md }}>
          <View style={styles.badgeRow}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <Text style={[typography.headline, { color: colors.primary, marginLeft: 8 }]}>
              {t('Tu privacidad es lo primero')}
            </Text>
          </View>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 22 }]}>
            {t('EcoScan está diseñada bajo el principio de privacidad por diseño. Tus plantas, fotos y datos pertenecen únicamente a ti.')}
          </Text>
          <TouchableOpacity onPress={handleOpenBrowser} style={{ marginTop: spacing.sm }}>
            <Text style={[typography.caption1, { color: colors.primary, fontWeight: '700' }]}>
              {PUBLIC_URL} ↗
            </Text>
          </TouchableOpacity>
        </Card>

        {/* 1. FOTOS Y CÁMARA */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: 6 }]}>
            {t('1. Cámara y Fotografías')}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
            {t('El permiso de cámara solo se utiliza para capturar la planta que deseas identificar o diagnosticar. Las imágenes se guardan exclusivamente en el almacenamiento local de tu dispositivo. Nunca subimos fotos a servidores remotos sin tu consentimiento ni las utilizamos para entrenar modelos públicos.')}
          </Text>
        </Card>

        {/* 2. UBICACIÓN Y CLIMA */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: 6 }]}>
            {t('2. Ubicación y Datos del Clima')}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
            {t('El permiso de ubicación aproximada se usa para consultar el clima local en Open-Meteo y adaptar los recordatorios de riego. Tu posición exacta nunca se registra en bases de datos ni se comparte con terceros. Puedes elegir tu ciudad manualmente en Ajustes si prefieres no otorgar acceso GPS.')}
          </Text>
        </Card>

        {/* 3. ALMACENAMIENTO LOCAL */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: 6 }]}>
            {t('3. Almacenamiento y Control Total')}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
            {t('Tu jardín, tareas y diario de crecimiento se almacenan en tu propio dispositivo. Puedes exportar una copia completa en formato JSON o borrar todos los datos en un solo toque desde los Ajustes de la aplicación.')}
          </Text>
        </Card>

        {/* 4. DIAGNÓSTICO ANÓNIMO Y CALIDAD */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: 6 }]}>
            {t('4. Analítica y Diagnóstico Opcional')}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
            {t('Solo recopilamos eventos anónimos de usabilidad y fallos si activas voluntariamente la casilla "Diagnóstico anónimo y calidad" en Ajustes. No recopilamos nombres, correos ni identificadores personales (cero PII).')}
          </Text>
        </Card>

        {/* 5. CONTACTO */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: 6 }]}>
            {t('5. Contacto del Responsable')}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
            {t('Para cualquier duda o solicitud referente a tus derechos de privacidad, escríbenos directamente a:')}
          </Text>
          <Text style={[typography.headline, { color: colors.primary, marginTop: 4 }]}>
            privacidad@ecoscan.app
          </Text>
        </Card>

        <Text style={[typography.caption2, { color: colors.textTertiary, textAlign: 'center', lineHeight: 18 }]}>
          {t('Última actualización: Octubre 2026 · Conforme a GDPR, CCPA y directrices de App Store y Google Play.')}
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
