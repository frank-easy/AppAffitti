import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, View, StyleSheet, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { uploadImageToSupabase } from '../utils/imageUpload';
import { commonStyles } from '../styles/commonStyles';

export function ProfileSetupScreen({ route, navigation }: any) {
  const passedRole = route.params?.role || 'tenant'; 
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [residence, setResidence] = useState('');
  const [nationality, setNationality] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Hard Filters - Obbligatori per inquilini
  const [gender, setGender] = useState<string>('');
  const [isSmoker, setIsSmoker] = useState<boolean | null>(null);
  const [occupation, setOccupation] = useState<string>('');
  
  const pickImage = async () => { 
    let result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsEditing: true, 
      aspect: [1, 1], 
      quality: 0.5 
    }); 
    if (!result.canceled && result.assets) setImage(result.assets[0].uri); 
  };
  
  const saveProfile = async () => {
    if (!firstName || !lastName) { 
      Alert.alert("Attenzione", "Compila nome e cognome."); 
      return; 
    }
    
    // Validazione Hard Filters (obbligatori per inquilini)
    if (passedRole === 'tenant') {
      if (!gender) {
        Alert.alert("Attenzione", "Seleziona il sesso.");
        return;
      }
      if (isSmoker === null) {
        Alert.alert("Attenzione", "Indica se sei fumatore o meno.");
        return;
      }
      if (!occupation) {
        Alert.alert("Attenzione", "Seleziona la tua occupazione.");
        return;
      }
    }
    
    setLoading(true);
    try {
      let publicUrl = image;
      try { if (image && !image.startsWith('http')) publicUrl = await uploadImageToSupabase(image); } catch (e) {}
      const { data: { user } } = await supabase.auth.getUser();
      const updates: any = { 
        id: user?.id, 
        first_name: firstName, 
        last_name: lastName, 
        dob: `19${99-parseInt(age || '20')}-01-01`, 
        residence, 
        nationality, 
        avatar_url: publicUrl, 
        updated_at: new Date(), 
        email: user?.email || '', 
        role: passedRole 
      };
      
      // Aggiungi Hard Filters solo per inquilini
      if (passedRole === 'tenant') {
        updates.gender = gender;
        updates.is_smoker = isSmoker;
        updates.occupation = occupation;
      }
      
      await supabase.from('profiles').upsert(updates);
      if (passedRole === 'owner') navigation.replace('AddApartment'); else navigation.replace('TenantApp');
    } catch (error: any) { Alert.alert("Errore", error.message); } finally { setLoading(false); }
  };
  
  return (
    <SafeAreaView style={commonStyles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={commonStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
        <Text style={commonStyles.headerTitle}>Profilo</Text>
        <TouchableOpacity onPress={pickImage} style={commonStyles.avatarPicker}>
          {image ? <Image source={{ uri: image }} style={commonStyles.avatarImg} /> : <Text style={{fontSize:40}}>📷</Text>}
        </TouchableOpacity>
        <TextInput style={commonStyles.input} placeholder="Nome" value={firstName} onChangeText={setFirstName}/>
        <TextInput style={commonStyles.input} placeholder="Cognome" value={lastName} onChangeText={setLastName}/>
        <TextInput style={commonStyles.input} placeholder="Età" value={age} onChangeText={setAge}/>
        <TextInput style={commonStyles.input} placeholder="Residenza" value={residence} onChangeText={setResidence}/>
        <TextInput style={commonStyles.input} placeholder="Nazionalità" value={nationality} onChangeText={setNationality}/>
        
        {/* Hard Filters - Solo per Inquilini */}
        {passedRole === 'tenant' && (
          <>
            <Text style={[commonStyles.label, {marginTop: 20}]}>Sesso *</Text>
            <View style={styles.optionsRow}>
              {[
                { value: 'male', label: 'Uomo' },
                { value: 'female', label: 'Donna' },
                { value: 'non_binary', label: 'Altro' },
                { value: 'na', label: 'Preferisco non rispondere' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, gender === option.value && styles.optionButtonActive]}
                  onPress={() => setGender(option.value)}
                >
                  <Text style={[styles.optionText, gender === option.value && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={commonStyles.label}>Fumatore *</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[styles.optionButton, isSmoker === true && styles.optionButtonActive]}
                onPress={() => setIsSmoker(true)}
              >
                <Text style={[styles.optionText, isSmoker === true && styles.optionTextActive]}>Sì</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, isSmoker === false && styles.optionButtonActive]}
                onPress={() => setIsSmoker(false)}
              >
                <Text style={[styles.optionText, isSmoker === false && styles.optionTextActive]}>No</Text>
              </TouchableOpacity>
            </View>

            <Text style={commonStyles.label}>Occupazione *</Text>
            <View style={styles.optionsRow}>
              {[
                { value: 'student', label: 'Studente' },
                { value: 'worker', label: 'Lavoratore' },
                { value: 'unemployed', label: 'Disoccupato' },
                { value: 'other', label: 'Altro' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, occupation === option.value && styles.optionButtonActive]}
                  onPress={() => setOccupation(option.value)}
                >
                  <Text style={[styles.optionText, occupation === option.value && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        
        <TouchableOpacity style={commonStyles.primaryBtn} onPress={saveProfile} disabled={loading}>
          <Text style={commonStyles.btnText}>Salva</Text>
        </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderColor: '#e8e8e8',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  optionTextActive: {
    color: 'white',
  },
});

