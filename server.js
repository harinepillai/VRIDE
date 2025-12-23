// Load Express and path modules
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files (HTML, CSS, JS) from the 'dist' folder (created by npm run build)
app.use(express.static(path.join(__dirname, 'dist')));

// When someone goes to "/", send index.html from dist
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
