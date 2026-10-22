import React, { useState } from 'react';
import { getSession, signIn, signOut } from './auth';

export default function AuthGate({ children }) {
  const [session, setSession] = useState(getSession());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (session) {
    return (
      <>
        {children}
        <button
          onClick={() => {
            signOut();
            setSession(null);
          }}
          style={{
            position: 'fixed', bottom: '10px', right: '10px', zIndex: 9999,
            padding: '6px 12px', fontSize: '12px', background: 'rgba(26,77,26,0.9)',
            color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
          }}
        >
          🔒 Se déconnecter
        </button>
      </>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const s = await signIn(email.trim(), password);
      setSession(s);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a4d1a, #2d5a27)', padding: '20px'
    }}>
      <form onSubmit={handleLogin} style={{
        background: 'white', padding: '30px', borderRadius: '15px', width: '100%',
        maxWidth: '360px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ color: '#1a4d1a', marginTop: 0, textAlign: 'center' }}>❄️ JM Pominville</h2>
        <p style={{ textAlign: 'center', color: '#666', marginTop: '-10px' }}>Connexion</p>
        <input
          type="email" placeholder="Courriel" value={email}
          onChange={(e) => setEmail(e.target.value)} required autoComplete="username"
          style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '16px' }}
        />
        <input
          type="password" placeholder="Mot de passe" value={password}
          onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
          style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '16px' }}
        />
        {error && <div style={{ color: '#c0392b', marginBottom: '12px', fontSize: '14px' }}>{error}</div>}
        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '12px', background: '#1a4d1a', color: 'white',
          border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer'
        }}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
