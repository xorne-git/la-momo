const express = require("express");
const { getDb } = require("../db.cjs");

const router = express.Router();

// GET /api/content/:key — lire un contenu
router.get("/:key", (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare("SELECT * FROM contents WHERE key = ?").get(req.params.key);
    if (!row) {
      return res.status(404).json({ error: "Clé introuvable" });
    }
    res.json({ key: row.key, value: row.value, updatedAt: row.updated_at });
  } catch (err) {
    console.error("Content GET error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/content/:key — sauvegarder un contenu
router.put("/:key", (req, res) => {
  const { value } = req.body;
  if (value === undefined || value === null) {
    return res.status(400).json({ error: "Le champ 'value' est requis" });
  }

  try {
    const db = getDb();
    db.prepare(
      "INSERT INTO contents (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')"
    ).run(req.params.key, value);

    const row = db.prepare("SELECT * FROM contents WHERE key = ?").get(req.params.key);
    res.json({ key: row.key, value: row.value, updatedAt: row.updated_at });
  } catch (err) {
    console.error("Content PUT error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
