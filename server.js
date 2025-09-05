// import dotenv from 'dotenv';
// dotenv.config({
//   path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
// });
// import { authenticateUser, isAdmin } from './middlewares/auth.js';



// import express from 'express';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';
// import { createClient } from '@supabase/supabase-js';
// import jwt from 'jsonwebtoken';
// import sql from './db.js';
// import { debug } from './utils.js';

// const app = express();
// const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173' || 'http://localhost:5174';

// app.use(cors({
//   origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174' ],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
// }));

// app.use(express.json());
// app.use(cookieParser());

// // Impostazione di Supabase
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// import adminRoutes from './routes/web/admin.js';
// app.use('/admin', adminRoutes);


// import programmiRoutes from './routes/web/programmi.js';
// app.use('/programmi', programmiRoutes);

// // Funzione per creare un access token
// const generateAccessToken = (userId, userRole) => {
//   return jwt.sign({ userId, userRole }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });
// };

// // Funzione per creare un refresh token
// const generateRefreshToken = (userId, userRole) => {
//   return jwt.sign({ userId, userRole }, process.env.JWT_REFRESH_SECRET_KEY, { expiresIn: '30d' });
// };

// // // Funzione per autenticare l'utente usando JWT
// // const authenticateUser = (req, res, next) => {
// //   const token = req.cookies.token; // Estrai il token dai cookies
// //   if (!token) {
// //     debug('[authenticateUser] Token non trovato');
// //     return res.status(401).json({ message: 'Non autorizzato' });
// //   }

// //   jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
// //     if (err) {
// //       debug('[authenticateUser] Token non valido');
// //       return res.status(401).json({ message: 'Token non valido' });
// //     }
// //     req.user = decoded;  // Decodifica e salva l'utente
// //     debug('[authenticateUser] Utente autenticato');
// //     next();
// //   });
// // };

// // Endpoint di verifica token
// app.get('/verify-token', authenticateUser, (req, res) => {
//   debug('[verify-token] Verifica utente avvio app!');

//   res.json({ isValid: true }); // Se il token è valido
// });

// // Middleware per verificare se l'utente è admin
// // const isAdmin = async (req, res, next) => {
// //   debug('[isAdmin] Verifica dei privilegi admin');
// //   try {
// //     // Ottieni i dettagli dell'utente dal database
// //     const userDetails = await sql`SELECT * FROM user_details WHERE uuid_auth = ${req.user.userId}`;
    
// //     if (!userDetails.length) {
// //       debug('[isAdmin] Utente non trovato');
// //       return res.status(404).json({ message: 'Utente non trovato' });
// //     }
    
// //     // Verifica se l'utente è admin (id_user_type = 1)
// //     if (userDetails[0].user_details_type !== 1) {
// //       debug('[isAdmin] Accesso negato: utente non è admin');
// //       return res.status(403).json({ message: 'Accesso negato: privilegi insufficienti' });
// //     }
    
// //     debug('[isAdmin] Utente verificato come admin');
// //     next(); // Procedi solo se l'utente è admin
// //   } catch (error) {
// //     debug(`[isAdmin] Errore nella verifica admin: ${error.message}`);
// //     return res.status(500).json({ message: 'Errore del server nella verifica dei privilegi' });
// //   }
// // };

// // Endpoint per verificare se l'utente è admin
// app.get('/verify-admin', authenticateUser, async (req, res) => {
//   debug('[verify-admin] Verifica status admin');
//   try {
//     // Ottieni i dettagli dell'utente dal database
//     debug('[verify-admin] Verifica status admin');
//     const isAdmin = req.user.userRole === 1;
//     debug(`[verify-admin] Utente ${isAdmin ? 'è' : 'non è'} admin`);
//     res.json({ isAdmin });
//   } catch (error) {
//     debug(`[verify-admin] Errore nella verifica admin: ${error.message}`);
//     return res.status(500).json({ message: 'Errore del server nella verifica dei privilegi' });
//   }
// });

// // VERIFICA RUOLO
// app.get('/verify-role', authenticateUser, (req, res) => {
//   debug('[verify-role] Verifica ruolo utente');
//   res.json({ 
//     isAuthenticated: true,
//     userRole: req.user.userRole 
//   });
// });

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

//     // Recupera i dettagli dell'utente incluso il ruolo
//     const userDetails = await sql`SELECT * FROM user_details WHERE uuid_auth = ${data.user.id}`;
  
//     if (!userDetails.length) {
//       debug('[login] Dettagli utente non trovati');
//       return res.status(404).json({ message: 'Dettagli utente non trovati' });
//     }
    
//     // Ottieni il ruolo dell'utente
//     const userRole = userDetails[0].user_details_type;

//   // Crea un access token e un refresh token
//   const accessToken = generateAccessToken(data.user.id, userRole);
//   const refreshToken = generateRefreshToken(data.user.id, userRole);

//   // Imposta il refresh token nei cookie (HttpOnly)
//   res.cookie('refreshToken', refreshToken, {
//     httpOnly: true, // Impedisce l'accesso tramite JavaScript
//     secure: process.env.NODE_ENV === 'production', // Imposta a true se in produzione (HTTPS)
//     sameSite: 'None', // Permette il cross-origin
//     maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 giorni
//   });

//   // Imposta l'access token nel cookie (HttpOnly)
//   res.cookie('token', accessToken, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'None',
//     maxAge: 24 * 60 * 60 * 1000, // 1 giorno
//   });

//   debug('[login] Login effettuato con successo per l\'utente: ' + data.user.id);
//   res.json({ message: 'Login effettuato con successo', user: data.user });
  
// });

// // RINFRESCA IL TOKEN
// app.post('/refreshToken', (req, res) => {
//   const refreshToken = req.cookies.refreshToken;
//   if (!refreshToken) {
//     return res.status(401).json({ message: 'Refresh token non trovato' });
//   }

//   jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY, (err, decoded) => {
//     if (err) {
//       return res.status(403).json({ message: 'Refresh token non valido' });
//     }

//     // Crea un nuovo access token
//     const accessToken = generateAccessToken(decoded.userId, decoded.userRole);

//     // Imposta il nuovo access token
//     res.cookie('token', accessToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'None',
//       maxAge: 24 * 60 * 60 * 1000, // 1 giorno
//     });

//     res.json({ message: 'Access token rinnovato con successo' });
//   });
// });

// // LOGOUT
// app.post('/logout', (req, res) => {
//   debug('[logout] Inizio processo di logout');
  
//   // Rimuovi i cookie di autenticazione
//   res.clearCookie('token');
//   res.clearCookie('refreshToken');
//   debug('[logout] Logout effettuato con successo');
//   res.json({ message: 'Logout effettuato con successo' });
// });

// // OTTIENI UTENTE
// app.get('/getUser', authenticateUser, async (req, res) => {
//   debug('[getUser] Recupero dei dettagli utente');
//   const user_details = await sql`SELECT * FROM user_details WHERE uuid_auth = ${req.user.userId}`;
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

// // Endpoint per ottenere i programmi di un personal trainer (quelli che ha creato)
// app.post('/getUserPrograms', authenticateUser, async (req, res) => {
//   try {
//     debug('[getWorkoutList] Recupero della lista allenamenti');
//     debug('req', req);
//     // Ottieni l'ID dell'utente loggato e il suo tipo
//     // const id_user_details = req.body.id || req.body.id_user_details;
//     const userType = req.body.user_details_type || req.body.userType;
   
//     // Ottieni l'id_user_details dal corpo della richiesta (se fornito)
//     const { id_user_details } = req.body;
//      debug(id_user_details, userType);
//     // Determina quale ID usare per la query
//     const queryId = id_user_details || userId;
    
//     // Se è un PT, ottieni i programmi creati da questo PT
//     if (userType === 2) {
//       const program = await sql`
//         SELECT p.*, u.name as client_name 
//         FROM program p
//         LEFT JOIN user_details u ON p.assigned_to = u.id
//         WHERE p.id_user_details = ${queryId}
//         ORDER BY p.created_at DESC
//       `;
      
//       debug('[getUserPrograms] Lista allenamenti del PT recuperata');
//       return res.json({ program });
//     } 
//     // Se è un admin, ottieni i programmi in base all'ID richiesto
//     else if (userType === 1 && id_user_details) {
//       const program = await sql`
//         SELECT program.*, user_details.name AS client_name
//         FROM program
//         LEFT JOIN user_details ON program.id_user_details = user_details.id_user_details
//         WHERE program.id_user_details = ${id_user_details}
//         ORDER BY program.created_at DESC;
//       `;
      
//       debug('[getUserPrograms] Lista allenamenti specifica recuperata dall\'admin');
//       return res.json({ program });
//     }
//     // Se è un normale cliente, ottieni solo i programmi assegnati a lui
//     else if (userType === 3) {
//       const program = await sql`
//         SELECT p.*, u.name as trainer_name 
//         FROM program p
//         LEFT JOIN user_details u ON p.id_user_details = u.id
//         WHERE p.assigned_to = ${userId}
//         ORDER BY p.created_at DESC
//       `;
      
//       debug('[getUserPrograms] Lista allenamenti del cliente recuperata');
//       return res.json({ program });
//     }
    
//     // Se arriviamo qui, c'è un caso non gestito
//     debug('[getUserPrograms] Richiesta non valida');
//     return res.status(400).json({ message: 'Richiesta non valida' });
    
//   } catch (error) {
//     debug('[getUserPrograms] Errore nel recupero dei programmi:', error);
//     res.status(500).json({ message: 'Errore nel recupero dei programmi' });
//   }
// });

// // Endpoint per ottenere i programmi di un cliente specifico
// app.get('/getWorkoutList', authenticateUser, async (req, res) => {
//   try {
//     debug('[getUserPrograms] Recupero dei programmi utente');
    
//     // Ottieni l'ID dell'utente loggato
//     const userId = req.user.id || req.user.user_id;
    
//     // Ottieni i programmi assegnati a questo utente
//     const program = await sql`
//       SELECT p.*, u.name as trainer_name 
//       FROM program p
//       LEFT JOIN user_details u ON p.id_user_details = u.id
//       WHERE p.assigned_to = ${userId}
//       ORDER BY p.created_at DESC
//     `;
    
//     debug('[getWorkoutList] Programmi dell\'utente recuperati con successo');
//     res.json({ program });
//   } catch (error) {
//     debug('[getWorkoutList] Errore nel recupero dei programmi:', error);
//     res.status(500).json({ message: 'Errore nel recupero dei programmi' });
//   }
// });

// //RITORNA LISTA UTENTI
// app.get('/getAllUsers', authenticateUser, isAdmin, async (req, res) => {
//   debug('[getAllUsers] Recupero di tutti gli utenti');
//   try {
//     const users = await sql`SELECT * FROM user_details`; 
//     if (!users.length) {
//       debug('[getAllUsers] Nessun utente trovato');
//       return res.status(404).json({ message: 'Nessun utente trovato' });
//     }
//     debug(`[getAllUsers] ${users.length} utenti recuperati con successo`);
//     res.json({ users });
//   } catch (error) {
//     debug('[getAllUsers] Errore nel recupero degli utenti:', error);
//     res.status(500).json({ message: 'Errore nel recupero degli utenti' });
//   }
// });


// // Avvio del server
// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//   debug(`[server] Server in ascolto sulla porta ${port}`);
// });

// // import dotenv from 'dotenv';
// // dotenv.config({
// //   path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
// // });

// // import express from 'express';
// // import cors from 'cors';
// // import cookieParser from 'cookie-parser';
// // import session from 'express-session';
// // import { createClient } from '@supabase/supabase-js';
// // import jwt from 'jsonwebtoken';
// // import sql from './db.js';
// // import { debug } from './utils.js';

// // const app = express();
// // const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// // app.use(cors({
// //   origin: ['https://gym-app-bst.netlify.app', 'http://localhost:5173'],
// //   credentials: true,  // Permette di inviare cookie e header di autenticazione
// //   methods: ['GET', 'POST', 'PUT', 'DELETE'],
// // }));

// // app.use(express.json());
// // app.use(cookieParser());

// // app.use(session({
// //   secret: process.env.SESSION_SECRET,
// //   resave: false,
// //   saveUninitialized: false,  // Evita sessioni non necessarie
// //   cookie: {
// //     secure: true,  // Deve essere sempre true su HTTPS
// //     httpOnly: true, // Evita accesso da JavaScript (sicurezza)
// //     sameSite: 'None',  // Essenziale per funzionare in cross-origin
// //   },
// // }));

// // //per session 1 mese
// // // app.use(session({
// // //   secret: process.env.SESSION_SECRET,
// // //   resave: false,
// // //   saveUninitialized: true,
// // //   cookie: {
// // //     secure: process.env.NODE_ENV === 'production', // assicura che il cookie sia sicuro in produzione
// // //     httpOnly: true, // per evitare l'accesso tramite JavaScript
// // //     sameSite: 'lax', // per proteggere contro attacchi CSRF
// // //     maxAge: 30 * 24 * 60 * 60 * 1000, // 30 giorni in millisecondi
// // //   },
// // // }));

// // const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// // const authenticateUser = async (req, res, next) => {
// //   debug('[authenticateUser] Verificando se l\'utente è autenticato');
// //   if (!req.session.userId) {
// //     debug('[authenticateUser] Utente non autenticato');
// //     return res.status(401).json({ message: 'Non autorizzato' });
// //   }
// //   req.user = { id: req.session.userId };
// //   debug('[authenticateUser] Utente autenticato');
// //   next();
// // };

// // // REGISTRAZIONE
// // app.post('/register', async (req, res) => {
// //   debug('[register] Inizio processo di registrazione');
// //   const { email, password, name } = req.body;

// //   const { data: existingUsers, error: checkError } = await supabase
// //     .from('user_details')
// //     .select('email')
// //     .eq('email', email);

// //   if (existingUsers.length > 0) {
// //     debug('[register] Email già registrata');
// //     return res.status(400).json({ error: 'Email già registrata' });
// //   }

// //   const { data, error } = await supabase.auth.signUp({ email, password });
// //   if (error) {
// //     debug(`[register] Errore durante la registrazione: ${error.message}`);
// //     return res.status(400).json({ error: error.message });
// //   }

// //   await supabase.from('user_details').insert([{ uuid_auth: data.user.id, name, email }]);
// //   debug('[register] Utente registrato con successo!');
// //   res.json({ message: 'Utente registrato con successo!' });
// // });

// // // LOGIN
// // app.post('/login', async (req, res) => {
// //   debug('[login] Inizio processo di login');
// //   const { email, password } = req.body;
// //   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
// //   if (error || !data.user) {
// //     debug('[login] Credenziali non valide');
// //     return res.status(401).json({ message: 'Credenziali non valide' });
// //   }

// //   req.session.userId = data.user.id;
// //   // Aggiungi debug per tracciare il salvataggio dell'ID utente nella sessione
// //   debug('[login] Salvataggio dell\'userId nella sessione: ' + req.session.userId);  // Traccia il salvataggio nella sessione
// //   debug('[login] Login effettuato con successo per l\'utente: ' + data.user.id);
// //   debug('[login] Dati utente: ', data.user); // Mostra i dati dell'utente per il debug
  
// //   res.json({ message: 'Login effettuato con successo', user: data.user });
// // });

// // // LOGOUT
// // app.post('/logout', async (req, res) => {
// //   debug('[logout] Inizio processo di logout');
// //    //Logout da Supabase
// //     const { error } = await supabase.auth.signOut();
// //     if (error) {
// //       console.error('Supabase logout error:', error.message);
// //       return res.status(500).json({ message: 'Error logging out from Supabase' });
// //     }
// //   req.session.destroy((err) => {
// //     if (err) {
// //       debug('[logout] Errore durante il logout');
// //       return res.status(500).json({ message: 'Errore durante il logout' });
// //     }
// //     debug('[logout] Logout effettuato con successo');
// //     res.json({ message: 'Logout effettuato con successo' });
// //   });
// // });

// // // OTTIENI UTENTE
// // app.get('/getUser', authenticateUser, async (req, res) => {
// //   debug('[getUser] Recupero dei dettagli utente');
// //   const user_details = await sql`SELECT * FROM user_details WHERE uuid_auth = ${req.user.id}`;
// //   if (!user_details.length) {
// //     debug('[getUser] Utente non trovato');
// //     return res.status(404).json({ message: 'Utente non trovato' });
// //   }
// //   debug('[getUser] Dettagli utente recuperati con successo');
// //   res.json({ user_details: user_details[0] });
// // });

// // // OTTIENI LISTA ALLENAMENTI
// // app.post('/getWorkoutList', authenticateUser, async (req, res) => {
// //   debug('[getWorkoutList] Recupero della lista allenamenti');
// //   const { id_user_details } = req.body;
// //   if (!id_user_details) {
// //     debug('[getWorkoutList] id_user_details mancante');
// //     return res.status(400).json({ message: 'id_user_details mancante' });
// //   }
// //   const program = await sql`SELECT * FROM program WHERE id_user_details = ${id_user_details}`;
// //   debug('[getWorkoutList] Lista allenamenti recuperata');
// //   res.json({ program });
// // });

// // const port = process.env.PORT || 3000;
// // app.listen(port, () => {
// //   debug(`[server] Server in ascolto sulla porta ${port}`);
// // });


import dotenv from 'dotenv';
dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { debug } from './utils.js';

// Importa i router
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import workoutsRoutes from './routes/workouts.js';
//import adminRoutes from './routes/admin.js'; // Presupponendo che esista

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Configurazione middleware
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(express.json());
app.use(cookieParser());

// Monta i router sotto il prefisso /api
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/workouts', workoutsRoutes);
//app.use('/api/admin', adminRoutes);

// Gestione degli errori 404
app.use((req, res) => {
  debug(`[404] Risorsa non trovata: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Risorsa non trovata' });
});

// Gestione degli errori generici
app.use((err, req, res, next) => {
  debug(`[ERROR] ${err.message}`);
  res.status(err.status || 500).json({ message: err.message || 'Errore interno del server' });
});

// Avvio del server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  debug(`[server] Server in ascolto sulla porta ${port}`);
});