import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { commonStyles } from '../styles/commonStyles';
import { COLORS } from '../utils/constants';

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
    <SafeAreaView style={commonStyles.containerCenter}>
      <Text style={commonStyles.bigTitle}>AppAffitti</Text>
      <View style={{height: 40}} />

      {/* Tenant Card - Fresh/Calm with tenantBrand */}
      <TouchableOpacity
        style={[styles.roleCard, styles.tenantCard]}
        onPress={() => selectRole('tenant')}
        activeOpacity={0.8}
      >
        <Text style={styles.roleCardTitle}>CERCO CASA</Text>
        <Text style={styles.roleCardSubtitle}>Trova la tua casa ideale</Text>
      </TouchableOpacity>

      {/* Owner Card - Warm/Solid with ownerBrand */}
      <TouchableOpacity
        style={[styles.roleCard, styles.ownerCard]}
        onPress={() => selectRole('owner')}
        activeOpacity={0.8}
      >
        <Text style={styles.roleCardTitle}>OFFRO CASA</Text>
        <Text style={styles.roleCardSubtitle}>Pubblica il tuo annuncio</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  roleCard: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  tenantCard: {
    backgroundColor: COLORS.tenantBrand,
    borderColor: COLORS.tenantBrand,
  },
  ownerCard: {
    backgroundColor: COLORS.ownerBrand,
    borderColor: COLORS.ownerBrand,
  },
  roleCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  roleCardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.white,
    opacity: 0.9,
  },
});