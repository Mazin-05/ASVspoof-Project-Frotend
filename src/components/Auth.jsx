import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Shield } from 'lucide-react';

export default function Auth() {
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  const isStrongPassword = (password) => {
    // Requires: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    try {
      if (isRegistering) {
        if (!isStrongPassword(authPassword)) {
          setAuthError("Password must be at least 8 characters, include uppercase, lowercase, a number, and a special character.");
          return;
        }
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
    } catch (err) {
      setAuthError(err.message.replace("Firebase: ", ""));
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: '#0f172a' }}>
      <div style={{ backgroundColor: '#1e293b', padding: '2.5rem', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', width: '100%', maxWidth: '28rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#1e1b4b', padding: '1rem', borderRadius: '9999px', color: '#6366f1', marginBottom: '1rem' }}>
            <Shield size={40} />
          </div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#ffffff', textAlign: 'center' }}>ASVspoof 2021 Dashboard</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>Transformer-Driven Deepfake Voice Analyzer</p>
        </div>

        <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '0.5rem' }}>Secure Email Address</label>
            <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1', marginBottom: '0.5rem' }}>Password</label>
            <input type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', outline: 'none' }} />
          </div>

          {authError && <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{authError}</div>}

          <button type="submit" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}>
            {isRegistering ? "Register" : "Login"}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }} style={{ color: '#818cf8', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            {isRegistering ? "Already registered? Login here" : "Don't have an account? Register now"}
          </button>
        </div>
      </div>
    </div>
  );
}