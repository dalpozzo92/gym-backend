import express from 'express';
import { authenticateUser, isAdmin, isPT, isPTorAdmin } from '../middlewares/auth.js';
import { debug } from '../utils.js';
import sql from '../db.js';

const router = express.Router();

// Endpoint per ottenere i programmi di un cliente specifico
router.post('/getWorkoutList', authenticateUser, async (req, res) => {
  try {
    debug('[getWorkoutList] Recupero dei programmi utente');
    
    // Ottieni l'ID dell'utente loggato
    const userId = req.user.userId;
    
    // Ottieni i programmi assegnati a questo utente
    const program = await sql`
      SELECT program.* 
      FROM program 
      LEFT JOIN user_details ON program.id_user_details = user_details.id_user_details
      WHERE user_details.uuid_auth = ${userId}
      ORDER BY program.created_at DESC
    `;
    
    debug('[getWorkoutList] Programmi dell\'utente recuperati con successo');
    res.json({ program });
  } catch (error) {
    debug('[getWorkoutList] Errore nel recupero dei programmi:', error);
    res.status(500).json({ message: 'Errore nel recupero dei programmi' });
  }
});

// Endpoint per ottenere i programmi di un personal trainer (quelli che ha creato)
router.post('/user-programs', authenticateUser, async (req, res) => {
  try {
    debug('[getUserPrograms] Recupero della lista allenamenti');
    
    // Ottieni il ruolo dell'utente
    const userType = req.user.userRole;
    const userId = req.user.userId;
    
    // Ottieni l'id_user_details dal corpo della richiesta (se fornito)
    const { id_user_details } = req.body;
    debug(id_user_details, userType);
    
    // Determina quale ID usare per la query
    const queryId = id_user_details || userId;
    
    // Se è un PT, ottieni i programmi creati da questo PT
    if (userType === 2) {
      const program = await sql`
        SELECT p.*, u.name as client_name 
        FROM program p
        LEFT JOIN user_details u ON p.assigned_to = u.id
        WHERE p.id_user_details = ${queryId}
        ORDER BY p.created_at DESC
      `;
      
      debug('[getUserPrograms] Lista allenamenti del PT recuperata');
      return res.json({ program });
    } 
    // Se è un admin, ottieni i programmi in base all'ID richiesto
    else if (userType === 1 && id_user_details) {
      const program = await sql`
        SELECT program.*, user_details.name AS client_name
        FROM program
        LEFT JOIN user_details ON program.id_user_details = user_details.id_user_details
        WHERE program.id_user_details = ${id_user_details}
        ORDER BY program.created_at DESC;
      `;
      
      debug('[getUserPrograms] Lista allenamenti specifica recuperata dall\'admin');
      return res.json({ program });
    }
    // Se è un normale cliente, ottieni solo i programmi assegnati a lui
    else if (userType === 3) {
      const program = await sql`
        SELECT p.*, u.name as trainer_name 
        FROM program p
        LEFT JOIN user_details u ON p.id_user_details = u.id
        WHERE p.assigned_to = ${userId}
        ORDER BY p.created_at DESC
      `;
      
      debug('[getUserPrograms] Lista allenamenti del cliente recuperata');
      return res.json({ program });
    }
    
    // Se arriviamo qui, c'è un caso non gestito
    debug('[getUserPrograms] Richiesta non valida');
    return res.status(400).json({ message: 'Richiesta non valida' });
    
  } catch (error) {
    debug('[getUserPrograms] Errore nel recupero dei programmi:', error);
    res.status(500).json({ message: 'Errore nel recupero dei programmi' });
  }
});

// Ottieni tutti i programmi (solo admin)
router.get('/all', authenticateUser, isAdmin, async (req, res) => {
  try {
    debug('[getAllPrograms] Recupero di tutti i programmi');
    
    // Ottieni tutti i programmi dal database
    const programs = await sql`SELECT * FROM program ORDER BY created_at DESC`;
    
    debug('[getAllPrograms] Programmi recuperati con successo');
    res.json({ programs });
  } catch (error) {
    debug('[getAllPrograms] Errore nel recupero dei programmi:', error);
    res.status(500).json({ message: 'Errore nel recupero dei programmi' });
  }
});

export default router;