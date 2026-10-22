import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { useTranslation } from '../i18n';
import {
  getCurrentUser,
  signInWithEmail,
  signUpWithEmail,
  signInAnonymously,
  signOut,
  UserProfile,
  onAuthStateChanged,
} from '../services/authService';
import { syncGardenWithCloud, getSyncMetadata } from '../services/syncService';
import { useGarden } from '../context/GardenContext';
import { useFeedback } from '../context/FeedbackContext';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const { colors, typography, spacing } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { plants, rooms, hydrateGarden } = useGarden();
  const { showToast } = useFeedback();

  const [user, setUser] = useState<UserProfile | null>(getCurrentUser());
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((newUser) => {
      setUser(newUser);
      if (newUser) {
        getSyncMetadata().then((meta) => setLastSyncTime(meta.lastSyncAt));
      }
    });
    return unsubscribe;
  }, []);

  const handleAuthAction = async () => {
    if (!email.trim() || !email.includes('@')) {
      showToast({ message: t('Ingresa un correo electrónico válido'), type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      Haptics.selectionAsync();
      let loggedUser: UserProfile;
      if (mode === 'signup') {
        loggedUser = await signUpWithEmail(email, password, displayName);
        showToast({ message: t('¡Cuenta creada con éxito!'), type: 'success' });
      } else {
        loggedUser = await signInWithEmail(email, password);
        showToast({ message: t('Bienvenido de nuevo'), type: 'success' });
      }

      // Sincronizar automáticamente el jardín tras iniciar sesión
      if (loggedUser) {
        setIsSyncing(true);
        const syncRes = await syncGardenWithCloud(loggedUser.uid, plants, rooms);
        await hydrateGarden();
        setLastSyncTime(new Date().toISOString());
        showToast({
          message: t('Jardín sincronizado: {count} plantas respaldadas', { count: syncRes.mergedCount }),
          type: 'success',
        });
      }
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('Error al autenticar');
      showToast({ message: msg, type: 'error' });
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    try {
      Haptics.selectionAsync();
      await signInAnonymously();
      showToast({ message: t('Conectado en modo invitado'), type: 'info' });
      onClose();
    } catch {
      showToast({ message: t('Error al iniciar como invitado'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      Haptics.selectionAsync();
      const res = await syncGardenWithCloud(user.uid, plants, rooms);
      await hydrateGarden();
      setLastSyncTime(new Date().toISOString());
      showToast({
        message: t('Sincronización completa: {count} plantas al día', { count: res.mergedCount }),
        type: 'success',
      });
    } catch {
      showToast({ message: t('No se pudo sincronizar el jardín'), type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      Haptics.selectionAsync();
      await signOut();
      showToast({ message: t('Sesión cerrada'), type: 'info' });
    } catch {
      showToast({ message: t('Error al cerrar sesión'), type: 'error' });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? insets.bottom : 0}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: isKeyboardVisible
                ? 12
                : (Platform.OS === 'ios' ? Math.max(insets.bottom, 24) : Math.max(insets.bottom, 16)),
            },
          ]}
        >
          {/* Cabecera */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.headline, { color: colors.textPrimary }]}>
                {user ? t('Tu Cuenta EcoScan') : t('Respaldar Jardín en la Nube')}
              </Text>
              <Text style={[typography.subheadline, { color: colors.textSecondary, marginTop: 2 }]}>
                {user
                  ? t('Sincroniza y accede a tus plantas desde cualquier dispositivo')
                  : t('Crea una cuenta opcional para sincronizar tus plantas')}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              android_ripple={{ color: colors.border, borderless: true, radius: 24 }}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: colors.background },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('Cerrar')}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={{ maxHeight: 420 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: isKeyboardVisible ? 16 : 24 }}
          >
            {user ? (
              /* Usuario autenticado */
              <View style={{ paddingTop: spacing.md }}>
                <View style={[styles.profileCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={[styles.avatarCircle, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="person" size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={[typography.headline, { color: colors.textPrimary }]}>
                      {user.displayName || user.email || t('Usuario')}
                    </Text>
                    <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                      {user.email || (user.isAnonymous ? t('Modo invitado anónimo') : '')}
                    </Text>
                  </View>
                </View>

                {/* Estado de sincronización */}
                <View style={[styles.syncStatusRow, { borderColor: colors.border }]}>
                  <Ionicons name="cloud-done-outline" size={22} color={colors.success} />
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '600' }]}>
                      {t('Sincronización en la nube')}
                    </Text>
                    <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                      {lastSyncTime
                        ? t('Última sincronización: {hora}', { hora: new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
                        : t('Listo para sincronizar')}
                    </Text>
                  </View>
                </View>

                {/* Botón sincronizar ahora */}
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    { backgroundColor: colors.primary, overflow: 'hidden' },
                    pressed && !isSyncing && { opacity: 0.85 },
                  ]}
                  android_ripple={{ color: colors.primaryDark }}
                  onPress={handleManualSync}
                  disabled={isSyncing}
                  accessibilityRole="button"
                  accessibilityLabel={t('Sincronizar mi jardín ahora')}
                >
                  {isSyncing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="sync-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={[typography.body, { color: '#FFFFFF', fontWeight: '700' }]}>
                        {t('Sincronizar mi jardín ahora')}
                      </Text>
                    </>
                  )}
                </Pressable>

                {/* Botón cerrar sesión */}
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { borderColor: colors.border, overflow: 'hidden' },
                    pressed && { opacity: 0.8 },
                  ]}
                  android_ripple={{ color: colors.border }}
                  onPress={handleSignOut}
                  accessibilityRole="button"
                  accessibilityLabel={t('Cerrar sesión en este dispositivo')}
                >
                  <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={[typography.body, { color: colors.textSecondary, fontWeight: '600' }]}>
                    {t('Cerrar sesión en este dispositivo')}
                  </Text>
                </Pressable>
              </View>
            ) : (
              /* Formulario de registro / inicio de sesión */
              <View style={{ paddingTop: spacing.md }}>
                {mode === 'signup' && (
                  <View style={{ marginBottom: spacing.sm }}>
                    <Text style={[typography.caption1, { color: colors.textSecondary, marginBottom: 4 }]}>
                      {t('Nombre o apodo')}
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                      placeholder={t('Ej. María')}
                      placeholderTextColor={colors.textSecondary}
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="words"
                    />
                  </View>
                )}

                <View style={{ marginBottom: spacing.sm }}>
                  <Text style={[typography.caption1, { color: colors.textSecondary, marginBottom: 4 }]}>
                    {t('Correo electrónico')}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                    placeholder={t('nombre@correo.com')}
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={{ marginBottom: spacing.md }}>
                  <Text style={[typography.caption1, { color: colors.textSecondary, marginBottom: 4 }]}>
                    {t('Contraseña')}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                    placeholder={t('••••••••')}
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                {/* Botón principal */}
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    { backgroundColor: colors.primary, overflow: 'hidden' },
                    pressed && !isLoading && { opacity: 0.85 },
                  ]}
                  android_ripple={{ color: colors.primaryDark }}
                  onPress={handleAuthAction}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel={mode === 'signup' ? t('Crear cuenta y sincronizar') : t('Iniciar sesión')}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={[typography.body, { color: '#FFFFFF', fontWeight: '700' }]}>
                      {mode === 'signup' ? t('Crear cuenta y sincronizar') : t('Iniciar sesión')}
                    </Text>
                  )}
                </Pressable>

                {/* Alternador inicio / registro */}
                <Pressable
                  style={({ pressed }) => [
                    { alignSelf: 'center', marginTop: spacing.sm, padding: 8, borderRadius: 8, overflow: 'hidden' },
                    pressed && { opacity: 0.75 },
                  ]}
                  android_ripple={{ color: colors.primaryLight }}
                  onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  accessibilityRole="button"
                  accessibilityLabel={
                    mode === 'signin'
                      ? t('¿No tienes cuenta? Regístrate')
                      : t('¿Ya tienes cuenta? Inicia sesión')
                  }
                >
                  <Text style={[typography.subheadline, { color: colors.primary, fontWeight: '600' }]}>
                    {mode === 'signin'
                      ? t('¿No tienes cuenta? Regístrate')
                      : t('¿Ya tienes cuenta? Inicia sesión')}
                  </Text>
                </Pressable>

                {/* Opción anónima / invitado */}
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { borderColor: colors.border, marginTop: spacing.md, overflow: 'hidden' },
                    pressed && !isLoading && { opacity: 0.8 },
                  ]}
                  android_ripple={{ color: colors.border }}
                  onPress={handleAnonymousSignIn}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel={t('Continuar como invitado sin cuenta')}
                >
                  <Text style={[typography.subheadline, { color: colors.textSecondary }]}>
                    {t('Continuar como invitado sin cuenta')}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  actionButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
});
