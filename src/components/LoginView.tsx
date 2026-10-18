import React, { useState } from 'react';
import { Bot, ArrowRight, ShieldCheck, Zap, Layers, Sparkles, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onSignInWithGoogle: () => Promise<void>;
  onContinueAsGuest: () => void;
}

export function LoginView({ onSignInWithGoogle, onContinueAsGuest }: LoginViewProps) {
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await onSignInWithGoogle();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(err?.message || 'Failed to complete Google Sign-In. Please try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon & Wordmark */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-black text-xl shadow-md mb-4">
          S
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          SelectBot
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Universal No-Code Chatbot Creation Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sign in to your account</h3>
            <p className="text-xs text-slate-500 mt-1">
              Connect via Google Authentication to manage your bots, menus, and Firestore database.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Primary Action: Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-xl shadow-xs bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors cursor-pointer disabled:opacity-50"
          >
            {signingIn ? (
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{signingIn ? 'Connecting to Firebase...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">or explore demo</span>
            </div>
          </div>

          {/* Secondary Action: Demo / Guest Access */}
          <button
            onClick={onContinueAsGuest}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <span>Continue as Guest (Explore Dashboard)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Feature Highlights */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Firebase Authentication & Cloud Firestore Active</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Multi-topic menu trees & ZAR (R) currency formatting</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Embeddable widget with public deployment engine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
