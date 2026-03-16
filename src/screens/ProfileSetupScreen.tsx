import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { uploadImageToSupabase } from '../utils/imageUpload';
import { commonStyles } from '../styles/commonStyles';

export function ProfileSetupScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [residence, setResidence] = useState('');
  const [nationality, setNationality] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
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
      };

      await supabase.from('profiles').upsert(updates);
      navigation.replace('RoleSelection');
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

        <TouchableOpacity style={commonStyles.primaryBtn} onPress={saveProfile} disabled={loading}>
          <Text style={commonStyles.btnText}>Salva</Text>
        </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


