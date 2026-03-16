import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../utils/constants';

interface AppHeaderProps {
  title?: string;
}

export const AppHeader = ({ title = "AppAffitti" }: AppHeaderProps) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.appHeaderContainer, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        <Text style={styles.appHeaderTitle}>{title}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  appHeaderContainer: { 
    width: '100%', 
    backgroundColor: COLORS.cardWhite, 
    borderBottomWidth: 1, 
    borderColor: COLORS.inputBorder, 
    zIndex: 10,
  },
  headerContent: {
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appHeaderTitle: { 
    fontSize: 22, 
    fontWeight: '700', 
    letterSpacing: 0.5, 
    color: COLORS.inkBlack,
    textAlign: 'center',
  },
});

