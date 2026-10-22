import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('FASE E.1: Floating glass tab bar hides on software keyboard opening', () => {
  const navPath = path.join(process.cwd(), 'navigation', 'AppNavigator.tsx');
  const navCode = fs.readFileSync(navPath, 'utf-8');

  // 1. screenOptions defines tabBarHideOnKeyboard: true
  assert.ok(
    navCode.includes('tabBarHideOnKeyboard: true'),
    'Tab.Navigator must configure tabBarHideOnKeyboard: true'
  );

  // 2. Custom FloatingGlassTabBar listens to keyboard events
  assert.ok(
    navCode.includes('Keyboard.addListener') &&
    navCode.includes('keyboardDidShow') &&
    navCode.includes('keyboardDidHide'),
    'FloatingGlassTabBar must attach listeners to keyboardDidShow/keyboardDidHide'
  );

  // 3. FloatingGlassTabBar checks keyboard state and returns null
  assert.ok(
    navCode.includes('isKeyboardVisible') &&
    navCode.includes('hideOnKeyboard && isKeyboardVisible'),
    'FloatingGlassTabBar must return null when keyboard is visible'
  );
});

test('FASE E.2: BottomSheet Android edge-to-edge KeyboardAvoidingView & scrollable contract', () => {
  const sheetPath = path.join(process.cwd(), 'components', 'BottomSheet.tsx');
  const sheetCode = fs.readFileSync(sheetPath, 'utf-8');

  // 1. KeyboardAvoidingView behavior configured for Android height & iOS padding
  assert.ok(
    sheetCode.includes("behavior={Platform.OS === 'ios' ? 'padding' : 'height'}"),
    "BottomSheet must use behavior={Platform.OS === 'ios' ? 'padding' : 'height'}"
  );

  // 2. keyboardVerticalOffset accounts for Android edge-to-edge navigation insets
  assert.ok(
    sheetCode.includes("keyboardVerticalOffset={Platform.OS === 'android' ? insets.bottom : 0}"),
    'BottomSheet must set keyboardVerticalOffset with insets.bottom on Android'
  );

  // 3. Modal configured with edge-to-edge flags
  assert.ok(
    sheetCode.includes('statusBarTranslucent') && sheetCode.includes('navigationBarTranslucent'),
    'BottomSheet Modal must declare statusBarTranslucent and navigationBarTranslucent'
  );

  // 4. Exposes scrollable prop and provides keyboardShouldPersistTaps="handled"
  assert.ok(
    sheetCode.includes('scrollable?: boolean') &&
    sheetCode.includes('keyboardShouldPersistTaps="handled"'),
    'BottomSheet must expose scrollable prop with keyboardShouldPersistTaps="handled"'
  );
});

test('FASE E.2: AuthModal Android edge-to-edge KeyboardAvoidingView and scroll behavior', () => {
  const authPath = path.join(process.cwd(), 'components', 'AuthModal.tsx');
  const authCode = fs.readFileSync(authPath, 'utf-8');

  // 1. KeyboardAvoidingView behavior
  assert.ok(
    authCode.includes("behavior={Platform.OS === 'ios' ? 'padding' : 'height'}"),
    "AuthModal must use behavior={Platform.OS === 'ios' ? 'padding' : 'height'}"
  );

  // 2. keyboardVerticalOffset
  assert.ok(
    authCode.includes("keyboardVerticalOffset={Platform.OS === 'android' ? insets.bottom : 0}"),
    'AuthModal must set keyboardVerticalOffset with insets.bottom on Android'
  );

  // 3. Modal edge-to-edge translucent flags
  assert.ok(
    authCode.includes('statusBarTranslucent') && authCode.includes('navigationBarTranslucent'),
    'AuthModal Modal must specify statusBarTranslucent and navigationBarTranslucent'
  );

  // 4. ScrollView handles taps during typing
  assert.ok(
    authCode.includes('keyboardShouldPersistTaps="handled"'),
    'AuthModal ScrollView must set keyboardShouldPersistTaps="handled"'
  );
});

test('FASE E.2: AddPlantModal enables scrollable mode so no form inputs are covered', () => {
  const addPlantPath = path.join(process.cwd(), 'components', 'garden', 'AddPlantModal.tsx');
  const addPlantCode = fs.readFileSync(addPlantPath, 'utf-8');

  assert.ok(
    addPlantCode.includes('scrollable={manualMode}'),
    'AddPlantModal must pass scrollable={manualMode} to BottomSheet'
  );
});

test('FASE E.2: EditCareTaskModal ScrollView configuration', () => {
  const editTaskPath = path.join(process.cwd(), 'components', 'calendar', 'EditCareTaskModal.tsx');
  const editTaskCode = fs.readFileSync(editTaskPath, 'utf-8');

  assert.ok(
    editTaskCode.includes('keyboardShouldPersistTaps="handled"'),
    'EditCareTaskModal ScrollView must set keyboardShouldPersistTaps="handled"'
  );
});

test('FASE E.2: AssistantScreen edge-to-edge input and auto-scroll behavior', () => {
  const assistantPath = path.join(process.cwd(), 'screens', 'AssistantScreen.tsx');
  const assistantCode = fs.readFileSync(assistantPath, 'utf-8');

  // 1. Keyboard listeners attached and scrollToEnd invoked
  assert.ok(
    assistantCode.includes('keyboardDidShow') &&
    assistantCode.includes('scrollToEnd()'),
    'AssistantScreen must scroll to end when keyboard opens'
  );

  // 2. Dynamic paddingBottom on inputBar
  assert.ok(
    assistantCode.includes('isKeyboardVisible ? 10 : Math.max(insets.bottom, 10)'),
    'AssistantScreen must clear extra navigation bar dead space when keyboard is up'
  );

  // 3. ScrollView taps handled
  assert.ok(
    assistantCode.includes('keyboardShouldPersistTaps="handled"'),
    'AssistantScreen ScrollView must set keyboardShouldPersistTaps="handled"'
  );
});
