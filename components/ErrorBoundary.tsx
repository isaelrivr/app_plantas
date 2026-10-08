import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { ErrorBanner } from './ErrorBanner';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/** Pantalla de recuperación que usa el tema y el ErrorBanner de la app. */
const ErrorFallback: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => {
  const { colors, spacing, typography, layout } = useAppTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.xl }}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: colors.errorLight, alignSelf: 'center', marginBottom: spacing.lg },
        ]}
      >
        <Ionicons name="leaf" size={48} color={colors.error} />
      </View>

      <Text
        style={[
          typography.title2,
          { color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
        ]}
      >
        Algo salió mal
      </Text>

      <Text
        style={[
          typography.body,
          { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
        ]}
      >
        Tuvimos un problema al mostrar esta pantalla. Tus datos están a salvo en tu dispositivo.
      </Text>

      <ErrorBanner message={message} />

      <TouchableOpacity
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Reintentar cargar la aplicación"
        style={[
          styles.retryButton,
          { backgroundColor: colors.primary, borderRadius: layout.borderRadius.md, marginTop: spacing.lg },
        ]}
      >
        <Ionicons name="refresh" size={18} color="#FFFFFF" />
        <Text style={[typography.headline, { color: '#FFFFFF', marginLeft: 8 }]}>Reintentar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

/**
 * Límite de errores global. Evita que un fallo de render deje la app en blanco
 * y ofrece una acción de recuperación.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'Error inesperado',
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    // En Fase 6 este punto se conectará con Sentry.
    console.error('[ErrorBoundary] Error no controlado:', error, info.componentStack);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback message={this.state.errorMessage} onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 20,
  },
});
