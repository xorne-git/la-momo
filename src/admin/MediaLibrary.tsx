import { useState, useEffect, useRef, type DragEvent, type SyntheticEvent } from "react";
import { Upload, Link, FolderPlus, Trash2, FolderOpen, Move, FileUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { optimizeImage } from "../utils/imageOptimizer";

export default function MediaLibrary() {
  const { isAdmin, isAuthenticated, currentUser } = useAuth();
  const userId = currentUser?.id;
  const [files, setFiles] = useState<{ filename: string; url: string; size: number; originalName?: string }[]>([]);
  const [folders, setFolders] = useState<{ name: string; fileCount: number }[]>([]);
  const [currentFolder, setCurrentFolder] = useState("");
  const [uploadTab, setUploadTab] = useState<"url" | "file">("file");
  const [urlInput, setUrlInput] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [imgVersion, setImgVersion] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; index: number } | null>(null);
  const [dimsLoaded, setDimsLoaded] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const moveSelectRef = useRef<HTMLSelectElement>(null);
  const dimsRef = useRef<Map<string, { w: number; h: number }>>(new Map());

  const handleImgLoad = (filename: string, e: SyntheticEvent<HTMLImageElement>) => {
    if (!dimsRef.current.has(filename)) {
      dimsRef.current.set(filename, {
        w: e.currentTarget.naturalWidth,
        h: e.currentTarget.naturalHeight,
      });
      setDimsLoaded((v) => v + 1); // trigger re-render to show dimensions
    }
  };

  const handleDragStart = (e: DragEvent, filename: string) => {
    e.dataTransfer.setData("text/plain", filename);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent, folderName: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(folderName);
  };

  const handleDragLeave = (folderName: string | null) => {
    setDragOver((prev) => (prev === folderName ? null : prev));
  };

  const handleDrop = async (e: DragEvent, targetFolder: string | null) => {
    e.preventDefault();
    setDragOver(null);
    const filename = e.dataTransfer.getData("text/plain");
    if (!filename) return;
    const dest = targetFolder ?? currentFolder;
    // Don't move if already in the same folder
    if (!dest && !currentFolder) return;
    if (dest === currentFolder) return;
    try {
      const res = await fetch("/api/media/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, targetFolder: dest || undefined, userId }),
      });
      if (res.ok) loadMedia();
    } catch {}
  };

  const loadMedia = async () => {
    try {
      const q = new URLSearchParams();
      if (currentFolder) q.set("folder", currentFolder);
      if (userId) q.set("userId", userId);
      const res = await fetch(`/api/media?${q}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
        setFolders(data.folders || []);
        setImgVersion((v) => v + 1);
      }
    } catch {}
  };

  useEffect(() => { loadMedia(); }, [currentFolder]);

  // Lightbox keyboard navigation
  useEffect(() => {
    if (!lightboxImage) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setLightboxImage(null); return; }
      if (e.key === "ArrowLeft" && lightboxImage.index > 0) {
        setLightboxImage({ url: files[lightboxImage.index - 1].url, index: lightboxImage.index - 1 });
      }
      if (e.key === "ArrowRight" && lightboxImage.index < files.length - 1) {
        setLightboxImage({ url: files[lightboxImage.index + 1].url, index: lightboxImage.index + 1 });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxImage, files]);

  // optimizeImage importée depuis src/utils/imageOptimizer

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Image uniquement"); return; }
    if (file.size > 32 * 1024 * 1024) { alert("L'image dépasse 32 Mo. Veuillez choisir un fichier plus léger."); return; }
    const originalName = file.name;
    const reader = new FileReader();
    reader.onload = async () => {
      let dataUrl = reader.result as string;
      try {
        dataUrl = await optimizeImage(dataUrl, file.type, file.size);
      } catch (err) {
        console.error("Compression error:", err);
        alert("Erreur lors de l'optimisation de l'image. Le fichier original sera envoyé.");
        // Continue with original — server may accept or reject it
      }
      try {
        const res = await fetch("/api/media/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl, folder: currentFolder || undefined, originalName, userId }),
        });
        if (res.ok) loadMedia();
        else {
          let msg = "Erreur serveur";
          try { const d = await res.json(); msg = d.error || msg; } catch {}
          alert(msg);
        }
      } catch { alert("Erreur de connexion au serveur"); }
    };
    reader.readAsDataURL(file);
  };

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return;
    try {
      const imgRes = await fetch(urlInput);
      const blob = await imgRes.blob();
      const urlParts = urlInput.split("/");
      const urlFilename = urlParts[urlParts.length - 1].split("?")[0] || "image_depuis_url";
      const originalName = urlFilename.length > 100 ? urlFilename.slice(0, 60) + "." + (blob.type.split("/")[1] || "jpg") : urlFilename;
      const reader = new FileReader();
      reader.onload = async () => {
        let dataUrl = reader.result as string;
        try { dataUrl = await optimizeImage(dataUrl, blob.type, blob.size); }
        catch { console.error("URL compression error"); /* proceed with original */ }
        try {
          const res = await fetch("/api/media/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUrl, folder: currentFolder || undefined, originalName, userId }),
          });
          if (res.ok) { setUrlInput(""); loadMedia(); }
          else { const d = await res.json(); alert(d.error || "Erreur serveur"); }
        } catch { alert("Erreur de connexion"); }
      };
      reader.readAsDataURL(blob);
    } catch { alert("Impossible de télécharger l'image depuis cette URL"); }
  };

  const deleteFile = async (filename: string) => {
    const path = currentFolder ? `${currentFolder}/${filename}` : filename;
    try {
      const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
      const res = await fetch(`/api/media/${encodeURIComponent(path)}${q}`, { method: "DELETE" });
      if (res.ok) { setDeleteConfirm(null); loadMedia(); }
    } catch {}
  };

  const moveFile = async (filename: string, target: string) => {
    try {
      const res = await fetch("/api/media/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, targetFolder: target || undefined, userId }),
      });
      if (res.ok) { setMoveTarget(null); loadMedia(); }
    } catch {}
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch("/api/media/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName, parent: currentFolder || undefined, userId }),
      });
      if (res.ok) { setNewFolderName(""); setShowNewFolder(false); loadMedia(); }
    } catch {}
  };

  if (!isAuthenticated || !isAdmin) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const breadcrumbs = currentFolder.split("/").filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h2 className="font-display text-2xl uppercase tracking-wide text-brand-dark mb-6">Médiathèque</h2>

      {/* Toolbar: upload tabs + new folder */}
      <div className="flex flex-wrap items-start gap-3 mb-6">
        <div className="flex flex-col w-full max-w-lg">
          {/* Tab bar */}
          <div className="flex gap-0">
            <button onClick={() => setUploadTab("file")} className={`px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer rounded-t-sm border border-b-0 ${uploadTab === "file" ? "bg-brand-steel/60 border-brand-dark/20 text-brand-dark font-bold" : "bg-brand-light border-brand-dark/10 text-brand-dark/50 hover:text-brand-dark hover:bg-brand-steel/30"}`}>
              <FileUp className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> Upload
            </button>
            <button onClick={() => setUploadTab("url")} className={`px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer rounded-t-sm border border-b-0 -ml-px ${uploadTab === "url" ? "bg-brand-steel/60 border-brand-dark/20 text-brand-dark font-bold" : "bg-brand-light border-brand-dark/10 text-brand-dark/50 hover:text-brand-dark hover:bg-brand-steel/30"}`}>
              <Link className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> URL
            </button>
          </div>

          {/* Tab panel */}
          <div className="bg-brand-steel/60 border border-brand-dark/20 rounded-b-sm rounded-tr-sm px-4 py-4 min-h-[56px]">
            {uploadTab === "file" && (
              <div className="flex items-center gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-brand-rust hover:brightness-110 text-brand-light font-mono text-[10px] uppercase tracking-widest rounded-[4px] transition-all cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Choisir un fichier</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileUpload} className="hidden" />
              </div>
            )}
            {uploadTab === "url" && (
              <div className="flex items-center gap-2">
                <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://images.unsplash.com/..." className="flex-1 bg-brand-light border border-brand-dark/10 text-brand-dark font-sans text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" />
                <button onClick={handleUrlUpload} className="px-4 py-2.5 bg-brand-dark hover:bg-brand-rust text-brand-light font-mono text-[10px] uppercase tracking-widest rounded-sm transition-all cursor-pointer whitespace-nowrap">
                  Ajouter
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1" />

        <button onClick={() => setShowNewFolder(!showNewFolder)} className="px-4 py-2 border border-brand-dark/10 font-mono text-[10px] uppercase tracking-widest rounded-sm hover:bg-brand-dark/5 transition-all cursor-pointer text-brand-dark">
          <FolderPlus className="w-3 h-3 inline mr-1" /> Nouveau dossier
        </button>
      </div>

      {showNewFolder && (
        <div className="flex items-center gap-2 mb-6 p-4 bg-brand-steel/30 border border-brand-dark/10 rounded-sm">
          <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Nom du dossier" className="flex-1 bg-brand-light border border-brand-dark/10 text-brand-dark font-sans text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-brand-rust" autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") createFolder(); }} />
          <button onClick={createFolder} className="px-3 py-2 bg-brand-dark text-brand-light font-mono text-[10px] uppercase tracking-widest rounded-sm hover:bg-brand-rust transition-colors cursor-pointer">Créer</button>
          <button onClick={() => { setShowNewFolder(false); setNewFolderName(""); }} className="px-3 py-2 border border-brand-dark/10 font-mono text-[10px] rounded-sm cursor-pointer text-brand-gray hover:text-brand-dark">Annuler</button>
        </div>
      )}

      {/* Breadcrumbs — visible only when inside a folder */}
      {breadcrumbs.length > 0 && (
      <div className="flex items-center gap-2 mb-4 font-mono text-[10px] text-brand-gray/60">
        <button onClick={() => setCurrentFolder("")} className="hover:text-brand-rust transition-colors cursor-pointer font-semibold" title="Racine">
          <FolderOpen className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />Racine
        </button>
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="text-brand-gray/30">/</span>
            <button onClick={() => setCurrentFolder(breadcrumbs.slice(0, i + 1).join("/"))} className="hover:text-brand-rust transition-colors cursor-pointer">{crumb}</button>
          </span>
        ))}
      </div>
      )}

      {/* Folders */}
      {folders.length > 0 && (
        <div className="mb-6">
          <p className="font-mono text-[11px] text-brand-gray uppercase tracking-wider mb-3 font-semibold">Dossiers</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {folders.map((f) => {
              const folderPath = currentFolder ? `${currentFolder}/${f.name}` : f.name;
              const isDragOver = dragOver === folderPath;
              return (
                <div key={f.name}
                  onDragOver={(e) => handleDragOver(e, folderPath)}
                  onDragLeave={() => handleDragLeave(folderPath)}
                  onDrop={(e) => handleDrop(e, folderPath)}
                  className={`rounded-[5px] transition-all duration-150 ${isDragOver ? "ring-2 ring-brand-rust bg-brand-rust/10 scale-[1.03]" : ""}`}
                >
                  <button
                    onClick={() => setCurrentFolder(folderPath)}
                    className={`flex flex-col items-center justify-center gap-1 p-4 border border-brand-dark/10 rounded-[5px] hover:border-brand-rust/50 hover:bg-brand-steel/30 transition-all cursor-pointer w-full ${isDragOver ? "border-brand-rust/70" : ""}`}
                  >
                    <FolderOpen className="w-10 h-10 text-brand-rust" />
                    <span className="font-mono text-[12px] md:text-[13px] text-brand-gray text-center leading-tight">{f.name}</span>
                    <span className="font-mono text-[10px] text-brand-gray/50">{f.fileCount} fich{f.fileCount > 1 ? 'iers' : 'ier'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Files grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {files.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="font-mono text-[10px] text-brand-gray/60">Aucune image dans ce dossier</p>
          </div>
        )}
        {files.map((f, idx) => (
          <div key={f.filename}
            className="group relative aspect-square rounded-[5px] overflow-hidden border border-brand-dark/5 bg-brand-steel/30">
            {/* Overlay click → lightbox (default cursor) */}
            <div
              className="absolute inset-0 z-10 cursor-pointer"
              draggable
              onDragStart={(e) => handleDragStart(e, currentFolder ? `${currentFolder}/${f.filename}` : f.filename)}
              onClick={() => setLightboxImage({ url: f.url, index: idx })}
            />
            {/* Drag handle — visible on hover, grab cursor */}
            <div
              className="absolute bottom-2 right-2 z-20 w-7 h-7 flex items-center justify-center bg-black/40 hover:bg-brand-dark/60 text-brand-light/60 hover:text-brand-light rounded-[4px] opacity-0 group-hover:opacity-100 transition-all cursor-grab active:cursor-grabbing"
              draggable
              onDragStart={(e) => handleDragStart(e, currentFolder ? `${currentFolder}/${f.filename}` : f.filename)}
              title="Glisser pour déplacer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="9" cy="5" r="1.5" fill="currentColor" /><circle cx="15" cy="5" r="1.5" fill="currentColor" />
                <circle cx="9" cy="12" r="1.5" fill="currentColor" /><circle cx="15" cy="12" r="1.5" fill="currentColor" />
                <circle cx="9" cy="19" r="1.5" fill="currentColor" /><circle cx="15" cy="19" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <img
              src={`${f.url}?v=${imgVersion}`}
              alt={f.filename}
              className="w-full h-full object-cover pointer-events-none"
              onLoad={(e) => handleImgLoad(f.filename, e)}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            {/* Text overlay — on top of draggable layer but pointer-events-none so clicks pass through */}
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-brand-dark/70 to-transparent p-4 pt-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <p className="font-mono text-[13px] text-brand-light truncate font-bold" title={f.filename}>{f.originalName || f.filename}</p>
              <p className="font-mono text-[11px] text-brand-light/70 mt-1">
                {formatSize(f.size)}
                {dimsRef.current.has(f.filename) && (
                  <span> · {dimsRef.current.get(f.filename)!.w}×{dimsRef.current.get(f.filename)!.h}</span>
                )}
              </p>
            </div>
            {deleteConfirm === f.filename ? (
              <div className="absolute inset-0 z-20 bg-brand-dark/80 flex items-center justify-center gap-3 p-4">
                <button onClick={(e) => { e.stopPropagation(); deleteFile(f.filename); }} className="flex-1 py-2.5 bg-[#8B1A1A] hover:bg-[#a02020] text-brand-light font-mono text-[11px] uppercase tracking-wider font-bold rounded-[4px] cursor-pointer transition-colors">Confirmer</button>
                <button onClick={(e) => { setDeleteConfirm(null); e.stopPropagation(); }} className="flex-1 py-2.5 bg-brand-light/15 hover:bg-brand-light/25 text-brand-light font-mono text-[11px] uppercase tracking-wider rounded-[4px] cursor-pointer transition-colors">Annuler</button>
              </div>
            ) : (
              <>
                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(f.filename); }} className="absolute top-1 right-1 z-20 w-6 h-6 flex items-center justify-center bg-black/40 hover:bg-brand-red/80 text-brand-light rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                  <Trash2 className="w-3 h-3" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setMoveTarget(f.filename); }} className="absolute top-1 left-1 z-20 w-6 h-6 flex items-center justify-center bg-black/40 hover:bg-brand-rust/80 text-brand-light rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                  <Move className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Move dialog */}
      {moveTarget && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setMoveTarget(null)}>
          <div className="bg-brand-light border border-brand-dark/10 shadow-xl p-5 rounded-sm max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <p className="font-mono text-[9px] text-brand-gray uppercase tracking-widest font-semibold mb-3">Déplacer {moveTarget}</p>
            <select ref={moveSelectRef} defaultValue="" className="w-full bg-brand-steel border border-brand-dark/10 text-brand-dark font-sans text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-brand-rust mb-3">
              <option value="">Racine</option>
              {folders.filter((f) => !currentFolder.startsWith(f.name)).map((f) => (
                <option key={f.name} value={currentFolder ? `${currentFolder}/${f.name}` : f.name}>{f.name} ({f.fileCount})</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => { const sel = moveSelectRef.current?.value; moveFile(moveTarget, sel || ""); }} className="flex-1 py-2 bg-brand-dark text-brand-light font-mono text-[10px] uppercase tracking-widest rounded-sm hover:bg-brand-rust transition-colors cursor-pointer">Déplacer</button>
              <button onClick={() => setMoveTarget(null)} className="flex-1 py-2 border border-brand-dark/10 font-mono text-[10px] rounded-sm cursor-pointer text-brand-gray hover:text-brand-dark">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox — full image preview with prev/next */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4 md:p-10"
          onClick={() => setLightboxImage(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-brand-light/60 hover:text-brand-light bg-black/40 hover:bg-black/60 rounded-full transition-all cursor-pointer z-10"
            title="Fermer (Esc)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/40 text-brand-light/80 font-mono text-[10px] rounded-full z-10">
            {lightboxImage.index + 1} / {files.length}
          </div>

          {/* Previous */}
          {lightboxImage.index > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxImage({ url: files[lightboxImage.index - 1].url, index: lightboxImage.index - 1 }); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-brand-light/60 hover:text-brand-light bg-black/30 hover:bg-black/50 rounded-full transition-all cursor-pointer z-10"
              title="Précédent (←)"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Next */}
          {lightboxImage.index < files.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxImage({ url: files[lightboxImage.index + 1].url, index: lightboxImage.index + 1 }); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-brand-light/60 hover:text-brand-light bg-black/30 hover:bg-black/50 rounded-full transition-all cursor-pointer z-10"
              title="Suivant (→)"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          {/* Image */}
          <img
            src={`${lightboxImage.url}?v=${imgVersion}`}
            alt="Aperçu"
            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
