import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, LayoutAnimation, UIManager, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { uploadImageToSupabase } from '../utils/imageUpload';
import { SCREEN_WIDTH, COLORS } from '../utils/constants';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ApartmentDetailEditModalProps {
  visible: boolean;
  apartment: any;
  onClose: () => void;
  onApartmentUpdated?: () => void;
}

export const ApartmentDetailEditModal = ({ visible, apartment, onClose, onApartmentUpdated }: ApartmentDetailEditModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Campi modificabili
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
  
  // Hard Filters
  const [allowedGender, setAllowedGender] = useState<string>('any');
  const [allowSmokers, setAllowSmokers] = useState<boolean>(false);
  const [allowedOccupation, setAllowedOccupation] = useState<string>('any');

  // Valori originali per annullare
  const [originalValues, setOriginalValues] = useState<any>(null);

  useEffect(() => {
    if (apartment && visible) {
      setTitle(apartment.title || '');
      setPrice(String(apartment.price || ''));
      setUtilityCost(String(apartment.utility_cost || '0'));
      setAddress(apartment.location || '');
      setDesc(apartment.description || '');
      setSqMeters(String(apartment.sq_meters || ''));
      setRooms(String(apartment.num_rooms || ''));
      setFloor(String(apartment.floor || ''));
      setBathrooms(String(apartment.bathrooms || ''));
      setFeatures(apartment.features || '');
      
      const imageArray = Array.isArray(apartment.image_url) 
        ? apartment.image_url 
        : apartment.image_url 
          ? [apartment.image_url] 
          : [];
      setImages(imageArray);
      
      setAllowedGender(apartment.allowed_gender || 'any');
      setAllowSmokers(apartment.allow_smokers || false);
      setAllowedOccupation(apartment.allowed_occupation || 'any');
      
      // Salva valori originali
      setOriginalValues({
        title: apartment.title || '',
        price: String(apartment.price || ''),
        utilityCost: String(apartment.utility_cost || '0'),
        address: apartment.location || '',
        desc: apartment.description || '',
        sqMeters: String(apartment.sq_meters || ''),
        rooms: String(apartment.num_rooms || ''),
        floor: String(apartment.floor || ''),
        bathrooms: String(apartment.bathrooms || ''),
        features: apartment.features || '',
        images: imageArray,
        allowedGender: apartment.allowed_gender || 'any',
        allowSmokers: apartment.allow_smokers || false,
        allowedOccupation: apartment.allowed_occupation || 'any',
      });
      
      setIsEditing(false);
    }
  }, [apartment, visible]);

  const pickImages = async () => {
    if (!isEditing) return;
    
    let result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsMultipleSelection: true, 
      selectionLimit: 5, 
      quality: 0.5 
    }); 
    if (!result.canceled && result.assets) {
      LayoutAnimation.easeInEaseOut();
      setImages([...images, ...result.assets.map(asset => asset.uri)]);
    }
  };

  const removeImage = (index: number) => {
    if (!isEditing) return;
    LayoutAnimation.easeInEaseOut();
    setImages(images.filter((_, i) => i !== index));
  };

  const handleEdit = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsEditing(true);
  };

  const handleCancel = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (originalValues) {
      setTitle(originalValues.title);
      setPrice(originalValues.price);
      setUtilityCost(originalValues.utilityCost);
      setAddress(originalValues.address);
      setDesc(originalValues.desc);
      setSqMeters(originalValues.sqMeters);
      setRooms(originalValues.rooms);
      setFloor(originalValues.floor);
      setBathrooms(originalValues.bathrooms);
      setFeatures(originalValues.features);
      setImages(originalValues.images);
      setAllowedGender(originalValues.allowedGender);
      setAllowSmokers(originalValues.allowSmokers);
      setAllowedOccupation(originalValues.allowedOccupation);
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!apartment) return;
    
    if (!title || !price || images.length === 0) {
      Alert.alert("Manca qualcosa", "Inserisci titolo, prezzo e almeno una foto.");
      return;
    }
    
    setLoading(true);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

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
        allowed_gender: allowedGender,
        allow_smokers: allowSmokers,
        allowed_occupation: allowedOccupation
      };

      const { error } = await supabase
        .from('apartments')
        .update(apartmentData)
        .eq('id', apartment.id);
      
      if (error) {
        Alert.alert("Errore", error.message);
        setLoading(false);
        return;
      }

      // Aggiorna valori originali
      setOriginalValues({
        title,
        price,
        utilityCost,
        address,
        desc,
        sqMeters,
        rooms,
        floor,
        bathrooms,
        features,
        images: uploadedUrls,
        allowedGender,
        allowSmokers,
        allowedOccupation,
      });

      setIsEditing(false);
      Alert.alert("Successo", "Annuncio aggiornato con successo!");
      
      if (onApartmentUpdated) {
        onApartmentUpdated();
      }
    } catch (error: any) {
      Alert.alert("Errore", error.message || 'Si è verificato un errore.');
    } finally {
      setLoading(false);
    }
  };

  if (!apartment) return null;

  const getCoverImage = (img: any) => {
    if (!img) return 'https://via.placeholder.com/150';
    return Array.isArray(img) ? img[0] : img;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Header con X */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Dettagli Annuncio</Text>
            <View style={{ width: 40 }} />
          </View>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Foto Gallery */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Foto</Text>
                {isEditing ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollView}>
                    {images.map((uri, index) => (
                      <View key={index} style={styles.imageItem}>
                        <Image source={{ uri }} style={styles.previewImage} />
                        <TouchableOpacity onPress={() => removeImage(index)} style={styles.removeImageButton}>
                          <Text style={styles.removeImageText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    {images.length < 5 && (
                      <TouchableOpacity onPress={pickImages} style={styles.addImageButton}>
                        <Text style={styles.addImageText}>+</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollView}>
                    {images.map((uri, index) => (
                      <Image key={index} source={{ uri }} style={styles.previewImage} />
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Informazioni Base */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informazioni Base</Text>
                
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Titolo</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Titolo (es. Monolocale)"
                      placeholderTextColor="#999"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{title}</Text>
                  )}
                </View>

                <View style={styles.fieldRow}>
                  <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.fieldLabel}>Affitto (€/mese)</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.input}
                        value={price}
                        onChangeText={setPrice}
                        placeholder="Affitto"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.fieldValue}>€{price}/mese</Text>
                    )}
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Utenze (€)</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.input}
                        value={utilityCost}
                        onChangeText={setUtilityCost}
                        placeholder="Utenze"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.fieldValue}>€{utilityCost}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Indirizzo</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={address}
                      onChangeText={setAddress}
                      placeholder="Indirizzo"
                      placeholderTextColor="#999"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{address}</Text>
                  )}
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Descrizione</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={desc}
                      onChangeText={setDesc}
                      placeholder="Descrizione..."
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={4}
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{desc || 'Nessuna descrizione'}</Text>
                  )}
                </View>
              </View>

              {/* Dettagli Tecnici */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dettagli Tecnici</Text>
                
                <View style={styles.fieldRow}>
                  <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.fieldLabel}>Metri Quadri</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.input}
                        value={sqMeters}
                        onChangeText={setSqMeters}
                        placeholder="Mq"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.fieldValue}>{sqMeters || '--'} m²</Text>
                    )}
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Locali</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.input}
                        value={rooms}
                        onChangeText={setRooms}
                        placeholder="Locali"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.fieldValue}>{rooms || '--'}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.fieldRow}>
                  <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.fieldLabel}>Piano</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.input}
                        value={floor}
                        onChangeText={setFloor}
                        placeholder="Piano"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.fieldValue}>{floor || '--'}</Text>
                    )}
                  </View>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Bagni</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.input}
                        value={bathrooms}
                        onChangeText={setBathrooms}
                        placeholder="Bagni"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.fieldValue}>{bathrooms || '--'}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Extra / Comfort</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={features}
                      onChangeText={setFeatures}
                      placeholder="Extra (separati da virgola)"
                      placeholderTextColor="#999"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{features || 'Nessun extra'}</Text>
                  )}
                </View>
              </View>

              {/* Requisiti Inquilino */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Requisiti Inquilino</Text>
                
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Chi accetti? (Sesso)</Text>
                  {isEditing ? (
                    <View style={styles.optionsRow}>
                      {[
                        { value: 'any', label: 'Tutti' },
                        { value: 'male', label: 'Solo Uomini' },
                        { value: 'female', label: 'Solo Donne' }
                      ].map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.optionButton, allowedGender === option.value && styles.optionButtonActive]}
                          onPress={() => {
                            LayoutAnimation.easeInEaseOut();
                            setAllowedGender(option.value);
                          }}
                        >
                          <Text style={[styles.optionText, allowedGender === option.value && styles.optionTextActive]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.fieldValue}>
                      {allowedGender === 'any' ? 'Tutti' : 
                       allowedGender === 'male' ? 'Solo Uomini' : 
                       'Solo Donne'}
                    </Text>
                  )}
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Fumatori ammessi?</Text>
                  {isEditing ? (
                    <View style={styles.optionsRow}>
                      <TouchableOpacity
                        style={[styles.optionButton, allowSmokers && styles.optionButtonActive]}
                        onPress={() => {
                          LayoutAnimation.easeInEaseOut();
                          setAllowSmokers(true);
                        }}
                      >
                        <Text style={[styles.optionText, allowSmokers && styles.optionTextActive]}>Sì</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.optionButton, !allowSmokers && styles.optionButtonActive]}
                        onPress={() => {
                          LayoutAnimation.easeInEaseOut();
                          setAllowSmokers(false);
                        }}
                      >
                        <Text style={[styles.optionText, !allowSmokers && styles.optionTextActive]}>No</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.fieldValue}>{allowSmokers ? 'Sì' : 'No'}</Text>
                  )}
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Occupazione richiesta</Text>
                  {isEditing ? (
                    <View style={styles.optionsRow}>
                      {[
                        { value: 'any', label: 'Tutti' },
                        { value: 'student', label: 'Solo Studenti' },
                        { value: 'worker', label: 'Solo Lavoratori' }
                      ].map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.optionButton, allowedOccupation === option.value && styles.optionButtonActive]}
                          onPress={() => {
                            LayoutAnimation.easeInEaseOut();
                            setAllowedOccupation(option.value);
                          }}
                        >
                          <Text style={[styles.optionText, allowedOccupation === option.value && styles.optionTextActive]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.fieldValue}>
                      {allowedOccupation === 'any' ? 'Tutti' : 
                       allowedOccupation === 'student' ? 'Solo Studenti' : 
                       'Solo Lavoratori'}
                    </Text>
                  )}
                </View>
              </View>

              {/* Pulsanti */}
              <View style={styles.actions}>
                {isEditing ? (
                  <>
                    <TouchableOpacity 
                      style={[styles.button, styles.saveButton]}
                      onPress={handleSave}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text style={styles.buttonText}>Salva</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.button, styles.cancelButton]}
                      onPress={handleCancel}
                      disabled={loading}
                    >
                      <Text style={[styles.buttonText, styles.cancelButtonText]}>Annulla</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity 
                    style={[styles.button, styles.editButton]}
                    onPress={handleEdit}
                  >
                    <Text style={styles.buttonText}>Modifica</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#333',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
  },
  imageScrollView: {
    marginBottom: 10,
  },
  imageItem: {
    position: 'relative',
    marginRight: 10,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 15,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 40,
    color: '#999',
  },
  field: {
    marginBottom: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
  actions: {
    gap: 12,
    marginTop: 10,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  editButton: {
    backgroundColor: COLORS.ownerBrand, // Owner-specific
  },
  saveButton: {
    backgroundColor: COLORS.ownerBrand, // Owner-specific
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  cancelButtonText: {
    color: '#666',
  },
});

