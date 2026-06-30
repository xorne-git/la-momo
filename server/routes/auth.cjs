const express = require("express");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../db.cjs");

const router = express.Router();

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }

  try {
    const db = getDb();
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (!user) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    // Simple token: UUID stocké en session (pas de JWT pour l'instant)
    const token = uuidv4();

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        artistId: user.artist_id,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/auth/users — list all users (no passwords)
router.get("/users", (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare("SELECT id, email, name, role, artist_id FROM users ORDER BY name").all();
    res.json(users);
  } catch (err) {
    console.error("Users list error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/auth/users/:id — update user
router.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, role, artist_id, password } = req.body;

  try {
    const db = getDb();
    const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    if (!existing) return res.status(404).json({ error: "Utilisateur introuvable" });

    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push("name = ?"); params.push(name); }
    if (email !== undefined) { updates.push("email = ?"); params.push(email); }
    if (role !== undefined) { updates.push("role = ?"); params.push(role); }
    if (artist_id !== undefined) { updates.push("artist_id = ?"); params.push(artist_id === "" ? null : artist_id); }
    if (password) { updates.push("password = ?"); params.push(bcrypt.hashSync(password, 10)); }

    if (updates.length === 0) return res.status(400).json({ error: "Aucun champ à mettre à jour" });

    params.push(id);
    db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);

    const updated = db.prepare("SELECT id, email, name, role, artist_id FROM users WHERE id = ?").get(id);
    res.json(updated);
  } catch (err) {
    console.error("User update error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
