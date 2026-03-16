import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, View, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { commonStyles } from '../styles/commonStyles';
import { COLORS } from '../utils/constants';

export function AuthScreen({ route, navigation }: any) {
  const { role } = route.params;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const TEST_INQUILINO = { email: 'inq1@stu.it', pass: '123456' }; 
  const TEST_PROPRIETARIO = { email: 'prop1@gmail.com', pass: '123456' };

  const handleRegister = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { Alert.alert("Errore", error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from('profiles').insert([{ id: data.user.id, role: role, email: email }]);
      navigation.replace('ProfileSetup', { role: role }); 
    }
    setLoading(false);
  };
  
  const handleLogin = async (manualEmail?: string, manualPass?: string) => {
    setLoading(true);
    const e = (manualEmail || email).trim();
    const p = (manualPass || password).trim();
    const { data, error } = await supabase.auth.signInWithPassword({ email: e, password: p });
    if (error) { Alert.alert("Errore Login", "Credenziali errate."); setLoading(false); return; }
    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
      const userRole = profile?.role || role;
      if (userRole === 'owner') navigation.replace('OwnerApp'); else navigation.replace('TenantApp');
    }
    setLoading(false);
  };
  
  return (
    <SafeAreaView style={commonStyles.containerCenter}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, width: '100%' }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={commonStyles.headerTitle}>{role === 'tenant' ? 'ACCESSO INQUILINO' : 'ACCESSO PROPRIETARIO'}</Text>
            <TextInput style={commonStyles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none"/>
            <TextInput style={commonStyles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry/>
            <TouchableOpacity style={commonStyles.primaryBtn} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="white"/> : <Text style={commonStyles.btnText}>Crea Nuovo Account</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[commonStyles.primaryBtn, {backgroundColor: COLORS.cardWhite, borderWidth:1, borderColor: COLORS.darkTeal, marginTop:15}]} onPress={() => handleLogin()} disabled={loading}>
              <Text style={[commonStyles.btnText, {color: COLORS.darkTeal}]}>Accedi</Text>
            </TouchableOpacity>
            <View style={{marginTop: 40, width: '100%', borderTopWidth: 1, borderColor: COLORS.inputBorder, paddingTop: 20}}>
              <View style={{flexDirection: 'row', gap: 10}}>
                <TouchableOpacity style={[commonStyles.primaryBtn, {flex: 1, backgroundColor: COLORS.inkBlack, marginTop: 0, padding: 10}]} onPress={() => handleLogin(TEST_INQUILINO.email, TEST_INQUILINO.pass)}>
                  <Text style={{color: COLORS.white, fontSize: 12, fontWeight: 'bold'}}>Login Inquilino</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[commonStyles.primaryBtn, {flex: 1, backgroundColor: COLORS.inkBlack, marginTop: 0, padding: 10}]} onPress={() => handleLogin(TEST_PROPRIETARIO.email, TEST_PROPRIETARIO.pass)}>
                  <Text style={{color: COLORS.white, fontSize: 12, fontWeight: 'bold'}}>Login Proprietario</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

