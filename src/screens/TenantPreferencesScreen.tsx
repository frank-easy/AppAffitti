import React, { useState } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { commonStyles } from '../styles/commonStyles';
import { COLORS } from '../utils/constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TenantPreferences'>;
};

export function TenantPreferencesScreen({ navigation }: Props) {
  const [city, setCity] = useState('');

  // TODO: salvare preferenze su tabella tenant_preferences
  const handleNext = () => {
    navigation.replace('TenantApp');
  };

  return (
    <SafeAreaView style={commonStyles.containerCenter}>
      <View style={styles.inner}>
        <Text style={commonStyles.headerTitle}>Le tue preferenze</Text>

        <Text style={commonStyles.label}>Città di ricerca</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="Es. Milano"
          value={city}
          onChangeText={setCity}
        />

        <TouchableOpacity
          style={[commonStyles.primaryBtn, { backgroundColor: COLORS.tenantBrand }]}
          onPress={handleNext}
        >
          <Text style={commonStyles.btnText}>Avanti</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    width: '100%',
    padding: 24,
    justifyContent: 'center',
  },
});
