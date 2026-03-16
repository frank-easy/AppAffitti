import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ApartmentDetailEditModal } from '../components/ApartmentDetailEditModal';
import { COLORS } from '../utils/constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ApartmentList'>;
};

type Apartment = {
  id: string;
  title: string;
  price: number;
  location: string;
  image_url: string[] | string | null;
};

export function ApartmentListScreen({ navigation }: Props) {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const loadApartments = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('apartments')
      .select('*')
      .eq('owner_id', user.id);
    if (!error && data) setApartments(data as Apartment[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadApartments(); }, [loadApartments]);

  const getCoverImage = (img: string[] | string | null): string => {
    if (!img) return 'https://via.placeholder.com/150';
    return Array.isArray(img) ? img[0] : img;
  };

  const confirmDelete = (apartment: Apartment) => {
    Alert.alert(
      'Vuoi eliminare questa casa?',
      '',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Sì',
          onPress: () =>
            Alert.alert(
              'Sei sicuro?',
              "L'operazione è irreversibile.",
              [
                { text: 'Annulla', style: 'cancel' },
                {
                  text: 'Sì, elimina',
                  style: 'destructive',
                  onPress: () => deleteApartment(apartment),
                },
              ],
            ),
        },
      ],
    );
  };

  const deleteApartment = async (apartment: Apartment) => {
    const { error } = await supabase.from('apartments').delete().eq('id', apartment.id);
    if (error) {
      Alert.alert('Errore', error.message);
      return;
    }
    setApartments(prev => prev.filter(a => a.id !== apartment.id));
  };

  const renderItem = ({ item }: { item: Apartment }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => {
        setSelectedApartment(item);
        setShowDetail(true);
      }}
    >
      <Image
        source={{ uri: getCoverImage(item.image_url) }}
        style={styles.cardImage}
        resizeMode="cover"
        onError={(e) => console.log('IMG ERROR:', e.nativeEvent.error, getCoverImage(item.image_url))}
        onLoad={() => console.log('IMG OK:', getCoverImage(item.image_url))}
      />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardPrice}>€{item.price}/mese</Text>
        <Text style={styles.cardLocation}>{item.location}</Text>
        <View style={styles.cardFooter}>
          <TouchableOpacity
            onPress={() => confirmDelete(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteBtn}>Elimina</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const header = (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Le tue case</Text>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate('AddApartment')}
      >
        <Text style={styles.addBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.ownerBrand} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {header}
      <FlatList
        data={apartments}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          apartments.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Nessuna casa inserita</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('AddApartment')}
            >
              <Text style={styles.emptyBtnText}>Aggiungi la tua prima casa</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <ApartmentDetailEditModal
        visible={showDetail}
        apartment={selectedApartment}
        onClose={() => setShowDetail(false)}
        onApartmentUpdated={loadApartments}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.ownerBrand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 26,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: COLORS.ownerBrand,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ownerBrand,
    marginBottom: 2,
  },
  cardLocation: {
    fontSize: 13,
    color: '#888',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteBtn: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '600',
  },
});
