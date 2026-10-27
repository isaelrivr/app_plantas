import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme, LinkingOptions } from '@react-navigation/native';
import { AppNavigator, RootStackParamList } from './navigation/AppNavigator';
import { navigationRef } from './navigation/navigationRef';
import { PremiumProvider, usePremium } from './context/PremiumContext';
import { GardenProvider, useGarden } from './context/GardenContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { FeedbackProvider } from './context/FeedbackContext';
import { TabBarVisibilityProvider } from './context/TabBarVisibilityContext';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppLoading } from './components/AppLoading';
import { useAppTheme } from './theme';
import { runStorageMigrations } from './services/storage';
import { hydrateGrowthDiary, isGrowthDiaryHydrated } from './services/growthDiaryService';

const linking: LinkingOptions<any> = {
  prefixes: ['ecoscan://', 'https://ecoscan.app'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Today: 'hoy',
          Garden: 'jardin',
          Scan: 'escanear',
          Explore: 'explorar',
          Profile: 'perfil',
        },
      },
      PlantDetail: 'planta/:plantId',
      Encyclopedia: 'enciclopedia',
      CareCalendar: 'calendario',
      GrowthDiary: 'diario/:plantId',
      Paywall: 'pro',
      Settings: 'ajustes',
      Help: 'ayuda',
      PrivacyPolicy: 'privacidad',
      TermsOfService: 'terminos',
    },
  },
};

function MainApp() {
  const { isDark, colors } = useAppTheme();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.accent,
    },
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer ref={navigationRef} theme={navigationTheme} linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </View>
  );
}

/**
 * Muestra el splash hasta hidratar todo el estado persistido, luego el
 * onboarding la primera vez y, finalmente, la app principal.
 */
function RootGate() {
  const { hasOnboarded, completeOnboarding, isHydrated: settingsHydrated } = useSettings();
  const { isHydrated: gardenHydrated } = useGarden();
  const { isHydrated: premiumHydrated } = usePremium();
  const { isDark, colors } = useAppTheme();
  const [bootReady, setBootReady] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    (async () => {
      await runStorageMigrations();
      if (!isGrowthDiaryHydrated()) {
        await hydrateGrowthDiary();
      }
      if (active) setBootReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const hydrated = bootReady && settingsHydrated && gardenHydrated && premiumHydrated;

  if (!hydrated) {
    return <AppLoading />;
  }

  if (!hasOnboarded) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <OnboardingScreen onComplete={completeOnboarding} />
      </View>
    );
  }

  return <MainApp />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <PremiumProvider>
          <GardenProvider>
            <TabBarVisibilityProvider>
              <FeedbackProvider>
                <ErrorBoundary>
                  <RootGate />
                </ErrorBoundary>
              </FeedbackProvider>
            </TabBarVisibilityProvider>
          </GardenProvider>
        </PremiumProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
