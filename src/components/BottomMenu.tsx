import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tab, COLORS } from '../utils/constants';

interface BottomMenuProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  userRole?: 'tenant' | 'owner'; // Role-based theming
}

export const BottomMenu = ({ activeTab, onTabChange, userRole = 'tenant' }: BottomMenuProps) => {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, 20);
  
  // Determine active color based on role
  const activeColor = userRole === 'owner' ? COLORS.ownerBrand : COLORS.tenantBrand;
  
  return (
    <View style={[styles.bottomBar, { paddingBottom }]}>
      <TouchableOpacity onPress={() => onTabChange('home')} style={styles.menuItem} activeOpacity={0.7}>
        <Text style={[
          styles.menuText, 
          activeTab === 'home' && { color: activeColor, fontWeight: '800', opacity: 1 }
        ]}>HOME</Text>
        {activeTab === 'home' && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onTabChange('chat')} style={styles.menuItem} activeOpacity={0.7}>
        <Text style={[
          styles.menuText, 
          activeTab === 'chat' && { color: activeColor, fontWeight: '800', opacity: 1 }
        ]}>CHAT</Text>
        {activeTab === 'chat' && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onTabChange('profile')} style={styles.menuItem} activeOpacity={0.7}>
        <Text style={[
          styles.menuText, 
          activeTab === 'profile' && { color: activeColor, fontWeight: '800', opacity: 1 }
        ]}>PROFILO</Text>
        {activeTab === 'profile' && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    backgroundColor: COLORS.cardWhite, 
    borderTopWidth: 1, 
    borderColor: COLORS.inputBorder, 
    paddingTop: 15, 
    position: 'absolute', 
    bottom: 0, 
    width: '100%', 
    elevation: 20, 
    shadowColor: COLORS.primaryDark, 
    shadowOffset: {width:0, height:-5}, 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    zIndex: 999 
  },
  menuItem: { alignItems: 'center', flex: 1, paddingVertical: 5 },
  menuText: { fontSize: 11, fontWeight: '500', color: COLORS.functionalTeal, letterSpacing: 1.5, marginTop: 0, opacity: 0.6 },
  activeDot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
});

