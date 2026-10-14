import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { loadJSON, saveJSON, STORAGE_KEYS } from '../services/storage';
import { setI18nLanguage } from '../i18n/core';
import type { AppLanguage } from '../i18n/types';

/**
 * SettingsContext
 *
 * Preferencias del usuario: tema, idioma, modo fácil (accesibilidad para adultos mayores),
 * notificaciones y estado de onboarding.
 *
 * Las preferencias se persisten localmente en AsyncStorage.
 */

export type ThemePreference = 'system' | 'light' | 'dark';
export type UserGoal = 'identify' | 'watering' | 'cure';
export type { AppLanguage } from '../i18n/types';

export const LANGUAGES: { code: AppLanguage; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

interface SettingsContextType {
  themePreference: ThemePreference;
  language: AppLanguage;
  notificationsEnabled: boolean;
  hasOnboarded: boolean;
  easyMode: boolean;
  userGoal?: UserGoal;
  resolvedScheme: 'light' | 'dark';
  /** `true` cuando las preferencias persistidas ya se cargaron desde disco. */
  isHydrated: boolean;
  setThemePreference: (value: ThemePreference) => void;
  setLanguage: (value: AppLanguage) => void;
  setNotificationsEnabled: (value: boolean) => void;
  setEasyMode: (value: boolean) => void;
  setUserGoal: (value: UserGoal) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface PersistedSettings {
  themePreference: ThemePreference;
  language: AppLanguage;
  notificationsEnabled: boolean;
  hasOnboarded: boolean;
  easyMode?: boolean;
  userGoal?: UserGoal;
}

const DEFAULT_SETTINGS: PersistedSettings = {
  themePreference: 'system',
  language: 'es',
  notificationsEnabled: true,
  hasOnboarded: false,
  easyMode: false,
  userGoal: 'watering',
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [language, setLanguage] = useState<AppLanguage>('es');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(false);
  const [easyMode, setEasyMode] = useState<boolean>(false);
  const [userGoal, setUserGoal] = useState<UserGoal>('watering');
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Hidratación desde disco.
  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await loadJSON<PersistedSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
      if (!active) return;
      setThemePreference(stored.themePreference ?? 'system');
      setLanguage(stored.language ?? 'es');
      setNotificationsEnabled(stored.notificationsEnabled ?? true);
      setHasOnboarded(stored.hasOnboarded ?? false);
      setEasyMode(Boolean(stored.easyMode));
      setUserGoal(stored.userGoal ?? 'watering');
      setIsHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persistencia tras cada cambio (nunca antes de hidratar).
  useEffect(() => {
    if (!isHydrated) return;
    void saveJSON<PersistedSettings>(STORAGE_KEYS.settings, {
      themePreference,
      language,
      notificationsEnabled,
      hasOnboarded,
      easyMode,
      userGoal,
    });
  }, [isHydrated, themePreference, language, notificationsEnabled, hasOnboarded, easyMode, userGoal]);

  // Mantiene el traductor global (servicios, alertas) en sintonía con el idioma.
  useEffect(() => {
    setI18nLanguage(language);
  }, [language]);

  const resolvedScheme: 'light' | 'dark' =
    themePreference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themePreference;

  const value = useMemo<SettingsContextType>(
    () => ({
      themePreference,
      language,
      notificationsEnabled,
      hasOnboarded,
      easyMode,
      userGoal,
      resolvedScheme,
      isHydrated,
      setThemePreference,
      setLanguage,
      setNotificationsEnabled,
      setEasyMode,
      setUserGoal,
      completeOnboarding: () => setHasOnboarded(true),
      resetOnboarding: () => setHasOnboarded(false),
      resetSettings: () => {
        setThemePreference('system');
        setLanguage('es');
        setNotificationsEnabled(true);
        setEasyMode(false);
        setUserGoal('watering');
      },
    }),
    [themePreference, language, notificationsEnabled, hasOnboarded, easyMode, userGoal, resolvedScheme, isHydrated]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

/** Devuelve las preferencias o valores por defecto si no hay provider (seguro). */
export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  const systemScheme = useColorScheme();
  if (!context) {
    const fallbackScheme: 'light' | 'dark' = systemScheme === 'dark' ? 'dark' : 'light';
    return {
      themePreference: 'system',
      language: 'es',
      notificationsEnabled: true,
      hasOnboarded: false,
      easyMode: false,
      userGoal: 'watering',
      resolvedScheme: fallbackScheme,
      isHydrated: false,
      setThemePreference: () => {},
      setLanguage: () => {},
      setNotificationsEnabled: () => {},
      setEasyMode: () => {},
      setUserGoal: () => {},
      completeOnboarding: () => {},
      resetOnboarding: () => {},
      resetSettings: () => {},
    };
  }
  return context;
}
