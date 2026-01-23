
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, company: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
    try {
      console.log('Fetching user profile for user ID:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle missing rows gracefully

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else if (data) {
        console.log('Profile fetched successfully:', data);
        setProfile(data);
      } else {
        console.log('No profile found for user, this is okay - profile may not exist yet');
        setProfile(null);
      }
    } catch (error) {
      console.error('Exception fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      console.log('Refreshing user profile');
      await fetchProfile(user.id);
    }
  };

  const checkSession = async () => {
    console.log('Manually checking session');
    setLoading(true);
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error checking session:', error);
        setSession(null);
        setUser(null);
        setProfile(null);
      } else if (currentSession) {
        console.log('Session found during manual check');
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchProfile(currentSession.user.id);
      } else {
        console.log('No session found during manual check');
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Exception checking session:', error);
      setSession(null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Signing in user with email:', email);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      console.log('Sign in successful');
      // Session will be set by onAuthStateChange listener
    } catch (error) {
      console.error('Exception during sign in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, company: string) => {
    console.log('Signing up user with email:', email);
    setLoading(true);
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
        console.error('Sign up error:', error);
        throw error;
      }

      console.log('Sign up successful');
      
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
          console.error('Error creating profile:', profileError);
        } else {
          console.log('Profile created successfully');
        }
      }
    } catch (error) {
      console.error('Exception during sign up:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('Signing out user');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      console.log('Sign out successful');
      setProfile(null);
    } catch (error) {
      console.error('Exception during sign out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SupabaseContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        checkSession,
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
