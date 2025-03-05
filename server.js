require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Route per registrare un utente
app.post('/register', async (req, res) => {
    const { email, password, name } = req.body;

    console.log('Richiesta di registrazione ricevuta:', { email, name });

    const { data: existingUsers, error: checkError } = await supabase
    .from('user_details')
    .select('email')
    .eq('email', email);

    if (checkError) {
        console.error('Errore nel controllo email:', checkError.message);
        return res.status(500).json({ error: 'Errore durante la verifica della email' });
    }

    // Se l'email esiste già, restituisci un errore
    if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Questa email è già registrata!' });
    }
    // 1. Creare l'utente in Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return res.status(400).json({ error: error.message });

    console.log('Utente registrato con successo in Supabase Auth:', data);

    const userId = data.user.id;

    // 2. Inserire i dettagli dell'utente in userDetails
    const { data: user_details, error: userDetailsError } = await supabase
        .from('user_details')
        .insert([{ uuid_auth: userId, name: name, email: email},]);

    if (userDetailsError){
        console.log('Errore user details:', userDetailsError.message);
        return res.status(400).json({ error: userDetailsError.message });
    } 

    return res.status(200).json({ message: 'Utente registrato con successo!'});
});

app.get('/getUser', async (req, res) => {
    try {
        const { user } = await supabase.auth.getUser(); // Ottiene l'utente autenticato
        if (!user) {
            return res.status(401).json({ message: "Utente non autenticato" });
        }

        // Esempio: recuperare ulteriori dati da `user_details`
        const { data, error } = await supabase
            .from('user_details')
            .select('*')
            .eq('uuid_auth', user.id)
            .single();

        if (error) throw error;

        res.json({ user, userDetails: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Porta dinamica per Koyeb
const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Server in ascolto sulla porta ${port}`));