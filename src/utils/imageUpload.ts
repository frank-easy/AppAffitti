import { supabase } from '../lib/supabase';

export async function uploadImageToSupabase(uri: string) {
  // 1. Estrae l'estensione (jpg, png)
  const ext = uri.substring(uri.lastIndexOf('.') + 1);
  
  // 2. Crea un nome file UNICO (Timestamp + Numero Casuale + Stringa Casuale)
  // Questo impedisce l'errore "Resource already exists" anche se carichi 10 foto in un millisecondo
  const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000000)}-${Math.random().toString(36).substring(7)}.${ext}`;
  
  const { error } = await supabase.storage
    .from('images')
    // @ts-ignore — React Native uri object, accettato da Supabase Storage su mobile
    .upload(fileName, { uri, name: fileName, type: `image/${ext}` });
  
  if (error) {
    // Se c'è un errore, lo vediamo nella console
    console.log("Errore Upload:", error.message);
    throw error;
  }
  
  const { data } = supabase.storage.from('images').getPublicUrl(fileName);
  return data.publicUrl;
}

