import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { uploadImageToSupabase } from '../utils/imageUpload';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Uomo' },
  { value: 'female', label: 'Donna' },
  { value: 'non_binary', label: 'Altro' },
];

const OCCUPATION_OPTIONS = [
  { value: 'student', label: 'Studente' },
  { value: 'worker', label: 'Lavoratore' },
  { value: 'other', label: 'Altro' },
];

export function ProfileSetupScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [occupation, setOccupation] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets) setImage(result.assets[0].uri);
  };

  const parseDob = (raw: string): string | null => {
    const parts = raw.split('/').map(s => s.trim());
    if (parts.length !== 3) return null;
    const [dd, mm, yyyy] = parts;
    if (!dd || !mm || !yyyy || yyyy.length !== 4) return null;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  };

  const saveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Attenzione', 'Inserisci il tuo nome.');
      return;
    }
    setLoading(true);
    try {
      let avatar_url: string | null = image;
      if (image && !image.startsWith('http')) {
        try { avatar_url = await uploadImageToSupabase(image); } catch {}
      }
      const { data: { user } } = await supabase.auth.getUser();
      const updates: any = {
        id: user?.id,
        full_name: fullName.trim(),
        avatar_url,
      };
      if (dob) {
        const iso = parseDob(dob);
        if (iso) updates.dob = iso;
      }
      if (gender) updates.gender = gender;
      if (occupation) updates.occupation = occupation;
      if (bio.trim()) updates.bio = bio.trim();

      await supabase.from('profiles').upsert(updates);
      navigation.replace('RoleSelection');
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      style={styles.flex}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Completa il profilo</Text>

          <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.8}>
            {image ? (
              <Image source={{ uri: image }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="camera-outline" size={24} color="#5A8A6A" />
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Nome e cognome"
            placeholderTextColor="#5A8A6A"
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={styles.input}
            placeholder="GG / MM / AAAA"
            placeholderTextColor="#5A8A6A"
            value={dob}
            onChangeText={setDob}
            keyboardType="numeric"
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Genere</Text>
              {GENDER_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optBtn, gender === opt.value && styles.optBtnActive]}
                  onPress={() => setGender(opt.value)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.optText, gender === opt.value && styles.optTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Occupazione</Text>
              {OCCUPATION_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optBtn, occupation === opt.value && styles.optBtnActive]}
                  onPress={() => setOccupation(opt.value)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.optText, occupation === opt.value && styles.optTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            style={styles.bioInput}
            placeholder="Qualcosa su di te..."
            placeholderTextColor="#5A8A6A"
            value={bio}
            onChangeText={setBio}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.cta} onPress={saveProfile} disabled={loading} activeOpacity={0.85}>
            <Text style={styles.ctaText}>{loading ? 'Salvataggio...' : 'Salva e inizia'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#0D1F1A',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 56,
  },
  title: {
    fontWeight: '700',
    fontSize: 22,
    color: '#F0EDE8',
    textAlign: 'center',
    marginBottom: 28,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#152B20',
    borderWidth: 1,
    borderColor: '#2A4F38',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#152B20',
    borderWidth: 0.8,
    borderColor: '#2A4F38',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#F0EDE8',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A8A6A',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  optBtn: {
    backgroundColor: '#0D2318',
    borderWidth: 1,
    borderColor: '#1E3D2A',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  optBtnActive: {
    backgroundColor: '#1A4A2E',
    borderColor: '#84A98C',
    borderWidth: 1.5,
  },
  optText: {
    fontSize: 13,
    color: '#4A7A5A',
    fontWeight: '500',
  },
  optTextActive: {
    color: '#A8D4B0',
    fontWeight: '700',
  },
  bioInput: {
    width: '100%',
    height: 90,
    backgroundColor: '#152B20',
    borderWidth: 0.8,
    borderColor: '#2A4F38',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    fontSize: 16,
    color: '#F0EDE8',
    marginBottom: 24,
  },
  cta: {
    backgroundColor: '#84A98C',
    borderRadius: 30,
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
