import express from 'express';
import { authenticateUser, isAdmin } from '../../middlewares/auth.js';
import { debug } from '../../utils.js';
import sql from '../../db.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Endpoint per richiedere accesso come PT
router.post('/richiesta-pt', async (req, res) => {
  debug('[admin/richiesta-pt] Nuova richiesta PT');
  const { nome, cognome, email, telefono, messaggio } = req.body;
  
  try {
    // Controlla se esiste già una richiesta con questa email
    const existingRequest = await sql`
      SELECT * FROM pt_requests WHERE email = ${email} AND status = 'pending'
    `;
    
    if (existingRequest.length > 0) {
      debug('[admin/richiesta-pt] Richiesta già esistente per questa email');
      return res.status(400).json({ 
        message: 'Esiste già una richiesta in sospeso per questa email' 
      });
    }
    
    // Inserisci la richiesta nel database
    await sql`
      INSERT INTO pt_requests (nome, cognome, email, telefono, messaggio, status)
      VALUES (${nome}, ${cognome}, ${email}, ${telefono}, ${messaggio}, 'pending')
    `;
    
    debug('[admin/richiesta-pt] Richiesta PT salvata con successo');
    res.json({ success: true });
  } catch (error) {
    debug(`[admin/richiesta-pt] Errore: ${error.message}`);
    res.status(500).json({ message: 'Errore nel salvataggio della richiesta' });
  }
});

// Endpoint per ottenere tutte le richieste PT (solo admin)
router.get('/richieste-pt', authenticateUser, isAdmin, async (req, res) => {
  debug('[admin/richieste-pt] Recupero richieste PT');
  
  try {
    const richieste = await sql`
      SELECT * FROM pt_requests 
      ORDER BY created_at DESC
    `;
    
    debug(`[admin/richieste-pt] Recuperate ${richieste.length} richieste`);
    res.json({ richieste });
  } catch (error) {
    debug(`[admin/richieste-pt] Errore: ${error.message}`);
    res.status(500).json({ message: 'Errore nel recupero delle richieste' });
  }
});

// Endpoint per approvare/rifiutare una richiesta PT
router.post('/gestisci-richiesta-pt', authenticateUser, isAdmin, async (req, res) => {
  debug('[admin/gestisci-richiesta-pt] Gestione richiesta PT');
  const { id, status, note } = req.body;
  
  try {
    await sql`
      UPDATE pt_requests 
      SET status = ${status}, note = ${note}, updated_at = NOW() 
      WHERE id = ${id}
    `;
    
    // Se approvata, crea account PT
    if (status === 'approved') {
      const richiesta = await sql`SELECT * FROM pt_requests WHERE id = ${id}`;
      
      if (richiesta.length > 0) {
        // Genera password temporanea
        const tempPassword = Math.random().toString(36).slice(-8);
        
        // Crea account in Supabase
        const { data, error } = await supabase.auth.admin.createUser({
          email: richiesta[0].email,
          password: tempPassword,
          email_confirm: true
        });
        
        if (error) throw new Error(error.message);
        
        // Crea record user_details con tipo PT (2)
        await sql`
          INSERT INTO user_details (uuid_auth, name, email, user_details_type)
          VALUES (${data.user.id}, ${richiesta[0].nome + ' ' + richiesta[0].cognome}, ${richiesta[0].email}, 2)
        `;
        
        // TODO: Invia email con credenziali
      }
    }
    
    debug(`[gestisci-richiesta-pt] Richiesta ${id} aggiornata a ${status}`);
    res.json({ success: true });
  } catch (error) {
    debug(`[admin/gestisci-richiesta-pt] Errore: ${error.message}`);
    res.status(500).json({ message: 'Errore nell\'aggiornamento della richiesta' });
  }
});

// Endpoint per verificare se l'utente è admin
router.get('/verify-admin', authenticateUser, async (req, res) => {
  debug('[admin/verify-admin] Verifica status admin');
  try {
    const userDetails = await sql`SELECT * FROM user_details WHERE uuid_auth = ${req.user.userId}`;
    
    if (!userDetails.length) {
      debug('[admin/verify-admin] Utente non trovato');
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    
    const isAdmin = userDetails[0].user_details_type === 1;
    debug(`[admin/verify-admin] Utente ${isAdmin ? 'è' : 'non è'} admin`);
    
    res.json({ isAdmin });
  } catch (error) {
    debug(`[admin/verify-admin] Errore: ${error.message}`);
    res.status(500).json({ message: 'Errore nella verifica admin' });
  }
});

// Endpoint per ottenere tutti gli utenti (solo admin)
router.get('/users', authenticateUser, isAdmin, async (req, res) => {
  debug('[admin/users] Recupero di tutti gli utenti');
  try {
    const users = await sql`SELECT * FROM user_details`;
    
    debug(`[admin/users] ${users.length} utenti recuperati`);
    res.json({ users });
  } catch (error) {
    debug(`[admin/users] Errore: ${error.message}`);
    res.status(500).json({ message: 'Errore nel recupero degli utenti' });
  }
});

// Endpoint per ottenere tutti i programmi (solo admin)
router.get('/getAllPrograms', authenticateUser, async (req, res) => {
  try {
    debug('[getAllPrograms] Recupero di tutti i programmi');
    
    // Verifica che l'utente sia un amministratore
    const userType = req.user.user_details_type || req.user.user_type;
    debug('[getAllPrograms] req: ', req);
    if (userType !== 1) {
      debug('[getAllPrograms] Accesso negato - L\'utente non è un amministratore');
      return res.status(403).json({ message: 'Accesso non autorizzato. Solo gli amministratori possono visualizzare tutti i programmi.' });
    }
    
    // Ottieni tutti i programmi dal database
    const program = await sql`SELECT * FROM program ORDER BY created_at DESC`;
    
    debug('[getAllPrograms] Programmi recuperati con successo');
    res.json({ program });
  } catch (error) {
    debug('[getAllPrograms] Errore nel recupero dei programmi:', error);
    res.status(500).json({ message: 'Errore nel recupero dei programmi' });
  }
});

export default router;