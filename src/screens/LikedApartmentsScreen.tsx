import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { ApartmentDetailModal } from '../components/ApartmentDetailModal';
import { COLORS } from '../utils/constants';

export function LikedApartmentsScreen({ navigation }: any) {
  const [likedApartments, setLikedApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApartment, setSelectedApartment] = useState<any>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadLikedApartments();
  }, []);

  const loadLikedApartments = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Query per ottenere gli swipe "right" con i dati degli appartamenti
      const { data, error } = await supabase
        .from('swipes')
        .select('*, apartments(*)')
        .eq('tenant_id', user.id)
        .eq('direction', 'right')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Errore nel caricamento:', error);
        setLoading(false);
        return;
      }

      // Estrai gli appartamenti dai risultati
      const apartments = data
        ?.map((swipe: any) => swipe.apartments)
        .filter((apt: any) => apt !== null) || [];

      setLikedApartments(apartments);
    } catch (error: any) {
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCoverImage = (img: any) => {
    if (!img) return 'https://via.placeholder.com/150';
    return Array.isArray(img) ? img[0] : img;
  };

  const renderApartmentItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.apartmentItem}
      onPress={() => setSelectedApartment(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: getCoverImage(item.image_url) }}
        style={styles.apartmentImage}
      />
      <View style={styles.apartmentInfo}>
        <Text style={styles.apartmentPrice}>€{item.price}/mese</Text>
        <Text style={styles.apartmentTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.apartmentLocation} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
      </View>
      <Text style={styles.arrowIcon}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Case che ti sono piaciute</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Case che ti sono piaciute</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Lista */}
      {likedApartments.length > 0 ? (
        <FlatList
          data={likedApartments}
          renderItem={renderApartmentItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💔</Text>
          <Text style={styles.emptyText}>Nessuna casa salvata</Text>
          <Text style={styles.emptySubtext}>
            Fai swipe a destra sulle case che ti piacciono per salvarle qui
          </Text>
        </View>
      )}

      {/* Modale Dettaglio */}
      <ApartmentDetailModal
        visible={!!selectedApartment}
        apartment={selectedApartment}
        onClose={() => setSelectedApartment(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.cardWhite,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
  },
  backButton: {
    padding: 5,
    width: 40,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.darkTeal,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.inkBlack,
    flex: 1,
    textAlign: 'center',
  },
  listContent: {
    padding: 20,
  },
  apartmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardWhite,
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    shadowColor: COLORS.inkBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  apartmentImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: COLORS.inputBorder,
    marginRight: 15,
  },
  apartmentInfo: {
    flex: 1,
  },
  apartmentPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkTeal,
    marginBottom: 4,
  },
  apartmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.inkBlack,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  apartmentLocation: {
    fontSize: 14,
    color: COLORS.mutedTeal,
    flex: 1,
  },
  arrowIcon: {
    fontSize: 24,
    color: COLORS.inputBorder,
    fontWeight: '300',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.inkBlack,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.mutedTeal,
    textAlign: 'center',
    lineHeight: 20,
  },
});

