import React from 'react';
import { View, StyleSheet, Platform, Switch as RNSwitch } from 'react-native';
import { Host, Switch as ExpoUISwitch } from '@expo/ui';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';

export interface MaterialSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

/**
 * Control Switch Material 3 de Android implementado con @expo/ui (Jetpack Compose / SwiftUI).
 * Con fallback suave a React Native Switch para compatibilidad universal y tests.
 */
export const MaterialSwitch: React.FC<MaterialSwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const { colors } = useAppTheme();

  const handleToggle = (nextVal: boolean) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    onValueChange(nextVal);
  };

  // En Android e iOS nativo utilizamos el componente real de @expo/ui
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return (
      <View
        style={styles.hostWrapper}
        accessible
        accessibilityRole="switch"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ checked: value, disabled }}
      >
        <Host style={styles.host}>
          <ExpoUISwitch
            value={value}
            onValueChange={handleToggle}
            disabled={disabled}
            testID={testID}
          />
        </Host>
      </View>
    );
  }

  // Fallback web / tests
  return (
    <RNSwitch
      value={value}
      onValueChange={handleToggle}
      disabled={disabled}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={value ? '#FFFFFF' : colors.surface}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
    />
  );
};

const styles = StyleSheet.create({
  hostWrapper: {
    minWidth: 52,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  host: {
    minWidth: 52,
    minHeight: 32,
  },
});
