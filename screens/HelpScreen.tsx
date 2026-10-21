import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { useTranslation } from '../i18n';
import { Card } from '../components/Card';
import { BottomSheet } from '../components/BottomSheet';
import { MaterialSwitch } from '../components/MaterialSwitch';
import { useFeedback } from '../context/FeedbackContext';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'scan-tips',
    question: '¿Cómo reconozco una planta con la cámara?',
    answer:
      'Toca el botón verde central "Escanear". Apunta a una hoja o flor bien iluminada, procurando que no haya sombras intensas ni fondos confusos, y pulsa el disparador. EcoScan te mostrará la especie más probable y cómo cuidarla.',
  },
  {
    id: 'notifications',
    question: '¿Por qué no recibo avisos de riego?',
    answer:
      'Asegúrate de haber activado los recordatorios en Ajustes > Notificaciones. Además, comprueba que en los Ajustes del sistema de tu teléfono la aplicación EcoScan tenga permiso para mostrar notificaciones.',
  },
  {
    id: 'privacy-photos',
    question: '¿Mis fotos se envían a internet o son privadas?',
    answer:
      'Tus fotos se procesan para reconocer la especie y se guardan únicamente en tu teléfono. EcoScan no vende tus datos ni almacena tus fotografías familiares en servidores remotos.',
  },
  {
    id: 'edit-care',
    question: '¿Cómo cambio la frecuencia de riego de una planta?',
    answer:
      'Entra en la pestaña Calendario. En cualquier tarea de cuidado verás el botón con un lápiz para editar. Desde allí puedes cambiar la próxima fecha de aviso y los días de repetición (por ejemplo, cada 7 o 14 días).',
  },
  {
    id: 'manage-pro',
    question: '¿Cómo activo o cancelo EcoScan Pro?',
    answer:
      'Puedes iniciar la prueba gratuita de 7 días desde la sección Pro. Si deseas cancelar, puedes hacerlo en cualquier momento antes de que termine el periodo desde los ajustes de suscripción de tu cuenta de Google Play o Apple ID.',
  },
  {
    id: 'offline-use',
    question: '¿Puedo usar la app sin conexión a internet?',
    answer:
      'Sí. Todo tu jardín, tus tareas de cuidado, tus fotos y el catálogo de la Enciclopedia están guardados localmente y se pueden consultar en cualquier momento sin datos ni wifi.',
  },
];

export const HelpScreen: React.FC = () => {
  const { colors, layout, spacing, typography, isDark } = useAppTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showToast } = useFeedback();

  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);

  const toggleFaq = (id: string) => {
    try { Haptics.selectionAsync(); } catch {}
    setExpandedFaq((prev) => (prev === id ? null : id));
  };

  const handleContactEmail = () => {
    try { Haptics.selectionAsync(); } catch {}
    Linking.openURL('mailto:soporte@ecoscan.app?subject=Consulta%20sobre%20EcoScan').catch(() => {
      showToast({ message: t('Escríbenos a soporte@ecoscan.app'), type: 'info' });
    });
  };

  const handleSendReport = () => {
    if (!reportText.trim()) {
      showToast({ message: t('Describe brevemente el problema antes de enviar.'), type: 'error' });
      return;
    }

    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    const diagnosticsInfo = includeDiagnostics
      ? `\n\n--- Diagnóstico técnico ---\nSO: ${Platform.OS} ${Platform.Version}\nApp: EcoScan v1.0.0`
      : '';
    const emailSubject = encodeURIComponent('Reporte de fallo en EcoScan');
    const emailBody = encodeURIComponent(reportText.trim() + diagnosticsInfo);

    Linking.openURL(`mailto:soporte@ecoscan.app?subject=${emailSubject}&body=${emailBody}`).catch(() => {
      showToast({ message: t('Reporte recibido. Gracias por ayudarnos a mejorar.'), type: 'success' });
    });

    setReportModalOpen(false);
    setReportText('');
    showToast({ message: t('Gracias por tu reporte. Lo revisaremos enseguida.'), type: 'success' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 12 : 16),
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed && Platform.OS === 'ios' ? 0.7 : 1 },
          ]}
          android_ripple={{ color: colors.primary + '20', borderless: true, radius: 24 }}
          accessibilityRole="button"
          accessibilityLabel={t('Volver')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
          <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>{t('Atrás')}</Text>
        </Pressable>
        <Text style={[typography.headline, { color: colors.textPrimary }]}>{t('Ayuda')}</Text>
        <View style={styles.actionHeaderBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: Math.max(insets.bottom + 24, spacing.xxxl),
        }}
      >
        {/* CONTACTO RÁPIDO */}
        <Card
          variant="flat"
          style={{
            marginBottom: spacing.lg,
            borderRadius: layout.borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <View style={styles.contactRow}>
            <View style={[styles.contactIconCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="chatbubbles" size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[typography.headline, { color: colors.textPrimary }]}>
                {t('¿Necesitas ayuda con tus plantas?')}
              </Text>
              <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
                {t('Estamos aquí para ayudarte. Escríbenos o reporta cualquier anomalía.')}
              </Text>
            </View>
          </View>

          <View style={styles.contactButtonsRow}>
            <Pressable
              onPress={handleContactEmail}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: colors.primary,
                  minHeight: layout.minTouchTarget,
                  overflow: 'hidden',
                  opacity: pressed && Platform.OS === 'ios' ? 0.8 : 1,
                },
              ]}
              android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
              accessibilityRole="button"
              accessibilityLabel={t('Enviar correo a soporte')}
            >
              <Ionicons name="mail" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={[typography.subheadline, { color: '#FFFFFF', fontWeight: '700' }]}>
                {t('Escribir correo')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setReportModalOpen(true)}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                  borderWidth: 1,
                  minHeight: layout.minTouchTarget,
                  overflow: 'hidden',
                  opacity: pressed && Platform.OS === 'ios' ? 0.8 : 1,
                },
              ]}
              android_ripple={{ color: colors.primary + '20' }}
              accessibilityRole="button"
              accessibilityLabel={t('Reportar un problema técnico')}
            >
              <Ionicons name="bug-outline" size={18} color={colors.textPrimary} style={{ marginRight: 6 }} />
              <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600' }]}>
                {t('Reportar fallo')}
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* PREGUNTAS FRECUENTES */}
        <Text
          style={[
            typography.headline,
            { color: colors.textPrimary, marginBottom: spacing.sm, paddingHorizontal: spacing.xxs },
          ]}
        >
          {t('Preguntas Frecuentes')}
        </Text>

        <View style={{ gap: spacing.sm }}>
          {FAQS.map((faq) => {
            const isExpanded = expandedFaq === faq.id;
            return (
              <Card
                key={faq.id}
                variant="flat"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  borderRadius: layout.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }}
              >
                <Pressable
                  onPress={() => toggleFaq(faq.id)}
                  style={({ pressed }) => [
                    styles.faqHeader,
                    { opacity: pressed && Platform.OS === 'ios' ? 0.75 : 1 },
                  ]}
                  android_ripple={{ color: colors.primary + '18' }}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isExpanded }}
                  accessibilityLabel={t(faq.question)}
                >
                  <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '700', flex: 1 }]}>
                    {t(faq.question)}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textSecondary}
                    style={{ marginLeft: 8 }}
                  />
                </Pressable>

                {isExpanded && (
                  <View style={[styles.faqBody, { backgroundColor: isDark ? '#1C1C1E' : '#F9F9FB', borderTopColor: colors.border }]}>
                    <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
                      {t(faq.answer)}
                    </Text>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      </ScrollView>

      {/* MODAL: REPORTAR PROBLEMA */}
      <BottomSheet
        visible={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title={t('Reportar un problema')}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '700', marginBottom: 6 }]}>
            {t('¿Qué problema has encontrado?')}
          </Text>
          <TextInput
            value={reportText}
            onChangeText={setReportText}
            placeholder={t('Explícanos qué pasó para que podamos corregirlo...')}
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            style={[
              styles.textArea,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            accessibilityLabel={t('Descripción del problema')}
          />

          <View style={[styles.diagnosticsRow, { marginTop: spacing.md }]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600' }]}>
                {t('Incluir diagnóstico del sistema')}
              </Text>
              <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                {t('Versión de la app y del sistema para resolver el fallo más rápido.')}
              </Text>
            </View>
            <MaterialSwitch
              value={includeDiagnostics}
              onValueChange={setIncludeDiagnostics}
              accessibilityLabel={t('Incluir diagnóstico del sistema')}
            />
          </View>

          <Pressable
            onPress={handleSendReport}
            style={({ pressed }) => [
              styles.submitReportBtn,
              {
                backgroundColor: colors.primary,
                minHeight: layout.minTouchTarget,
                marginTop: spacing.xl,
                overflow: 'hidden',
                opacity: pressed && Platform.OS === 'ios' ? 0.85 : 1,
              },
            ]}
            android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
            accessibilityRole="button"
            accessibilityLabel={t('Enviar reporte de fallo')}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={[typography.headline, { color: '#FFFFFF', fontWeight: '700' }]}>
              {t('Enviar reporte')}
            </Text>
          </Pressable>
        </ScrollView>
      </BottomSheet>
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
  actionHeaderBtn: { width: 48 },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contactIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 56,
  },
  faqBody: {
    padding: 16,
    borderTopWidth: 1,
  },
  textArea: {
    height: 110,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  diagnosticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  submitReportBtn: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});
