import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { Button } from '../components/Button';
import { useTranslation } from '../i18n';
import { requestNotificationPermissions } from '../services/notificationService';

interface Page {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  accent: 'primary' | 'accent' | 'premiumGold';
}

const PAGES: Page[] = [
  {
    icon: 'leaf',
    title: 'Bienvenido a EcoScan',
    description: 'Tu compañero inteligente para mantener cada planta sana y radiante, sin necesidad de ser experto.',
    accent: 'primary',
  },
  {
    icon: 'camera',
    title: 'Identifica al instante',
    description: 'Escanea cualquier planta con la cámara y descubre su especie, cuidados, luz ideal, riego y toxicidad.',
    accent: 'accent',
  },
  {
    icon: 'notifications',
    title: 'Nunca olvides un cuidado',
    description: 'Recibe recordatorios de riego, abonos y podas, sigue tu racha de cuidados y mira crecer tus plantas.',
    accent: 'premiumGold',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { colors, motion, spacing, typography } = useAppTheme();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [welcomeScale] = useState(() => new Animated.Value(motion.isReduced ? 1 : 0.6));
  const [welcomeOpacity] = useState(() => new Animated.Value(motion.isReduced ? 1 : 0));

  useEffect(() => {
    if (motion.isReduced) {
      welcomeScale.setValue(1);
      welcomeOpacity.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.spring(welcomeScale, { toValue: 1, damping: 12, stiffness: 140, useNativeDriver: true }),
      Animated.timing(welcomeOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [welcomeScale, welcomeOpacity, motion.isReduced]);

  const getAccent = (accent: Page['accent']) => colors[accent];

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1));
    setIndex(newIndex);
  };

  const handleNext = async () => {
    if (index < PAGES.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (index + 1), animated: !motion.isReduced });
      setIndex(index + 1);
      return;
    }
    try {
      await requestNotificationPermissions();
    } catch {}
    onComplete();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        onPress={onComplete}
        accessibilityRole="button"
        accessibilityLabel={t('Saltar introducción')}
        accessibilityHint={t('Pasa directamente a la pantalla principal')}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.skipButton}
      >
        <Text style={[typography.subheadline, { color: colors.textSecondary, fontWeight: '600' }]}>{t('Saltar')}</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        style={{ flex: 1 }}
      >
        {PAGES.map((page, i) => {
          const accent = getAccent(page.accent);
          const isWelcome = i === 0;
          return (
            <View key={page.title} style={[styles.page, { width }]}>
              <Animated.View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: accent + '22',
                    transform: [{ scale: isWelcome ? welcomeScale : 1 }],
                    opacity: isWelcome ? welcomeOpacity : 1,
                  },
                ]}
              >
                <Ionicons name={page.icon} size={72} color={accent} />
              </Animated.View>
              <Text style={[typography.largeTitle, { color: colors.textPrimary, textAlign: 'center', marginTop: spacing.xl }]}>
                {t(page.title)}
              </Text>
              <Text
                style={[
                  typography.body,
                  { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.lg, lineHeight: 26 },
                ]}
              >
                {t(page.description)}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots} accessibilityRole="none">
          {PAGES.map((page, i) => (
            <View
              key={page.title}
              style={[
                styles.dot,
                {
                  backgroundColor: i === index ? colors.primary : colors.border,
                  width: i === index ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Button
          title={index < PAGES.length - 1 ? t('Siguiente') : t('Comenzar')}
          onPress={handleNext}
          variant="primary"
          size="lg"
          style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}
          icon={
            index < PAGES.length - 1 ? undefined : <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 8,
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
