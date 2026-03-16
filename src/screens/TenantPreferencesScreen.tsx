import React, { useState } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation/AppNavigator';
import { commonStyles } from '../styles/commonStyles';
import { COLORS } from '../utils/constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TenantPreferences'>;
};

export function TenantPreferencesScreen({ navigation }: Props) {
  const [city, setCity] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isSmoker, setIsSmoker] = useState<boolean | null>(null);
  const [hasPets, setHasPets] = useState<boolean | null>(null);
  const [roomType, setRoomType] = useState<'single' | 'entire' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    const parsed = parseFloat(maxPrice);
    const prefMaxPrice = isNaN(parsed) ? null : parsed;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Errore', 'Sessione non trovata.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      pref_city: city.trim() || null,
      pref_max_price: prefMaxPrice,
      pref_smoker: isSmoker,
      pref_pets: hasPets,
      pref_room_type: roomType,
    });

    if (error) {
      Alert.alert('Errore', error.message);
      setLoading(false);
      return;
    }

    navigation.replace('TenantApp');
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={commonStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={commonStyles.headerTitle}>Le tue preferenze</Text>

            <Text style={commonStyles.label}>Città di ricerca</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="Es. Milano"
              value={city}
              onChangeText={setCity}
            />

            <Text style={commonStyles.label}>Budget massimo (€/mese)</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="Es. 800"
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="numeric"
            />

            <Text style={commonStyles.label}>Sei fumatore?</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, isSmoker === true && styles.toggleBtnActive]}
                onPress={() => setIsSmoker(true)}
              >
                <Text style={[styles.toggleText, isSmoker === true && styles.toggleTextActive]}>Sì</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, isSmoker === false && styles.toggleBtnActive]}
                onPress={() => setIsSmoker(false)}
              >
                <Text style={[styles.toggleText, isSmoker === false && styles.toggleTextActive]}>No</Text>
              </TouchableOpacity>
            </View>

            <Text style={commonStyles.label}>Hai animali?</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, hasPets === true && styles.toggleBtnActive]}
                onPress={() => setHasPets(true)}
              >
                <Text style={[styles.toggleText, hasPets === true && styles.toggleTextActive]}>Sì</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, hasPets === false && styles.toggleBtnActive]}
                onPress={() => setHasPets(false)}
              >
                <Text style={[styles.toggleText, hasPets === false && styles.toggleTextActive]}>No</Text>
              </TouchableOpacity>
            </View>

            <Text style={commonStyles.label}>Tipo di alloggio</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, roomType === 'single' && styles.toggleBtnActive]}
                onPress={() => setRoomType('single')}
              >
                <Text style={[styles.toggleText, roomType === 'single' && styles.toggleTextActive]}>Stanza</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, roomType === 'entire' && styles.toggleBtnActive]}
                onPress={() => setRoomType('entire')}
              >
                <Text style={[styles.toggleText, roomType === 'entire' && styles.toggleTextActive]}>Appartamento intero</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[commonStyles.primaryBtn, { backgroundColor: COLORS.tenantBrand }]}
              onPress={handleNext}
              disabled={loading}
            >
              <Text style={commonStyles.btnText}>{loading ? 'Salvataggio...' : 'Avanti'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  toggleBtnActive: {
    backgroundColor: COLORS.tenantBrand,
    borderColor: COLORS.tenantBrand,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#fff',
  },
});
