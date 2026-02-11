const express = require('express');
const path = require('path');
const app = express();
const PORT = process.nano || 3000;

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html for SPA-like behavior (optional, but good practice)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Now using Supabase for Auth & DB.');
});
