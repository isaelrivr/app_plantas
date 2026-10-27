import React, { useState, useEffect } from 'react';
import { Platform, View, StyleSheet, Text, Pressable, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
 * Barra de navegación inferior oficial de Material Design 3 (M3 NavigationBar).
 * - Anclada al borde inferior de la pantalla (edge-to-edge).
 * - Superficie tonal pura M3 surfaceContainer (cero consumo de GPU por BlurView).
 * - Indicador activo tipo píldora horizontal (64x32dp) con primaryContainer / onPrimaryContainer.
 * - Icono y etiqueta siempre visibles con escala labelMedium.
 * - Feedback táctil nativo con android_ripple.
 * - Botón central de Escanear destacado como acción limpia.
 */
export function M3NavigationBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, layout, isDark } = useAppTheme();
  const { isPremium } = usePremium();
  const { t } = useTranslation();

  const getRouteConfig = (routeName: keyof RootTabParamList): {
    label: string;
    iconName: keyof typeof Ionicons.glyphMap;
    activeIconName: keyof typeof Ionicons.glyphMap;
    accessibilityLabel: string;
  } => {
    switch (routeName) {
      case 'Today':
        return {
          label: t('Hoy'),
          iconName: 'today-outline',
          activeIconName: 'today',
          accessibilityLabel: t('Pestaña de Hoy'),
        };
      case 'Garden':
        return {
          label: t('Mi Jardín'),
          iconName: 'leaf-outline',
          activeIconName: 'leaf',
          accessibilityLabel: t('Pestaña de Mi Jardín'),
        };
      case 'Scan':
        return {
          label: t('Escanear'),
          iconName: 'scan-outline',
          activeIconName: 'scan',
          accessibilityLabel: t('Pestaña de Escanear'),
        };
      case 'Explore':
        return {
          label: t('Explorar'),
          iconName: 'compass-outline',
          activeIconName: 'compass',
          accessibilityLabel: t('Pestaña de Explorar'),
        };
      case 'Profile':
        return {
          label: isPremium ? t('Yo (Pro)') : t('Yo'),
          iconName: isPremium ? 'sparkles-outline' : 'person-outline',
          activeIconName: isPremium ? 'sparkles' : 'person',
          accessibilityLabel: t('Pestaña de Yo y Perfil'),
        };
      default:
        return {
          label: String(routeName),
          iconName: 'ellipse-outline',
          activeIconName: 'ellipse',
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

  // Oculta la barra con teclado abierto o si la ruta lo solicita
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

  const barHeight = layout.tabBarHeight + insets.bottom;

  return (
    <View
      style={[
        styles.navBarContainer,
        {
          height: barHeight,
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: colors.surfaceContainer,
          borderTopColor: colors.outlineVariant,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = getRouteConfig(route.name as keyof RootTabParamList);
          const { options } = descriptors[route.key];

          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : config.label;

          const isGold = route.name === 'Profile' && isPremium;
          const isScan = route.name === 'Scan';
          const activeColor = isGold
            ? colors.premiumGold
            : isScan
            ? colors.primary
            : colors.onSurface;

          const iconColor = isFocused
            ? isScan
              ? colors.onPrimary
              : colors.onPrimaryContainer
            : colors.onSurfaceVariant;

          const pillBg = isFocused
            ? isScan
              ? colors.primary
              : isGold
              ? colors.premiumGoldLight
              : colors.primaryContainer
            : 'transparent';

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
                radius: 32,
              }}
              style={({ pressed }) => [
                styles.tabItem,
                {
                  minHeight: Math.max(layout.minTouchTarget, 48),
                  opacity: pressed && Platform.OS === 'ios' ? 0.75 : 1,
                },
              ]}
            >
              {/* Indicador de píldora activa M3 */}
              <View
                style={[
                  styles.iconPill,
                  {
                    backgroundColor: pillBg,
                  },
                ]}
              >
                <Ionicons
                  name={isFocused ? config.activeIconName : config.iconName}
                  size={22}
                  color={iconColor}
                />
              </View>

              {/* Etiqueta de texto siempre visible M3 */}
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? activeColor : colors.onSurfaceVariant,
                    fontFamily: FONT_FAMILY,
                    fontWeight: isFocused ? fontWeights.bold : fontWeights.medium,
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Alias de retrocompatibilidad
export const FloatingGlassTabBar = M3NavigationBar;

function BottomTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Today"
      tabBar={(props) => <M3NavigationBar {...props} />}
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
  const { colors } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: colors.surface,
        },
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
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    zIndex: 100,
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconPill: {
    width: 64,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
