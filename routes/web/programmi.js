import express from 'express';
import { authenticateUser, isAdmin } from '../../middlewares/auth.js';
import { debug } from '../../utils.js';
import sql from '../../db.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);


// Endpoint per ottenere tutti i programmi (solo admin)
router.get('/getAllPrograms', authenticateUser, isAdmin, async (req, res) => {
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