import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, ImagePlus, Trash2, Upload, Link, ImageIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface SliderEditProps {
  storageKey: string;
  defaultImages: string[];
  alt: string;
  className?: string;
  wrapperClassName?: string;
}

export default function SliderEdit({ storageKey, defaultImages, alt, wrapperClassName = "" }: SliderEditProps) {
  const { isAdmin, currentUser } = useAuth();
  const [publishedImages, setPublishedImages] = useState<string[]>(defaultImages);
  const [draftImages, setDraftImages] = useState<string[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isEditing, setIsEditing] = useState(() => localStorage.getItem(`${storageKey}_editing`) === "true");
  const setEdit = (v: boolean) => {
    localStorage.setItem(`${storageKey}_editing`, String(v));
    if (v) setDraftImages([...publishedImages]);
    setIsEditing(v);
  };
  const [newUrlInput, setNewUrlInput] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [removeConfirm, setRemoveConfirm] = useState<number | null>(null);
  const [showMediaLib, setShowMediaLib] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<{ filename: string; url: string }[]>([]);
  const [mediaRefreshKey, setMediaRefreshKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadTab, setUploadTab] = useState<"url" | "upload" | "media">("url");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load from API first, then localStorage, then defaults
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/content/${storageKey}`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data.value) {
            const urls = JSON.parse(data.value);
            if (Array.isArray(urls) && urls.length > 0) {
              setPublishedImages(urls);
              localStorage.setItem(storageKey, data.value);
              setLoading(false);
              return;
            }
          }
        }
      } catch {}
      try {
        const saved = localStorage.getItem(storageKey);
        if (!cancelled && saved) {
          const urls = JSON.parse(saved);
          if (Array.isArray(urls) && urls.length > 0) {
            setPublishedImages(urls);
          }
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [storageKey]);

  const displayImages = draftImages ?? publishedImages;
  const hasDraft = draftImages !== null && JSON.stringify(draftImages) !== JSON.stringify(publishedImages);

  const updateDraftImages = (newList: string[]) => {
    setDraftImages(newList);
  };

  const handlePublish = async () => {
    if (draftImages === null) {
      setIsEditing(false);
      return;
    }
    const list = draftImages.length > 0 ? draftImages : defaultImages;
    setPublishedImages(list);
    const json = JSON.stringify(list);
    localStorage.setItem(storageKey, json);
    try { await fetch(`/api/content/${storageKey}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: json }) }); } catch {}
    setDraftImages(null);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraftImages(null);
    setIsEditing(false);
  };

  const goTo = (idx: number) => {
    setCurrentIndex(Math.max(0, Math.min(idx, displayImages.length - 1)));
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 8000);
  };

  const addImage = () => {
    const url = newUrlInput.trim();
    if (!url) return;
    updateDraftImages([...(draftImages ?? publishedImages), url]);
    setNewUrlInput("");
  };

  const loadMediaLib = async () => {
    try {
      const q = currentUser?.id ? `?userId=${encodeURIComponent(currentUser.id)}` : "";
      const res = await fetch(`/api/media${q}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMediaFiles(data);
        else if (data.files) setMediaFiles(data.files);
      }
    } catch {}
    setShowMediaLib(true);
    setUploadTab("media");
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Veuillez sélectionner une image"); return; }
    if (file.size > 32 * 1024 * 1024) { alert("L'image dépasse 32 Mo"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const res = await fetch("/api/media/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl, folder: ".content", userId: currentUser?.id }) });
        setUploading(false);
        if (res.ok) {
          const data = await res.json();
          const nextImages = [...(draftImages ?? publishedImages), data.url];
          updateDraftImages(nextImages);
          try { const r2 = await fetch("/api/media"); if (r2.ok) setMediaFiles(await r2.json()); } catch {}
          setMediaRefreshKey((k) => k + 1);
        } else {
          alert("Erreur lors de l'upload");
        }
      } catch { alert("Erreur de connexion"); setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (idx: number) => {
    const base = draftImages ?? publishedImages;
    const newList = base.filter((_, i) => i !== idx);
    updateDraftImages(newList.length > 0 ? newList : defaultImages);
    setRemoveConfirm(null);
    if (currentIndex >= newList.length) setCurrentIndex(Math.max(0, newList.length - 1));
  };

  // Auto-play slider with 5s interval
  useEffect(() => {
    if (displayImages.length <= 1 || isPaused) {
      if (autoTimerRef.current) { clearInterval(autoTimerRef.current); autoTimerRef.current = null; }
      return;
    }
    autoTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayImages.length);
    }, 5000);
    return () => { if (autoTimerRef.current) clearInterval(autoTimerRef.current); };
  }, [displayImages.length, isPaused]);

  // Click outside modal closes it — ONLY for the backdrop overlay, not document-wide
  // (prevents accidental close on file upload callbacks)

  if (loading && isAdmin) {
    return <div className={`aspect-[4/5] bg-brand-steel border border-brand-dark/10 ${wrapperClassName}`} />;
  }

  const currentImage = displayImages[currentIndex] || defaultImages[0];

  return (
    <>
      <div
        className={`relative group/imageedit ${wrapperClassName}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Image with smooth fade transition */}
        <div className="aspect-[4/5] overflow-hidden border border-brand-dark/10 shadow-lg bg-brand-steel relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <img
                src={currentImage}
                alt={alt}
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </AnimatePresence>

          {/* Preview badge */}
          {hasDraft && (
            <span className="absolute -top-2 -right-2 z-20 px-1.5 py-0.5 bg-brand-rust text-brand-light font-mono text-[8px] uppercase tracking-wider font-bold rounded-sm shadow-sm pointer-events-none">
              Preview
            </span>
          )}

          {/* Admin overlay edit button */}
          {isAdmin && isHovering && !isEditing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-brand-dark/40 backdrop-blur-[1px] transition-all duration-200 cursor-pointer border border-brand-rust/40">
              {hasDraft && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePublish(); }}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-brand-light px-4 py-2 font-mono text-xs uppercase tracking-widest shadow-md transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Publier
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                    className="flex items-center gap-2 bg-brand-dark hover:bg-brand-dark/80 text-brand-light px-4 py-2 font-mono text-xs uppercase tracking-widest shadow-md transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Annuler
                  </button>
                </div>
              )}
              <button
                onClick={() => setEdit(true)}
                className="flex items-center gap-2 bg-brand-rust text-brand-light px-4 py-2 font-mono text-xs uppercase tracking-widest shadow-md"
              >
                <ImagePlus className="w-4 h-4" />
                Gérer les images
              </button>
            </div>
          )}

          {/* Prev/Next nav arrows (only if multiple images) */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(currentIndex - 1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-brand-dark/50 hover:bg-brand-dark/70 text-brand-light rounded-full transition-all cursor-pointer z-10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(currentIndex + 1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-brand-dark/50 hover:bg-brand-dark/70 text-brand-light rounded-full transition-all cursor-pointer z-10"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Dots indicator */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {displayImages.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); goTo(i); }}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${i === currentIndex ? "bg-brand-rust" : "bg-brand-dark/20 hover:bg-brand-dark/40"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Admin edit modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-start justify-center pt-16 pb-8" onClick={() => handleCancel()}>
          <div ref={modalRef} className="bg-brand-light border border-brand-dark/10 shadow-xl p-8 rounded-sm max-w-4xl w-[95vw] mx-4 max-h-[calc(100vh-96px)] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setEdit(false)} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-brand-gray/50 hover:text-brand-dark transition-colors cursor-pointer z-10" title="Fermer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <h3 className="font-display text-lg uppercase tracking-wide text-brand-dark mb-4 ml-8">Gestion des images</h3>

            {/* Existing images with drag-reorder */}
            <div className="space-y-2 mb-4">
              {(draftImages ?? publishedImages).map((url, i) => (
                <div key={i}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData("text/plain", String(i)); e.currentTarget.classList.add("opacity-40"); }}
                  onDragEnd={(e) => { e.currentTarget.classList.remove("opacity-40"); }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; e.currentTarget.classList.add("border-brand-rust"); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove("border-brand-rust"); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("border-brand-rust");
                    const from = parseInt(e.dataTransfer.getData("text/plain"));
                    const to = i;
                    if (from === to) return;
                    const base = draftImages ?? publishedImages;
                    const newList = [...base];
                    const [moved] = newList.splice(from, 1);
                    newList.splice(to, 0, moved);
                    updateDraftImages(newList);
                  }}
                  className="flex items-center gap-3 p-2 bg-brand-steel/50 border border-brand-dark/5 rounded-sm transition-all cursor-default"
                >
                  <span className="cursor-grab active:cursor-grabbing text-brand-gray/40 hover:text-brand-gray flex-shrink-0" title="Glisser pour réordonner">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="9" cy="5" r="1.5" fill="currentColor" /><circle cx="15" cy="5" r="1.5" fill="currentColor" />
                      <circle cx="9" cy="12" r="1.5" fill="currentColor" /><circle cx="15" cy="12" r="1.5" fill="currentColor" />
                      <circle cx="9" cy="19" r="1.5" fill="currentColor" /><circle cx="15" cy="19" r="1.5" fill="currentColor" />
                    </svg>
                  </span>
                  <span className="w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] text-brand-gray bg-brand-dark/5">{i + 1}</span>
                  <img src={url} alt="" className="w-10 h-10 object-cover rounded-sm flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <span className="flex-1 font-mono text-[9px] text-brand-gray truncate">{url}</span>
                  {removeConfirm === i ? (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => removeImage(i)} className="px-2 py-1 bg-brand-red text-brand-light font-mono text-[9px] rounded-[4px] cursor-pointer">Confirmer</button>
                      <button onClick={() => setRemoveConfirm(null)} className="px-2 py-1 border border-brand-dark/10 font-mono text-[9px] rounded-[4px] cursor-pointer">Annuler</button>
                    </div>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); setRemoveConfirm(i); }} className="p-1 text-brand-gray/60 hover:text-brand-red cursor-pointer flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
            </div>

            {/* Add new — tabs with panel */}
            <div className="flex flex-col max-w-2xl">
              <div className="flex gap-0">
                <button onClick={() => setUploadTab("url")} className={`px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer rounded-t-sm border border-b-0 ${uploadTab === "url" ? "bg-brand-steel/60 border-brand-dark/20 text-brand-dark font-bold" : "bg-brand-light border-brand-dark/10 text-brand-dark/50 hover:text-brand-dark hover:bg-brand-steel/30"}`}>
                  <Link className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> URL
                </button>
                <button onClick={() => setUploadTab("upload")} className={`px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer rounded-t-sm border border-b-0 -ml-px ${uploadTab === "upload" ? "bg-brand-steel/60 border-brand-dark/20 text-brand-dark font-bold" : "bg-brand-light border-brand-dark/10 text-brand-dark/50 hover:text-brand-dark hover:bg-brand-steel/30"}`}>
                  <Upload className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> Upload
                </button>
                <button onClick={() => { setUploadTab("media"); loadMediaLib(); }} className={`px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer rounded-t-sm border border-b-0 -ml-px ${uploadTab === "media" ? "bg-brand-steel/60 border-brand-dark/20 text-brand-dark font-bold" : "bg-brand-light border-brand-dark/10 text-brand-dark/50 hover:text-brand-dark hover:bg-brand-steel/30"}`}>
                  <ImageIcon className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> Médiathèque
                </button>
              </div>
              <div className="bg-brand-steel/60 border border-brand-dark/20 rounded-b-sm rounded-tr-sm px-4 py-4 min-h-[60px]">
                {uploadTab === "url" && (
                  <div className="flex gap-2 items-center">
                    <input type="text" value={newUrlInput} onChange={(e) => setNewUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 bg-brand-light border border-brand-dark/10 text-brand-dark font-sans text-sm px-3 py-2.5 rounded-[4px] focus:outline-none focus:border-brand-rust transition-colors" />
                    <button onClick={addImage} className="px-4 py-2.5 bg-brand-dark hover:bg-brand-rust text-brand-light font-mono text-[10px] uppercase tracking-widest rounded-[4px] transition-all cursor-pointer whitespace-nowrap">Ajouter</button>
                  </div>
                )}
                {uploadTab === "upload" && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-brand-rust hover:brightness-110 text-brand-light font-mono text-[10px] uppercase tracking-widest rounded-[4px] transition-all cursor-pointer flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Choisir un fichier
                    </button>
                    {uploading && <span className="font-mono text-[10px] text-brand-gray">Upload...</span>}
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileUpload} className="hidden" />
                  </div>
                )}
                {uploadTab === "media" && (
              <div key={mediaRefreshKey}>
              <div className="mb-4">
                <p className="font-mono text-[9px] text-brand-gray uppercase tracking-wider mb-2 font-semibold">Images ({mediaFiles.length})</p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto">
                  {mediaFiles.length === 0 && <p className="col-span-3 font-mono text-[9px] text-brand-gray/60 text-center py-4">Aucune image</p>}
                  {mediaFiles.map((f) => (
                    <button key={f.filename} onClick={() => { updateDraftImages([...(draftImages ?? publishedImages), f.url]); }}
                      className="group relative aspect-square rounded-sm overflow-hidden border border-brand-dark/5 hover:border-brand-rust transition-colors cursor-pointer">
                      <img src={f.url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <div className="absolute inset-0 bg-brand-rust/0 group-hover:bg-brand-rust/20 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
              </div>
            )}
            </div>
            </div>

            {/* Publish / Cancel actions */}
            <div className="sticky bottom-0 -mx-8 -mb-8 mt-6 px-8 py-4 bg-brand-light border-t border-brand-dark/10 flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 font-mono text-xs uppercase tracking-widest text-brand-dark/60 hover:text-brand-dark transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handlePublish}
                className="px-4 py-2 font-mono text-xs uppercase tracking-widest bg-emerald-600 text-brand-light hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                Publier
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
