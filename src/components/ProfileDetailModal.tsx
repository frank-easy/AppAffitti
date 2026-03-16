import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, LayoutAnimation, UIManager, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { uploadImageToSupabase } from '../utils/imageUpload';
import { COLORS } from '../utils/constants';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ProfileDetailModalProps {
  visible: boolean;
  profile: any;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export const ProfileDetailModal = ({ visible, profile, onClose, onProfileUpdated }: ProfileDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Campi modificabili
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [residence, setResidence] = useState('');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState<string>('');
  const [isSmoker, setIsSmoker] = useState<boolean | null>(null);

  // Valori originali per annullare
  const [originalValues, setOriginalValues] = useState<any>(null);

  useEffect(() => {
    if (profile && visible) {
      setAvatarImage(profile.avatar_url || null);
      setResidence(profile.residence || '');
      
      // Calcola età dalla data di nascita
      if (profile.dob) {
        const birthDate = new Date(profile.dob);
        const today = new Date();
        const calculatedAge = today.getFullYear() - birthDate.getFullYear();
        setAge(String(calculatedAge));
      } else {
        setAge('');
      }
      
      setOccupation(profile.occupation || '');
      setIsSmoker(profile.is_smoker ?? null);
      
      // Salva valori originali
      setOriginalValues({
        avatarImage: profile.avatar_url || null,
        residence: profile.residence || '',
        age: profile.dob ? (() => {
          const birthDate = new Date(profile.dob);
          const today = new Date();
          return String(today.getFullYear() - birthDate.getFullYear());
        })() : '',
        occupation: profile.occupation || '',
        isSmoker: profile.is_smoker ?? null,
      });
      
      setIsEditing(false);
    }
  }, [profile, visible]);

  const handlePickImage = async () => {
    if (!isEditing) return;
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permessi', 'È necessario concedere i permessi per accedere alle foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      LayoutAnimation.easeInEaseOut();
      setAvatarImage(result.assets[0].uri);
    }
  };

  const handleEdit = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsEditing(true);
  };

  const handleCancel = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (originalValues) {
      setAvatarImage(originalValues.avatarImage);
      setResidence(originalValues.residence);
      setAge(originalValues.age);
      setOccupation(originalValues.occupation);
      setIsSmoker(originalValues.isSmoker);
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setLoading(true);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Errore', 'Utente non trovato.');
        setLoading(false);
        return;
      }

      let avatarUrl = avatarImage;

      // Se l'immagine è cambiata e non è già un URL, caricala
      if (avatarImage && !avatarImage.startsWith('http')) {
        try {
          avatarUrl = await uploadImageToSupabase(avatarImage);
        } catch (error: any) {
          Alert.alert('Errore', 'Impossibile caricare l\'immagine: ' + error.message);
          setLoading(false);
          return;
        }
      }

      // Calcola la data di nascita dall'età
      const birthYear = new Date().getFullYear() - parseInt(age || '20');
      const dob = `${birthYear}-01-01`;

      // Aggiorna il profilo (solo campi modificabili)
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          residence: residence,
          dob: dob,
          occupation: occupation,
          is_smoker: isSmoker,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Errore', 'Impossibile salvare le modifiche: ' + error.message);
        setLoading(false);
        return;
      }

      // Aggiorna valori originali
      setOriginalValues({
        avatarImage: avatarUrl,
        residence,
        age,
        occupation,
        isSmoker,
      });

      setIsEditing(false);
      Alert.alert('Successo', 'Profilo aggiornato con successo!');
      
      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (error: any) {
      Alert.alert('Errore', error.message || 'Si è verificato un errore.');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  const roleLabel = profile.role === 'owner' ? 'Proprietario' : 'Inquilino';
  const roleIcon = profile.role === 'owner' ? '🔑' : '👤';

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
            <Text style={styles.headerTitle}>Dettagli Profilo</Text>
            <View style={{ width: 40 }} />
          </View>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Foto Profilo */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Foto Profilo</Text>
                <TouchableOpacity 
                  onPress={isEditing ? handlePickImage : undefined}
                  style={styles.avatarContainer}
                  activeOpacity={isEditing ? 0.7 : 1}
                >
                  <Image 
                    source={{ uri: avatarImage || 'https://via.placeholder.com/150' }} 
                    style={styles.avatar}
                  />
                  {isEditing && (
                    <View style={styles.cameraOverlay}>
                      <Text style={styles.cameraIcon}>📷</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Informazioni Personali */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informazioni Personali</Text>
                
                {/* Nome (Read-only) */}
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Nome</Text>
                  <Text style={styles.fieldValue}>{profile.first_name}</Text>
                </View>

                {/* Cognome (Read-only) */}
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Cognome</Text>
                  <Text style={styles.fieldValue}>{profile.last_name}</Text>
                </View>

                {/* Ruolo (Read-only) */}
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Ruolo</Text>
                  <Text style={styles.fieldValue}>{roleIcon} {roleLabel}</Text>
                </View>

                {/* Residenza (Modificabile) */}
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Residenza</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={residence}
                      onChangeText={setResidence}
                      placeholder="Inserisci residenza"
                      placeholderTextColor="#999"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{residence || 'Non specificata'}</Text>
                  )}
                </View>

                {/* Età (Modificabile) */}
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Età</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={age}
                      onChangeText={setAge}
                      placeholder="Inserisci età"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{age || 'Non specificata'}</Text>
                  )}
                </View>

                {/* Email (Read-only) */}
                {profile.email && (
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Email</Text>
                    <Text style={styles.fieldValue}>{profile.email}</Text>
                  </View>
                )}

                {/* Nazionalità (Read-only) */}
                {profile.nationality && (
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Nazionalità</Text>
                    <Text style={styles.fieldValue}>{profile.nationality}</Text>
                  </View>
                )}

                {/* Sesso (Read-only, solo per inquilini) */}
                {profile.role === 'tenant' && profile.gender && (
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Sesso</Text>
                    <Text style={styles.fieldValue}>
                      {profile.gender === 'male' ? 'Uomo' : 
                       profile.gender === 'female' ? 'Donna' : 
                       profile.gender === 'non_binary' ? 'Altro/Non-binario' : 
                       'Preferisco non rispondere'}
                    </Text>
                  </View>
                )}

                {/* Occupazione (Modificabile, solo per inquilini) */}
                {profile.role === 'tenant' && (
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Occupazione</Text>
                    {isEditing ? (
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
                            onPress={() => {
                              LayoutAnimation.easeInEaseOut();
                              setOccupation(option.value);
                            }}
                          >
                            <Text style={[styles.optionText, occupation === option.value && styles.optionTextActive]}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.fieldValue}>
                        {occupation === 'student' ? 'Studente' : 
                         occupation === 'worker' ? 'Lavoratore' : 
                         occupation === 'unemployed' ? 'Disoccupato' : 
                         occupation === 'other' ? 'Altro' : 
                         'Non specificata'}
                      </Text>
                    )}
                  </View>
                )}

                {/* Fumatore (Modificabile, solo per inquilini) */}
                {profile.role === 'tenant' && (
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Fumatore</Text>
                    {isEditing ? (
                      <View style={styles.optionsRow}>
                        <TouchableOpacity
                          style={[styles.optionButton, isSmoker === true && styles.optionButtonActive]}
                          onPress={() => {
                            LayoutAnimation.easeInEaseOut();
                            setIsSmoker(true);
                          }}
                        >
                          <Text style={[styles.optionText, isSmoker === true && styles.optionTextActive]}>Sì</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.optionButton, isSmoker === false && styles.optionButtonActive]}
                          onPress={() => {
                            LayoutAnimation.easeInEaseOut();
                            setIsSmoker(false);
                          }}
                        >
                          <Text style={[styles.optionText, isSmoker === false && styles.optionTextActive]}>No</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.fieldValue}>
                        {isSmoker === true ? 'Sì' : isSmoker === false ? 'No' : 'Non specificato'}
                      </Text>
                    )}
                  </View>
                )}
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
  avatarContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: '50%',
    marginRight: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  cameraIcon: {
    fontSize: 20,
  },
  field: {
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
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
    backgroundColor: '#666',
  },
  saveButton: {
    backgroundColor: '#007AFF',
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

