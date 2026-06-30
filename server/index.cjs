const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: "50mb" }));

// API routes
const authRoutes = require("./routes/auth.cjs");
const contentRoutes = require("./routes/content.cjs");
const mediaRoutes = require("./routes/media.cjs");
const permissionsRoutes = require("./routes/permissions.cjs");

app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api", permissionsRoutes);

// Serve uploaded media files
app.use("/media", express.static(path.join(__dirname, "media"), { dotfiles: "allow" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Serveur API démarré sur http://0.0.0.0:${PORT}`);
});
