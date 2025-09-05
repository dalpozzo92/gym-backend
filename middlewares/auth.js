import { createClient } from '@supabase/supabase-js';
import { debug } from '../utils.js';

// Inizializza il client Supabase con la chiave di servizio
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Funzione per verificare un token Supabase
export const verifyToken = async (token) => {
  if (!token) {
    return { isValid: false };
  }
  
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return { isValid: false };
    }
    return { isValid: true, user: data.user };
  } catch (error) {
    debug(`[verifyToken] Errore: ${error.message}`);
    return { isValid: false };
  }
};

// Funzione per refreshare un token Supabase
export const refreshToken = async (token) => {
  if (!token) {
    return { success: false, error: 'Token non fornito' };
  }
  
  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: token });
    
    if (error || !data.session) {
      return { success: false, error: error?.message || 'Errore nel refresh del token' };
    }
    
    return { 
      success: true, 
      session: data.session, 
      token: data.session.access_token,
      expiresIn: data.session.expires_in 
    };
  } catch (error) {
    debug(`[refreshToken] Errore: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Middleware per autenticare l'utente
export const authenticateUser = async (req, res, next) => {
  // Ottieni l'access token dal cookie
  const accessToken = req.cookies.sb_access_token;
  
  if (!accessToken) {
    debug('[authenticateUser] Access token non trovato');
    return res.status(401).json({ message: 'Non autorizzato' });
  }
  
  try {
    // Verifica l'access token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    // Se il token è valido, procedi
    if (!error && user) {
      // Recupera i dettagli dell'utente dal database
      const { data: userDetails, error: detailsError } = await supabase
        .from('user_details')
        .select('*')
        .eq('uuid_auth', user.id)
        .single();
      
      if (detailsError || !userDetails) {
        debug('[authenticateUser] Dettagli utente non trovati');
        return res.status(404).json({ message: 'Dettagli utente non trovati' });
      }
      
      // Salva l'utente nella richiesta
      req.user = {
        userId: user.id,
        userRole: userDetails.user_details_type,
        userDetails: userDetails
      };
      
      debug('[authenticateUser] Utente autenticato: ' + user.id);
      next();
      return;
    }
    
    // Se il token non è valido, prova a refreshare
    debug('[authenticateUser] Access token non valido, tentativo di refresh');
    
    // Ottieni il refresh token dal cookie
    const refreshToken = req.cookies.sb_refresh_token;
    
    if (!refreshToken) {
      debug('[authenticateUser] Refresh token non trovato');
      return res.status(401).json({ message: 'Sessione scaduta, effettua nuovamente il login' });
    }
    
    // Tenta di refreshare la sessione
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });
    
    if (refreshError || !refreshData.session) {
      debug('[authenticateUser] Refresh token non valido: ' + refreshError?.message);
      
      // Cancella i cookie di sessione
      res.clearCookie('sb_access_token');
      res.clearCookie('sb_refresh_token');
      
      return res.status(401).json({ message: 'Sessione scaduta, effettua nuovamente il login' });
    }
    
    // Aggiorna i cookie con i nuovi token
    res.cookie('sb_access_token', refreshData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: refreshData.session.expires_in * 1000
    });
    
    res.cookie('sb_refresh_token', refreshData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 24 * 60 * 60 * 1000 // 60 giorni in millisecondi
    });
    
    // Recupera i dettagli dell'utente con il nuovo token
    const { data: userDetailsAfterRefresh, error: detailsErrorAfterRefresh } = await supabase
      .from('user_details')
      .select('*')
      .eq('uuid_auth', refreshData.user.id)
      .single();
    
    if (detailsErrorAfterRefresh || !userDetailsAfterRefresh) {
      debug('[authenticateUser] Dettagli utente non trovati dopo refresh');
      return res.status(404).json({ message: 'Dettagli utente non trovati' });
    }
    
    // Salva l'utente nella richiesta
    req.user = {
      userId: refreshData.user.id,
      userRole: userDetailsAfterRefresh.user_details_type,
      userDetails: userDetailsAfterRefresh
    };
    
    debug('[authenticateUser] Utente autenticato dopo refresh: ' + refreshData.user.id);
    next();
  } catch (error) {
    debug('[authenticateUser] Errore di autenticazione: ' + error.message);
    return res.status(401).json({ message: 'Errore di autenticazione' });
  }
};

// Middleware per verificare se l'utente è admin
export const isAdmin = (req, res, next) => {
  debug('[isAdmin] Verifica dei privilegi admin');
  
  if (req.user.userRole !== 1) {
    debug('[isAdmin] Accesso negato: utente non è admin');
    return res.status(403).json({ message: 'Accesso negato: privilegi insufficienti' });
  }
    
  debug('[isAdmin] Utente verificato come admin');
  next();
};

// Middleware per verificare se l'utente è un Personal Trainer
export const isPT = (req, res, next) => {
  debug('[isPT] Verifica dei privilegi PT');
  
  if (req.user.userRole !== 2) {
    debug('[isPT] Accesso negato: utente non è PT');
    return res.status(403).json({ message: 'Accesso negato: privilegi insufficienti' });
  }
  
  debug('[isPT] Utente verificato come PT');
  next();
};

// Middleware per verificare se l'utente è PT o admin
export const isPTorAdmin = (req, res, next) => {
  debug('[isPTorAdmin] Verifica dei privilegi PT o admin');
  
  if (req.user.userRole !== 1 && req.user.userRole !== 2) {
    debug('[isPTorAdmin] Accesso negato: utente non è né PT né admin');
    return res.status(403).json({ message: 'Accesso negato: privilegi insufficienti' });
  }
  
  debug('[isPTorAdmin] Utente verificato come PT o admin');
  next();
};