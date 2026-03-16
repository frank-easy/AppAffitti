import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

console.log('[supabase] URL:', SUPABASE_URL);
console.log('[supabase] KEY first10:', SUPABASE_ANON_KEY.slice(0, 10), '| last10:', SUPABASE_ANON_KEY.slice(-10), '| length:', SUPABASE_ANON_KEY.length);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

supabase.from('profiles').select('count').limit(1)
  .then(({ data, error }) =>
    console.log('[supabase] DB ping:', JSON.stringify({ data, error }))
  );

