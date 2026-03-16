import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SCREEN_WIDTH, SCREEN_HEIGHT, COLORS } from '../utils/constants';
import { UserProfileOverlay } from './UserProfileOverlay';
import { FullScreenPhotoOverlay } from './FullScreenPhotoOverlay';

interface ApartmentDetailModalProps {
  visible: boolean;
  apartment: any;
  onClose: () => void;
}

export const ApartmentDetailModal = ({ visible, apartment, onClose }: ApartmentDetailModalProps) => {
  const [showOwner, setShowOwner] = useState(false);
  const [fullPhotoUri, setFullPhotoUri] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  if (!apartment) return null;

  // Gestione sicura: se image_url è stringa (vecchi dati) la converte in array
  const photos = Array.isArray(apartment.image_url) ? apartment.image_url : [apartment.image_url];
  
  // Calcola l'altezza del carosello (45% dello schermo)
  const carouselHeight = SCREEN_HEIGHT * 0.45;

  // Prepara le features come chips
  const features = [
    { icon: '📐', label: `${apartment.sq_meters || '--'} m²` },
    { icon: '🚪', label: `${apartment.num_rooms || '--'} Locali` },
    { icon: '🏢', label: `Piano ${apartment.floor || '--'}` },
    { icon: '🛁', label: `${apartment.bathrooms || '--'} Bagni` },
  ];

  // Aggiungi features extra se presenti
  if (apartment.features) {
    const extraFeatures = apartment.features.split(',').map((f: string) => f.trim()).filter(Boolean);
    extraFeatures.forEach((feature: string) => {
      features.push({ icon: '✨', label: feature });
    });
  }

  return (
    <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* IMMERSIVE HEADER - Carosello Foto */}
        <View style={[styles.carouselContainer, { height: carouselHeight }]}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            style={styles.carousel}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {photos.map((uri: string, index: number) => (
              <TouchableOpacity 
                key={index} 
                activeOpacity={0.9} 
                onPress={() => setFullPhotoUri(uri)}
                style={styles.imageContainer}
              >
                <Image 
                  source={{ uri }} 
                  style={[styles.carouselImage, { height: carouselHeight }]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Gradiente superiore per rendere visibile il bottone chiudi */}
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.2)', 'transparent']}
            locations={[0, 0.3, 1]}
            style={styles.topGradient}
          />

          {/* Bottone Chiudi Fluttuante */}
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.floatingCloseButton}
            activeOpacity={0.8}
          >
            <View style={styles.closeButtonInner}>
              <Text style={styles.closeButtonText}>✕</Text>
            </View>
          </TouchableOpacity>

          {/* Indicatori Paginazione */}
          {photos.length > 1 && (
            <View style={styles.paginationDots}>
              {photos.map((_: any, i: number) => (
                <View 
                  key={i} 
                  style={[
                    styles.dot, 
                    i === activeIndex ? styles.dotActive : styles.dotInactive
                  ]} 
                />
              ))}
            </View>
          )}
        </View>

        {/* INFO SHEET - Contenitore Dettagli */}
        <ScrollView 
          style={styles.infoSheet}
          contentContainerStyle={styles.infoSheetContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Prezzo e Spese - Enormi e ben visibili */}
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.premiumPrice}>€{apartment.price}</Text>
              <Text style={styles.pricePeriod}>/mese</Text>
            </View>
            {apartment.utility_cost > 0 && (
              <Text style={styles.utilityCost}>+ €{apartment.utility_cost} spese mensili</Text>
            )}
          </View>

          {/* Titolo e Indirizzo */}
          <Text style={styles.premiumTitle}>{apartment.title}</Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{apartment.location}</Text>
          </View>

          <View style={styles.divider} />

          {/* Features & Comfort - Chips */}
          <View style={styles.chipsContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.chip}>
                <Text style={styles.chipIcon}>{feature.icon}</Text>
                <Text style={styles.chipText}>{feature.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Descrizione */}
          <Text style={styles.sectionTitle}>Descrizione</Text>
          <Text style={styles.descriptionText}>
            {apartment.description || 'Nessuna descrizione disponibile.'}
          </Text>

          {/* Proprietario - Design Premium */}
          <View style={styles.divider} />
          <TouchableOpacity 
            style={styles.ownerCard} 
            onPress={() => setShowOwner(true)}
            activeOpacity={0.7}
          >
            <View style={styles.ownerContent}>
              <View style={styles.ownerAvatar}>
                <Text style={styles.ownerAvatarText}>👤</Text>
              </View>
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerLabel}>Annuncio di</Text>
                <Text style={styles.ownerName}>Profilo Proprietario</Text>
                <Text style={styles.ownerSubtext}>Tocca per visualizzare</Text>
              </View>
              <Text style={styles.ownerArrow}>›</Text>
            </View>
          </TouchableOpacity>

          {/* Spazio finale per scroll fluido */}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Modali */}
        {showOwner && (
          <Modal 
            visible={showOwner} 
            animationType="slide" 
            transparent={false} 
            onRequestClose={() => setShowOwner(false)}
          >
            <UserProfileOverlay userId={apartment.owner_id} onClose={() => setShowOwner(false)} />
          </Modal>
        )}

        {fullPhotoUri && (
          <View style={styles.absoluteFullOverlay}>
            <FullScreenPhotoOverlay uri={fullPhotoUri} onClose={() => setFullPhotoUri(null)} />
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  // IMMERSIVE HEADER
  carouselContainer: {
    width: '100%',
    position: 'relative',
  },
  carousel: {
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  carouselImage: {
    width: SCREEN_WIDTH,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 2,
  },
  floatingCloseButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.inkBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.inkBlack,
  },
  paginationDots: {
    position: 'absolute',
    bottom: 40, // Moved higher up
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: COLORS.inkBlack,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  // INFO SHEET
  infoSheet: {
    flex: 1,
    backgroundColor: COLORS.cardWhite,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: COLORS.inkBlack,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  infoSheetContent: {
    padding: 25,
    paddingTop: 30,
  },
  // PREZZO
  priceSection: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  premiumPrice: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.inkBlack,
    letterSpacing: -1,
  },
  pricePeriod: {
    fontSize: 20,
    fontWeight: '500',
    color: COLORS.mutedTeal,
    marginLeft: 4,
  },
  utilityCost: {
    fontSize: 16,
    color: COLORS.mutedTeal,
    fontWeight: '400',
  },
  // TITOLO E INDIRIZZO
  premiumTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.inkBlack,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  locationText: {
    fontSize: 16,
    color: COLORS.mutedTeal,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.inputBorder,
    marginVertical: 24,
  },
  // CHIPS
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  chipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.inkBlack,
  },
  // SEZIONI
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.mutedTeal,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.inkBlack,
    fontWeight: '400',
  },
  // PROPRIETARIO
  ownerCard: {
    backgroundColor: COLORS.cardWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    padding: 16,
    marginTop: 8,
  },
  ownerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.inputBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ownerAvatarText: {
    fontSize: 28,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerLabel: {
    fontSize: 12,
    color: COLORS.mutedTeal,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.inkBlack,
    marginBottom: 2,
  },
  ownerSubtext: {
    fontSize: 14,
    color: COLORS.darkTeal,
    fontWeight: '500',
  },
  ownerArrow: {
    fontSize: 24,
    color: COLORS.inputBorder,
    fontWeight: '300',
  },
  absoluteFullOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 9999,
  },
});
