const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const dbPath = path.resolve(__dirname, 'database', 'family.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error(" Feil ved tilkobling til DB:", err.message);
    else console.log("Database koblet til:", dbPath);
});

// --- API for metadata ---
app.get('/api/meta', (req, res) => {
    db.all("SELECT id, navn FROM brukere", (e1, users) => {
        db.all("SELECT id, tittel FROM oppgaver", (e2, tasks) => {
            if (e1 || e2) return res.status(500).json({ error: "Feil ved spørring mot DB" });
            res.json({ users: users || [], tasks: tasks || [] });
        });
    });
});

// --- API for oppgaver ---
app.get('/api/tasks', (req, res) => {
    const sql = `
        SELECT t.id, b.navn as userName, o.tittel as taskTitle, 
               k.navn as categoryName, o.poeng as points, t.status
        FROM tildelinger t
        JOIN brukere b ON t.bruker_id = b.id
        JOIN oppgaver o ON t.oppgave_id = o.id
        LEFT JOIN kategorier k ON o.kategori_id = k.id
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- Legg til ny oppgave ---
app.post('/api/tasks', (req, res) => {
    const { bruker_id, oppgave_id } = req.body;
    db.run(
        "INSERT INTO tildelinger (bruker_id, oppgave_id) VALUES (?, ?)",
        [bruker_id, oppgave_id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID });
        }
    );
});

// --- Slett oppgave ---
app.delete('/api/tasks/:id', (req, res) => {
    db.run("DELETE FROM tildelinger WHERE id = ?", req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.sendStatus(204);
    });
});

// --- Oppdater status ---
app.patch('/api/tasks/:id/status', (req, res) => {
    const { status } = req.body;
    const id = req.params.id;
    db.run(
        "UPDATE tildelinger SET status = ? WHERE id = ?",
        [status, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

// --- API for ranking ---
app.get('/api/ranking', (req, res) => {
    const sql = `
        SELECT b.navn as userName, 
               SUM(CASE WHEN t.status = 'done' THEN o.poeng ELSE 0 END) as totalPoints
        FROM brukere b
        LEFT JOIN tildelinger t ON b.id = t.bruker_id
        LEFT JOIN oppgaver o ON t.oppgave_id = o.id
        GROUP BY b.id
        ORDER BY totalPoints DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(3000, () => console.log(' Server startet: http://localhost:3000'));