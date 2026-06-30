const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../db.cjs");

const router = express.Router();

const RESOURCES = [
  "hero", "lieu", "histoire", "clen", "map", "gallery",
  "actualites", "artpage", "slides", "blog", "tags",
  "media", "comptes", "groupes"
];

// ─── GROUPS ───

router.get("/groups", (req, res) => {
  try {
    const db = getDb();
    const groups = db.prepare("SELECT * FROM groups ORDER BY name").all();
    const perms = db.prepare("SELECT * FROM group_permissions").all();
    const members = db.prepare(`SELECT gu.group_id, u.id AS user_id, u.name AS user_name FROM user_groups gu JOIN users u ON u.id = gu.user_id`).all();

    const result = groups.map((g) => ({
      ...g,
      permissions: perms.filter((p) => p.group_id === g.id).map(({ group_id, ...rest }) => rest),
      memberCount: members.filter((m) => m.group_id === g.id).length,
    }));
    res.json(result);
  } catch (err) {
    console.error("Groups list error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/groups", (req, res) => {
  const { name, role } = req.body;
  if (!name || !role) return res.status(400).json({ error: "Nom et rôle requis" });
  try {
    const db = getDb();
    const id = uuidv4();
    db.prepare("INSERT INTO groups (id, name, role) VALUES (?, ?, ?)").run(id, name, role);
    // Auto-create empty permissions for all resources
    const insert = db.prepare("INSERT OR IGNORE INTO group_permissions (id, group_id, resource, can_create, can_modify, can_delete) VALUES (?, ?, ?, 0, 0, 0)");
    const tx = db.transaction(() => {
      for (const r of RESOURCES) insert.run(uuidv4(), id, r);
    });
    tx();
    res.json({ id, name, role, permissions: RESOURCES.map((r) => ({ id: "", resource: r, can_create: 0, can_modify: 0, can_delete: 0 })), memberCount: 0 });
  } catch (err) {
    console.error("Group create error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/groups/:id", (req, res) => {
  const { name } = req.body;
  try {
    const db = getDb();
    db.prepare("UPDATE groups SET name = ? WHERE id = ?").run(name, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Group update error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.delete("/groups/:id", (req, res) => {
  try {
    const db = getDb();
    db.prepare("DELETE FROM groups WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Group delete error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── GROUP PERMISSIONS ───

router.put("/groups/:id/permissions", (req, res) => {
  const { permissions } = req.body; // [{ resource, can_create, can_modify, can_delete }]
  try {
    const db = getDb();
    const update = db.prepare("UPDATE group_permissions SET can_create = ?, can_modify = ?, can_delete = ? WHERE group_id = ? AND resource = ?");
    const tx = db.transaction(() => {
      for (const p of permissions) {
        update.run(p.can_create ? 1 : 0, p.can_modify ? 1 : 0, p.can_delete ? 1 : 0, req.params.id, p.resource);
      }
    });
    tx();
    res.json({ success: true });
  } catch (err) {
    console.error("Group permissions update error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── USER-GROUP ASSIGNMENTS ───

router.get("/users/:userId/groups", (req, res) => {
  try {
    const db = getDb();
    const groups = db.prepare("SELECT g.* FROM groups g JOIN user_groups ug ON ug.group_id = g.id WHERE ug.user_id = ?").all(req.params.userId);
    res.json(groups);
  } catch (err) {
    console.error("User groups error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/users/:userId/groups", (req, res) => {
  const { groupId } = req.body;
  try {
    const db = getDb();
    db.prepare("INSERT OR IGNORE INTO user_groups (id, user_id, group_id) VALUES (?, ?, ?)").run(uuidv4(), req.params.userId, groupId);
    res.json({ success: true });
  } catch (err) {
    console.error("User group assign error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.delete("/users/:userId/groups/:groupId", (req, res) => {
  try {
    const db = getDb();
    db.prepare("DELETE FROM user_groups WHERE user_id = ? AND group_id = ?").run(req.params.userId, req.params.groupId);
    res.json({ success: true });
  } catch (err) {
    console.error("User group unassign error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── USER PERMISSIONS ───

router.get("/users/:userId/permissions", (req, res) => {
  try {
    const db = getDb();
    const perms = db.prepare("SELECT * FROM user_permissions WHERE user_id = ?").all(req.params.userId);
    res.json(perms);
  } catch (err) {
    console.error("User permissions error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/users/:userId/permissions", (req, res) => {
  const { permissions } = req.body; // [{ resource, can_create, can_modify, can_delete }]
  try {
    const db = getDb();
    const upsert = db.prepare(`
      INSERT INTO user_permissions (id, user_id, resource, can_create, can_modify, can_delete)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, resource) DO UPDATE SET can_create = excluded.can_create, can_modify = excluded.can_modify, can_delete = excluded.can_delete
    `);
    const tx = db.transaction(() => {
      for (const p of permissions) {
        upsert.run(uuidv4(), req.params.userId, p.resource, p.can_create ? 1 : 0, p.can_modify ? 1 : 0, p.can_delete ? 1 : 0);
      }
    });
    tx();
    res.json({ success: true });
  } catch (err) {
    console.error("User permissions update error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── EFFECTIVE PERMISSIONS (merged group + user, user wins) ───

router.get("/users/:userId/effective", (req, res) => {
  try {
    const db = getDb();
    const userId = req.params.userId;

    // Get user's role for fallback defaults
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(userId);
    const isArtiste = user?.role === "artiste";

    // Get user's groups
    const userGroups = db.prepare("SELECT group_id FROM user_groups WHERE user_id = ?").all(userId).map((r) => r.group_id);

    // Aggregate group permissions
    let groupPerms = {};
    if (userGroups.length > 0) {
      const placeholders = userGroups.map(() => "?").join(",");
      const rows = db.prepare(`SELECT resource, MAX(can_create) AS can_create, MAX(can_modify) AS can_modify, MAX(can_delete) AS can_delete FROM group_permissions WHERE group_id IN (${placeholders}) GROUP BY resource`).all(...userGroups);
      for (const r of rows) groupPerms[r.resource] = { can_create: r.can_create, can_modify: r.can_modify, can_delete: r.can_delete };
    }

    // Get user-specific permissions
    const userPerms = db.prepare("SELECT * FROM user_permissions WHERE user_id = ?").all(userId);
    const userMap = {};
    for (const p of userPerms) userMap[p.resource] = { can_create: p.can_create, can_modify: p.can_modify, can_delete: p.can_delete };

    // Merge: user wins over group
    const result = {};
    for (const r of RESOURCES) {
      let group = groupPerms[r] || { can_create: 0, can_modify: 0, can_delete: 0 };
      // Fallback: artiste users get full access to their own page resources
      if (isArtiste && !userGroups.length) {
        const artistDefaults = ["slides", "blog", "tags", "artpage", "media"];
        if (artistDefaults.includes(r)) {
          group = { can_create: 1, can_modify: 1, can_delete: 1 };
        }
      }
      const user = userMap[r];
      result[r] = user ? { ...group, ...user } : { ...group };
    }

    res.json(result);
  } catch (err) {
    console.error("Effective permissions error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
