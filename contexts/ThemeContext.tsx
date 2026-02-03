
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';
type Language = 'en' | 'fr';

interface ThemeContextType {
  theme: ThemeMode;
  language: Language;
  effectiveTheme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@pto_theme_mode';
const LANGUAGE_STORAGE_KEY = '@pto_language';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      console.log('ThemeContext: Loading theme and language preferences from storage');
      const [savedTheme, savedLanguage] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(LANGUAGE_STORAGE_KEY),
      ]);

      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
        setThemeState(savedTheme as ThemeMode);
        console.log('ThemeContext: Loaded theme preference:', savedTheme);
      } else {
        console.log('ThemeContext: No saved theme, using default: system');
      }
      
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'fr')) {
        setLanguageState(savedLanguage as Language);
        console.log('ThemeContext: Loaded language preference:', savedLanguage);
      } else {
        console.log('ThemeContext: No saved language, using default: en');
      }
    } catch (error) {
      console.error('ThemeContext: Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (mode: ThemeMode) => {
    try {
      console.log('ThemeContext: Setting theme mode to:', mode);
      // Update state first for immediate UI update
      setThemeState(mode);
      // Then persist to storage
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      console.log('ThemeContext: Theme mode saved successfully to storage');
    } catch (error) {
      console.error('ThemeContext: Error saving theme mode:', error);
      // Revert state if storage fails
      loadPreferences();
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      console.log('ThemeContext: Setting language to:', lang);
      // Update state first for immediate UI update
      setLanguageState(lang);
      // Then persist to storage
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      console.log('ThemeContext: Language saved successfully to storage');
    } catch (error) {
      console.error('ThemeContext: Error saving language:', error);
      // Revert state if storage fails
      loadPreferences();
    }
  };

  // Calculate effective theme based on theme mode and system preference
  const effectiveTheme: 'light' | 'dark' = 
    theme === 'system' 
      ? (systemColorScheme === 'dark' ? 'dark' : 'light')
      : theme;

  console.log('ThemeContext: Current state - theme:', theme, 'effectiveTheme:', effectiveTheme, 'language:', language);

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        language,
        effectiveTheme,
        setTheme,
        setLanguage,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
