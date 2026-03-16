import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';

export async function uploadImageToSupabase(uri: string): Promise<string> {
  const ext = uri.substring(uri.lastIndexOf('.') + 1).toLowerCase();
  const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000000)}-${Math.random().toString(36).substring(7)}.${ext}`;

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64' as any,
  });

  const byteCharacters = globalThis.atob
    ? globalThis.atob(base64)
    : Buffer.from(base64, 'base64').toString('binary');

  const bytes = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    bytes[i] = byteCharacters.charCodeAt(i);
  }

  const { error } = await supabase.storage
    .from('images')
    .upload(fileName, bytes, { contentType: `image/${ext}` });

  if (error) {
    console.log('Errore Upload:', error.message);
    throw error;
  }

  const { data } = supabase.storage.from('images').getPublicUrl(fileName);
  return data.publicUrl;
}