
import { Redirect } from 'expo-router';
import { useSupabase } from '@/contexts/SupabaseContext';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';

export default function Index() {
  const { user, loading } = useSupabase();

  console.log('Index screen - User:', user ? 'Logged in' : 'Not logged in', 'Loading:', loading);

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.ptoGreen} />
      </View>
    );
  }

  // Redirect to auth if not logged in, otherwise to dashboard
  if (!user) {
    console.log('Redirecting to /auth - user not logged in');
    return <Redirect href="/auth" />;
  }

  console.log('Redirecting to /(tabs)/dashboard - user logged in');
  return <Redirect href="/(tabs)/dashboard" />;
}
