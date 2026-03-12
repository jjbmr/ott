import { useState, useEffect } from 'react';
import { Play, Lock } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';

interface AdminLoginProps {
  onLogin: (idToken: string) => void;
  onCancel: () => void;
}

export default function AdminLogin({ onLogin, onCancel }: AdminLoginProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const idToken = await result.user.getIdToken();
          onLogin(idToken);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Redirect login failed');
      }
    };
    checkRedirect();
  }, [onLogin]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      onLogin(idToken);
    } catch (err: any) {
      console.error('Popup error, trying redirect:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirErr: any) {
          setError(redirErr.message || 'Failed to redirect to login');
          setLoading(false);
        }
      } else {
        setError(err.message || 'Failed to login with Google');
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-8 bg-zinc-900 p-8 rounded-2xl border border-white/10">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-sky-500 p-3 rounded-2xl mb-4">
              <Play className="w-8 h-8 text-zinc-950 fill-zinc-950" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Admin Access</h2>
          <p className="mt-2 text-zinc-400">Sign in with your Google account</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white rounded-xl text-zinc-950 font-bold hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-950"></span>
            ) : (
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            )}
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 px-4 border border-zinc-800 rounded-xl text-zinc-300 font-medium hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
