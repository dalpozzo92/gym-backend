import dotenv from 'dotenv';
dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import sql from './db.js';
import { debug } from './utils.js';

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(express.json());
app.use(cookieParser());

// Impostazione di Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Funzione per creare un access token
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });
};

// Funzione per creare un refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET_KEY, { expiresIn: '30d' });
};

// Funzione per autenticare l'utente usando JWT
const authenticateUser = (req, res, next) => {
  const token = req.cookies.token; // Estrai il token dai cookies
  if (!token) {
    debug('[authenticateUser] Token non trovato');
    return res.status(401).json({ message: 'Non autorizzato' });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      debug('[authenticateUser] Token non valido');
      return res.status(401).json({ message: 'Token non valido' });
    }
    req.user = decoded;  // Decodifica e salva l'utente
    debug('[authenticateUser] Utente autenticato');
    next();
  });
};

// REGISTRAZIONE
app.post('/register', async (req, res) => {
  debug('[register] Inizio processo di registrazione');
  const { email, password, name } = req.body;

  const { data: existingUsers, error: checkError } = await supabase
    .from('user_details')
    .select('email')
    .eq('email', email);

  if (existingUsers.length > 0) {
    debug('[register] Email già registrata');
    return res.status(400).json({ error: 'Email già registrata' });
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    debug(`[register] Errore durante la registrazione: ${error.message}`);
    return res.status(400).json({ error: error.message });
  }

  await supabase.from('user_details').insert([{ uuid_auth: data.user.id, name, email }]);
  debug('[register] Utente registrato con successo!');
  res.json({ message: 'Utente registrato con successo!' });
});

// LOGIN
app.post('/login', async (req, res) => {
  debug('[login] Inizio processo di login');
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    debug('[login] Credenziali non valide');
    return res.status(401).json({ message: 'Credenziali non valide' });
  }

  // Crea un access token e un refresh token
  const accessToken = generateAccessToken(data.user.id);
  const refreshToken = generateRefreshToken(data.user.id);

  // Imposta il refresh token nei cookie (HttpOnly)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, // Impedisce l'accesso tramite JavaScript
    secure: process.env.NODE_ENV === 'production', // Imposta a true se in produzione (HTTPS)
    sameSite: 'None', // Permette il cross-origin
    maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 giorni
  });

  // Imposta l'access token nel cookie (HttpOnly)
  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None',
    maxAge: 24 * 60 * 60 * 1000, // 1 giorno
  });

  debug('[login] Login effettuato con successo per l\'utente: ' + data.user.id);
  res.json({ message: 'Login effettuato con successo', user: data.user });
});

// RINFRESCA IL TOKEN
app.post('/refreshToken', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token non trovato' });
  }

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Refresh token non valido' });
    }

    // Crea un nuovo access token
    const accessToken = generateAccessToken(decoded.userId);

    // Imposta il nuovo access token
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      maxAge: 24 * 60 * 60 * 1000, // 1 giorno
    });

    res.json({ message: 'Access token rinnovato con successo' });
  });
});

// LOGOUT
app.post('/logout', (req, res) => {
  debug('[logout] Inizio processo di logout');
  
  // Rimuovi i cookie di autenticazione
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  debug('[logout] Logout effettuato con successo');
  res.json({ message: 'Logout effettuato con successo' });
});

// OTTIENI UTENTE
app.get('/getUser', authenticateUser, async (req, res) => {
  debug('[getUser] Recupero dei dettagli utente');
  const user_details = await sql`SELECT * FROM user_details WHERE uuid_auth = ${req.user.userId}`;
  if (!user_details.length) {
    debug('[getUser] Utente non trovato');
    return res.status(404).json({ message: 'Utente non trovato' });
  }
  debug('[getUser] Dettagli utente recuperati con successo');
  res.json({ user_details: user_details[0] });
});

// OTTIENI LISTA ALLENAMENTI
app.post('/getWorkoutList', authenticateUser, async (req, res) => {
  debug('[getWorkoutList] Recupero della lista allenamenti');
  const { id_user_details } = req.body;
  if (!id_user_details) {
    debug('[getWorkoutList] id_user_details mancante');
    return res.status(400).json({ message: 'id_user_details mancante' });
  }
  const program = await sql`SELECT * FROM program WHERE id_user_details = ${id_user_details}`;
  debug('[getWorkoutList] Lista allenamenti recuperata');
  res.json({ program });
});

// Avvio del server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  debug(`[server] Server in ascolto sulla porta ${port}`);
});

// import dotenv from 'dotenv';
// dotenv.config({
//   path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
// });

// import express from 'express';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';
// import session from 'express-session';
// import { createClient } from '@supabase/supabase-js';
// import jwt from 'jsonwebtoken';
// import sql from './db.js';
// import { debug } from './utils.js';

// const app = express();
// const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// app.use(cors({
//   origin: ['https://gym-app-bst.netlify.app', 'http://localhost:5173'],
//   credentials: true,  // Permette di inviare cookie e header di autenticazione
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
// }));

// app.use(express.json());
// app.use(cookieParser());

// app.use(session({
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: false,  // Evita sessioni non necessarie
//   cookie: {
//     secure: true,  // Deve essere sempre true su HTTPS
//     httpOnly: true, // Evita accesso da JavaScript (sicurezza)
//     sameSite: 'None',  // Essenziale per funzionare in cross-origin
//   },
// }));

// //per session 1 mese
// // app.use(session({
// //   secret: process.env.SESSION_SECRET,
// //   resave: false,
// //   saveUninitialized: true,
// //   cookie: {
// //     secure: process.env.NODE_ENV === 'production', // assicura che il cookie sia sicuro in produzione
// //     httpOnly: true, // per evitare l'accesso tramite JavaScript
// //     sameSite: 'lax', // per proteggere contro attacchi CSRF
// //     maxAge: 30 * 24 * 60 * 60 * 1000, // 30 giorni in millisecondi
// //   },
// // }));

// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// const authenticateUser = async (req, res, next) => {
//   debug('[authenticateUser] Verificando se l\'utente è autenticato');
//   if (!req.session.userId) {
//     debug('[authenticateUser] Utente non autenticato');
//     return res.status(401).json({ message: 'Non autorizzato' });
//   }
//   req.user = { id: req.session.userId };
//   debug('[authenticateUser] Utente autenticato');
//   next();
// };

// // REGISTRAZIONE
// app.post('/register', async (req, res) => {
//   debug('[register] Inizio processo di registrazione');
//   const { email, password, name } = req.body;

//   const { data: existingUsers, error: checkError } = await supabase
//     .from('user_details')
//     .select('email')
//     .eq('email', email);

//   if (existingUsers.length > 0) {
//     debug('[register] Email già registrata');
//     return res.status(400).json({ error: 'Email già registrata' });
//   }

//   const { data, error } = await supabase.auth.signUp({ email, password });
//   if (error) {
//     debug(`[register] Errore durante la registrazione: ${error.message}`);
//     return res.status(400).json({ error: error.message });
//   }

//   await supabase.from('user_details').insert([{ uuid_auth: data.user.id, name, email }]);
//   debug('[register] Utente registrato con successo!');
//   res.json({ message: 'Utente registrato con successo!' });
// });

// // LOGIN
// app.post('/login', async (req, res) => {
//   debug('[login] Inizio processo di login');
//   const { email, password } = req.body;
//   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
//   if (error || !data.user) {
//     debug('[login] Credenziali non valide');
//     return res.status(401).json({ message: 'Credenziali non valide' });
//   }

//   req.session.userId = data.user.id;
//   // Aggiungi debug per tracciare il salvataggio dell'ID utente nella sessione
//   debug('[login] Salvataggio dell\'userId nella sessione: ' + req.session.userId);  // Traccia il salvataggio nella sessione
//   debug('[login] Login effettuato con successo per l\'utente: ' + data.user.id);
//   debug('[login] Dati utente: ', data.user); // Mostra i dati dell'utente per il debug
  
//   res.json({ message: 'Login effettuato con successo', user: data.user });
// });

// // LOGOUT
// app.post('/logout', async (req, res) => {
//   debug('[logout] Inizio processo di logout');
//    //Logout da Supabase
//     const { error } = await supabase.auth.signOut();
//     if (error) {
//       console.error('Supabase logout error:', error.message);
//       return res.status(500).json({ message: 'Error logging out from Supabase' });
//     }
//   req.session.destroy((err) => {
//     if (err) {
//       debug('[logout] Errore durante il logout');
//       return res.status(500).json({ message: 'Errore durante il logout' });
//     }
//     debug('[logout] Logout effettuato con successo');
//     res.json({ message: 'Logout effettuato con successo' });
//   });
// });

// // OTTIENI UTENTE
// app.get('/getUser', authenticateUser, async (req, res) => {
//   debug('[getUser] Recupero dei dettagli utente');
//   const user_details = await sql`SELECT * FROM user_details WHERE uuid_auth = ${req.user.id}`;
//   if (!user_details.length) {
//     debug('[getUser] Utente non trovato');
//     return res.status(404).json({ message: 'Utente non trovato' });
//   }
//   debug('[getUser] Dettagli utente recuperati con successo');
//   res.json({ user_details: user_details[0] });
// });

// // OTTIENI LISTA ALLENAMENTI
// app.post('/getWorkoutList', authenticateUser, async (req, res) => {
//   debug('[getWorkoutList] Recupero della lista allenamenti');
//   const { id_user_details } = req.body;
//   if (!id_user_details) {
//     debug('[getWorkoutList] id_user_details mancante');
//     return res.status(400).json({ message: 'id_user_details mancante' });
//   }
//   const program = await sql`SELECT * FROM program WHERE id_user_details = ${id_user_details}`;
//   debug('[getWorkoutList] Lista allenamenti recuperata');
//   res.json({ program });
// });

// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//   debug(`[server] Server in ascolto sulla porta ${port}`);
// });
