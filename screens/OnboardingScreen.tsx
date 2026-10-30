import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme';
import { Button } from '../components/Button';
import { useTranslation } from '../i18n';
import { useSettings, UserGoal, LANGUAGES } from '../context/SettingsContext';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { colors, layout, motion, spacing, typography } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const { language, setLanguage, userGoal, setUserGoal } = useSettings();
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [index, setIndex] = useState(0);

  const GOALS: { key: UserGoal; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    {
      key: 'identify',
      title: t('Identificar mis plantas'),
      subtitle: t('Escanea con la cámara para saber qué especie tienes'),
      icon: 'camera',
    },
    {
      key: 'watering',
      title: t('No olvidar el riego'),
      subtitle: t('Recordatorios claros según el clima y cada especie'),
      icon: 'water',
    },
    {
      key: 'cure',
      title: t('Curar una planta enferma'),
      subtitle: t('Diagnostica hojas amarillas, manchas y plagas'),
      icon: 'medkit',
    },
  ];

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1));
    setIndex(newIndex);
  };

  const goToStep = (step: number) => {
    scrollRef.current?.scrollTo({ x: width * step, animated: !motion.isReduced });
    setIndex(step);
  };

  const handleNext = () => {
    if (index < 2) {
      goToStep(index + 1);
    } else {
      onComplete();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Botón Omitir siempre visible */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={onComplete}
          android_ripple={{ color: colors.border, borderless: true, radius: 24 }}
          accessibilityRole="button"
          accessibilityLabel={t('Omitir')}
          accessibilityHint={t('Pasa directamente a la pantalla principal')}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          style={({ pressed }) => [styles.skipButton, pressed && { opacity: 0.7 }]}
        >
          <Text style={[typography.body, { color: colors.textSecondary, fontWeight: '600' }]}>
            {t('Omitir')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        style={{ flex: 1 }}
      >
        {/* PASO 1: Bienvenida e Idioma */}
        <View style={[styles.page, { width }]}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
            accessible
            accessibilityLabel={t('Logotipo oficial de EcoScan')}
          />
          <Text style={[typography.title1, styles.title, { color: colors.textPrimary }]}>
            {t('Bienvenido a EcoScan')}
          </Text>
          <Text style={[typography.subheadline, styles.subtitle, { color: colors.textSecondary }]}>
            {t('Elige tu idioma para comenzar')}
          </Text>

          <View style={styles.languageOptions}>
            {LANGUAGES.map((lang) => {
              const selected = language === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setLanguage(lang.code);
                  }}
                  android_ripple={{ color: colors.primaryContainer }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={lang.label}
                  style={({ pressed }) => [
                    styles.langCard,
                    {
                      borderColor: selected ? colors.primary : colors.outlineVariant,
                      backgroundColor: selected ? colors.primaryContainer : colors.surfaceContainerLow,
                      borderRadius: layout.borderRadius.lg,
                      borderWidth: selected ? 2 : 1,
                      overflow: 'hidden',
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    style={[
                      typography.headline,
                      { color: selected ? colors.onPrimaryContainer : colors.textPrimary },
                    ]}
                  >
                    {lang.label}
                  </Text>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  ) : (
                    <View style={[styles.radioCircle, { borderColor: colors.outlineVariant }]} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* PASO 2: ¿Qué quieres lograr? */}
        <View style={[styles.page, { width }]}>
          <Text style={[typography.title1, styles.title, { color: colors.textPrimary, marginTop: 10 }]}>
            {t('¿Qué quieres lograr?')}
          </Text>
          <Text style={[typography.subheadline, styles.subtitle, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
            {t('Adaptaremos tus cuidados y recordatorios a tu prioridad')}
          </Text>

          <View style={styles.goalsList}>
            {GOALS.map((goal) => {
              const selected = userGoal === goal.key;
              return (
                <Pressable
                  key={goal.key}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setUserGoal(goal.key);
                  }}
                  android_ripple={{ color: colors.primaryContainer }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${goal.title}. ${goal.subtitle}`}
                  style={({ pressed }) => [
                    styles.goalCard,
                    {
                      borderColor: selected ? colors.primary : colors.outlineVariant,
                      backgroundColor: selected ? colors.primaryContainer : colors.surfaceContainerLow,
                      borderRadius: layout.borderRadius.lg,
                      borderWidth: selected ? 2 : 1,
                      overflow: 'hidden',
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <View
                    style={[
                      styles.goalIconBox,
                      {
                        backgroundColor: selected ? colors.primary : colors.surfaceContainerHigh,
                      },
                    ]}
                  >
                    <Ionicons
                      name={goal.icon}
                      size={24}
                      color={selected ? colors.onPrimary : colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md, marginRight: spacing.xs }}>
                    <Text
                      style={[
                        typography.headline,
                        { color: selected ? colors.onPrimaryContainer : colors.textPrimary },
                      ]}
                    >
                      {goal.title}
                    </Text>
                    <Text
                      style={[
                        typography.caption1,
                        { color: selected ? colors.onPrimaryContainer : colors.textSecondary, marginTop: 2, lineHeight: 18 },
                      ]}
                    >
                      {goal.subtitle}
                    </Text>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* PASO 3: Tu jardín inteligente */}
        <View style={[styles.page, { width }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.accent + '22' }]}>
            <Ionicons name="sparkles" size={64} color={colors.primary} />
          </View>
          <Text style={[typography.title1, styles.title, { color: colors.textPrimary }]}>
            {t('Tu jardín en tus manos')}
          </Text>
          <Text
            style={[
              typography.body,
              styles.subtitle,
              { color: colors.textSecondary, paddingHorizontal: spacing.md, lineHeight: 26 },
            ]}
          >
            {t('Cuidados sencillos, recordatorios oportunos y fichas claras para que tus plantas crezcan felices.')}
          </Text>
        </View>
      </ScrollView>

      {/* FOOTER: Indicador de 3 pasos y botón de acción */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.dots} accessibilityRole="none">
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === index ? colors.primary : colors.outlineVariant,
                  width: i === index ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Button
          title={index < 2 ? t('Siguiente') : t('Empezar')}
          onPress={handleNext}
          variant="filled"
          size="lg"
          style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}
          icon={index < 2 ? undefined : <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoImage: {
    width: 130,
    height: 130,
    borderRadius: 26,
    marginBottom: 20,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    fontWeight: '800',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  languageOptions: {
    width: '100%',
    marginTop: 28,
    gap: 12,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1.5,
    minHeight: 64,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  goalsList: {
    width: '100%',
    gap: 12,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1.5,
    minHeight: 76,
  },
  goalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
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
