import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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

export const AssistantScreen: React.FC = () => {
  const { colors, layout, spacing, typography } = useAppTheme();
  const navigation = useNavigation<any>();
  const { plants } = useGarden();
  const { t } = useTranslation();

  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([getWelcomeMessage()]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const scrollToEnd = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

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
        plantName: plants[0]?.name,
      });
      setMessages((prev) => [...prev, reply]);
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
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: Platform.OS === 'ios' ? 12 : 16,
          },
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
        <View style={{ alignItems: 'center' }}>
          <Text style={[typography.headline, { color: colors.textPrimary }]}>{t('Asistente de Plantas')}</Text>
          <Text style={[typography.caption2, { color: colors.textTertiary }]}>{t('Respuestas botánicas al instante')}</Text>
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
                  <TouchableOpacity
                    key={q}
                    onPress={() => handleSend(q)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={t('Preguntar: {pregunta}', { pregunta: t(q) })}
                    style={[
                      styles.suggestionChip,
                      { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: layout.borderRadius.md },
                    ]}
                  >
                    <Text style={[typography.footnote, { color: colors.textPrimary }]}>{t(q)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.inputBar,
            { backgroundColor: colors.surface, borderTopColor: colors.border, paddingHorizontal: spacing.md },
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
                backgroundColor: colors.surfaceSecondary,
                borderRadius: layout.borderRadius.full,
              },
            ]}
            accessibilityLabel={t('Mensaje para el asistente')}
            onSubmitEditing={() => handleSend(input)}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={() => handleSend(input)}
            disabled={!input.trim() || typing}
            accessibilityRole="button"
            accessibilityLabel={t('Enviar mensaje')}
            style={[
              styles.sendButton,
              {
                backgroundColor: input.trim() && !typing ? colors.primary : colors.border,
                borderRadius: layout.borderRadius.full,
              },
            ]}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
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
  backButton: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
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
    minHeight: 44,
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
    minHeight: 44,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
