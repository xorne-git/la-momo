const Database = require("better-sqlite3");
const path = require("path");
const bcrypt = require("bcryptjs");
const { randomUUID: uuidv4 } = require("crypto");

const DB_PATH = path.join(__dirname, "..", "morinerie.db");

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
    seedUsers();
    seedGroups();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'artiste')),
      artist_id TEXT
    );

    CREATE TABLE IF NOT EXISTS contents (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'artiste')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS group_permissions (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      resource TEXT NOT NULL,
      can_create INTEGER NOT NULL DEFAULT 0,
      can_modify INTEGER NOT NULL DEFAULT 0,
      can_delete INTEGER NOT NULL DEFAULT 0,
      UNIQUE(group_id, resource)
    );

    CREATE TABLE IF NOT EXISTS user_groups (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      UNIQUE(user_id, group_id)
    );

    CREATE TABLE IF NOT EXISTS user_permissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      resource TEXT NOT NULL,
      can_create INTEGER NOT NULL DEFAULT 0,
      can_modify INTEGER NOT NULL DEFAULT 0,
      can_delete INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, resource)
    );
  `);
}

function seedUsers() {
  const count = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
  if (count > 0) return; // déjà seedé

  const insert = db.prepare(
    "INSERT INTO users (id, email, password, name, role, artist_id) VALUES (?, ?, ?, ?, ?, ?)"
  );

  const adminPassword = bcrypt.hashSync("admin123", 10);
  const artistPassword = bcrypt.hashSync("artiste123", 10);

  const users = [
    { id: uuidv4(), email: "admin@morinerie.art", password: adminPassword, name: "Admin Morinerie", role: "admin", artist_id: "artist-admin" },
    { id: uuidv4(), email: "garance.lemaitre@morinerie.art", password: artistPassword, name: "Garance Lemaître", role: "artiste", artist_id: "artist-1" },
    { id: uuidv4(), email: "keruzore.paint@morinerie.art", password: artistPassword, name: "Marc-Antoine Kéruzoré", role: "artiste", artist_id: "artist-2" },
    { id: uuidv4(), email: "n.dubreuil@morinerie.art", password: artistPassword, name: "Nolwenn Dubreuil", role: "artiste", artist_id: "artist-3" },
    { id: uuidv4(), email: "julien.gauthier@morinerie.art", password: artistPassword, name: "Julien Gauthier", role: "artiste", artist_id: "artist-4" },
  ];

  const tx = db.transaction(() => {
    for (const u of users) {
      insert.run(u.id, u.email, u.password, u.name, u.role, u.artist_id);
    }
  });
  tx();
}

function seedGroups() {
  const resources = ["hero", "lieu", "histoire", "clen", "map", "gallery", "actualites", "artpage", "slides", "blog", "tags", "media", "comptes", "groupes"];
  const artistResources = ["slides", "blog", "tags", "artpage", "media"];

  const count = db.prepare("SELECT COUNT(*) as c FROM groups").get().c;
  if (count === 0) {
    // Super Admin — full access
    const saId = uuidv4();
    db.prepare("INSERT INTO groups (id, name, role) VALUES (?, ?, ?)").run(saId, "Super Admin", "admin");
    for (const r of resources) {
      db.prepare("INSERT INTO group_permissions (id, group_id, resource, can_create, can_modify, can_delete) VALUES (?, ?, ?, 1, 1, 1)")
        .run(uuidv4(), saId, r);
    }

    // Artistes group — access to own page resources
    const artId = uuidv4();
    db.prepare("INSERT INTO groups (id, name, role) VALUES (?, ?, ?)").run(artId, "Artistes", "artiste");
    for (const r of resources) {
      const full = artistResources.includes(r);
      db.prepare("INSERT INTO group_permissions (id, group_id, resource, can_create, can_modify, can_delete) VALUES (?, ?, ?, ?, ?, ?)")
        .run(uuidv4(), artId, r, full ? 1 : 0, full ? 1 : 0, full ? 1 : 0);
    }

    // Assign all existing artiste users to Artistes group
    const artistUsers = db.prepare("SELECT id FROM users WHERE role = 'artiste'").all();
    for (const u of artistUsers) {
      db.prepare("INSERT OR IGNORE INTO user_groups (id, user_id, group_id) VALUES (?, ?, ?)").run(uuidv4(), u.id, artId);
    }
    return;
  }

  // Migration: ensure all resources exist for all groups
  const groups = db.prepare("SELECT id, name FROM groups").all();
  for (const g of groups) {
    const isSuperAdmin = g.name === "Super Admin";
    const isArtistGroup = g.role === "artiste";
    for (const r of resources) {
      const exists = db.prepare("SELECT id FROM group_permissions WHERE group_id = ? AND resource = ?").get(g.id, r);
      if (!exists) {
        const full = isSuperAdmin || (isArtistGroup && artistResources.includes(r));
        db.prepare("INSERT INTO group_permissions (id, group_id, resource, can_create, can_modify, can_delete) VALUES (?, ?, ?, ?, ?, ?)")
          .run(uuidv4(), g.id, r, full ? 1 : 0, full ? 1 : 0, full ? 1 : 0);
      }
    }
  }

  // Ensure "Artistes" group exists (for pre-seeded DBs)
  const existingArtGroup = db.prepare("SELECT id FROM groups WHERE name = 'Artistes'").get();
  if (existingArtGroup) {
    // Update permissions for existing Artistes group
    for (const r of resources) {
      const full = artistResources.includes(r);
      db.prepare("UPDATE group_permissions SET can_create = ?, can_modify = ?, can_delete = ? WHERE group_id = ? AND resource = ?")
        .run(full ? 1 : 0, full ? 1 : 0, full ? 1 : 0, existingArtGroup.id, r);
    }
  } else {
    const artId = uuidv4();
    db.prepare("INSERT INTO groups (id, name, role) VALUES (?, ?, ?)").run(artId, "Artistes", "artiste");
    for (const r of resources) {
      const full = artistResources.includes(r);
      db.prepare("INSERT INTO group_permissions (id, group_id, resource, can_create, can_modify, can_delete) VALUES (?, ?, ?, ?, ?, ?)")
        .run(uuidv4(), artId, r, full ? 1 : 0, full ? 1 : 0, full ? 1 : 0);
    }
  }

  // Assign all artiste users to Artistes group if not already assigned
  const artGroupId = db.prepare("SELECT id FROM groups WHERE name = 'Artistes'").get()?.id;
  if (artGroupId) {
    const artistUsers = db.prepare("SELECT id FROM users WHERE role = 'artiste'").all();
    for (const u of artistUsers) {
      db.prepare("INSERT OR IGNORE INTO user_groups (id, user_id, group_id) VALUES (?, ?, ?)").run(uuidv4(), u.id, artGroupId);
    }
  }
}

module.exports = { getDb };
