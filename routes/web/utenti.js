import express from 'express';
import { authenticateUser, isAdmin, isPT, isPTorAdmin } from '../../middlewares/auth.js';
import { debug } from '../../utils.js';
import sql from '../../db.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// RITORNA LISTA UTENTI in base al ruolo
router.get('/getAllUsers', authenticateUser, isPTorAdmin, async (req, res) => {
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