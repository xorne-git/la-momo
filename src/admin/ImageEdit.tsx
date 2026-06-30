import { useState, useEffect, useRef, type ReactNode, type ChangeEvent } from "react";
import { ImagePlus, Upload, Link, Loader2, ImageIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { optimizeImage } from "../utils/imageOptimizer";

async function saveImageToApi(key: string, value: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/content/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    return res.ok;
  } catch { return false; }
}

interface ImageEditProps {
  storageKey: string;
  defaultUrl: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  children?: ReactNode;
}

export default function ImageEdit({ storageKey, defaultUrl, alt, className = "", wrapperClassName = "", children }: ImageEditProps) {
  const { isAdmin, currentUser } = useAuth();
  const [publishedUrl, setPublishedUrl] = useState(defaultUrl);
  const [draftUrl, setDraftUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const [uploadTab, setUploadTab] = useState<"url" | "upload" | "media">("url");
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<{ filename: string; url: string }[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // On mount: try API → localStorage → default
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/content/${storageKey}`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data.value) {
            setPublishedUrl(data.value);
            localStorage.setItem(storageKey, data.value);
            setLoading(false);
            return;
          }
        }
      } catch {}
      try {
        const saved = localStorage.getItem(storageKey);
        if (!cancelled && saved) {
          setPublishedUrl(saved);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [storageKey]);

  const handleSetDraftUrl = () => {
    const url = inputUrl.trim() || defaultUrl;
    setDraftUrl(url);
  };

  const handlePublish = async () => {
    if (draftUrl === null) {
      setIsEditing(false);
      return;
    }
    setPublishedUrl(draftUrl);
    localStorage.setItem(storageKey, draftUrl);
    const ok = await saveImageToApi(storageKey, draftUrl);
    setSaveError(!ok);
    setDraftUrl(null);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraftUrl(null);
    setIsEditing(false);
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image (JPEG, PNG, etc.)");
      return;
    }
    if (file.size > 32 * 1024 * 1024) { alert("L'image dépasse 32 Mo. Veuillez choisir un fichier plus léger."); return; }
    setUploading(true);
    try {
      const rawDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Erreur de lecture"));
        reader.readAsDataURL(file);
      });
      const dataUrl = await optimizeImage(rawDataUrl, file.type, file.size);
      setDraftUrl(dataUrl);
    } catch {
      alert("Erreur lors de la lecture ou de l'optimisation de l'image.");
    }
    setUploading(false);
  };

  const loadMedia = async () => {
    try {
      const q = currentUser?.id ? `?userId=${encodeURIComponent(currentUser.id)}` : "";
      const res = await fetch(`/api/media${q}`);
      if (res.ok) {
        const data = await res.json();
        setMediaFiles(Array.isArray(data) ? data : data.files || []);
      }
    } catch {}
  };

  const handleOpen = () => {
    setInputUrl(draftUrl ?? publishedUrl);
    setUploadTab("url");
    setIsEditing(true);
    loadMedia();
  };

  useEffect(() => {
    if (!isEditing) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsEditing(false);
      }
    };
    setTimeout(() => document.addEventListener("click", handleClickOutside), 0);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isEditing]);

  // Loading state
  if (loading && isAdmin) {
    return (
      <div className={`flex items-center justify-center aspect-[4/5] bg-brand-steel border border-brand-dark/10 ${wrapperClassName}`}>
        <Loader2 className="w-6 h-6 animate-spin text-brand-gray" />
      </div>
    );
  }

  const displayUrl = draftUrl ?? publishedUrl;
  const hasDraft = draftUrl !== null && draftUrl !== publishedUrl;

  return (
    <>
      <div
        className={`relative group/imageedit ${wrapperClassName}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {hasDraft && (
          <span className="absolute -top-2 -right-2 z-20 px-1.5 py-0.5 bg-brand-rust text-brand-light font-mono text-[8px] uppercase tracking-wider font-bold rounded-sm shadow-sm pointer-events-none">
            Preview
          </span>
        )}
        {children ? (
          children
        ) : (
          <img
            src={displayUrl}
            alt={alt}
            className={className}
            referrerPolicy="no-referrer"
          />
        )}

        {isAdmin && isHovering && !isEditing && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-brand-dark/40 backdrop-blur-[2px] transition-all duration-200 cursor-pointer border-2 border-brand-rust/50">
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
              onClick={handleOpen}
              className="flex items-center gap-2 bg-brand-rust text-brand-light px-4 py-2 font-mono text-xs uppercase tracking-widest shadow-md"
            >
              <ImagePlus className="w-4 h-4" />
              Changer l'image
            </button>
          </div>
        )}
      </div>

      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
        >
          <div ref={modalRef} className="bg-brand-light border border-brand-dark/10 shadow-xl p-6 rounded-sm max-w-lg w-full mx-4">
            <h3 className="font-display text-lg uppercase tracking-wide text-brand-dark mb-4">Modifier l'image</h3>

            {/* Tabs: URL / Upload / Médiathèque */}
            <div className="flex gap-0 mb-5 border border-brand-dark/10 rounded-[4px] overflow-hidden">
              <button
                onClick={() => setUploadTab("url")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] uppercase tracking-widest transition-colors cursor-pointer ${uploadTab === "url" ? "bg-brand-dark text-brand-light" : "bg-brand-steel text-brand-dark/60 hover:text-brand-dark"}`}
              >
                <Link className="w-3.5 h-3.5" />
                URL
              </button>
              <button
                onClick={() => setUploadTab("upload")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] uppercase tracking-widest transition-colors cursor-pointer ${uploadTab === "upload" ? "bg-brand-dark text-brand-light" : "bg-brand-steel text-brand-dark/60 hover:text-brand-dark"}`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload
              </button>
              <button
                onClick={() => setUploadTab("media")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] uppercase tracking-widest transition-colors cursor-pointer ${uploadTab === "media" ? "bg-brand-dark text-brand-light" : "bg-brand-steel text-brand-dark/60 hover:text-brand-dark"}`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Médiathèque
              </button>
            </div>

            {uploadTab === "url" ? (
              <>
                <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest mb-1.5 font-bold">
                  URL de l'image
                </label>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    setDraftUrl(e.target.value.trim() || defaultUrl);
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-brand-steel border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-brand-rust transition-colors mb-4"
                />
              </>
            ) : uploadTab === "upload" ? (
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-brand-rust hover:brightness-110 text-brand-light font-mono text-[10px] uppercase tracking-widest rounded-[4px] transition-all cursor-pointer flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Choisir un fichier
                  </button>
                  {uploading && <span className="font-mono text-[10px] text-brand-gray">Upload...</span>}
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <p className="font-mono text-[9px] text-brand-gray uppercase tracking-wider mb-2 font-semibold">Ma médiathèque</p>
                <div className="grid grid-cols-4 gap-2 max-h-[600px] overflow-y-auto">
                  {mediaFiles.map((f) => (
                    <button key={f.filename}
                      onClick={() => {
                        setDraftUrl(f.url);
                      }}
                      className={`aspect-square rounded-[4px] overflow-hidden border hover:border-brand-rust hover:ring-1 hover:ring-brand-rust transition-all cursor-pointer bg-brand-steel/30 ${draftUrl === f.url ? "border-brand-rust ring-1 ring-brand-rust" : "border-brand-dark/10"}`}
                    >
                      <img src={f.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {mediaFiles.length === 0 && (
                    <p className="col-span-full font-mono text-[10px] text-brand-gray/50 py-4 text-center">Aucune image</p>
                  )}
                </div>
              </div>
            )}

            {/* Preview */}
            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm">
                <p className="font-mono text-[10px] text-red-600">
                  ⚠ Échec de la sauvegarde API — image conservée en localStorage
                </p>
              </div>
            )}

            {(uploadTab === "url" && (draftUrl ?? inputUrl)) && (
              <div className="aspect-video bg-brand-steel border border-brand-dark/5 mb-4 overflow-hidden rounded-sm">
                <img
                  src={draftUrl ?? inputUrl}
                  alt="Aperçu"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
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
