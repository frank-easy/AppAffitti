import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SCREEN_WIDTH } from '../utils/constants';

interface FullScreenPhotoOverlayProps {
  uri: string | null;
  onClose: () => void;
}

export const FullScreenPhotoOverlay = ({ uri, onClose }: FullScreenPhotoOverlayProps) => {
  if (!uri) return null;
  return (
    <View style={styles.overlayContainerBlack}>
      <TouchableOpacity onPress={onClose} style={styles.closeBtnTopLeft}>
        <Text style={{color:'white', fontSize:24, fontWeight:'bold'}}>✕</Text>
      </TouchableOpacity>
      <Image source={{ uri }} style={{width: SCREEN_WIDTH, height: '80%', resizeMode: 'contain'}} />
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainerBlack: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  closeBtnTopLeft: { position: 'absolute', top: 50, left: 20, zIndex: 99, padding: 10 },
});

