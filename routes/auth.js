import express from 'express';
import { authenticateUser, verifyToken, refreshToken } from '../middlewares/auth.js';
import { debug } from '../utils.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// // GET USER INFO - Ottieni informazioni utente autenticato
// router.get('/me', authenticateUser, async (req, res) => {
//   debug('[me] Recupero informazioni utente');
//   res.json({ 
//     user: {
//       id: req.user.userId,
//       role: req.user.userRole,
//       ...req.user.userDetails
//     }
//   });
// });

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    debug('[login] Tentativo di login per: ' + email);
    
    // Autenticazione con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error || !data.user || !data.session) {
      debug('[login] Credenziali non valide: ' + error?.message + ' ' + email + ' ' + password);
      return res.status(401).json({ message: 'Credenziali non valide' });
    }
    
    // Recupera i dettagli dell'utente
    const { data: userDetails, error: detailsError } = await supabase
      .from('user_details')
      .select('*')
      .eq('uuid_auth', data.user.id)
      .single();
    
    if (detailsError || !userDetails) {
      debug('[login] Dettagli utente non trovati');
      return res.status(404).json({ message: 'Dettagli utente non trovati' });
    }
    
    // Imposta il cookie di sessione Supabase
       // Imposta l'access token come cookie
    res.cookie('sb_access_token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: data.session.expires_in * 1000 // Converte i secondi in millisecondi
    });

     // Imposta il refresh token come cookie separato
    res.cookie('sb_refresh_token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 24 * 60 * 60 * 1000 // 60 giorni in millisecondi
    });
    
    debug('[login] Login effettuato con successo per: ' + email);
    res.json({
      message: 'Login effettuato con successo',
      user: {
        id: data.user.id,
        email: data.user.email,
        ...userDetails
      }
    });
  } catch (error) {
    debug('[login] Errore di login: ' + error.message);
    res.status(500).json({ message: 'Errore durante il login' });
  }
});

// REGISTER - Gestito dal backend
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  try {
    debug('[register] Tentativo di registrazione per: ' + email);
    
    // Verifica se l'email esiste già
    const { data: existingUsers } = await supabase
      .from('user_details')
      .select('email')
      .eq('email', email);
    
    if (existingUsers && existingUsers.length > 0) {
      debug('[register] Email già registrata');
      return res.status(400).json({ message: 'Email già registrata' });
    }
    
    // Registrazione con Supabase
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Conferma automaticamente l'email
    });
    
    if (error) {
      debug('[register] Errore di registrazione: ' + error.message);
      return res.status(400).json({ message: error.message });
    }
    
    // Crea i dettagli dell'utente
    const { error: insertError } = await supabase
      .from('user_details')
      .insert([{
        uuid_auth: data.user.id,
        name,
        email,
        user_details_type: 3 // Cliente (default)
      }]);
    
    if (insertError) {
      debug('[register] Errore nell\'inserimento dei dettagli: ' + insertError.message);
      return res.status(500).json({ message: 'Errore nella creazione del profilo utente' });
    }
    
    debug('[register] Registrazione completata per: ' + email);
    res.json({ message: 'Registrazione completata con successo' });
  } catch (error) {
    debug('[register] Errore di registrazione: ' + error.message);
    res.status(500).json({ message: 'Errore durante la registrazione' });
  }
});

// LOGOUT - Gestito dal backend
router.post('/logout', async (req, res) => {
  debug('[logout] Logout utente');
  
  // Ottieni il token dalla sessione
  const accessToken = req.cookies.sb_access_token;
  
  if (accessToken) {
    try {
      // Invalida il token in Supabase
      await supabase.auth.admin.signOut(accessToken);
    } catch (error) {
      debug('[logout] Errore nel logout da Supabase: ' + error.message);
    }
  }
  
  
  // Cancella entrambi i cookie di sessione
  res.clearCookie('sb_access_token');
  res.clearCookie('sb_refresh_token');
  
  res.json({ message: 'Logout effettuato con successo' });
});

// REFRESH TOKEN - Endpoint che utilizza la funzione del middleware
router.post('/refresh-token', async (req, res) => {
  debug('[refresh-token] Refresh del token');
  
  // Ottieni il token dalla sessione
  const accessToken = req.cookies.sb_access_token;
  
  // Utilizza la funzione refreshToken dal middleware
  const result = await refreshToken(accessToken);
  
  if (!result.success) {
    debug(`[refresh-token] Errore: ${result.error}`);
    return res.status(401).json({ message: result.error });
  }
  
  // Imposta il nuovo cookie di sessione
  res.cookie('sb_access_token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: result.expiresIn * 1000
  });
  
  debug('[refresh-token] Token refreshato con successo');
  res.json({ message: 'Token refreshato con successo' });
});

// VERIFICA TOKEN - Endpoint che utilizza la funzione del middleware
router.get('/verify-token', async (req, res) => {
  debug('[verify-token] Verifica token');
  
  // Ottieni il token dalla sessione
  const token = req.cookies.sb_access_token;
  
  // Utilizza la funzione verifyToken dal middleware
  const result = await verifyToken(token);
  
  debug(`[verify-token] Token ${result.isValid ? 'valido' : 'non valido'}`);
  res.json({ isValid: result.isValid });
});

// OTTIENI PROFILO UTENTE - Gestito dal backend
router.get('/me', authenticateUser, (req, res) => {
  debug('[me] Recupero profilo utente');
  
  res.json({
    user: {
      id: req.user.userId,
      role: req.user.userRole,
      ...req.user.userDetails
    }
  });
});

// VERIFICA RUOLO
router.get('/verify-role', authenticateUser, (req, res) => {
  debug('[verify-role] Verifica ruolo utente');
  res.json({
    isAuthenticated: true,
    userRole: req.user.userRole
  });
});

// VERIFICA ADMIN
router.get('/verify-admin', authenticateUser, (req, res) => {
  debug('[verify-admin] Verifica status admin');
  res.json({ isAdmin: req.user.userRole === 1 });
});

export default router;