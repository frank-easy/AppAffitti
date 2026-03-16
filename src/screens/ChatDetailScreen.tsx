import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, FlatList, Modal, KeyboardAvoidingView, Platform, Alert, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { UserProfileOverlay } from '../components/UserProfileOverlay';
import { ApartmentDetailModal } from '../components/ApartmentDetailModal';
import { commonStyles } from '../styles/commonStyles';
import { COLORS } from '../utils/constants';

export function ChatDetailScreen({ route, navigation }: any) {
  const { match_id, title, other_id, apartment_id } = route.params;
  const [msgs, setMsgs] = useState<any[]>([]); 
  const [txt, setTxt] = useState(''); 
  const [myId, setMyId] = useState<string | null>(null); 
  const flatListRef = useRef<FlatList>(null); 
  
  const [showProfile, setShowProfile] = useState(false);
  const [showHouse, setShowHouse] = useState(false);
  const [apartmentData, setApartmentData] = useState<any>(null);
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { 
    supabase.auth.getUser().then(({ data: { user } }) => { 
      if (user) setMyId(user.id); 
    }); 
  }, []);

  // Funzione per marcare i messaggi come letti (con debounce)
  const markAsRead = async () => {
    if (!myId || !match_id) return;
    
    // Cancella il timeout precedente se esiste
    if (markAsReadTimeoutRef.current) {
      clearTimeout(markAsReadTimeoutRef.current);
    }
    
    // Imposta un nuovo timeout per evitare chiamate multiple
    markAsReadTimeoutRef.current = setTimeout(async () => {
      try {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('match_id', match_id)
          .neq('sender_id', myId)
          .eq('is_read', false);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }, 300);
  };
  
  // Fetch iniziale per caricare lo storico dei messaggi
  useEffect(() => { 
    const fetchInitialMessages = async () => { 
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', match_id)
        .order('created_at', { ascending: true }); 
      if (data) {
        setMsgs(data);
      }
    }; 
    fetchInitialMessages();
  }, [match_id]);

  // Marca i messaggi come letti quando la schermata si apre o quando myId è disponibile
  useEffect(() => {
    if (myId && match_id) {
      // Marca come letto immediatamente
      markAsRead();
      // E anche dopo un breve delay per assicurarsi che i messaggi siano caricati
      const timer = setTimeout(() => markAsRead(), 1000);
      return () => clearTimeout(timer);
    }
  }, [myId, match_id]);

  // Carica profilo altro utente
  useEffect(() => {
    const loadOtherUserProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', other_id)
        .single();
      if (data) setOtherUserProfile(data);
    };
    if (other_id) loadOtherUserProfile();
  }, [other_id]);

  // Sottoscrizione Realtime per i nuovi messaggi e aggiornamenti (read receipts)
  useEffect(() => {
    if (!myId || !match_id) return;

    const channel = supabase
      .channel(`messages:${match_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${match_id}`
        },
        (payload) => {
          // Aggiungi il nuovo messaggio allo stato
          if (payload.new) {
            setMsgs((prevMsgs) => {
              // Evita duplicati: controlla se esiste già un messaggio temporaneo con lo stesso contenuto
              const tempMsgIndex = prevMsgs.findIndex(
                (msg) => msg.id?.toString().startsWith('temp-') && 
                         msg.content === payload.new.content && 
                         msg.sender_id === payload.new.sender_id
              );
              
              if (tempMsgIndex !== -1) {
                const newMsgs = [...prevMsgs];
                newMsgs[tempMsgIndex] = payload.new;
                return newMsgs;
              }
              
              const exists = prevMsgs.some(msg => msg.id === payload.new.id);
              if (exists) {
                return prevMsgs;
              }
              
              return [...prevMsgs, payload.new];
            });
            
            // Se il messaggio è dell'altro utente, marcalo come letto
            if (payload.new.sender_id !== myId && myId) {
              markAsRead();
            }
            
            // Scroll automatico al nuovo messaggio
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${match_id}`
        },
        (payload) => {
          // Aggiorna lo stato del messaggio quando viene marcato come letto
          if (payload.new) {
            setMsgs((prevMsgs) => 
              prevMsgs.map(msg => 
                msg.id === payload.new.id ? { ...msg, is_read: payload.new.is_read } : msg
              )
            );
          }
        }
      )
      .subscribe();

    // Cleanup: unsubscribe quando il componente viene smontato o match_id cambia
    return () => {
      channel.unsubscribe();
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
    };
  }, [match_id, myId]);

  useEffect(() => {
      if (apartment_id) {
          supabase.from('apartments').select('*').eq('id', apartment_id).single()
            .then(({ data }) => setApartmentData(data));
      }
  }, [apartment_id]);
  
  const sendMessage = async () => { 
    if (!txt.trim() || !myId) return; 
    
    const content = txt.trim();
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Crea messaggio temporaneo per Optimistic UI
    const tempMsg = {
      id: tempId,
      match_id: match_id,
      content: content,
      sender_id: myId,
      sender_role: 'user',
      created_at: new Date().toISOString(),
      is_read: false, // Default: non letto
    };
    
    // 1. Immediate Feedback: Aggiungi immediatamente il messaggio alla lista
    setMsgs((prevMsgs) => [...prevMsgs, tempMsg]);
    
    // 2. Clear Input: Pulisci l'input immediatamente
    setTxt('');
    
    // 3. Scroll: Scrolla alla fine per mostrare il nuovo messaggio
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
    
      // 4. Invia al database
      try {
        const { error } = await supabase.from('messages').insert([{ 
          match_id, 
          content, 
          sender_id: myId, 
          sender_role: 'user',
          is_read: false // Default: non letto
        }]);
      
      // 5. Error Handling: Se fallisce, rimuovi il messaggio temporaneo
      if (error) {
        setMsgs((prevMsgs) => prevMsgs.filter(msg => msg.id !== tempId));
        Alert.alert('Errore', 'Impossibile inviare il messaggio. Riprova.');
      }
      // Se ha successo, il messaggio reale arriverà tramite Realtime subscription
      // e sostituirà quello temporaneo (vedi logica nel useEffect)
    } catch (error: any) {
      // Rimuovi il messaggio temporaneo in caso di errore
      setMsgs((prevMsgs) => prevMsgs.filter(msg => msg.id !== tempId));
      Alert.alert('Errore', 'Impossibile inviare il messaggio. Riprova.');
    }
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.backgroundLight }}>
      {/* Geometric Info Bar Header */}
      <View style={styles.geometricHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkTeal} />
        </TouchableOpacity>
        
        {/* Row 1: User Info */}
        <TouchableOpacity 
          style={styles.userInfoRow}
          onPress={() => setShowProfile(true)}
          activeOpacity={0.7}
        >
          {otherUserProfile?.avatar_url ? (
            <Image 
              source={{ uri: otherUserProfile.avatar_url }} 
              style={styles.headerAvatar}
            />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={{ fontSize: 20 }}>👤</Text>
            </View>
          )}
          <View style={styles.userInfoText}>
            <Text style={styles.userName}>{title || 'Chat'}</Text>
            <Text style={styles.userSubtext}>Tocca per profilo</Text>
          </View>
        </TouchableOpacity>

        {/* Row 2: Apartment Context Badge */}
        {apartmentData && (
          <TouchableOpacity 
            style={styles.apartmentBadge}
            onPress={() => setShowHouse(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="home" size={16} color={COLORS.mutedTeal} />
            <Text style={styles.apartmentBadgeText} numberOfLines={1}>
              {apartmentData.title}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList 
        ref={flatListRef} 
        data={msgs} 
        keyExtractor={(item) => item.id?.toString() || `msg-${Date.now()}`} 
        contentContainerStyle={{ padding: 15, paddingBottom: 20 }} 
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })} 
        renderItem={({ item }) => {
          const isMyMessage = item.sender_id === myId;
          const isRead = item.is_read === true;
          
          return (
            <View style={[
              styles.messageBubble, 
              isMyMessage ? styles.messageBubbleMine : styles.messageBubbleTheirs
            ]}>
              <Text style={[
                styles.messageText,
                isMyMessage ? styles.messageTextMine : styles.messageTextTheirs
              ]}>
                {item.content}
              </Text>
              
              {/* Read Receipts - Solo per i messaggi dell'utente */}
              {isMyMessage && (
                <View style={styles.readReceiptContainer}>
                  <Ionicons 
                    name="checkmark-done" 
                    size={14} 
                    color={isRead ? '#01161E' : '#9CA3AF'} 
                  />
                </View>
              )}
            </View>
          );
        }} 
      />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
        <View style={commonStyles.inputArea}>
          <TextInput 
            value={txt} 
            onChangeText={setTxt} 
            style={commonStyles.inputChat} 
            placeholder="Scrivi un messaggio..." 
            placeholderTextColor={COLORS.mutedTeal} 
          />
          <TouchableOpacity onPress={sendMessage} style={commonStyles.sendBtn}>
            <Text style={{ fontWeight: 'bold', color: COLORS.white }}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      <Modal visible={showProfile} animationType="slide" transparent={false} onRequestClose={() => setShowProfile(false)}>
         <UserProfileOverlay userId={other_id} onClose={() => setShowProfile(false)} />
      </Modal>

      <ApartmentDetailModal 
         visible={showHouse} 
         apartment={apartmentData} 
         onClose={() => setShowHouse(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  geometricHeader: {
    backgroundColor: COLORS.cardWhite,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    shadowColor: COLORS.inkBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  backButton: {
    padding: 5,
    marginBottom: 10,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: COLORS.inputBorder,
  },
  headerAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: COLORS.inputBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoText: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.inkBlack,
    marginBottom: 2,
  },
  userSubtext: {
    fontSize: 12,
    color: COLORS.darkTeal,
  },
  apartmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  apartmentBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.mutedTeal,
    maxWidth: 200,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginBottom: 8,
    alignSelf: 'flex-start',
    position: 'relative', // For read receipt positioning
  },
  messageBubbleMine: {
    backgroundColor: COLORS.tenantBrand, // #84A98C
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageBubbleTheirs: {
    backgroundColor: COLORS.inputBorder,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#01161E', // Ink Black for high contrast on tenantBrand background
  },
  messageTextTheirs: {
    color: COLORS.inkBlack,
  },
  readReceiptContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 8,
    alignSelf: 'flex-end',
  },
});