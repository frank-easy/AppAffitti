import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export function RoleSelectionScreen({ navigation }: any) {
  const selectRole = async (role: 'tenant' | 'owner') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { Alert.alert('Errore', 'Sessione non trovata.'); return; }
    const { error } = await supabase.from('profiles').update({ role }).eq('id', user.id);
    if (error) { Alert.alert('Errore', error.message); return; }
    if (role === 'owner') navigation.replace('AddApartment');
    else navigation.replace('TenantPreferences');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sei qui per...</Text>

      <TouchableOpacity
        style={styles.tenantCard}
        onPress={() => selectRole('tenant')}
        activeOpacity={0.75}
      >
        <Ionicons name="search-outline" size={28} color="#84A98C" />
        <Text style={styles.cardTitle}>Cerco casa</Text>
        <Text style={styles.cardSubtitle}>Trova la tua casa ideale</Text>
      </TouchableOpacity>

      <View style={{ height: 14 }} />

      <TouchableOpacity
        style={styles.ownerCard}
        onPress={() => selectRole('owner')}
        activeOpacity={0.75}
      >
        <Ionicons name="home-outline" size={28} color="#A7754D" />
        <Text style={styles.cardTitle}>Offro casa</Text>
        <Text style={styles.cardSubtitle}>Pubblica il tuo annuncio</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1F1A',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    fontSize: 26,
    color: '#F0EDE8',
    marginTop: 64,
    marginBottom: 32,
  },
  tenantCard: {
    backgroundColor: '#152B20',
    borderWidth: 1,
    borderColor: 'rgba(132, 169, 140, 0.35)',
    borderRadius: 20,
    padding: 28,
    width: '85%',
    alignSelf: 'center',
  },
  ownerCard: {
    backgroundColor: '#152B20',
    borderWidth: 1,
    borderColor: 'rgba(167, 117, 77, 0.35)',
    borderRadius: 20,
    padding: 28,
    width: '85%',
    alignSelf: 'center',
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 17,
    color: '#F0EDE8',
    marginTop: 12,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B9975',
    marginTop: 4,
  },
});
