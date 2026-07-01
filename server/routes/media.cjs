const express = require("express");
const path = require("path");
const fs = require("fs");
const { randomUUID: uuidv4 } = require("crypto");

const router = express.Router();

const MEDIA_DIR = path.join(__dirname, "..", "media");

// Ensure media directory exists
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

// Safe resolve — prevents path traversal
const safePath = (p) => {
  const resolved = path.resolve(MEDIA_DIR, p);
  if (!resolved.startsWith(MEDIA_DIR)) return null;
  return resolved;
};

// Filename metadata store — maps UUID filenames to original names
const METADATA_FILE = path.join(MEDIA_DIR, ".filenames.json");

function loadMetadata() {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      return JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

function saveMetadata(data) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2));
}

function getOriginalName(uuidFilename) {
  const meta = loadMetadata();
  return meta[uuidFilename] || uuidFilename;
}

// POST /api/media/upload — upload a file (base64 or file), optional folder, per-user
router.post("/upload", (req, res) => {
  const { dataUrl, folder, originalName, userId } = req.body;
  if (!dataUrl || typeof dataUrl !== "string") {
    return res.status(400).json({ error: "Champ 'dataUrl' requis (base64)" });
  }

  try {
    const matches = dataUrl.match(/^data:(image\/(png|jpeg|webp|gif));base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: "Format d'image non supporté." });
    }

    const ext = matches[2] === "jpeg" ? "jpg" : matches[2];
    const base64Data = matches[3];
    const filename = `${uuidv4()}.${ext}`;

    // Base directory: user-specific or shared
    let targetDir = userId ? path.join(MEDIA_DIR, "users", userId) : MEDIA_DIR;
    if (folder && typeof folder === "string") {
      const safe = safePath(path.join(userId ? `users/${userId}` : "", folder));
      if (!safe) return res.status(403).json({ error: "Chemin invalide" });
      fs.mkdirSync(safe, { recursive: true });
      targetDir = safe;
    } else {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filepath = path.join(targetDir, filename);
    fs.writeFileSync(filepath, Buffer.from(base64Data, "base64"));

    // Store original name in metadata
    if (originalName && typeof originalName === "string" && originalName !== filename) {
      const meta = loadMetadata();
      meta[filename] = originalName.replace(/[^a-zA-Z0-9._\-()\sàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]/g, "_");
      saveMetadata(meta);
    }

    const userPrefix = userId ? `users/${userId}/` : "";
    const urlPath = folder ? `/media/${userPrefix}${folder}/${filename}` : `/media/${userPrefix}${filename}`;
    res.json({ url: urlPath, filename, originalName: originalName || filename, folder: folder || "" });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Erreur lors de l'upload" });
  }
});

// GET /api/media — list files and folders (per-user with userId)
router.get("/", (req, res) => {
  try {
    const userId = req.query.userId;
    const userBase = userId ? `users/${userId}` : "";
    const folder = String(req.query.folder || "");
    // If userId given, scope to that user's directory
    const basePath = userId ? path.join(MEDIA_DIR, userBase) : MEDIA_DIR;
    const scanDir = folder ? safePath(path.join(userBase, folder)) : basePath;
    if (!scanDir || !fs.existsSync(scanDir)) {
      return res.json({ files: [], folders: [] });
    }

    const entries = fs.readdirSync(scanDir, { withFileTypes: true });

    // Folders with file counts
    const folders = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => {
        const dirPath = path.join(scanDir, e.name);
        let count = 0;
        try {
          const dirEntries = fs.readdirSync(dirPath, { withFileTypes: true });
          count = dirEntries.filter((de) => de.isFile() && /\.(png|jpe?g|webp|gif)$/i.test(de.name)).length;
        } catch {}
        return { name: e.name, fileCount: count };
      });

    const allMeta = loadMetadata();
    const files = entries
      .filter((e) => e.isFile() && /\.(png|jpe?g|webp|gif)$/i.test(e.name))
      .map((e) => {
        const p = path.join(scanDir, e.name);
        const urlPath = folder ? `/media/${userBase ? userBase + "/" : ""}${folder}/${e.name}` : `/media/${userBase ? userBase + "/" : ""}${e.name}`;
        return { filename: e.name, url: urlPath, size: fs.statSync(p).size, originalName: allMeta[e.name] || e.name };
      })
      .sort((a, b) => b.size - a.size);

    res.json({ files, folders, currentFolder: folder });
  } catch (err) {
    console.error("Media list error:", err);
    res.status(500).json({ error: "Erreur" });
  }
});

// POST /api/media/folder — create a folder
router.post("/folder", (req, res) => {
  const { name, parent, userId } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Nom de dossier requis" });
  }
  const safeName = name.replace(/[^a-zA-Z0-9_\-]/g, "_");
  const userPrefix = userId ? `users/${userId}` : "";
  const basePath = parent ? path.join(userPrefix, parent) : userPrefix;
  const target = basePath ? safePath(path.join(basePath, safeName)) : safePath(safeName);
  if (!target) return res.status(403).json({ error: "Chemin invalide" });
  try {
    fs.mkdirSync(target, { recursive: true });
    const folderPath = parent ? `${parent}/${safeName}` : safeName;
    res.json({ success: true, folder: folderPath });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la création du dossier" });
  }
});

// DELETE /api/media/:filename — delete a file or empty folder
router.delete("/:filename", (req, res) => {
  try {
    const userId = req.query.userId;
    const p = userId ? `users/${userId}/${req.params.filename}` : req.params.filename;
    const filepath = safePath(p);
    if (!filepath) return res.status(403).json({ error: "Chemin invalide" });
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: "Introuvable" });
    fs.unlinkSync(filepath);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Erreur" });
  }
});

// DELETE /api/media/folder/:folder — delete an empty folder
router.delete("/folder/:folder", (req, res) => {
  try {
    const p = req.params.folder;
    const dirpath = safePath(p);
    if (!dirpath) return res.status(403).json({ error: "Chemin invalide" });
    if (!fs.existsSync(dirpath)) return res.status(404).json({ error: "Introuvable" });
    const remaining = fs.readdirSync(dirpath);
    if (remaining.length > 0) return res.status(400).json({ error: "Le dossier n'est pas vide" });
    fs.rmdirSync(dirpath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur" });
  }
});

// POST /api/media/move — move a file to another folder
router.post("/move", (req, res) => {
  try {
    const { filename, targetFolder, userId } = req.body;
    if (!filename) return res.status(400).json({ error: "Nom de fichier requis" });

    // Split "folder/name.ext" into source folder path + basename
    const parts = filename.split("/");
    const baseName = parts.pop();
    const sourceFolder = parts.length > 0 ? parts.join("/") : null;

    // Locate source file
    const userPrefix = userId ? `users/${userId}` : "";
    let sourcePath;
    if (sourceFolder) {
      const sourceDir = safePath(path.join(userPrefix, sourceFolder));
      if (!sourceDir) return res.status(403).json({ error: "Chemin source invalide" });
      sourcePath = path.join(sourceDir, baseName);
    } else {
      const searchRoot = userId ? path.join(MEDIA_DIR, userPrefix) : MEDIA_DIR;
      const findFile = (dir, name) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          if (e.isFile() && e.name === name) return path.join(dir, e.name);
          if (e.isDirectory() && !e.name.startsWith(".")) {
            const found = findFile(path.join(dir, e.name), name);
            if (found) return found;
          }
        }
        return null;
      };
      sourcePath = findFile(searchRoot, baseName);
    }

    if (!sourcePath || !fs.existsSync(sourcePath)) {
      return res.status(404).json({ error: "Fichier introuvable" });
    }

    // Resolve destination
    let destDir = userId ? path.join(MEDIA_DIR, userPrefix) : MEDIA_DIR;
    if (targetFolder && typeof targetFolder === "string") {
      const safe = safePath(path.join(userPrefix, targetFolder));
      if (!safe) return res.status(403).json({ error: "Chemin invalide" });
      fs.mkdirSync(safe, { recursive: true });
      destDir = safe;
    }

    const destPath = path.join(destDir, baseName);
    if (sourcePath === destPath) return res.json({ success: true, moved: false });

    fs.renameSync(sourcePath, destPath);
    const urlPath = targetFolder
      ? `/media/${userPrefix ? userPrefix + "/" : ""}${targetFolder}/${baseName}`
      : `/media/${userPrefix ? userPrefix + "/" : ""}${baseName}`;
    res.json({ success: true, moved: true, newUrl: urlPath });
  } catch (err) {
    console.error("Move error:", err);
    res.status(500).json({ error: "Erreur lors du déplacement" });
  }
});

module.exports = router;
