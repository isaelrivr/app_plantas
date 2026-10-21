import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GlassView, BlurTargetContext } from '../components/GlassView';
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
import { useAppTheme } from '../theme';
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

function BottomTabs() {
  const { colors, typography, layout } = useAppTheme();
  const { isPremium } = usePremium();
  const { t } = useTranslation();
  const tabBlurTargetRef = React.useRef<View | null>(null);

  return (
    <BlurTargetContext.Provider value={tabBlurTargetRef}>
      <Tab.Navigator
        initialRouteName="Today"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarBackground: () => (
            <GlassView
              blurTarget={tabBlurTargetRef}
              borderRadius={32}
              style={StyleSheet.absoluteFill}
              elevated={false}
            />
          ),
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 16,
          right: 16,
          height: 68,
          borderRadius: 32,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          borderWidth: 0,
          elevation: 12,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.14,
          shadowRadius: 12,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          minHeight: 48,
          paddingVertical: 4,
        },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          tabBarLabel: t('Hoy'),
          tabBarAccessibilityLabel: t('Pestaña de Hoy'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'today' : 'today-outline'}
              size={size + 1}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Garden"
        component={GardenScreen}
        options={{
          tabBarLabel: t('Mi Jardín'),
          tabBarAccessibilityLabel: t('Pestaña de Mi Jardín'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'leaf' : 'leaf-outline'}
              size={size + 1}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScannerScreen}
        options={{
          tabBarLabel: t('Escanear'),
          tabBarAccessibilityLabel: t('Pestaña de Escanear'),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '700',
            color: colors.primary,
          },
          tabBarIcon: () => (
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -20,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 8,
                borderWidth: 3,
                borderColor: colors.surface,
              }}
            >
              <Ionicons name="camera" size={26} color="#FFFFFF" />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: t('Explorar'),
          tabBarAccessibilityLabel: t('Pestaña de Explorar'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'compass' : 'compass-outline'}
              size={size + 1}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: isPremium ? t('Yo (Pro)') : t('Yo'),
          tabBarAccessibilityLabel: t('Pestaña de Yo y Perfil'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? (isPremium ? 'sparkles' : 'person') : (isPremium ? 'sparkles-outline' : 'person-outline')}
              size={size + 1}
              color={isPremium ? colors.premiumGold : color}
            />
          ),
        }}
      />
    </Tab.Navigator>
    </BlurTargetContext.Provider>
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
