// Gestion de la connexion (Supabase Auth) pour l'app web JM Pominville
const SUPABASE_URL = 'https://lgduqlcebtasmfwafhwm.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_nm3F2326eRjQ8MIzGSJUZw_VL9zaTpj';
const STORAGE_KEY = 'jm_auth_session';

export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveSession(data) {
  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
    email: data.user && data.user.email ? data.user.email : ''
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: PUBLISHABLE_KEY },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error('Courriel ou mot de passe incorrect.');
  }
  return saveSession(data);
}

export function signOut() {
  localStorage.removeItem(STORAGE_KEY);
}

// Retourne un jeton valide (le renouvelle automatiquement s'il va expirer).
// Tant que personne n'est connecté, retourne la clé publique (période de transition).
export async function getAccessToken() {
  let session = getSession();
  if (!session) return PUBLISHABLE_KEY;

  if (Date.now() > session.expires_at - 60000) {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: PUBLISHABLE_KEY },
        body: JSON.stringify({ refresh_token: session.refresh_token })
      });
      const data = await res.json();
      if (!res.ok) {
        signOut();
        window.location.reload();
        return PUBLISHABLE_KEY;
      }
      session = saveSession(data);
    } catch (e) {
      // Hors connexion : on garde l'ancien jeton
    }
  }
  return session.access_token;
}
