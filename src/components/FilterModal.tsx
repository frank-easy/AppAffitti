import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: { maxPrice: number | null; minSqMeters: number | null; minRooms: number | null }) => void;
  initialFilters: { maxPrice: number | null; minSqMeters: number | null; minRooms: number | null };
}

export const FilterModal = ({ visible, onClose, onApply, initialFilters }: FilterModalProps) => {
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice ? String(initialFilters.maxPrice) : '');
  const [minSqMeters, setMinSqMeters] = useState(initialFilters.minSqMeters ? String(initialFilters.minSqMeters) : '');
  const [minRooms, setMinRooms] = useState(initialFilters.minRooms ? String(initialFilters.minRooms) : '');

  const handleReset = () => {
    setMaxPrice(''); setMinSqMeters(''); setMinRooms('');
    onApply({ maxPrice: null, minSqMeters: null, minRooms: null });
    onClose();
  };

  const handleApply = () => {
    const parsedPrice = parseFloat(maxPrice);
    const parsedSqm = parseInt(minSqMeters);
    const parsedRooms = parseInt(minRooms);
    onApply({
      maxPrice: maxPrice && !isNaN(parsedPrice) ? parsedPrice : null,
      minSqMeters: minSqMeters && !isNaN(parsedSqm) ? parsedSqm : null,
      minRooms: minRooms && !isNaN(parsedRooms) ? parsedRooms : null,
    });
    onClose();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.filterModalOverlay}>
        <View style={styles.filterModalContainer}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Filtra Ricerca</Text>
            <TouchableOpacity onPress={onClose}><Text style={{fontSize:20, padding: 5}}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{padding: 20}}>
            <Text style={styles.filterLabel}>Prezzo Massimo (€)</Text>
            <TextInput style={styles.filterInput} placeholder="Es. 600" keyboardType="numeric" value={maxPrice} onChangeText={setMaxPrice} />
            <Text style={styles.filterLabel}>Metri Quadri Minimi</Text>
            <TextInput style={styles.filterInput} placeholder="Es. 20" keyboardType="numeric" value={minSqMeters} onChangeText={setMinSqMeters} />
            <Text style={styles.filterLabel}>Locali Minimi</Text>
            <TextInput style={styles.filterInput} placeholder="Es. 2" keyboardType="numeric" value={minRooms} onChangeText={setMinRooms} />
            <View style={{flexDirection:'row', gap:10, marginTop: 20}}>
              <TouchableOpacity style={[styles.filterBtn, styles.filterBtnSecondary]} onPress={handleReset}>
                <Text style={styles.filterBtnSecondaryText}>Resetta</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.filterBtn, styles.filterBtnPrimary]} onPress={handleApply}>
                <Text style={styles.filterBtnPrimaryText}>Applica</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  filterModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  filterModalContainer: { backgroundColor: COLORS.cardWhite, borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: '50%' },
  filterModalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderColor: COLORS.inputBorder },
  filterModalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primaryDark },
  filterLabel: { fontWeight: '600', marginTop: 15, marginBottom: 5, color: COLORS.primaryDark },
  filterInput: { backgroundColor: COLORS.backgroundLight, padding: 15, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: COLORS.inputBorder, color: COLORS.primaryDark },
  filterBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
  filterBtnPrimary: { backgroundColor: COLORS.tenantBrand }, // Used in TenantApp
  filterBtnPrimaryText: { color: COLORS.primaryDark, fontWeight: 'bold', textAlign: 'center' }, // Dark text for contrast on tenantBrand
  filterBtnSecondary: { backgroundColor: COLORS.inputBorder },
  filterBtnSecondaryText: { color: COLORS.primaryDark, fontWeight: 'bold', textAlign: 'center' },
});

