'use client';

import { CredentialResponse, GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiPost } from '../lib/api';
import { useAuthStore } from '../lib/store';

export function GoogleAuthButton() {
  const setToken = useAuthStore((s) => s.setToken);
  const setAuthMethod = useAuthStore((s) => s.setAuthMethod);
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      // In a real implementation, you would:
      // 1. Send the credential token to your backend
      // 2. Backend verifies it with Google and creates/links user
      // 3. Backend returns your app's JWT token

      // For now, we'll decode the JWT to get user info (THIS IS INSECURE - DO NOT USE IN PRODUCTION)
      // In production, ALWAYS verify the token on the backend

      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }

      // Send to backend for verification and user creation/linking
      const response = await apiPost<{ accessToken: string }>(
        '/auth/google/callback',
        {
          token: credentialResponse.credential,
        }
      );

      setToken(response.accessToken);
      setAuthMethod('google');
      router.push('/dashboard');
    } catch (error: any) {
      setIsError(true);
      setMessage(error?.message || 'Failed to sign in with Google');
    }
  };

  const handleGoogleError = () => {
    setIsError(true);
    setMessage('Failed to sign in with Google');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 before:flex-1 before:h-px before:bg-zinc-200 after:flex-1 after:h-px after:bg-zinc-200 dark:before:bg-neutral-700 dark:after:bg-neutral-700">
        <span className="text-sm text-zinc-500 dark:text-neutral-400">or</span>
      </div>

      <div className="flex justify-center">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin_with"
            theme="outline"
            size="large"
          />
        </GoogleOAuthProvider>
      </div>

      {message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm font-medium text-center ${
            isError
              ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
