import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { OrganicBlobs } from '../components/intro/OrganicBlobs';
import { COLORS } from '../utils/constants';

const SCREEN_HEIGHT = Dimensions.get('window').height;

function toFixed4(n: number) {
  return Number(n.toFixed(4));
}

const SHEET_HEIGHT_RATIO = 0.85;
const SHEET_HEIGHT = toFixed4(SCREEN_HEIGHT * SHEET_HEIGHT_RATIO);
const BORDER_RADIUS_TOP = 32;
const BUTTON_BORDER_RADIUS = 30;
const BUTTON_PADDING_VERTICAL = 16;

export function IntroScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [authVisible, setAuthVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const slideAnim = useRef(new Animated.Value(1)).current;

  const quickLogin = async (quickRole: 'tenant' | 'owner') => {
    const email =
      quickRole === 'tenant'
        ? process.env.EXPO_PUBLIC_DEV_TENANT_EMAIL
        : process.env.EXPO_PUBLIC_DEV_OWNER_EMAIL;
    const password =
      quickRole === 'tenant'
        ? process.env.EXPO_PUBLIC_DEV_TENANT_PASSWORD
        : process.env.EXPO_PUBLIC_DEV_OWNER_PASSWORD;
    console.log('[quickLogin] role:', quickRole, '| email:', email, '| password:', password ? password.slice(0, 2) + '***' + password.slice(-1) : 'UNDEFINED');
    const { data, error } = await supabase.auth.signInWithPassword({ email: email ?? '', password: password ?? '' });
    console.log('[quickLogin] error:', JSON.stringify(error));
    console.log('[quickLogin] data:', JSON.stringify(data));
    if (error) { Alert.alert('Dev login error', error.message); return; }
    if (data.session) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.session.user.id).single();
      const userRole = profile?.role || 'tenant';
      if (userRole === 'owner') navigation.replace('OwnerApp');
      else navigation.replace('TenantApp');
    }
  };

  const openAuth = () => {
    setAuthVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeAuth = () => {
    Keyboard.dismiss();
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setAuthVisible(false));
  };

  const handleLogin = async () => {
    setLoading(true);
    const e = email.trim();
    const p = password.trim();
    if (!e || !p) {
      Alert.alert('Errore', 'Inserisci email e password.');
      setLoading(false);
      return;
    }
    console.log('[handleLogin] email:', e, '| password:', p.slice(0, 2) + '***' + p.slice(-1));
    const { data, error } = await supabase.auth.signInWithPassword({ email: e, password: p });
    console.log('[handleLogin] error:', JSON.stringify(error));
    console.log('[handleLogin] data:', JSON.stringify(data));
    if (error) {
      Alert.alert('Errore login', 'Credenziali errate.');
      setLoading(false);
      return;
    }
    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
      const userRole = profile?.role || 'tenant';
      closeAuth();
      if (userRole === 'owner') navigation.replace('OwnerApp');
      else navigation.replace('TenantApp');
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    const e = email.trim();
    const p = password.trim();
    if (!e || !p) {
      Alert.alert('Errore', 'Inserisci email e password.');
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.auth.signUp({ email: e, password: p });
    if (error) {
      Alert.alert('Errore', error.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      await supabase.from('profiles').insert([{ id: data.user.id, email: e }]);
      closeAuth();
      navigation.replace('ProfileSetup');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.background} />
      <OrganicBlobs />

      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.spacer} />
        <Text style={styles.heroText}>La tua prossima casa, a portata di match.</Text>
        <View style={styles.spacer} />
        <TouchableOpacity style={styles.cta} onPress={openAuth} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Iniziamo</Text>
        </TouchableOpacity>
      </View>

      {__DEV__ && (
        <View style={styles.devBar}>
          <TouchableOpacity style={[styles.devBtn, { backgroundColor: '#84A98C' }]} onPress={() => quickLogin('tenant')}>
            <Text style={styles.devBtnText}>⚡ Tenant</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.devBtn, { backgroundColor: '#A7754D' }]} onPress={() => quickLogin('owner')}>
            <Text style={styles.devBtnText}>⚡ Owner</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={authVisible}
        transparent
        animationType="none"
        onRequestClose={closeAuth}
      >
        <KeyboardAvoidingView
          style={styles.modalWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalInner}>
            <TouchableWithoutFeedback onPress={closeAuth}>
              <Animated.View
                style={[
                  styles.overlay,
                  {
                    opacity: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 0],
                    }),
                  },
                ]}
              />
            </TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sheet,
                {
                  height: SHEET_HEIGHT,
                  borderTopLeftRadius: BORDER_RADIUS_TOP,
                  borderTopRightRadius: BORDER_RADIUS_TOP,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, SHEET_HEIGHT],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.sheetTouchable}>
                  <View style={styles.sheetHandle} />
                  <ScrollView
                    style={styles.sheetScroll}
                    contentContainerStyle={styles.sheetContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    <Text style={styles.sheetTitle}>Accedi o Crea account</Text>

                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#9ca3af"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!loading}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#9ca3af"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      editable={!loading}
                    />

                    <TouchableOpacity
                      style={styles.accediBtn}
                      onPress={isSignUp ? handleSignUp : handleLogin}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <Text style={styles.accediBtnText}>{isSignUp ? 'Crea account' : 'Accedi'}</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.switchMode}
                      onPress={() => setIsSignUp(!isSignUp)}
                      disabled={loading}
                    >
                      <Text style={styles.switchModeText}>
                        {isSignUp ? 'Hai già un account? Accedi' : 'Non hai un account? Crea account'}
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.inkBlack,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  spacer: {
    flex: 1,
  },
  heroText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  cta: {
    backgroundColor: COLORS.fadedCopper,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingVertical: BUTTON_PADDING_VERTICAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  modalWrap: {
    flex: 1,
  },
  modalInner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  sheet: {
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  sheetTouchable: {
    flex: 1,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginTop: 12,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.inkBlack,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.inkBlack,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.darkTeal,
    borderRadius: 12,
    marginBottom: 14,
  },
  accediBtn: {
    width: '100%',
    backgroundColor: COLORS.fadedCopper,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  accediBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  switchMode: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 14,
    color: COLORS.darkTeal,
    fontWeight: '500',
  },
  devBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  devBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
