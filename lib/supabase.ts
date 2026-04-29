import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://knwiychyivtswhicxfzh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtud2l5Y2h5aXZ0c3doaWN4ZnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDk1MTUsImV4cCI6MjA5MzAyNTUxNX0.4KH8LBJhSbr-1pPAfcEBRY8oUtgR3zXswVio73lcXq0';

// SSR safety check for Expo Web
const isWeb = Platform.OS === 'web';
const canUseStorage = isWeb ? typeof window !== 'undefined' : true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: canUseStorage ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
