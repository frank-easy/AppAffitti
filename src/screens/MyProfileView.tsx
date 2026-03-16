import React, { useState, useEffect } from 'react';
import { ScrollView, Text, Image, TouchableOpacity, ActivityIndicator, View, StyleSheet, Platform, UIManager } from 'react-native';
import { supabase } from '../lib/supabase';
import { ProfileDetailModal } from '../components/ProfileDetailModal';
import { COLORS } from '../utils/constants';

// Abilita LayoutAnimation su Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function MyProfileView({ onLogout, navigation }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  
  useEffect(() => { 
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setProfile(data);
          setAvatarImage(data.avatar_url || null);
        }
      }
    };
    loadProfile();
  }, []);


  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.functionalTeal} />
      </View>
    );
  }

  const roleLabel = profile.role === 'owner' ? 'Proprietario' : 'Inquilino';
  const roleIcon = profile.role === 'owner' ? '🔑' : '👤';
  const roleBrandColor = profile.role === 'owner' ? COLORS.ownerBrand : COLORS.tenantBrand;

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section - Bubble 1 - Preview Card */}
      <TouchableOpacity 
        style={styles.heroBubble}
        onPress={() => setShowProfileDetail(true)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: avatarImage || 'https://via.placeholder.com/150' }} 
            style={styles.heroAvatar}
          />
        </View>
        <Text style={styles.heroName}>
          {profile.first_name} {profile.last_name}
        </Text>
        
        {/* Solo Ruolo nella Preview */}
        <View style={styles.heroRoleContainer}>
          <Text style={styles.heroRoleIcon}>{roleIcon}</Text>
          <Text style={styles.heroRoleLabel}>{roleLabel}</Text>
        </View>
        
        {/* Tasto Vedi Dettagli */}
        <TouchableOpacity 
          style={styles.viewDetailsButton}
          onPress={(e) => {
            e.stopPropagation();
            setShowProfileDetail(true);
          }}
        >
          <Text style={styles.viewDetailsButtonText}>Vedi dettagli</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Bubble Le tue case - Solo per Proprietari */}
      {profile?.role === 'owner' && (
        <TouchableOpacity
          style={styles.caseBubble}
          onPress={() => { if (navigation) navigation.navigate('ApartmentList'); }}
          activeOpacity={0.7}
        >
          <Text style={styles.caseBubbleText}>LE TUE CASE</Text>
        </TouchableOpacity>
      )}

      {/* Bubble Case Piaciute - Solo per Inquilini */}
      {profile?.role === 'tenant' && (
        <TouchableOpacity
          style={styles.likedBubble}
          onPress={() => {
            if (navigation) {
              navigation.navigate('LikedApartments');
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.likedSubtext}>I TUOI LIKE</Text>
        </TouchableOpacity>
      )}

      {/* Action Bar - Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={[styles.pillButton, styles.logoutButton]}
          onPress={onLogout}
        >
          <Text style={[styles.pillButtonText, styles.logoutButtonText]}>Esci</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Detail Modal */}
      <ProfileDetailModal
        visible={showProfileDetail}
        profile={profile}
        onClose={() => setShowProfileDetail(false)}
        onProfileUpdated={() => {
          // Ricarica il profilo dopo l'aggiornamento
          const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
              if (data) {
                setProfile(data);
                setAvatarImage(data.avatar_url || null);
              }
            }
          };
          loadProfile();
        }}
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 120,
  },
  // Hero Section - Bubble 1
  heroBubble: {
    backgroundColor: COLORS.cardWhite,
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.inkBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  heroRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 15,
  },
  heroRoleIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  heroRoleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mutedTeal,
  },
  viewDetailsButton: {
    backgroundColor: COLORS.mutedTeal,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    opacity: 0.3,
  },
  viewDetailsButtonText: {
    color: COLORS.inkBlack,
    fontSize: 14,
    fontWeight: '600',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  heroAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.inputBorder,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  cameraIcon: {
    fontSize: 18,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.inkBlack,
    letterSpacing: -0.5,
  },
  // Action Bar - Buttons
  actionBar: {
    gap: 12,
    marginTop: 10,
  },
  pillButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  editButton: {
    // Will be set dynamically based on role
  },
  saveButton: {
    // Will be set dynamically based on role
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.fadedCopper,
  },
  pillButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  cancelButtonText: {
    color: COLORS.mutedTeal,
  },
  logoutButtonText: {
    color: COLORS.fadedCopper,
  },
  // Liked Apartments Bubble
  likedBubble: {
    backgroundColor: COLORS.cardWhite,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.inkBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  likedSubtext: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.mutedTeal,
    letterSpacing: 0.5,
  },
  caseBubble: {
    backgroundColor: COLORS.cardWhite,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.inkBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.ownerBrand,
  },
  caseBubbleText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ownerBrand,
    letterSpacing: 0.5,
  },
});
