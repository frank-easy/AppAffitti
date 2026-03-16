import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../utils/constants';

export function ChatListComponent({navigation}: any) {
  const [list, setList] = useState<any[]>([]); 
  const [myId, setMyId] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, { content: string; timestamp: string }>>({});

  useEffect(() => { 
    const load = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        setMyId(user.id);
        
        const { data } = await supabase.from('matches')
            .select(`
                *, 
                apartments(title), 
                owner_profile:profiles!owner_id(first_name, last_name, avatar_url), 
                tenant_profile:profiles!tenant_id(first_name, last_name, avatar_url)
            `)
            .or(`owner_id.eq.${user.id},tenant_id.eq.${user.id}`);
        
        if (data) {
          setList(data);
          
          // Calcola messaggi non letti e ultimo messaggio per ogni match
          const counts: Record<string, number> = {};
          const lastMsgs: Record<string, { content: string; timestamp: string }> = {};
          
          for (const match of data) {
            // Conteggio non letti
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('match_id', match.id)
              .neq('sender_id', user.id)
              .eq('is_read', false);
            
            counts[match.id] = count || 0;
            
            // Ultimo messaggio
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('match_id', match.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (lastMsg) {
              lastMsgs[match.id] = {
                content: lastMsg.content,
                timestamp: lastMsg.created_at,
              };
            }
          }
          
          setUnreadCounts(counts);
          setLastMessages(lastMsgs);
        }
    };
    load();
    
    // Refresh ogni 5 secondi per aggiornare i conteggi
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ieri';
    } else if (days < 7) {
      return date.toLocaleDateString('it-IT', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <View style={styles.container}>
       <FlatList 
         data={list} 
         keyExtractor={i => i.id} 
         contentContainerStyle={styles.listContent}
         showsVerticalScrollIndicator={false}
         renderItem={({item}) => {
            const isMeOwner = item.owner_id === myId;
            const otherProfile = isMeOwner ? item.tenant_profile : item.owner_profile;
            
            const otherName = otherProfile 
                ? `${otherProfile.first_name} ${otherProfile.last_name}` 
                : "Utente Sconosciuto";
            
            const otherAvatar = otherProfile?.avatar_url;
            const otherId = isMeOwner ? item.tenant_id : item.owner_id;
            const unreadCount = unreadCounts[item.id] || 0;
            
            return (
                <TouchableOpacity 
                    onPress={() => navigation.navigate('ChatDetail', { 
                        match_id: item.id, 
                        title: otherName, 
                        other_id: otherId,
                        apartment_id: item.apartment_id 
                    })} 
                    style={styles.chatCard}
                    activeOpacity={0.7}
                >
                  {/* Left: Avatar */}
                  {otherAvatar ? (
                    <Image 
                      source={{ uri: otherAvatar }} 
                      style={styles.avatar} 
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarPlaceholderText}>👤</Text>
                    </View>
                  )}
                  
                  {/* Middle: User Info */}
                  <View style={styles.middleSection}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {otherName}
                    </Text>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {lastMessages[item.id]?.content 
                        ? lastMessages[item.id].content 
                        : `🏠 ${item.apartments?.title || "Casa rimossa"}`}
                    </Text>
                  </View>
                  
                  {/* Right: Timestamp & Unread Badge */}
                  <View style={styles.rightSection}>
                    <Text style={styles.timestamp}>
                      {formatTimestamp(lastMessages[item.id]?.timestamp || item.created_at || '')}
                    </Text>
                    {unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
            );
       }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardWhite,
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    shadowColor: COLORS.inkBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: COLORS.inputBorder,
    marginRight: 15,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: COLORS.inputBorder,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 24,
  },
  middleSection: {
    flex: 1,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.inkBlack,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.mutedTeal,
    lineHeight: 18,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 6,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.mutedTeal,
    fontWeight: '500',
    opacity: 0.7,
  },
  unreadBadge: {
    backgroundColor: COLORS.darkTeal,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});