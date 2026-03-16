import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, View, StyleSheet, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { uploadImageToSupabase } from '../utils/imageUpload';
import { AppHeader } from '../components/AppHeader';
import { commonStyles } from '../styles/commonStyles';
import { COLORS } from '../utils/constants';

export function AddApartmentScreen({ navigation, route }: any) {
  const { apartmentData } = route.params || {};
  const isEditMode = !!apartmentData;
  
  const [title, setTitle] = useState(''); 
  const [price, setPrice] = useState(''); 
  const [utilityCost, setUtilityCost] = useState(''); 
  const [address, setAddress] = useState(''); 
  const [desc, setDesc] = useState(''); 
  const [sqMeters, setSqMeters] = useState(''); 
  const [rooms, setRooms] = useState(''); 
  const [floor, setFloor] = useState(''); 
  const [bathrooms, setBathrooms] = useState(''); 
  const [features, setFeatures] = useState(''); 
  const [images, setImages] = useState<string[]>([]); 
  const [loading, setLoading] = useState(false);
  
  // Hard Filters - Requisiti Inquilino
  const [allowedGender, setAllowedGender] = useState<string>('any');
  const [allowSmokers, setAllowSmokers] = useState<boolean>(false);
  const [allowedOccupation, setAllowedOccupation] = useState<string>('any');

  // Popola gli stati se siamo in edit mode
  useEffect(() => {
    if (apartmentData) {
      setTitle(apartmentData.title || '');
      setPrice(String(apartmentData.price || ''));
      setUtilityCost(String(apartmentData.utility_cost || ''));
      setAddress(apartmentData.location || '');
      setDesc(apartmentData.description || '');
      setSqMeters(String(apartmentData.sq_meters || ''));
      setRooms(String(apartmentData.num_rooms || ''));
      setFloor(String(apartmentData.floor || ''));
      setBathrooms(String(apartmentData.bathrooms || ''));
      setFeatures(apartmentData.features || '');
      
      // Gestione immagini: se è array usa quello, altrimenti crea array
      const imageArray = Array.isArray(apartmentData.image_url) 
        ? apartmentData.image_url 
        : apartmentData.image_url 
          ? [apartmentData.image_url] 
          : [];
      setImages(imageArray);
      
      // Hard Filters
      setAllowedGender(apartmentData.allowed_gender || 'any');
      setAllowSmokers(apartmentData.allow_smokers || false);
      setAllowedOccupation(apartmentData.allowed_occupation || 'any');
    }
  }, [apartmentData]);

  const pickImages = async () => { 
    let result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsMultipleSelection: true, 
      selectionLimit: 5, 
      quality: 0.5 
    }); 
    if (!result.canceled && result.assets) {
      setImages([...images, ...result.assets.map(asset => asset.uri)]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const saveApartment = async () => {
    if (!title || !price || images.length === 0) { 
      Alert.alert("Manca qualcosa", "Inserisci titolo, prezzo e almeno una foto."); 
      return; 
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Errore", "Utente non trovato.");
        setLoading(false);
        return;
      }
      
      // Carica solo le nuove immagini (quelle che non sono già URL)
      const uploadedUrls = await Promise.all(images.map(async (imgUri) => {
         if (imgUri.startsWith('http')) return imgUri;
         console.log('URI prima upload:', imgUri);
         return await uploadImageToSupabase(imgUri);
      }));

      const apartmentData = { 
        title, 
        location: address, 
        price: parseFloat(price), 
        utility_cost: parseFloat(utilityCost || '0'), 
        image_url: uploadedUrls, 
        type: title, 
        description: desc, 
        sq_meters: parseInt(sqMeters || '0'), 
        num_rooms: parseInt(rooms || '0'), 
        floor: parseInt(floor || '0'), 
        bathrooms: parseInt(bathrooms || '0'), 
        features: features,
        // Hard Filters
        allowed_gender: allowedGender,
        allow_smokers: allowSmokers,
        allowed_occupation: allowedOccupation
      };

      if (isEditMode && route.params?.apartmentData) {
        // Update mode
        const { error } = await supabase
          .from('apartments')
          .update(apartmentData)
          .eq('id', route.params.apartmentData.id);
        
        if (error) {
          Alert.alert("Errore", error.message);
          setLoading(false);
          return;
        }
        Alert.alert("Successo", "Annuncio aggiornato con successo!");
      } else {
        // Insert mode
        const { error } = await supabase
          .from('apartments')
          .insert([{ ...apartmentData, owner_id: user.id }]);
        
        if (error) {
          Alert.alert("Errore", error.message);
          setLoading(false);
          return;
        }
      }
      
      navigation.replace('OwnerApp');
    } catch (e: any) { 
      Alert.alert("Errore", e.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <AppHeader title={isEditMode ? "Modifica Annuncio" : "Nuova Casa"}/>
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
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 10}}>
            {images.map((uri, index) => (
              <View key={index} style={{marginRight: 10}}>
                <Image source={{ uri }} style={commonStyles.miniPreview} />
                <TouchableOpacity onPress={() => removeImage(index)} style={commonStyles.removePhotoBtn}>
                  <Text style={{color:'white', fontWeight:'bold'}}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={pickImages} style={commonStyles.addPhotoBtn}>
              <Text style={{fontSize: 30, color:'#ccc'}}>+</Text>
            </TouchableOpacity>
          </ScrollView>
          <Text style={{color:'#888', marginBottom: 20, fontSize: 12}}>Aggiungi fino a 5 foto</Text>
        </View>

        <TextInput style={commonStyles.input} placeholder="Titolo (es. Monolocale)" value={title} onChangeText={setTitle}/>
        <View style={{flexDirection:'row', gap:10}}>
          <TextInput style={[commonStyles.input, {flex:1}]} placeholder="Affitto €" value={price} onChangeText={setPrice} keyboardType="numeric"/>
          <TextInput style={[commonStyles.input, {flex:1}]} placeholder="Utenze €" value={utilityCost} onChangeText={setUtilityCost} keyboardType="numeric"/>
        </View>
        <TextInput style={commonStyles.input} placeholder="Indirizzo" value={address} onChangeText={setAddress}/>
        <Text style={commonStyles.label}>Dettagli</Text>
        <View style={{flexDirection:'row', gap:10}}>
          <TextInput style={[commonStyles.input, {flex:1}]} placeholder="Mq" value={sqMeters} onChangeText={setSqMeters} keyboardType="numeric"/>
          <TextInput style={[commonStyles.input, {flex:1}]} placeholder="Locali" value={rooms} onChangeText={setRooms} keyboardType="numeric"/>
        </View>
        <View style={{flexDirection:'row', gap:10}}>
          <TextInput style={[commonStyles.input, {flex:1}]} placeholder="Piano" value={floor} onChangeText={setFloor} keyboardType="numeric"/>
          <TextInput style={[commonStyles.input, {flex:1}]} placeholder="Bagni" value={bathrooms} onChangeText={setBathrooms} keyboardType="numeric"/>
        </View>
        <TextInput style={[commonStyles.input, {height:80}]} placeholder="Descrizione..." multiline value={desc} onChangeText={setDesc}/>
        <TextInput style={commonStyles.input} placeholder="Extra" value={features} onChangeText={setFeatures}/>
        
        {/* Sezione Requisiti Inquilino (Filtri Rigidi) */}
        <View style={styles.filtersSection}>
          <Text style={[commonStyles.label, {marginTop: 20, marginBottom: 15}]}>Requisiti Inquilino (Filtri Rigidi)</Text>
          
          {/* Chi accetti? (Sesso) */}
          <Text style={styles.filterLabel}>Chi accetti? (Sesso)</Text>
          <View style={styles.optionsRow}>
            {[
              { value: 'any', label: 'Tutti' },
              { value: 'male', label: 'Solo Uomini' },
              { value: 'female', label: 'Solo Donne' }
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionButton, allowedGender === option.value && styles.optionButtonActive]}
                onPress={() => setAllowedGender(option.value)}
              >
                <Text style={[styles.optionText, allowedGender === option.value && styles.optionTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fumatori ammessi? */}
          <Text style={styles.filterLabel}>Fumatori ammessi?</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionButton, allowSmokers && styles.optionButtonActive]}
              onPress={() => setAllowSmokers(true)}
            >
              <Text style={[styles.optionText, allowSmokers && styles.optionTextActive]}>Sì</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, !allowSmokers && styles.optionButtonActive]}
              onPress={() => setAllowSmokers(false)}
            >
              <Text style={[styles.optionText, !allowSmokers && styles.optionTextActive]}>No</Text>
            </TouchableOpacity>
          </View>

          {/* Occupazione richiesta */}
          <Text style={styles.filterLabel}>Occupazione richiesta</Text>
          <View style={styles.optionsRow}>
            {[
              { value: 'any', label: 'Tutti' },
              { value: 'student', label: 'Solo Studenti' },
              { value: 'worker', label: 'Solo Lavoratori' }
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionButton, allowedOccupation === option.value && styles.optionButtonActive]}
                onPress={() => setAllowedOccupation(option.value)}
              >
                <Text style={[styles.optionText, allowedOccupation === option.value && styles.optionTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
                <TouchableOpacity style={[commonStyles.primaryBtn, { backgroundColor: COLORS.ownerBrand }]} onPress={saveApartment} disabled={loading}>
                  {loading ? <ActivityIndicator color={COLORS.white}/> : <Text style={commonStyles.btnText}>{isEditMode ? "Salva Modifiche" : "Pubblica Annuncio"}</Text>}
                </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  filtersSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 15,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  optionButton: {
    flex: 1,
    minWidth: '30%',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderColor: '#e8e8e8',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: COLORS.ownerBrand,
    borderColor: COLORS.ownerBrand,
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

