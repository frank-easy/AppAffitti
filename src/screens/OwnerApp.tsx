 import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { Tab, COLORS } from '../utils/constants';
import { AppHeader } from '../components/AppHeader';
import { BottomMenu } from '../components/BottomMenu';
import { ChatListComponent } from './ChatListComponent';
import { MyProfileView } from './MyProfileView';
import { commonStyles } from '../styles/commonStyles';

export function OwnerApp({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [homeSubTab, setHomeSubTab] = useState<'leads' | 'analytics'>('leads');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [stats, setStats] = useState({ apartments: 0, swipes: 0, matches: 0 });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => { if (activeTab === 'home') { fetchCandidates(); fetchStats(); } }, [activeTab, homeSubTab]);

  const fetchCandidates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: myApartments } = await supabase.from('apartments').select('id').eq('owner_id', user.id);
    const myIds = myApartments?.map(a => a.id) || [];
    
    if (myIds.length > 0) {
       const { data } = await supabase.from('swipes')
         .select(`*, apartments (title, image_url), profiles (first_name, last_name, avatar_url, residence, dob)`)
         .in('apartment_id', myIds)
         .eq('direction', 'right'); 
       if (data) setCandidates(data);
    } else { setCandidates([]); }
  };

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setStatsLoading(true);

    const { data: myApartments } = await supabase.from('apartments').select('id').eq('owner_id', user.id);
    const myIds = myApartments?.map((a: any) => a.id) || [];

    let swipesCount = 0;
    if (myIds.length > 0) {
      const { count } = await supabase.from('swipes')
        .select('*', { count: 'exact', head: true })
        .in('apartment_id', myIds)
        .eq('direction', 'right');
      swipesCount = count ?? 0;
    }

    const { count: matchesCount } = await supabase.from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id);

    setStats({ apartments: myIds.length, swipes: swipesCount, matches: matchesCount ?? 0 });
    setStatsLoading(false);
  };

  const handleReject = async (item: any) => {
      await supabase.from('swipes').update({ direction: 'left' }).eq('id', item.id);
      setCandidates(prev => prev.filter(c => c.id !== item.id));
  };

  const handleAccept = async (swipeInfo: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: matchData, error: matchError } = await supabase.from('matches').insert([{ tenant_id: swipeInfo.tenant_id, apartment_id: swipeInfo.apartment_id, owner_id: user?.id }]).select().single();
    
    if (matchError && matchError.code !== '23505') { Alert.alert("Errore", matchError.message); return; }

    await supabase.from('swipes').delete().eq('id', swipeInfo.id);
    setCandidates(prev => prev.filter(c => c.id !== swipeInfo.id));

    const tenantName = `${swipeInfo.profiles?.first_name} ${swipeInfo.profiles?.last_name}`;
    let finalMatchId = matchData?.id;
    if (!finalMatchId) {
        const { data: existing } = await supabase.from('matches').select('id').eq('tenant_id', swipeInfo.tenant_id).eq('apartment_id', swipeInfo.apartment_id).single();
        finalMatchId = existing?.id;
    }
    if (finalMatchId) {
        Alert.alert("Match!", "Chat aperta.");
        navigation.navigate('ChatDetail', { match_id: finalMatchId, title: tenantName, other_id: swipeInfo.tenant_id });
    }
  };

  const handleLogout = async () => { 
    await supabase.auth.signOut(); 
    navigation.reset({ index: 0, routes: [{ name: 'RoleSelection' }] }); 
  };

  return (
    <View style={commonStyles.container}>
      <AppHeader title="AppAffitti" />
      {activeTab === 'home' && (
        <View style={commonStyles.topTabContainer}>
          <TouchableOpacity style={[commonStyles.topTabBtn, homeSubTab === 'leads' && commonStyles.topTabBtnActive]} onPress={() => setHomeSubTab('leads')}>
            <Text style={[commonStyles.topTabText, homeSubTab === 'leads' && commonStyles.topTabTextActive]}>INTERESSATI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[commonStyles.topTabBtn, homeSubTab === 'analytics' && commonStyles.topTabBtnActive]} onPress={() => setHomeSubTab('analytics')}>
            <Text style={[commonStyles.topTabText, homeSubTab === 'analytics' && commonStyles.topTabTextActive]}>ANALYTICS</Text>
          </TouchableOpacity>
        </View>
      )}
      {activeTab === 'home' && homeSubTab === 'leads' && (
         <FlatList 
           data={candidates} 
           contentContainerStyle={{padding: 20, paddingBottom: 120}} 
           keyExtractor={i => i.id} 
           renderItem={({item}) => (
           <View style={commonStyles.requestCard}>
             <View style={{flexDirection:'row', marginBottom:10}}>
               <Image source={{uri: item.profiles?.avatar_url || 'https://via.placeholder.com/50'}} style={{width:50, height:50, borderRadius:25, marginRight:10}} />
               <View>
                 <Text style={{fontWeight:'bold'}}>{item.profiles?.first_name} {item.profiles?.last_name}</Text>
                 <Text>Da: {item.profiles?.residence}</Text>
               </View>
             </View>
             <Text>Interessato a: {item.apartments?.title}</Text>
             <View style={commonStyles.actions}>
               <TouchableOpacity style={commonStyles.btnReject} onPress={() => handleReject(item)}>
                 <Text>❌ Scarta</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[commonStyles.btnAccept, { backgroundColor: COLORS.ownerBrand }]} onPress={() => handleAccept(item)}>
                 <Text style={{color: COLORS.white, fontWeight:'bold'}}>✅ Accetta</Text>
               </TouchableOpacity>
             </View>
           </View>
         )} 
         ListEmptyComponent={
           <View style={commonStyles.centerContainer}>
             <Text style={{fontSize:30}}>📭</Text>
             <Text style={{marginTop:10, color: COLORS.mutedTeal}}>Nessuna richiesta</Text>
           </View>
         } 
       />
      )}
      {activeTab === 'home' && homeSubTab === 'analytics' && (
        <View style={{ flex: 1, padding: 20, gap: 16, backgroundColor: COLORS.backgroundLight }}>
          {statsLoading ? (
            <View style={commonStyles.centerContainer}>
              <ActivityIndicator color={COLORS.ownerBrand} size="large" />
            </View>
          ) : (
            <>
              {[
                { label: 'Appartamenti pubblicati', value: stats.apartments, icon: '🏠' },
                { label: 'Swipe ricevuti', value: stats.swipes, icon: '👆' },
                { label: 'Match attivi', value: stats.matches, icon: '🤝' },
              ].map(({ label, value, icon }) => (
                <View
                  key={label}
                  style={{
                    backgroundColor: COLORS.cardWhite,
                    borderRadius: 16,
                    padding: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                    shadowColor: '#000',
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <Text style={{ fontSize: 32 }}>{icon}</Text>
                  <View>
                    <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.ownerBrand }}>{value}</Text>
                    <Text style={{ fontSize: 13, color: COLORS.functionalTeal, marginTop: 2 }}>{label}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      )}
      {activeTab === 'chat' && <ChatListComponent navigation={navigation}/>}
      {activeTab === 'profile' && <MyProfileView onLogout={handleLogout} navigation={navigation} />}
      <BottomMenu activeTab={activeTab} onTabChange={setActiveTab} userRole="owner" />
    </View>
  );
}

