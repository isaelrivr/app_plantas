import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { AppNavigator } from './navigation/AppNavigator';
import { PremiumProvider } from './context/PremiumContext';
import { GardenProvider } from './context/GardenContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { useAppTheme } from './theme';

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
 * Muestra el onboarding la primera vez y luego la app principal.
 */
function RootGate() {
  const { hasOnboarded, completeOnboarding } = useSettings();
  const { isDark, colors } = useAppTheme();

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
            <RootGate />
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
