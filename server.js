const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const dbPath = path.join('/mnt/data', 'db.json');
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '[]', 'utf-8');
}

// Static files 
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Root to index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Return JSON data
app.get('/api/data', (req, res) => {
    fs.readFile(dbPath, 'utf-8', (err, jsonData) => {
      if (err) {
        console.error('Failed to read db.json:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      const allReservations = JSON.parse(jsonData);
      const censored = allReservations.map(reserve => ({
        date: reserve.date,
        time: reserve.time
      }));
      res.json(censored);
    });
  });

app.post('/api/reservation', (req, res) => {
  const reservation = req.body;

  // Read current data
  fs.readFile(dbPath, 'utf-8', (err, data) => {
    let reservations = [];

    if (!err && data) {
      try {
        reservations = JSON.parse(data);
      } catch (parseErr) {
        console.error('Failed to parse JSON:', parseErr);
        return res.status(500).json({ error: 'Database is corrupted' });
      }
    }

    // Add new reservation
    reservations.push(reservation);

    // Write to db.json
    fs.writeFile(dbPath, JSON.stringify(reservations, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Failed to write reservation:', writeErr);
        return res.status(500).json({ error: 'Failed to save reservation' });
      }

      res.status(200).json({ message: 'Reservation saved successfully' });
    });
  });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
