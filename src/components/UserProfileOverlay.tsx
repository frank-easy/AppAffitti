import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

interface UserProfileOverlayProps {
  userId: string | null;
  onClose: () => void;
}

export const UserProfileOverlay = ({ userId, onClose }: UserProfileOverlayProps) => {
  const [profile, setProfile] = useState<any>(null);
  
  useEffect(() => { 
    if (userId) {
      supabase.from('profiles').select('*').eq('id', userId).single().then(({ data }) => setProfile(data));
    }
  }, [userId]);
  
  if (!userId) return null;
  
  return (
    <View style={styles.overlayContainerWhite}>
      <View style={styles.overlayHeader}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtnStandard}>
          <Text style={{fontSize:24, fontWeight:'bold', color:'#333'}}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.overlayTitle}>Profilo Utente</Text>
      </View>
      {profile ? (
        <ScrollView contentContainerStyle={{alignItems:'center', padding: 40}}>
          <Image source={{ uri: profile.avatar_url || 'https://via.placeholder.com/150' }} style={styles.avatarBig} />
          <Text style={styles.profileName}>{profile.first_name} {profile.last_name}</Text>
          <View style={styles.infoBoxOverlay}>
             <Text style={{color:'#666'}}>Nazionalità: <Text style={{fontWeight:'bold', color:'#333'}}>{profile.nationality || 'ND'}</Text></Text>
             <Text style={{color:'#666', marginTop:5}}>Residenza: <Text style={{fontWeight:'bold', color:'#333'}}>{profile.residence || 'ND'}</Text></Text>
             <Text style={{color:'#666', marginTop:5}}>Ruolo: <Text style={{fontWeight:'bold', color:'#333'}}>{profile.role === 'owner' ? 'Proprietario' : 'Inquilino'}</Text></Text>
          </View>
        </ScrollView>
      ) : <ActivityIndicator style={{marginTop:50}} color="#007AFF"/>}
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainerWhite: { flex: 1, backgroundColor: 'white' },
  overlayHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#eee' },
  closeBtnStandard: { padding: 5, marginRight: 15 },
  overlayTitle: { fontSize: 18, fontWeight: 'bold' },
  avatarBig: { width: 120, height: 120, borderRadius: 60, marginBottom: 15 },
  profileName: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  infoBoxOverlay: { width: '100%', backgroundColor: '#f9f9f9', padding: 25, borderRadius: 16 },
});

