import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Swiper from 'react-native-deck-swiper';
import { supabase } from '../lib/supabase';
import { Tab, COLORS } from '../utils/constants';
import { AppHeader } from '../components/AppHeader';
import { BottomMenu } from '../components/BottomMenu';
import { FilterModal } from '../components/FilterModal';
import { ApartmentDetailModal } from '../components/ApartmentDetailModal';
import { ChatListComponent } from './ChatListComponent';
import { MyProfileView } from './MyProfileView';
import { commonStyles } from '../styles/commonStyles';
import { SCREEN_HEIGHT } from '../utils/constants';

export function TenantApp({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [apartments, setApartments] = useState<any[]>([]);
  const [allSwiped, setAllSwiped] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{ maxPrice: number | null; minSqMeters: number | null; minRooms: number | null }>({ 
    maxPrice: null, 
    minSqMeters: null, 
    minRooms: null 
  });

  useEffect(() => { if (activeTab === 'home') loadApartments(); }, [activeTab, filters]);

  // Funzione helper per verificare se un appartamento passa i filtri rigidi
  const passesHardFilters = (apartment: any, userProfile: any): boolean => {
    // Gender Filter
    if (apartment.allowed_gender && apartment.allowed_gender !== 'any') {
      // Se la casa richiede un genere specifico
      if (apartment.allowed_gender !== userProfile.gender) {
        // Se l'utente è 'non_binary' o 'na', viene escluso se la casa richiede 'male' o 'female'
        if (userProfile.gender === 'non_binary' || userProfile.gender === 'na') {
          return false;
        }
        // Altrimenti, escludi se il genere non corrisponde
        return false;
      }
    }

    // Smoker Filter
    // Se la casa NON permette fumatori E l'utente è fumatore, escludi
    if (apartment.allow_smokers === false && userProfile.is_smoker === true) {
      return false;
    }

    // Occupation Filter
    if (apartment.allowed_occupation && apartment.allowed_occupation !== 'any') {
      if (apartment.allowed_occupation !== userProfile.occupation) {
        return false;
      }
    }

    return true;
  };

  const loadApartments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Recupera il profilo utente completo con i dati per i filtri rigidi
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('gender, is_smoker, occupation')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      console.warn('Profilo utente non trovato');
      return;
    }
    
    let query = supabase.from('apartments').select('*');
    if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
    if (filters.minSqMeters) query = query.gte('sq_meters', filters.minSqMeters);
    if (filters.minRooms) query = query.gte('num_rooms', filters.minRooms);

    const { data: allHomes } = await query;
    const { data: mySwipes } = await supabase.from('swipes').select('apartment_id').eq('tenant_id', user.id);
    const { data: myMatches } = await supabase.from('matches').select('apartment_id').eq('tenant_id', user.id);

    const hiddenIds = new Set([
        ...(mySwipes?.map(s => String(s.apartment_id)) || []),
        ...(myMatches?.map(m => String(m.apartment_id)) || [])
    ]);

    // Applica i filtri rigidi PRIMA di filtrare per swipes/matches
    const hardFilteredHomes = allHomes?.filter(home => passesHardFilters(home, userProfile)) || [];
    
    // Poi filtra per swipes/matches già visti
    const availableHomes = hardFilteredHomes.filter(home => !hiddenIds.has(String(home.id)));
    
    setApartments(availableHomes);
    setAllSwiped(availableHomes.length === 0);
  };

  const handleSwipe = async (idx: number, direction: 'right' | 'left') => {
    const card = apartments[idx];
    if(!card) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('swipes').insert([{ tenant_id: user?.id, apartment_id: card.id, direction }]);
  };

  const handleLogout = async () => { 
    await supabase.auth.signOut(); 
    navigation.reset({ index: 0, routes: [{ name: 'RoleSelection' }] }); 
  };

  const getCoverImage = (img: any) => Array.isArray(img) ? img[0] : img;

  return (
    <View style={commonStyles.container}>
      <AppHeader title="AppAffitti" />
      {activeTab === 'home' && (
        <View style={commonStyles.filterContainer}>
           <TouchableOpacity style={commonStyles.filterPill} onPress={() => setShowFilters(true)} activeOpacity={0.8}>
             <Text style={{fontSize: 16}}>🔍</Text>
             <Text style={commonStyles.filterPillText}>FILTRA RICERCA</Text>
           </TouchableOpacity>
        </View>
      )}
      
      {activeTab === 'home' && (
        apartments.length > 0 && !allSwiped ? (
         <View style={commonStyles.swiperFlexContainer}>
           <Swiper 
              cards={apartments} 
              renderCard={(card) => (
                <TouchableOpacity 
                  style={[styles.immersiveCard, { height: SCREEN_HEIGHT * 0.63 }]} 
                  activeOpacity={0.95} 
                  onPress={() => setSelectedApartment(card)}
                >
                  {/* Immagine di sfondo che occupa tutta la card */}
                  <Image 
                    source={{uri: getCoverImage(card.image_url)}} 
                    style={styles.cardBackgroundImage}
                    resizeMode="cover"
                  />
                  
                  {/* LinearGradient per rendere il testo leggibile (ultimi 40%) */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
                    locations={[0, 0.5, 1]}
                    style={styles.gradientOverlay}
                  >
                    {/* Contenuto testo nella parte bassa sinistra */}
                    <View style={styles.cardContent}>
                      {/* Prezzo - Font grande 32px */}
                      <Text style={styles.immersivePrice}>€{card.price}</Text>
                      
                      {/* Titolo/Zona - Font medio 20px */}
                      <Text style={styles.immersiveTitle}>{card.title}</Text>
                      <Text style={styles.immersiveLocation}>{card.location}</Text>
                      
                      {/* Info rapide con icone */}
                      <View style={styles.quickInfoRow}>
                        <Text style={styles.quickInfoText}>
                          📐 {card.sq_meters || '--'}mq
                        </Text>
                        <Text style={styles.quickInfoSeparator}> • </Text>
                        <Text style={styles.quickInfoText}>
                          🚪 {card.num_rooms || '--'} Locali
                        </Text>
                        {card.bathrooms && (
                          <>
                            <Text style={styles.quickInfoSeparator}> • </Text>
                            <Text style={styles.quickInfoText}>
                              🛁 {card.bathrooms} Bagni
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )} 
              onSwipedRight={(i) => handleSwipe(i, 'right')} 
              onSwipedLeft={(i) => handleSwipe(i, 'left')}
              onSwipedAll={() => setAllSwiped(true)} 
              cardIndex={0} stackSize={3} backgroundColor="transparent" 
              cardVerticalMargin={0} verticalSwipe={false}
              containerStyle={{flex:1, alignItems: 'center', justifyContent: 'center'}} 
            />
         </View>
        ) : (
          <View style={commonStyles.centerContainer}>
            <Text style={{fontSize:40}}>🎉</Text>
            <Text style={commonStyles.headerTitle}>Nessuna casa trovata!</Text>
            <Text style={{color:'#666'}}>Prova a cambiare i filtri.</Text>
          </View>
        )
      )}
      <ApartmentDetailModal visible={!!selectedApartment} apartment={selectedApartment} onClose={() => setSelectedApartment(null)} />
      <FilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={setFilters} initialFilters={filters} />
      {activeTab === 'chat' && <ChatListComponent navigation={navigation}/>}
      {activeTab === 'profile' && <MyProfileView onLogout={handleLogout} navigation={navigation} />}
      <BottomMenu activeTab={activeTab} onTabChange={setActiveTab} userRole="tenant" />
    </View>
  );
}

const styles = StyleSheet.create({
  immersiveCard: {
    borderRadius: 20,
    backgroundColor: COLORS.cardWhite,
    shadowColor: COLORS.inkBlack,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    marginLeft: 15,
    marginRight: 15,
    overflow: 'hidden',
  },
  cardBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  // Gradient Overlay - Ultimi 40%
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    justifyContent: 'flex-end',
  },
  cardContent: {
    padding: 24,
    paddingBottom: 28,
  },
  // Prezzo - Font grande 32px
  immersivePrice: {
    color: 'white',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  // Titolo/Zona - Font medio 20px
  immersiveTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  immersiveLocation: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Info rapide con icone
  quickInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  quickInfoText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  quickInfoSeparator: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '300',
    marginHorizontal: 4,
  },
});

