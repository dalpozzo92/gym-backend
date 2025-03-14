// import dotenv from 'dotenv';
// dotenv.config();
// import express from 'express';
// import cors from 'cors';
// import { createClient } from '@supabase/supabase-js';
// import jwt from 'jsonwebtoken';
// import sql from './db.js';

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Funzione per decodificare il token JWT
// const decodeToken = (token) => {
//   try {
//     return jwt.verify(token, process.env.JWT_SECRET_KEY);  // Assicurati che la chiave segreta sia configurata
//   } catch (error) {
//     return null;
//   }
// };

// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);


// // Route per registrare un utente
// app.post('/register', async (req, res) => {
//     const { email, password, name } = req.body;

//     console.log('Richiesta di registrazione ricevuta:', { email, name });

//     const { data: existingUsers, error: checkError } = await supabase
//     .from('user_details')
//     .select('email')
//     .eq('email', email);

//     if (checkError) {
//         console.error('Errore nel controllo email:', checkError.message);
//         return res.status(500).json({ error: 'Errore durante la verifica della email' });
//     }

//     // Se l'email esiste già, restituisci un errore
//     if (existingUsers.length > 0) {
//         return res.status(400).json({ error: 'Questa email è già registrata!' });
//     }
//     // 1. Creare l'utente in Supabase Auth
//     const { data, error } = await supabase.auth.signUp({ email, password });

//     if (error) return res.status(400).json({ error: error.message });

//     console.log('Utente registrato con successo in Supabase Auth:', data);

//     const userId = data.user.id;

//     // 2. Inserire i dettagli dell'utente in userDetails
//     const { data: user_details, error: userDetailsError } = await supabase
//         .from('user_details')
//         .insert([{ uuid_auth: userId, name: name, email: email},]);

//     if (userDetailsError){
//         console.log('Errore user details:', userDetailsError.message);
//         return res.status(400).json({ error: userDetailsError.message });
//     } 

//     return res.status(200).json({ message: 'Utente registrato con successo!'});
// });



// //login utente
// // app.post('/login', async (req, res) => {
// //     const { email, password } = req.body;
  
// //     try {
// //       const { data, error } = await supabase.auth.signInWithPassword({ email, password });
// //       console.log('Risultato autenticazione:', data, error);

// //       if (error) {
// //         return res.status(401).json({ message: error.message });
// //       }
  
// //       res.json({
// //         token: data.session.access_token, // Token JWT da usare per autenticarsi
// //         user: data.user,
// //       });
// //     } catch (err) {
// //       res.status(500).json({ message: 'Errore del server' });
// //     }
// //   });
// // Login endpoint
// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   // Autenticazione dell'utente con Supabase (o altra logica)
//   const { data, error } = await supabase.auth.signInWithPassword({ email, password });

//   if (error || !data.user) {
//     console.error('❌ Errore di autenticazione:', error?.message);
//     return res.status(401).json({ message: error?.message || 'Credenziali non valide' });
//   }

//   console.log('✅ Utente autenticato:', data.user);
//   // Genera Access Token (scade in 1 ora)
//   const accessToken = jwt.sign({ sub: data.user.id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

//   // Genera Refresh Token (scade in 30 giorni)
//   const refreshToken = jwt.sign({ sub: data.user.id }, process.env.JWT_SECRET_KEY, { expiresIn: '30d' });

//   console.log('🛡️ Access Token:', accessToken);
//   console.log('🔄 Refresh Token:', refreshToken);

//   try {
//     await sql`
//       INSERT INTO refresh_tokens (uuid, token)
//       VALUES (${data.user.id}, ${refreshToken})
//     `;
//     console.log('✅ Refresh token salvato nel database');

//   } catch (dbError) {
//     console.error('❌ Errore nel salvataggio del refresh token:', dbError);

//     return res.status(500).json({ message: 'Errore nel salvataggio del refresh token' });
//   }
//   return res.json({ accessToken, refreshToken, user: data.user });
// });

// // Endpoint per ottenere un nuovo Access Token tramite il Refresh Token
// app.post('/refresh', async (req, res) => {
//   const { refreshToken } = req.body;

//   if (!refreshToken) {
//     return res.status(400).json({ message: 'Refresh token mancante' });
//   }

//   try {
//     const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);

//     // Controlla se il refresh token è nel database
//     const { rows: validTokens } = await sql`
//       SELECT * FROM refresh_tokens WHERE user_id = ${decoded.sub} AND token = ${refreshToken}
//     `;

//     if (validTokens.length === 0) {
//       return res.status(401).json({ message: 'Refresh token non valido' });
//     }

//     const newAccessToken = jwt.sign({ sub: decoded.sub }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
//     const newRefreshToken = jwt.sign({ sub: decoded.sub }, process.env.JWT_SECRET_KEY, { expiresIn: '30d' });

//     // Aggiorna il refresh token nel database
//     await sql`
//       UPDATE refresh_tokens
//       SET token = ${newRefreshToken}
//       WHERE user_id = ${decoded.sub}
//     `;

//     return res.json({ newAccessToken, newRefreshToken });
//   } catch (error) {
//     return res.status(401).json({ message: 'Refresh token non valido' });
//   }
// });




// // Rotta per il logout
// // app.post('/logout', async (req, res) => {
// //     try {
// //       // Estrai il token di autorizzazione dal header
// //       const token = req.headers.authorization?.split(' ')[1]; // Authorization: Bearer <token>
  
// //       if (!token) {
// //         return res.status(400).json({ message: 'Token mancante' });
// //       }
  
// //       // Chiama il metodo supabase.auth.signOut()
// //       const { error } = await supabase.auth.signOut(token);
  
// //       if (error) {
// //         return res.status(500).json({ message: 'Errore nel logout', error: error.message });
// //       }
  
// //       res.status(200).json({ message: 'Logout effettuato con successo' });
// //     } catch (error) {
// //       res.status(500).json({ message: 'Errore durante il logout', error: error.message });
// //     }
// //   });
// app.post('/logout', async (req, res) => {
//   const token = req.headers.authorization?.split(' ')[1];

//   if (!token) {
//       return res.status(400).json({ message: 'Token mancante' });
//   }

//   try {
//       // Verifica il token e rimuovi il refresh token dal database (se necessario)
//       const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

//       await sql`
//       DELETE FROM refresh_tokens WHERE token = ${refreshToken}
//     `;
//       return res.status(200).json({ message: 'Logout effettuato con successo' });
//   } catch (error) {
//       return res.status(500).json({ message: 'Errore durante il logout', error: error.message });
//   }
// });



//   // //ritorna dati lista allenamenti
//   // app.post('/getWorkoutList', async (req, res) => {
//   //   try {
//   //     // Estrai l'id_user_details dal corpo della richiesta
//   //     const { id_user_details } = req.body;  // Assicurati che id_user_details venga inviato dal frontend
  
//   //     if (!id_user_details) {
//   //       return res.status(400).json({ message: 'id_user_details non fornito' });
//   //     }
//   //   console.log("ID user details ", id_user_details);
//   //     // Recupero degli allenamenti per id_user_details
//   //     const { data: program, error: workoutError } = await supabase
//   //       .from('program') // Tabella degli allenamenti
//   //       .select('*')
//   //       .eq('id_user_details', id_user_details);  // Filtra per id_user_details
  
//   //     if (workoutError) {
//   //       throw workoutError;
//   //     }
//   //     console.log("workouts BE ", program);
  
//   //     // Risposta con gli allenamenti
//   //     res.json({ program });
//   //   } catch (error) {
//   //     console.error('Errore nel recupero allenamenti:', error);
//   //     res.status(500).json({ error: error.message });
//   //   }
//   // });
  
//   //ritorna dati user
// // app.get('/getUser', async (req, res) => {
// //     try {
// //         const token = req.headers.authorization?.split(' ')[1];  // Estrai il token dal header Authorization

// //         const { data: user, errorAuth } = await supabase.auth.getUser(token);
// //         if (errorAuth || !user) {
// //             return res.status(401).json({ message: "Utente non autenticato" });
// //         }

// //         // recuperare ulteriori dati da `user_details`
// //         const { data: user_details, error: dbError } = await supabase
// //         .from('user_details')
// //         .select('*')
// //         .eq('uuid_auth', user.user.id)
// //         .single();

// //     if (dbError) throw dbError;

// //     res.json({user_details }); // user: user.user, 
// //     } catch (error) {
// //         res.status(500).json({ error: error.message });
// //     }
// // });

// // Recupero dati utente
// // Recupero dati utente usando SQL
// app.get('/getUser', async (req, res) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1]; // Estrai il token dal header Authorization

//     if (!token) {
//       return res.status(400).json({ message: 'Token mancante' });
//     }

//     // Verifica il token
//     const decoded = decodeToken(token);

//     if (!decoded) {
//       return res.status(401).json({ message: 'Token non valido o scaduto' });
//     }

//     // Recupera i dettagli dell'utente dal database SQL
//     const { rows: user_details, error } = await sql`
//       SELECT * FROM user_details WHERE uuid_auth = ${decoded.sub}
//     `;

//     if (error) {
//       return res.status(500).json({ message: 'Errore nel recupero dei dati utente', error: error.message });
//     }

//     if (!user_details || user_details.length === 0) {
//       return res.status(404).json({ message: 'Utente non trovato' });
//     }

//     res.json({ user_details: user_details[0] });
//   } catch (error) {
//     res.status(500).json({ message: 'Errore durante il recupero dei dati', error: error.message });
//   }
// });




// // Recupero allenamenti
// app.post('/getWorkoutList', async (req, res) => {
//   const { id_user_details } = req.body;

//   if (!id_user_details) {
//     return res.status(400).json({ message: 'id_user_details non fornito' });
//   }

//   try {
//     const { rows: program } = await sql`
//       SELECT * FROM program WHERE id_user_details = ${id_user_details}
//     `;
//     res.json({ program });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });



// // Porta dinamica per Koyeb
// const port = process.env.PORT || 3000;

// app.listen(port, () => console.log(`Server in ascolto sulla porta ${port}`));


// import dotenv from 'dotenv';
// dotenv.config();
// import express from 'express';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';
// import { createClient } from '@supabase/supabase-js';
// import jwt from 'jsonwebtoken';
// import sql from './db.js';
// import { debug } from './utils.js';


// const app = express();
// const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// app.use(cors({
//   origin: CLIENT_URL,
//   credentials: true,
// }));
// app.use(express.json());
// app.use(cookieParser());

// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// // Funzione per decodificare il token JWT
// const decodeToken = (token) => {
//   try {
//     return jwt.verify(token, process.env.JWT_SECRET_KEY);
//   } catch (error) {
//     return null;
//   }
// };

// const verifyToken = (req, res, next) => {
//   const token = req.cookies.access_token || req.headers['authorization']?.split(' ')[1]; // Token nei cookie o nell'header

//   if (!token) {
//     debug('[verifyToken] Token mancante o non valido');

//     return res.status(401).json({ message: 'Token mancante o non valido' });
//   }

//   jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
//     if (err) {
//       debug('[verifyToken] Token non valido o scaduto');

//       return res.status(401).json({ message: 'Token non valido o scaduto' });
//     }

//     req.user = decoded; // Aggiungi l'utente alla richiesta
//     next(); // Continua con la rotta
//   });
// };

// // ===========================
// // REGISTER ROUTE
// // ===========================
// app.post('/register', async (req, res) => {
//   const { email, password, name } = req.body;
//   console.log('Register attempt:', { email, name });

//   const { data: existingUsers, error: checkError } = await supabase
//     .from('user_details')
//     .select('email')
//     .eq('email', email);

//   if (checkError) {
//     console.error('Email check error:', checkError.message);
//     return res.status(500).json({ error: 'Error checking email' });
//   }

//   if (existingUsers.length > 0) {
//     return res.status(400).json({ error: 'Email already registered' });
//   }

//   // Creare l'utente in Supabase Auth
//   const { data, error } = await supabase.auth.signUp({ email, password });
//   if (error) return res.status(400).json({ error: error.message });
//   debug('User registered in Supabase Auth:', data);

//   const userId = data.user.id;
//   // Inserire i dettagli dell'utente in user_details
//   const { data: user_details, error: userDetailsError } = await supabase
//     .from('user_details')
//     .insert([{ uuid_auth: userId, name, email }]);
//   if (userDetailsError) {
//     console.error('Error saving user details:', userDetailsError.message);
//     return res.status(400).json({ error: userDetailsError.message });
//   }

//   return res.status(200).json({ message: 'User registered successfully!' });
// });

// // ===========================
// // LOGIN ROUTE – con settaggio dei cookie
// // ===========================
// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   // Autenticazione con Supabase
//   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
//   if (error || !data.user) {
//     console.error('Authentication error:', error?.message);
//     return res.status(401).json({ message: error?.message || 'Invalid credentials' });
//   }
//   debug('User authenticated:', data.user);

//   // Genera i token
//   const accessToken = jwt.sign({ sub: data.user.id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
//   const refreshToken = jwt.sign({ sub: data.user.id }, process.env.JWT_SECRET_KEY, { expiresIn: '2h' });

//   debug('Access Token:', accessToken);
//   debug('Refresh Token:', refreshToken);
//   const decodedAccessToken = jwt.decode(accessToken);
//   debug('Token access scade alle:', new Date(decodedAccessToken.exp * 1000).toISOString());


//   try {
//     // Salva il refresh token nel database
//     const existingTokens = await sql`
//     SELECT * FROM refresh_tokens WHERE uuid = ${data.user.id}
//   `;
  
//   if (existingTokens.length > 0) {
//     // Aggiorna il token esistente
//     await sql`
//       UPDATE refresh_tokens
//       SET token = ${refreshToken}, created_at = now()
//       WHERE uuid = ${data.user.id}
//     `;
//     debug('✅ Refresh token aggiornato nel database');
//   } else {
//     // Inserisci un nuovo refresh token
//     await sql`
//       INSERT INTO refresh_tokens (uuid, token)
//       VALUES (${data.user.id}, ${refreshToken})
//     `;
//     debug('✅ Refresh token salvato nel database');
//   }
//   } catch (dbError) {
//     console.error('Error saving refresh token:', dbError);
//     return res.status(500).json({ message: 'Error saving refresh token' });
//   }


//   // Invia i token come cookie HttpOnly
//   res.cookie('access_token', accessToken, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'None',
//     maxAge: 3600000, // 1 hour
//   });
//   res.cookie('refresh_token', refreshToken, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'None',
//     maxAge: 30 * 24 * 3600000, // 30 days
//   });

//   debug('[login] login effettuato');

//   return res.json({ message: 'Login successful', user: data.user });
// });

// // ===========================
// // REFRESH TOKEN ROUTE – utilizza il refresh token dal cookie
// // ===========================
// app.post('/refresh', async (req, res) => {
//   const refreshToken = req.cookies.refresh_token;
//   if (!refreshToken) {
//     return res.status(400).json({ message: 'Refresh token missing' });
//   }
//   try {
//     const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);

//     // Verifica che il refresh token esista nel database
//     const validTokens = await sql`
//       SELECT * FROM refresh_tokens WHERE uuid = ${decoded.sub} AND token = ${refreshToken}
//     `;
//     if (validTokens.length === 0) {
//       return res.status(401).json({ message: 'Invalid refresh token' });
//     }

//     // Genera nuovi token
//     const newAccessToken = jwt.sign({ sub: decoded.sub }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
//     const newRefreshToken = jwt.sign({ sub: decoded.sub }, process.env.JWT_SECRET_KEY, { expiresIn: '2h' });

//     const decodedToken = JSON.parse(atob(newAccessToken.split('.')[1])); 
//     debug("nuovo token Scade alle:", new Date(decodedToken.exp * 1000));
    
//     // Aggiorna il refresh token nel database
//     await sql`
//       UPDATE refresh_tokens
//       SET token = ${newRefreshToken}
//       WHERE uuid = ${decoded.sub}
//     `;

//     // Imposta i nuovi cookie
//     res.cookie('access_token', newAccessToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'None',
//       maxAge: 3600000,
//     });
//     res.cookie('refresh_token', newRefreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'None',
//       maxAge: 30 * 24 * 3600000,
//     });

//     debug('✅ Refresh token rigenerato');

//     return res.json({ message: 'Token refreshed' });
    
//   } catch (error) {
//     console.error('Error refreshing token:', error);
//     return res.status(401).json({ message: 'Invalid refresh token' });
//   }
// });

// // ===========================
// // LOGOUT ROUTE – elimina i cookie
// // ===========================
// app.post('/logout', async (req, res) => {
//   try {
//     const refreshToken = req.cookies.refresh_token;
//     if (!refreshToken) {
//       return res.status(400).json({ message: 'No refresh token provided' });
//     }

//     // Logout da Supabase
//     const { error } = await supabase.auth.signOut();
//     if (error) {
//       console.error('Supabase logout error:', error.message);
//       return res.status(500).json({ message: 'Error logging out from Supabase' });
//     }

//     // Cancella il refresh token dal database
//     await sql`
//       DELETE FROM refresh_tokens WHERE token = ${refreshToken}
//     `;

//     // Rimuove i cookie dal client
//     res.clearCookie('access_token', { httpOnly: true, secure: true, sameSite: 'Strict' });
//     res.clearCookie('refresh_token', { httpOnly: true, secure: true, sameSite: 'Strict' });

//     debug('[logout] logout effettuato');

//     return res.json({ message: 'Logout effettuato' });
//   } catch (error) {
//     console.error('Logout error:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// });


// // ===========================
// // GET USER – recupera i dati dell’utente (usando access token dal cookie)
// // ===========================
// app.get('/getUser', verifyToken, async (req, res) => {

//   try {
//       const user_details = await sql`
//       SELECT * FROM user_details WHERE uuid_auth = ${req.user.sub}
//     `;
//     debug('user_details: ', user_details);

//     if (!user_details || user_details.length === 0) {
//       debug('[getUser] user non trovato');

//       return res.status(404).json({ message: 'User not found' });
//     }
//     return res.json({ user_details: user_details[0] });
//   } catch (error) {
//     debug('[getUser] errore getUser');

//     return res.status(500).json({ message: 'Error fetching user details', error: error.message });
//   }
// });

// // ===========================
// // GET WORKOUT LIST – restituisce la lista degli allenamenti
// // ===========================
// app.post('/getWorkoutList', verifyToken, async (req, res) => {
//   const { id_user_details } = req.body;
//   if (!id_user_details) {
//     return res.status(400).json({ message: 'id_user_details missing' });
//   }
//   try {
//     const program = await sql`
//       SELECT * FROM program WHERE id_user_details = ${id_user_details}
//     `;
//     debug('program: ', program);

//     return res.json({ program });
//   } catch (error) {
//     return res.status(500).json({ message: 'Error fetching workouts', error: error.message });
//   }
// });

// // ===========================
// // Avvio del server
// // ===========================
// const port = process.env.PORT || 3000;
// app.listen(port, () => console.log(`Server listening on port ${port}`));
import dotenv from 'dotenv';
dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import sql from './db.js';
import { debug } from './utils.js';

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: (origin, callback) => {
    // Aggiungi il dominio di produzione e localhost se in modalità sviluppo
    if (origin === 'https://gym-app-bst.netlify.app' || origin === 'http://localhost:5173') {
      callback(null, true);
    } else {
      callback(new Error('Non autorizzato'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'none' },
}));

//per session 1 mese
// app.use(session({
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: true,
//   cookie: {
//     secure: process.env.NODE_ENV === 'production', // assicura che il cookie sia sicuro in produzione
//     httpOnly: true, // per evitare l'accesso tramite JavaScript
//     sameSite: 'lax', // per proteggere contro attacchi CSRF
//     maxAge: 30 * 24 * 60 * 60 * 1000, // 30 giorni in millisecondi
//   },
// }));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const authenticateUser = async (req, res, next) => {
  debug('[authenticateUser] Verificando se l\'utente è autenticato');
  if (!req.session.userId) {
    debug('[authenticateUser] Utente non autenticato');
    return res.status(401).json({ message: 'Non autorizzato' });
  }
  req.user = { id: req.session.userId };
  debug('[authenticateUser] Utente autenticato');
  next();
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

  req.session.userId = data.user.id;
  // Aggiungi debug per tracciare il salvataggio dell'ID utente nella sessione
  debug('[login] Salvataggio dell\'userId nella sessione: ' + req.session.userId);  // Traccia il salvataggio nella sessione
  debug('[login] Login effettuato con successo per l\'utente: ' + data.user.id);
  debug('[login] Dati utente: ', data.user); // Mostra i dati dell'utente per il debug
  
  res.json({ message: 'Login effettuato con successo', user: data.user });
});

// LOGOUT
app.post('/logout', async (req, res) => {
  debug('[logout] Inizio processo di logout');
   //Logout da Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase logout error:', error.message);
      return res.status(500).json({ message: 'Error logging out from Supabase' });
    }
  req.session.destroy((err) => {
    if (err) {
      debug('[logout] Errore durante il logout');
      return res.status(500).json({ message: 'Errore durante il logout' });
    }
    debug('[logout] Logout effettuato con successo');
    res.json({ message: 'Logout effettuato con successo' });
  });
});

// OTTIENI UTENTE
app.get('/getUser', authenticateUser, async (req, res) => {
  debug('[getUser] Recupero dei dettagli utente');
  const user_details = await sql`SELECT * FROM user_details WHERE uuid_auth = ${req.user.id}`;
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  debug(`[server] Server in ascolto sulla porta ${port}`);
});
