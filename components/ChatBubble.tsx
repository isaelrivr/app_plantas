import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useAppTheme } from '../theme';
import { AssistantMessage } from '../services/assistantService';

interface ChatBubbleProps {
  message: AssistantMessage;
  onQuickReply?: (reply: string) => void;
}

/**
 * Burbuja de mensaje del asistente de plantas (punto 11).
 * El asistente (izquierda) incluye avatar; el usuario (derecha) va alineado.
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onQuickReply }) => {
  const { colors, layout, typography } = useAppTheme();
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {!isUser ? (
        <Image
          source={require('../assets/logo.png')}
          style={[
            styles.avatar,
            { borderRadius: layout.borderRadius.full },
          ]}
          resizeMode="contain"
          accessible
          accessibilityLabel="EcoScan"
        />
      ) : null}

      <View style={styles.bubbleColumn}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isUser ? colors.primary : colors.surface,
              borderColor: colors.border,
              borderRadius: layout.borderRadius.lg,
            },
            !isUser && styles.bubbleBorder,
            isUser ? styles.bubbleUser : styles.bubbleAssistant,
          ]}
        >
          <Text
            style={[
              typography.callout,
              { color: isUser ? '#FFFFFF' : colors.textPrimary },
            ]}
          >
            {message.text}
          </Text>
        </View>

        {!isUser && message.quickReplies && message.quickReplies.length > 0 && onQuickReply ? (
          <View style={styles.quickReplies}>
            {message.quickReplies.map((reply) => (
              <Pressable
                key={reply}
                onPress={() => onQuickReply(reply)}
                android_ripple={{ color: colors.primaryLight, borderless: false }}
                accessibilityRole="button"
                accessibilityLabel={`Sugerencia: ${reply}`}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={({ pressed }) => [
                  styles.quickChip,
                  {
                    borderColor: colors.primary,
                    borderRadius: layout.borderRadius.full,
                    overflow: 'hidden',
                  },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Text style={[typography.footnote, { color: colors.primary, fontWeight: '600' }]}>
                  {reply}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {message.source === 'cloud-function' ? (
          <Text style={[typography.caption2, { color: colors.textTertiary, marginTop: 4 }]}>
            Respuesta de IA
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  bubbleColumn: {
    maxWidth: '82%',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleBorder: {
    borderWidth: 1,
  },
  bubbleUser: {
    borderTopRightRadius: 4,
  },
  bubbleAssistant: {
    borderTopLeftRadius: 4,
  },
  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  quickChip: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 48,
    justifyContent: 'center',
  },
});
