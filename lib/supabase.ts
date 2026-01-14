
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://krdablhwacmskizvltfv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZGFibGh3YWNtc2tpenZsdGZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjUzMTcsImV4cCI6MjA3Nzc0MTMxN30.x0CFh8FpHC_fBHKQokZalKPLkLLP6GTDRAWt213kebw';

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('Supabase client initialized with URL:', SUPABASE_URL);
