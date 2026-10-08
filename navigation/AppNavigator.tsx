import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScannerScreen } from '../screens/ScannerScreen';
import { GardenScreen } from '../screens/GardenScreen';
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
import { useAppTheme } from '../theme';
import { usePremium } from '../context/PremiumContext';

export type RootTabParamList = {
  'Escáner': undefined;
  'Mi Jardín': undefined;
  'Perfil': undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  HabitatMap: { plantId: string };
  PlantDetail: { plantId: string };
  HealthDiagnosis: { plantId?: string };
  CareCalendar: undefined;
  GrowthDiary: { plantId: string };
  Assistant: undefined;
  Encyclopedia: undefined;
  Achievements: undefined;
  Paywall: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function BottomTabs() {
  const { colors, typography, layout } = useAppTheme();
  const { isPremium } = usePremium();

  return (
    <Tab.Navigator
      initialRouteName="Escáner"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          minHeight: layout.minTouchTarget,
        },
      }}
    >
      <Tab.Screen
        name="Escáner"
        component={ScannerScreen}
        options={{
          tabBarLabel: 'Escáner',
          tabBarAccessibilityLabel: 'Pestaña de Escáner y Reconocimiento de Plantas',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'camera' : 'camera-outline'}
              size={size + 2}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Mi Jardín"
        component={GardenScreen}
        options={{
          tabBarLabel: 'Mi Jardín',
          tabBarAccessibilityLabel: 'Pestaña de Mi Jardín y Registro de Riegos',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'leaf' : 'leaf-outline'}
              size={size + 2}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarLabel: isPremium ? 'Perfil (Pro)' : 'Perfil',
          tabBarAccessibilityLabel: 'Pestaña de Perfil y Suscripción Premium',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? (isPremium ? 'sparkles' : 'person') : (isPremium ? 'sparkles-outline' : 'person-outline')}
              size={size + 2}
              color={isPremium ? colors.premiumGold : color}
            />
          ),
        }}
      />
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
    </Stack.Navigator>
  );
};
