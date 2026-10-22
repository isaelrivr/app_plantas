import React, { useState, useEffect } from 'react';
import { Platform, View, StyleSheet, Text, Pressable, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from '../components/GlassSurface';
import { useActiveBlurTarget } from '../context/ActiveBlurTargetContext';
import { TodayScreen } from '../screens/TodayScreen';
import { GardenScreen } from '../screens/GardenScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HabitatMapScreen } from '../screens/HabitatMapScreen';
import { PlantDetailScreen } from '../screens/PlantDetailScreen';
import { HealthDiagnosisScreen } from '../screens/HealthDiagnosisScreen';
import { CareCalendarScreen } from '../screens/CareCalendarScreen';
import { GrowthDiaryScreen } from '../screens/GrowthDiaryScreen';
import { AssistantScreen } from '../screens/AssistantScreen';
import { EncyclopediaScreen } from '../screens/EncyclopediaScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from '../screens/TermsOfServiceScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { useAppTheme, fontWeights, FONT_FAMILY } from '../theme';
import { useFloatingBarMetrics } from '../hooks/useFloatingBarMetrics';
import { useTabBarVisibility } from '../context/TabBarVisibilityContext';
import { shouldRenderFloatingTabBar } from '../utils/tabBarVisibility';
import { usePremium } from '../context/PremiumContext';
import { useTranslation } from '../i18n';

export type RootTabParamList = {
  Today: undefined;
  Garden: undefined;
  Scan: undefined;
  Explore: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: { screen?: keyof RootTabParamList } | undefined;
  HabitatMap: { plantId: string; plantName?: string; speciesId?: string };
  PlantDetail: {
    plantId: string;
    plantName?: string;
    scientificName?: string;
    confidence?: number;
  };
  HealthDiagnosis: {
    plantId?: string;
    plantName?: string;
    scientificName?: string;
    photoUri?: string;
  };
  CareCalendar: undefined;
  GrowthDiary: { plantId: string };
  Assistant: { plantName?: string; initialQuestion?: string } | undefined;
  Encyclopedia: undefined;
  Achievements: undefined;
  Paywall: undefined;
  Settings: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  Help: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Barra de navegación inferior flotante con estética de vidrio (pill).
 * Cumple con todas las directrices de la FASE 4:
 * - Forma de cápsula (pill) separada de los bordes laterales (16dp).
 * - Superficie de vidrio con blur por hardware y fallback suave.
 * - Iconos de línea fina en todas las pestañas.
 * - Etiqueta visible ÚNICAMENTE en la pestaña activa con chip acolchado.
 * - Respeta los insets inferiores de navegación de Android e iOS.
 * - Áreas táctiles mínimas >= 48dp con android_ripple en Android.
 */
function FloatingGlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, layout, isDark } = useAppTheme();
  const { isPremium } = usePremium();
  const { t } = useTranslation();
  const { activeBlurTargetRef } = useActiveBlurTarget();

  const getRouteConfig = (routeName: keyof RootTabParamList): {
    label: string;
    iconName: keyof typeof Ionicons.glyphMap;
    accessibilityLabel: string;
  } => {
    switch (routeName) {
      case 'Today':
        return {
          label: t('Hoy'),
          iconName: 'today-outline',
          accessibilityLabel: t('Pestaña de Hoy'),
        };
      case 'Garden':
        return {
          label: t('Mi Jardín'),
          iconName: 'leaf-outline',
          accessibilityLabel: t('Pestaña de Mi Jardín'),
        };
      case 'Scan':
        return {
          label: t('Escanear'),
          iconName: 'scan-outline',
          accessibilityLabel: t('Pestaña de Escanear'),
        };
      case 'Explore':
        return {
          label: t('Explorar'),
          iconName: 'compass-outline',
          accessibilityLabel: t('Pestaña de Explorar'),
        };
      case 'Profile':
        return {
          label: isPremium ? t('Yo (Pro)') : t('Yo'),
          iconName: isPremium ? 'sparkles-outline' : 'person-outline',
          accessibilityLabel: t('Pestaña de Yo y Perfil'),
        };
      default:
        return {
          label: String(routeName),
          iconName: 'ellipse-outline',
          accessibilityLabel: String(routeName),
        };
    }
  };

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const { isTabBarVisible } = useTabBarVisibility();
  const currentRoute = state.routes[state.index];
  const focusedOptions = descriptors[currentRoute.key]?.options;
  const tabBarStyle = focusedOptions?.tabBarStyle as any;
  const hideOnKeyboard = (focusedOptions?.tabBarHideOnKeyboard as boolean | undefined) ?? true;

  // Oculta la barra con teclado abierto (tabBarHideOnKeyboard), o si la ruta/contexto lo solicitan
  const shouldShow = shouldRenderFloatingTabBar({
    hideOnKeyboard,
    isKeyboardVisible,
    isTabBarVisible,
    tabBarStyle,
    tabBarVisibleOption: (focusedOptions as any)?.tabBarVisible,
  });

  if (!shouldShow || (hideOnKeyboard && isKeyboardVisible)) {
    return null;
  }

  const { tabBarBottomMargin, tabBarHeight } = useFloatingBarMetrics();
  // insets.bottom es respetado centralizadamente vía useFloatingBarMetrics
  const _bottomInset = insets.bottom;
  const bottomMargin = tabBarBottomMargin;

  return (
    <View style={[styles.floatingContainer, { bottom: bottomMargin }]} pointerEvents="box-none">
      <GlassSurface
        blurTarget={activeBlurTargetRef ?? undefined}
        borderRadius={layout.borderRadius.full}
        intensity={55}
        elevated
        style={[styles.pillSurface, { minHeight: tabBarHeight }]}
      >
        <View style={[styles.tabRow, { minHeight: tabBarHeight }]}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const config = getRouteConfig(route.name as keyof RootTabParamList);
            const { options } = descriptors[route.key];

            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : config.label;

            const isGold = route.name === 'Profile' && isPremium;
            const activeColor = isGold ? colors.premiumGold : colors.primary;
            const iconColor = isFocused ? activeColor : colors.textTertiary;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={options.tabBarAccessibilityLabel || config.accessibilityLabel}
                testID={`tab-${route.name.toLowerCase()}`}
                android_ripple={{
                  color: colors.primary + '18',
                  borderless: true,
                  radius: 28,
                }}
                style={({ pressed }) => [
                  styles.tabItem,
                  {
                    minHeight: Math.max(layout.minTouchTarget, 48),
                    opacity: pressed && Platform.OS === 'ios' ? 0.75 : 1,
                  },
                ]}
              >
                {isFocused ? (
                  <View
                    style={[
                      styles.activeChip,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.12)'
                          : colors.primaryLight,
                        borderRadius: layout.borderRadius.full,
                      },
                    ]}
                  >
                    <Ionicons name={config.iconName} size={20} color={activeColor} />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.activeLabel,
                        {
                          color: activeColor,
                          fontFamily: FONT_FAMILY,
                          fontWeight: fontWeights.medium,
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.inactiveIconWrapper}>
                    <Ionicons name={config.iconName} size={22} color={iconColor} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </GlassSurface>
    </View>
  );
}

function BottomTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Today"
      tabBar={(props) => <FloatingGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Garden" component={GardenScreen} />
      <Tab.Screen name="Scan" component={ScannerScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabs} />
      <Stack.Screen
        name="HabitatMap"
        component={HabitatMapScreen}
        options={{
          animation: 'fade_from_bottom',
        }}
      />
      <Stack.Screen
        name="PlantDetail"
        component={PlantDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="HealthDiagnosis"
        component={HealthDiagnosisScreen}
        options={{
          animation: 'fade_from_bottom',
        }}
      />
      <Stack.Screen
        name="CareCalendar"
        component={CareCalendarScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen name="GrowthDiary" component={GrowthDiaryScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Assistant" component={AssistantScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Encyclopedia" component={EncyclopediaScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Help" component={HelpScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  pillSurface: {
    width: '100%',
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 48,
    gap: 6,
  },
  activeLabel: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
  inactiveIconWrapper: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
