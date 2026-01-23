
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Alert } from 'react-native';

interface UserProfile {
  id: string;
  name: string;
  company: string;
  email: string;
  created_at: string;
}

interface SupabaseContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, company: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('SupabaseProvider: Initializing auth state');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('SupabaseProvider: Initial session:', session ? 'Found' : 'None');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.error('SupabaseProvider: Error getting initial session:', err);
      setError('Failed to check authentication status. Please check your internet connection.');
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('SupabaseProvider: Auth state changed:', _event, session ? 'Session exists' : 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Poll for session changes (in case web auth completes)
    const pollInterval = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession && !session) {
        console.log('SupabaseProvider: Session detected via polling');
        setSession(currentSession);
        setUser(currentSession.user);
        fetchProfile(currentSession.user.id);
      }
    }, 2000); // Check every 2 seconds

    return () => {
      console.log('SupabaseProvider: Cleaning up auth listener');
      subscription.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [session]);

  const fetchProfile = async (userId: string) => {
    console.log('fetchProfile: Starting fetch for user ID:', userId);
    setError(null);
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout after 10 seconds')), 10000);
    });

    try {
      console.log('fetchProfile: Querying profiles table...');
      
      // Race between the actual query and the timeout
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;

      console.log('fetchProfile: Query completed. Error:', error ? 'YES' : 'NO', 'Data:', data ? 'YES' : 'NO');

      if (error) {
        console.error('fetchProfile: Supabase error:', JSON.stringify(error, null, 2));
        
        // Check for specific error codes
        if (error.code === 'PGRST116') {
          const errorMsg = 'No profile found for your account. Your account may not have access to this app. Please contact your administrator.';
          console.error('fetchProfile: PGRST116 - Profile not found');
          setError(errorMsg);
          Alert.alert(
            'Profile Not Found',
            errorMsg,
            [{ text: 'OK' }]
          );
        } else if (error.message?.includes('JWT')) {
          const errorMsg = 'Authentication token error. Please sign in again.';
          console.error('fetchProfile: JWT error');
          setError(errorMsg);
          Alert.alert(
            'Authentication Error',
            errorMsg,
            [{ text: 'OK', onPress: () => signOut() }]
          );
        } else {
          const errorMsg = `Failed to load profile: ${error.message || 'Unknown error'}`;
          console.error('fetchProfile: Other error:', error.message);
          setError(errorMsg);
          Alert.alert(
            'Error Loading Profile',
            errorMsg,
            [{ text: 'Retry', onPress: () => fetchProfile(userId) }, { text: 'Cancel' }]
          );
        }
        setProfile(null);
      } else if (data) {
        console.log('fetchProfile: Profile found successfully:', data.name, data.company);
        setProfile(data);
        setError(null);
      } else {
        console.log('fetchProfile: No profile data returned (user may not have profile record)');
        const errorMsg = 'Your account does not have a profile. You may not have access to this app. Please contact your administrator.';
        setError(errorMsg);
        Alert.alert(
          'No Profile Found',
          errorMsg,
          [{ text: 'OK' }]
        );
        setProfile(null);
      }
    } catch (error: any) {
      console.error('fetchProfile: Exception caught:', error.message || error);
      
      let errorMsg = 'Failed to load your profile. ';
      if (error.message?.includes('timeout')) {
        errorMsg += 'The request timed out. Please check your internet connection.';
      } else if (error.message?.includes('network')) {
        errorMsg += 'Network error. Please check your internet connection.';
      } else {
        errorMsg += error.message || 'Unknown error occurred.';
      }
      
      setError(errorMsg);
      Alert.alert(
        'Error',
        errorMsg,
        [
          { text: 'Retry', onPress: () => fetchProfile(userId) },
          { text: 'Sign Out', onPress: () => signOut(), style: 'destructive' }
        ]
      );
      setProfile(null);
    } finally {
      console.log('fetchProfile: Setting loading to false');
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      console.log('refreshProfile: Refreshing user profile');
      setLoading(true);
      await fetchProfile(user.id);
    }
  };

  const checkSession = async () => {
    console.log('checkSession: Manually checking session');
    setLoading(true);
    setError(null);
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('checkSession: Error checking session:', error);
        const errorMsg = `Session check failed: ${error.message}`;
        setError(errorMsg);
        Alert.alert('Error', errorMsg);
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else if (currentSession) {
        console.log('checkSession: Session found during manual check');
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchProfile(currentSession.user.id);
      } else {
        console.log('checkSession: No session found during manual check');
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('checkSession: Exception checking session:', error);
      const errorMsg = `Failed to check session: ${error.message || 'Unknown error'}`;
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('signIn: Signing in user with email:', email);
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('signIn: Sign in error:', error);
        throw error;
      }

      console.log('signIn: Sign in successful');
      // Session will be set by onAuthStateChange listener
    } catch (error: any) {
      console.error('signIn: Exception during sign in:', error);
      setError(error.message || 'Sign in failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, company: string) => {
    console.log('signUp: Signing up user with email:', email);
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            company,
          },
        },
      });

      if (error) {
        console.error('signUp: Sign up error:', error);
        throw error;
      }

      console.log('signUp: Sign up successful');
      
      // Create profile record if user was created
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              name,
              company,
              email,
              created_at: new Date().toISOString(),
            },
          ]);

        if (profileError) {
          console.error('signUp: Error creating profile:', profileError);
        } else {
          console.log('signUp: Profile created successfully');
        }
      }
    } catch (error: any) {
      console.error('signUp: Exception during sign up:', error);
      setError(error.message || 'Sign up failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('signOut: Signing out user');
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('signOut: Sign out error:', error);
        throw error;
      }
      console.log('signOut: Sign out successful');
      setProfile(null);
    } catch (error: any) {
      console.error('signOut: Exception during sign out:', error);
      setError(error.message || 'Sign out failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <SupabaseContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        checkSession,
        clearError,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
