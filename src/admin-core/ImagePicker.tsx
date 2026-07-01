import React, { useState, useEffect, useRef } from "react";
import { Upload, Link, Image as ImageIcon, Folder, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface ImagePickerProps {
  onSelect: (url: string) => void;
}

interface MediaFile {
  filename: string;
  url: string;
  size: number;
  originalName?: string;
}

interface MediaFolder {
  name: string;
  fileCount: number;
}

export default function ImagePicker({ onSelect }: ImagePickerProps) {
  const { currentUser } = useAuth();
  const [uploadTab, setUploadTab] = useState<"url" | "upload" | "media">("url");
  const [inputUrl, setInputUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [mediaFolders, setMediaFolders] = useState<MediaFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState("");
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = async (folder = currentFolder) => {
    try {
      const params = new URLSearchParams();
      if (currentUser?.id) params.set("userId", currentUser.id);
      if (folder) params.set("folder", folder);
      const res = await fetch(`/api/media?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMediaFiles(Array.isArray(data) ? data : data.files || []);
        setMediaFolders(data.folders || []);
      }
    } catch {}
  };

  useEffect(() => { loadMedia(); }, [currentUser?.id]);

  const navigateToFolder = (name: string) => {
    setFolderHistory((prev) => [...prev, currentFolder]);
    const newFolder = currentFolder ? `${currentFolder}/${name}` : name;
    setCurrentFolder(newFolder);
    loadMedia(newFolder);
  };

  const navigateBack = () => {
    const prev = folderHistory[folderHistory.length - 1] || "";
    setFolderHistory((prev) => prev.slice(0, -1));
    setCurrentFolder(prev);
    loadMedia(prev);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Image uniquement"); return; }
    setUploading(true);
    try {
      const rawDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Erreur de lecture"));
        reader.readAsDataURL(file);
      });
      const body: Record<string, any> = { dataUrl: rawDataUrl, originalName: file.name, userId: currentUser?.id };
      if (currentFolder) body.folder = currentFolder;
      const res = await fetch("/api/media/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        onSelect(data.url);
        loadMedia();
      } else { alert("Erreur upload"); }
    } catch { alert("Erreur"); }
    setUploading(false);
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-brand-dark/10">
        <button onClick={() => setUploadTab("url")} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer -mb-px border border-brand-dark/10 rounded-t-sm ${uploadTab === "url" ? "bg-brand-light border-b-brand-light text-brand-rust font-bold" : "bg-brand-steel/30 text-brand-dark/60 hover:text-brand-dark"}`}>
          <Link className="w-3.5 h-3.5" />
          URL
        </button>
        <button onClick={() => setUploadTab("upload")} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer -mb-px border border-brand-dark/10 rounded-t-sm ${uploadTab === "upload" ? "bg-brand-light border-b-brand-light text-brand-rust font-bold" : "bg-brand-steel/30 text-brand-dark/60 hover:text-brand-dark"}`}>
          <Upload className="w-3.5 h-3.5" />
          Upload
        </button>
        <button onClick={() => { setUploadTab("media"); loadMedia(); }} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer -mb-px border border-brand-dark/10 rounded-t-sm ${uploadTab === "media" ? "bg-brand-light border-b-brand-light text-brand-rust font-bold" : "bg-brand-steel/30 text-brand-dark/60 hover:text-brand-dark"}`}>
          <ImageIcon className="w-3.5 h-3.5" />
          Médiathèque
        </button>
      </div>

      {/* Panel content */}
      {uploadTab === "url" ? (
        <div className="border border-brand-dark/10 border-t-0 p-4 bg-brand-light">
          <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest mb-1.5 font-bold">URL de l'image</label>
          <div className="flex gap-2">
            <input type="text" value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} placeholder="https://images.unsplash.com/..." className="flex-1 bg-brand-steel border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" />
            <button onClick={() => { if (inputUrl.trim()) { onSelect(inputUrl.trim()); setInputUrl(""); } }} className="px-4 py-3 bg-brand-dark hover:bg-brand-rust text-brand-light font-mono text-[10px] uppercase tracking-widest transition-colors cursor-pointer rounded-sm flex-shrink-0">Ajouter</button>
          </div>
        </div>
      ) : uploadTab === "upload" ? (
        <div className="border border-brand-dark/10 border-t-0 p-4 bg-brand-light">
          <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-brand-rust hover:brightness-110 text-brand-light font-mono text-[10px] uppercase tracking-widest rounded-[4px] transition-all cursor-pointer flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Choisir un fichier
            </button>
            {uploading && <span className="font-mono text-[10px] text-brand-gray">Upload...</span>}
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} className="hidden" />
        </div>
      ) : (
        <div className="border border-brand-dark/10 border-t-0 p-4 bg-brand-light">
          {/* Folder navigation */}
          <div className="flex items-center gap-2 mb-3">
            {currentFolder && (
              <button onClick={navigateBack} className="flex items-center gap-1 font-mono text-[9px] text-brand-rust hover:text-brand-dark transition-colors cursor-pointer uppercase tracking-wider">
                <ArrowLeft className="w-3 h-3" />
                Retour
              </button>
            )}
            <p className="font-mono text-[9px] text-brand-gray uppercase tracking-wider font-semibold">
              {currentFolder ? currentFolder : "Racine"} ({mediaFiles.length + mediaFolders.length})
            </p>
          </div>

          {/* Folders grid */}
          {mediaFolders.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              {mediaFolders.map((f) => (
                <button key={f.name} onClick={() => navigateToFolder(f.name)}
                  className="flex flex-col items-center justify-center gap-1 aspect-square border border-dashed border-brand-dark/20 rounded-sm hover:border-brand-rust/50 transition-all cursor-pointer bg-brand-steel/30 p-2">
                  <Folder className="w-6 h-6 text-brand-gray/60" />
                  <span className="font-mono text-[7px] text-brand-gray uppercase tracking-wider text-center leading-tight truncate w-full">{f.name}</span>
                  <span className="font-mono text-[6px] text-brand-gray/50">{f.fileCount} fichier{f.fileCount !== 1 ? "s" : ""}</span>
                </button>
              ))}
            </div>
          )}

          {/* Files grid */}
          <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
            {mediaFiles.length === 0 && mediaFolders.length === 0 && (
              <p className="col-span-3 font-mono text-[9px] text-brand-gray/60 text-center py-4">Aucune image</p>
            )}
            {mediaFiles.map((f) => (
              <button key={f.filename} onClick={() => onSelect(f.url)}
                className="aspect-square border border-brand-dark/10 rounded-sm overflow-hidden hover:border-brand-rust/50 transition-all cursor-pointer bg-brand-dark/5">
                <img src={f.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
