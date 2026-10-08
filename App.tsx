import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { AppNavigator } from './navigation/AppNavigator';
import { PremiumProvider, usePremium } from './context/PremiumContext';
import { GardenProvider, useGarden } from './context/GardenContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppLoading } from './components/AppLoading';
import { useAppTheme } from './theme';
import { runStorageMigrations } from './services/storage';
import { hydrateGrowthDiary, isGrowthDiaryHydrated } from './services/growthDiaryService';

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
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={navigationTheme}>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaView>
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
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <OnboardingScreen onComplete={completeOnboarding} />
      </SafeAreaView>
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
            <ErrorBoundary>
              <RootGate />
            </ErrorBoundary>
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
