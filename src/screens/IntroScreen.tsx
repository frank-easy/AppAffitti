import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardEvent,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { IntroShapes } from '../components/intro/IntroShapes';
import { COLORS } from '../utils/constants';

const SCREEN_HEIGHT = Dimensions.get('window').height;

function toFixed4(n: number) {
  return Number(n.toFixed(4));
}

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
  const keyboardShift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => {
        Animated.timing(keyboardShift, {
          toValue: -e.endCoordinates.height * 0.72,
          duration: Platform.OS === 'ios' ? e.duration : 200,
          useNativeDriver: true,
        }).start();
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e: KeyboardEvent) => {
        Animated.timing(keyboardShift, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? e.duration : 200,
          useNativeDriver: true,
        }).start();
      }
    );
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

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
      <IntroShapes />

      <View style={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}>
        <Text style={styles.appName}>AppAffitti</Text>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={styles.heroText}>La tua prossima casa, a portata di match.</Text>
        </View>
        <View style={{ width: '100%', gap: 12 }}>
          <TouchableOpacity style={styles.cta} onPress={openAuth} activeOpacity={0.85}>
            <Text style={styles.ctaText}>Iniziamo</Text>
          </TouchableOpacity>
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
        </View>
      </View>

      <Modal
        visible={authVisible}
        transparent
        animationType="none"
        onRequestClose={closeAuth}
      >
        <View style={styles.modalWrap}>
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
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, SCREEN_HEIGHT],
                      }),
                    },
                    { translateY: keyboardShift },
                  ],
                },
              ]}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View>
                  <View style={styles.sheetHandle} />
                  <View style={[styles.sheetContent, { paddingBottom: insets.bottom + 16 }]}>
                    <Text style={styles.sheetTitle}>Accedi</Text>

                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#5A8A6A"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!loading}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#5A8A6A"
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
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1F1A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  appName: {
    fontFamily: 'Georgia',
    fontSize: 22,
    color: '#F0EDE8',
    opacity: 0.88,
    textAlign: 'center',
    paddingVertical: 8,
  },
  spacer: {
    flex: 1,
  },
  heroText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F0EDE8',
    textAlign: 'center',
    marginBottom: 28,
  },
  cta: {
    backgroundColor: '#84A98C',
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingVertical: BUTTON_PADDING_VERTICAL,
    width: '85%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0D1F1A',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2A4F38',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  sheetContent: {
    paddingHorizontal: 24,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F0EDE8',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#F0EDE8',
    backgroundColor: '#152B20',
    borderWidth: 0.8,
    borderColor: '#2A4F38',
    borderRadius: 12,
    marginBottom: 14,
  },
  accediBtn: {
    width: '100%',
    backgroundColor: '#84A98C',
    height: 52,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  accediBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  switchMode: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 14,
    color: '#84A98C',
    textAlign: 'center',
  },
  devBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 0,
    paddingVertical: 4,
    opacity: 0.5,
  },
  devBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
