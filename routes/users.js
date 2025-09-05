import express from 'express';
import { authenticateUser, isAdmin, isPT, isPTorAdmin } from '../middlewares/auth.js';
import { debug } from '../utils.js';
import sql from '../db.js';

const router = express.Router();

// OTTIENI UTENTE CORRENTE
router.get('/me', authenticateUser, async (req, res) => {
  debug('[getUser] Recupero dei dettagli utente');
  const user_details = await sql`SELECT * FROM user_details WHERE uuid_auth = ${req.user.userId}`;
  if (!user_details.length) {
    debug('[getUser] Utente non trovato');
    return res.status(404).json({ message: 'Utente non trovato' });
  }
  debug('[getUser] Dettagli utente recuperati con successo');
  res.json({ user_details: user_details[0] });
});

// RITORNA LISTA UTENTI in base al ruolo
router.get('/all', authenticateUser, isPTorAdmin, async (req, res) => {
  debug('[getAllUsers] Recupero di tutti gli utenti');
  try {
    let users;
    
    if (req.user.userRole === 1) {
      // Admin: vede tutti gli utenti
      users = await sql`SELECT * FROM user_details`;
    } else if (req.user.userRole === 2) {
      // PT: vede solo i suoi clienti
      const ptDetails = await sql`SELECT id_user_details FROM user_details WHERE uuid_auth = ${req.user.userId}`;
      if (!ptDetails.length) {
        return res.status(404).json({ message: 'Dettagli PT non trovati' });
      }
      const ptId = ptDetails[0].id_user_details;
      users = await sql`SELECT * FROM user_details WHERE id_personal_trainer = ${ptId}`;
    }
    
    if (!users || !users.length) {
      debug('[getAllUsers] Nessun utente trovato');
      return res.status(404).json({ message: 'Nessun utente trovato' });
    }
    
    debug(`[getAllUsers] ${users.length} utenti recuperati con successo`);
    res.json({ users });
  } catch (error) {
    debug('[getAllUsers] Errore nel recupero degli utenti:', error);
    res.status(500).json({ message: 'Errore nel recupero degli utenti' });
  }
});

export default router;