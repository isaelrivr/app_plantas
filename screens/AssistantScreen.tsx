import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { ChatBubble } from '../components/ChatBubble';
import { useGarden } from '../context/GardenContext';
import {
  AssistantMessage,
  createMessage,
  getWelcomeMessage,
  sendAssistantMessage,
  SUGGESTED_QUESTIONS,
} from '../services/assistantService';
import { useTranslation } from '../i18n';
import { announce } from '../services/accessibilityService';

export const AssistantScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { plants } = useGarden();
  const { t } = useTranslation();

  const plantNameFromRoute = route.params?.plantName;
  const targetPlantName = plantNameFromRoute || plants[0]?.name;

  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    if (plantNameFromRoute) {
      return [
        createMessage(
          'assistant',
          t('¡Hola! Soy tu asistente botánico de EcoScan 🌿. Pregúntame sobre riego, luz, plagas, toxicidad o cuidados de tu {nombre}.', {
            nombre: plantNameFromRoute,
          }),
          {
            quickReplies: [
              t('¿Cada cuántos días se riega?'),
              t('¿Cuánta luz necesita?'),
              t('¿Es tóxica para mascotas?'),
              t('¿Por qué tiene hojas amarillas?'),
            ],
            source: 'mock',
          }
        ),
      ];
    }
    return [getWelcomeMessage()];
  });
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const scrollToEnd = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      scrollToEnd();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, typing]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    try { Haptics.selectionAsync(); } catch {}

    const userMessage = createMessage('user', trimmed);
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setTyping(true);

    try {
      const reply = await sendAssistantMessage(trimmed, {
        plantName: targetPlantName,
      });
      setMessages((prev) => [...prev, reply]);
      announce(reply.text);
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    } catch {
      setMessages((prev) => [
        ...prev,
        createMessage('assistant', t('Lo siento, hubo un problema al procesar tu pregunta. Inténtalo de nuevo.')),
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surfaceContainer,
            borderBottomColor: colors.outlineVariant,
            paddingTop: insets.top + (Platform.OS === 'ios' ? 8 : 12),
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          android_ripple={{ color: colors.primaryLight, borderless: true, radius: 24 }}
          accessibilityRole="button"
          accessibilityLabel={t('Volver')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
          <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>{t('Atrás')}</Text>
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={[typography.headline, { color: colors.textPrimary }]}>{t('Asistente de Plantas')}</Text>
          <Text style={[typography.footnote, { color: colors.textSecondary }]}>{t('Respuestas botánicas al instante')}</Text>
        </View>
        <View style={styles.actionHeaderBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.lg }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              onQuickReply={message.role === 'assistant' ? handleSend : undefined}
            />
          ))}

          {typing ? (
            <View style={styles.typingRow}>
              <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="leaf" size={16} color={colors.primary} />
              </View>
              <View
                style={[
                  styles.typingBubble,
                  { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: layout.borderRadius.lg },
                ]}
              >
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[typography.footnote, { color: colors.textSecondary, marginLeft: 8 }]}>
                  {t('Pensando...')}
                </Text>
              </View>
            </View>
          ) : null}

          {messages.length <= 1 ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={[typography.footnote, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
                {t('Preguntas frecuentes')}
              </Text>
              <View style={styles.suggestions}>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <Pressable
                    key={q}
                    onPress={() => handleSend(q)}
                    android_ripple={{ color: colors.primaryLight, borderless: false }}
                    accessibilityRole="button"
                    accessibilityLabel={t('Preguntar: {pregunta}', { pregunta: t(q) })}
                    style={({ pressed }) => [
                      styles.suggestionChip,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        borderRadius: layout.borderRadius.lg,
                        overflow: 'hidden',
                      },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Text style={[typography.footnote, { color: colors.textPrimary }]}>{t(q)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.surfaceContainer,
              borderTopColor: colors.outlineVariant,
              paddingHorizontal: spacing.md,
              paddingBottom: isKeyboardVisible ? 10 : Math.max(insets.bottom, 10),
            },
          ]}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t('Escribe tu pregunta...')}
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                backgroundColor: colors.surfaceContainerHigh,
                borderColor: colors.outlineVariant,
                borderWidth: 1,
                borderRadius: layout.borderRadius.full,
              },
            ]}
            accessibilityLabel={t('Mensaje para el asistente')}
            onSubmitEditing={() => handleSend(input)}
            returnKeyType="send"
          />
          <Pressable
            onPress={() => handleSend(input)}
            disabled={!input.trim() || typing}
            android_ripple={{ color: '#FFFFFF33', borderless: true, radius: 24 }}
            accessibilityRole="button"
            accessibilityLabel={t('Enviar mensaje')}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: input.trim() && !typing ? colors.primary : colors.surfaceContainerHighest,
                borderRadius: layout.borderRadius.full,
                overflow: 'hidden',
              },
              pressed && input.trim() && !typing && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="send" size={18} color={input.trim() && !typing ? colors.onPrimary : colors.textTertiary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  actionHeaderBtn: { width: 60 },
  typingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestions: { gap: 8 },
  suggestionChip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 48,
    justifyContent: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  sendButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
