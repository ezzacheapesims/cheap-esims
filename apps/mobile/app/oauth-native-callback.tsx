import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { useUser } from '@clerk/clerk-expo';
import { theme } from '../src/theme';

export default function OAuthCallback() {
  const router = useRouter();
  const { setActive, isLoaded: signInLoaded } = useSignIn();
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  const params = useLocalSearchParams<{
    created_session_id?: string;
    rotating_token_nonce?: string;
  }>();

  useEffect(() => {
    async function handleCallback() {
      if (!signInLoaded || !userLoaded) return;

      try {
        // Check if user is already signed in (session might already be active)
        if (isSignedIn) {
          // User is already signed in, just redirect
          router.replace('/');
          return;
        }

        // Clerk's OAuth callback should have created_session_id
        if (params.created_session_id && setActive) {
          // Set the active session using the session ID from the callback
          await setActive({ session: params.created_session_id });
          
          // Small delay to ensure session is set before redirect
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Redirect to home page
          router.replace('/');
        } else {
          // If no session ID, redirect to sign in
          console.warn('[OAuth] No session ID in callback, params:', params);
          router.replace('/(auth)/sign-in');
        }
      } catch (error) {
        console.error('[OAuth] Callback error:', error);
        // On error, redirect to sign in
        router.replace('/(auth)/sign-in');
      }
    }

    if (signInLoaded && userLoaded) {
      handleCallback();
    }
  }, [params.created_session_id, setActive, router, signInLoaded, userLoaded, isSignedIn]);

  // Show loading indicator while processing
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
