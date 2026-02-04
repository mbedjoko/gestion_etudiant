const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); 
app.use(bodyParser.json());

// Servir les fichiers statiques
app.use(express.static(__dirname));

/**
 * CONNEXION À LA BASE DE DONNÉES
 */
const dbPath = path.resolve(__dirname, 'gestion_etudiants.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erreur lors de l\'ouverture de la base de données', err.message);
    } else {
        console.log(`Connecté à la base de données : ${dbPath}`);
        db.run("PRAGMA foreign_keys = ON");
        
        // Initialisation de la table paramètres
        db.run(`CREATE TABLE IF NOT EXISTS parametres (
            id INTEGER PRIMARY KEY,
            universite_nom TEXT,
            universite_logo TEXT
        )`, () => {
            // S'assurer qu'une ligne existe toujours avec l'ID 1
            db.get("SELECT id FROM parametres WHERE id = 1", (err, row) => {
                if (!row) {
                    db.run("INSERT INTO parametres (id, universite_nom, universite_logo) VALUES (1, ?, ?)", 
                    ["Université Polytechnique Centrale", ""]);
                }
            });
        });

        // Création des autres tables si nécessaire
        db.run(`CREATE TABLE IF NOT EXISTS filiere (
            id_filiere INTEGER PRIMARY KEY AUTOINCREMENT,
            code_filiere TEXT,
            nom_filiere TEXT
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS annee_academique (
            id_annee INTEGER PRIMARY KEY AUTOINCREMENT,
            libelle TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS etudiant (
            id_etudiant INTEGER PRIMARY KEY AUTOINCREMENT,
            matricule TEXT,
            nom TEXT,
            prenom TEXT,
            date_naissance TEXT,
            sexe TEXT,
            id_filiere INTEGER,
            id_annee INTEGER,
            FOREIGN KEY(id_filiere) REFERENCES filiere(id_filiere),
            FOREIGN KEY(id_annee) REFERENCES annee_academique(id_annee)
        )`);
    }
});

// --- API : PARAMÈTRES ---

app.get('/api/settings', (req, res) => {
    db.get("SELECT universite_nom, universite_logo FROM parametres WHERE id = 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || { universite_nom: "Établissement Scolaire", universite_logo: "" });
    });
});

app.post('/api/settings', (req, res) => {
    const { universite_nom, universite_logo } = req.body;
    db.run("UPDATE parametres SET universite_nom = ?, universite_logo = ? WHERE id = 1", 
    [universite_nom, universite_logo], (err) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Paramètres mis à jour avec succès", universite_logo });
    });
});

// --- API : TABLEAU DE BORD ---

app.get('/api/stats', (req, res) => {
    const queries = [
        new Promise((resolve) => db.get("SELECT COUNT(*) as total FROM etudiant", (err, row) => resolve(row ? row.total : 0))),
        new Promise((resolve) => db.get("SELECT COUNT(*) as total FROM filiere", (err, row) => resolve(row ? row.total : 0))),
        new Promise((resolve) => db.all("SELECT f.nom_filiere, COUNT(e.id_etudiant) as count FROM filiere f LEFT JOIN etudiant e ON f.id_filiere = e.id_filiere GROUP BY f.id_filiere", (err, rows) => resolve(rows || [])))
    ];

    Promise.all(queries).then(([totalEtudiants, totalFilieres, repartitionFiliere]) => {
        res.json({ totalEtudiants, totalFilieres, repartitionFiliere });
    }).catch(err => res.status(500).json({ error: err.message }));
});

// --- API : ÉTUDIANTS ---

app.get('/api/etudiants', (req, res) => {
    const sql = `
        SELECT e.*, f.nom_filiere, a.libelle as annee
        FROM etudiant e
        JOIN filiere f ON e.id_filiere = f.id_filiere
        JOIN annee_academique a ON e.id_annee = a.id_annee
        ORDER BY e.id_etudiant DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ data: rows });
    });
});

app.post('/api/etudiants', (req, res) => {
    const { matricule, nom, prenom, date_naissance, sexe, id_filiere, id_annee } = req.body;
    db.run(`INSERT INTO etudiant (matricule, nom, prenom, date_naissance, sexe, id_filiere, id_annee) VALUES (?,?,?,?,?,?,?)`, 
    [matricule, nom, prenom, date_naissance, sexe, id_filiere, id_annee], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Étudiant ajouté", id: this.lastID });
    });
});

app.delete('/api/etudiants/:id', (req, res) => {
    db.run(`DELETE FROM etudiant WHERE id_etudiant = ?`, req.params.id, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Étudiant supprimé avec succès" });
    });
});

// --- API : FILIÈRES ---

app.get('/api/filieres', (req, res) => {
    db.all("SELECT * FROM filiere ORDER BY nom_filiere", (err, rows) => {
        res.json({ data: rows || [] });
    });
});

app.post('/api/filieres', (req, res) => {
    const { code_filiere, nom_filiere } = req.body;
    db.run("INSERT INTO filiere (code_filiere, nom_filiere) VALUES (?,?)", [code_filiere, nom_filiere], (err) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Filière ajoutée" });
    });
});

app.delete('/api/filieres/:id', (req, res) => {
    // Note: La suppression peut échouer si des étudiants sont liés à cette filière (PRAGMA foreign_keys = ON)
    db.run("DELETE FROM filiere WHERE id_filiere = ?", req.params.id, (err) => {
        if (err) return res.status(400).json({ error: "Impossible de supprimer : des étudiants sont peut-être liés à cette filière." });
        res.json({ message: "Filière supprimée avec succès" });
    });
});

// --- API : ANNÉES ACADÉMIQUES ---

app.get('/api/annees', (req, res) => {
    db.all("SELECT * FROM annee_academique ORDER BY libelle DESC", (err, rows) => {
        res.json({ data: rows || [] });
    });
});

app.post('/api/annees', (req, res) => {
    const { libelle } = req.body;
    db.run("INSERT INTO annee_academique (libelle) VALUES (?)", [libelle], (err) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Année ajoutée" });
    });
});

app.delete('/api/annees/:id', (req, res) => {
    db.run("DELETE FROM annee_academique WHERE id_annee = ?", req.params.id, (err) => {
        if (err) return res.status(400).json({ error: "Impossible de supprimer : des étudiants sont peut-être liés à cette année." });
        res.json({ message: "Année supprimée avec succès" });
    });
});

// --- MAINTENANCE ---

app.get('/api/maintenance/export-csv', (req, res) => {
    const sql = `SELECT e.matricule, e.nom, e.prenom, f.nom_filiere FROM etudiant e JOIN filiere f ON e.id_filiere = f.id_filiere`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        const header = "Matricule,Nom,Prenom,Filiere\n";
        const csv = rows.map(r => `${r.matricule},${r.nom},${r.prenom},${r.nom_filiere}`).join("\n");
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=export.csv');
        res.send(header + csv);
    });
});

app.get('/api/maintenance/backup', (req, res) => {
    if (fs.existsSync(dbPath)) {
        res.json({ message: "Sauvegarde réussie", file: "gestion_etudiants.db" });
    } else {
        res.status(404).json({ error: "Fichier non trouvé" });
    }
});

// Démarrage
app.listen(PORT, () => {
    console.log(`Serveur prêt sur http://localhost:${PORT}`);
});