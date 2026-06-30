import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, Save, Plus, Pencil, Trash2, ArrowLeft, User } from "lucide-react";
import ImagePicker from "./ImagePicker";
import { useAuth } from "../context/AuthContext";
import ArtistBlogEdit from "./ArtistBlogEdit";
import TagEditor from "./TagEditor";
import WysiwygEditor from "./WysiwygEditor";
import { toast } from "../utils/toast";
import { ARTISTS } from "../data";
import type { Artwork } from "../types";
import { getAllGlobalTags, getDisciplines, saveDisciplines } from "../utils/tags";

function loadWorks(artistId: string): Artwork[] {
  try {
    const saved = localStorage.getItem(`morinerie_artist_works_${artistId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  const artist = ARTISTS.find((a) => a.id === artistId);
  return artist?.works || [];
}

let _pendingSave: ReturnType<typeof setTimeout> | null = null;
function saveWorks(artistId: string, works: Artwork[]) {
  localStorage.setItem(`morinerie_artist_works_${artistId}`, JSON.stringify(works));
  if (_pendingSave) clearTimeout(_pendingSave);
  _pendingSave = setTimeout(() => {
    fetch(`/api/content/morinerie_artist_works_${artistId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(works) }),
    }).catch(() => {});
  }, 2000);
}

export default function ArtistSliderEdit({ onTabChange, preselectArtistId }: { onTabChange?: (tab: string) => void; preselectArtistId?: string | null }) {
  const { isAdmin, currentUser } = useAuth();
  const isArtist = currentUser?.role === "artiste";
  const defaultArtistId = preselectArtistId || (isArtist ? (currentUser?.artistId || null) : null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(defaultArtistId);
  const [activeTab, setActiveTab] = useState<"slides" | "blog" | "tags" | "hero" | "vignette">("slides");

  useEffect(() => { onTabChange?.(activeTab); }, [activeTab]);
  const [works, setWorks] = useState<Artwork[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [workIndex, setWorkIndex] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const savedRef = useRef<Artwork[]>([]);

  useEffect(() => {
    if (selectedArtistId) {
      const w = loadWorks(selectedArtistId);
      setWorks(w);
      savedRef.current = w.map((x) => ({ ...x }));
    }
  }, [selectedArtistId]);

  const current = workIndex < works.length ? works[workIndex] : { id: `work-${Date.now()}`, title: "", year: new Date().getFullYear(), medium: "", imageUrl: "", description: "" } as Artwork;

  const updateField = (field: keyof Artwork, value: string | number) => {
    setWorks((prev) => {
      const next = [...prev];
      next[workIndex] = { ...next[workIndex], [field]: value };
      return next;
    });
    setDirty(true);
  };

  const handleSave = () => {
    let next = works;
    if (editingIndex !== null && editingIndex >= works.length && selectedArtistId) {
      const newWork: Artwork = {
        id: `work-${Date.now()}`,
        title: current.title || "Nouveau slide",
        year: current.year || new Date().getFullYear(),
        medium: current.medium || "",
        imageUrl: current.imageUrl || "",
        description: current.description || "",
      };
      next = [...works, newWork];
      setWorks(next);
    }
    if (selectedArtistId) {
      saveWorks(selectedArtistId, next);
      savedRef.current = next.map((w) => ({ ...w }));
    }
    setEditingIndex(null);
    setDirty(false);
    toast.success("Le slide a bien été sauvegardé");
  };

  const addWork = () => {
    setEditingIndex(works.length);
    setWorkIndex(works.length);
  };

  const deleteWork = (idx: number) => {
    setWorks((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (selectedArtistId) saveWorks(selectedArtistId, next);
      savedRef.current = next.map((w) => ({ ...w }));
      return next;
    });
    setDeleteConfirmIdx(null);
    setDirty(true);
    if (editingIndex === idx) setEditingIndex(null);
    toast.success("Slide supprimé");
  };

  if (!isAdmin && !isArtist) return null;
  const hasArtistId = !!currentUser?.artistId && isArtist;
  const showBackButton = !hasArtistId;

  // ARTIST SELECTOR (admin only — artists go directly to their own page)
  if (!selectedArtistId) {
    if (hasArtistId) return null; // user has a linked artist page
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="font-display text-2xl uppercase tracking-wide text-brand-dark mb-6">Espace des artistes</h2>
        <p className="font-mono text-[10px] text-brand-gray mb-6 uppercase tracking-wider">Sélectionnez un artiste pour gérer sa page</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ARTISTS.map((artist) => (
            <button
              key={artist.id}
              onClick={() => { setSelectedArtistId(artist.id); setEditingIndex(null); }}
              className="flex items-center gap-4 p-4 bg-brand-steel/30 border border-brand-dark/10 hover:border-brand-rust/50 transition-colors rounded-sm text-left cursor-pointer"
            >
              <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden bg-brand-dark/5 border border-brand-dark/10">
                <img src={artist.avatarUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-display text-sm text-brand-dark font-bold">{artist.name}</p>
                <p className="font-mono text-[9px] text-brand-gray">{getDisciplines(artist.id).join(" · ")}</p>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}

function ArtistVignetteImage({ artistId }: { artistId: string }) {
  const artist = ARTISTS.find((a) => a.id === artistId);
  const { url, setUrl } = useImageStorage(artistId, "vignette", artist?.featuredWorkUrl);
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg uppercase tracking-wide text-brand-dark">Vignette</h3>
      <p className="font-mono text-[10px] text-brand-gray">Image d'aperçu sur la page d'accueil.</p>
      {url && (
        <div className="aspect-video max-w-sm rounded-sm overflow-hidden bg-brand-dark/5 border border-brand-dark/10">
          <img src={url} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div>
        <ImagePicker onSelect={setUrl} />
      </div>
    </div>
  );
}

  const selectedArtist = ARTISTS.find((a) => a.id === selectedArtistId);

  // LIST VIEW
  if (editingIndex === null) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {!hasArtistId && (
              <button onClick={() => setSelectedArtistId(null)} className="w-8 h-8 flex items-center justify-center bg-brand-dark/5 hover:bg-brand-dark/10 rounded-sm transition-colors cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="font-display text-2xl uppercase tracking-wide text-brand-dark">{selectedArtist?.name}</h2>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-0 mb-6 border-b border-brand-dark/10">
          {(["slides", "blog", "tags", "hero", "vignette"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer -mb-px border border-brand-dark/10 rounded-t-sm ${
                activeTab === tab
                  ? "text-brand-rust font-bold border-b-brand-light bg-brand-light"
                  : "text-brand-dark/50 hover:text-brand-dark bg-brand-steel/30 border-r-0 last:border-r"
              }`}
            >
              {tab === "slides" ? "Slides" : tab === "blog" ? "Blog" : tab === "tags" ? "Tags" : tab === "hero" ? "Héro" : "Vignette"}
            </button>
          ))}
        </div>

        {activeTab === "slides" && (
          <>
            <div className="space-y-3">
              {works.map((work, idx) => (
                <div key={work.id} className="flex items-center gap-4 bg-brand-steel/30 border border-brand-dark/10 p-4 rounded-sm hover:border-brand-dark/20 transition-colors">
                  <div className="w-20 h-14 shrink-0 bg-brand-dark/5 border border-brand-dark/10 overflow-hidden rounded-sm">
                    {work.imageUrl ? <img src={work.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-mono text-[20px] text-brand-gray/30">{idx + 1}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm text-brand-dark truncate font-bold">{work.title}</p>
                    <p className="font-mono text-[9px] text-brand-gray/60 truncate">{work.medium}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => { setEditingIndex(idx); setWorkIndex(idx); }} className="p-2 hover:bg-brand-dark/10 text-brand-dark/50 hover:text-brand-dark transition-colors rounded-sm cursor-pointer" title="Modifier">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {deleteConfirmIdx === idx ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteWork(idx)} className="px-2 py-1 bg-red-600 text-white font-mono text-[9px] rounded-sm cursor-pointer">Confirmer</button>
                        <button onClick={() => setDeleteConfirmIdx(null)} className="px-2 py-1 bg-brand-dark/10 text-brand-dark font-mono text-[9px] rounded-sm cursor-pointer">Annuler</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirmIdx(idx)} className="p-2 hover:bg-red-100 text-brand-dark/50 hover:text-red-600 transition-colors rounded-sm cursor-pointer" title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addWork} className="mt-4 w-full py-3 border-2 border-dashed border-brand-dark/10 hover:border-brand-rust/40 text-brand-gray hover:text-brand-rust font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer rounded-sm flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Ajouter un slide
            </button>
          </>
        )}

        {activeTab === "blog" && selectedArtistId && (
          <ArtistBlogEdit artistId={selectedArtistId} />
        )}
        {activeTab === "tags" && selectedArtistId && <ArtistPageTags artistId={selectedArtistId} />}
        {activeTab === "hero" && selectedArtistId && <ArtistHeroImage artistId={selectedArtistId} />}
        {activeTab === "vignette" && selectedArtistId && <ArtistVignetteImage artistId={selectedArtistId} />}
      </div>
    );
  }

  // EDIT VIEW
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setEditingIndex(null); setDirty(false); }} className="w-8 h-8 flex items-center justify-center bg-brand-dark/5 hover:bg-brand-dark/10 rounded-sm transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-dark">Slide {editingIndex! + 1}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest rounded-sm transition-all cursor-pointer flex items-center gap-1.5 ${savedFlash ? "bg-emerald-600 text-white" : dirty ? "bg-brand-rust text-brand-light hover:brightness-110" : "bg-brand-dark/10 text-brand-dark/30 cursor-not-allowed"}`} disabled={!dirty && !savedFlash}>
            {savedFlash ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Sauvegardé</> : <><Save className="w-3 h-3" /> Enregistrer</>}
          </button>
        </div>
      </div>

      {/* Work selector */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setWorkIndex((i) => Math.max(0, i - 1))} disabled={workIndex === 0} className="w-8 h-8 flex items-center justify-center bg-brand-dark/5 hover:bg-brand-dark/10 disabled:opacity-20 rounded-sm transition-all cursor-pointer disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-mono text-[11px] text-brand-dark/60">
          Slide {workIndex + 1} / {works.length}
        </span>
        <button onClick={() => setWorkIndex((i) => Math.min(works.length - 1, i + 1))} disabled={workIndex >= works.length - 1} className="w-8 h-8 flex items-center justify-center bg-brand-dark/5 hover:bg-brand-dark/10 disabled:opacity-20 rounded-sm transition-all cursor-pointer disabled:cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Image */}
      <div className="mb-6">
        <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-2">Image du slide</label>
        {current.imageUrl && (
          <div className="aspect-video mb-3 rounded-sm overflow-hidden bg-brand-dark/5 border border-brand-dark/10 max-w-lg">
            <img src={current.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <ImagePicker onSelect={(url) => updateField("imageUrl", url)} />
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Titre</label>
          <input type="text" value={current.title} onChange={(e) => updateField("title", e.target.value)} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" />
        </div>
        <div>
          <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Année</label>
          <input type="number" value={current.year} onChange={(e) => updateField("year", parseInt(e.target.value) || new Date().getFullYear())} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" />
        </div>
        <div>
          <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Technique / Medium</label>
          <input type="text" value={current.medium} onChange={(e) => updateField("medium", e.target.value)} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" />
        </div>
        <div>
          <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Description</label>
          <WysiwygEditor value={current.description || ""} onChange={(html) => updateField("description", html)} />
        </div>
        <div>
          <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Tags</label>
          <TagEditor
            tags={current.tags || []}
            onChange={(tags) => {
              setWorks((prev) => {
                const next = [...prev];
                next[workIndex] = { ...next[workIndex], tags };
                return next;
              });
              setDirty(true);
            }}
            suggestions={getAllGlobalTags()}
          />
        </div>
      </div>

      {dirty && <p className="font-mono text-[10px] text-brand-rust mt-4">Modifications non enregistrées</p>}
    </div>
  );
}

function ArtistPageTags({ artistId }: { artistId: string }) {
  const [tags, setTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`morinerie_artist_tags_${artistId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const savedSnapshot = useRef(JSON.stringify(tags));

  useEffect(() => {
    const currentKey = JSON.stringify(tags);
    if (currentKey === savedSnapshot.current) return;
    savedSnapshot.current = currentKey;
    localStorage.setItem(`morinerie_artist_tags_${artistId}`, JSON.stringify(tags));
    const timeout = setTimeout(async () => {
      try {
        await fetch(`/api/content/morinerie_artist_tags_${artistId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: JSON.stringify(tags) }),
        });
        toast.success("Les tags ont bien été sauvegardés");
      } catch {
        toast.error("Erreur lors de la sauvegarde des tags");
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [tags]);

  const tagSuggestions = useMemo(() => getAllGlobalTags(), []);

  const [disciplines, setDisciplines] = useState<string[]>(() => getDisciplines(artistId));
  const discSnapshot = useRef(JSON.stringify(disciplines));

  useEffect(() => {
    const cur = JSON.stringify(disciplines);
    if (cur === discSnapshot.current) return;
    discSnapshot.current = cur;
    saveDisciplines(artistId, disciplines);
  }, [disciplines]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-display text-lg uppercase tracking-wide text-brand-dark">Tags</h3>
        <p className="font-mono text-[10px] text-brand-gray">Ces tags s'affichent sur votre page et servent de suggestions pour vos slides et articles.</p>
        <TagEditor tags={tags} onChange={setTags} suggestions={tagSuggestions} />
      </div>
      <div className="border-t border-brand-dark/10 pt-6 space-y-4">
        <h3 className="font-display text-lg uppercase tracking-wide text-brand-dark">Disciplines</h3>
        <p className="font-mono text-[10px] text-brand-gray">Disciplines artistiques de l'artiste (affichées dans les fiches et la galerie).</p>
        <TagEditor tags={disciplines} onChange={setDisciplines} suggestions={tagSuggestions} chipClassName="bg-brand-rust/10 border border-brand-rust/20 text-brand-rust" />
      </div>
    </div>
  );
}

function useImageStorage(artistId: string, key: string, fallbackUrl?: string) {
  const storageKey = `morinerie_artist_${key}_${artistId}`;
  const [url, setUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return saved;
    } catch {}
    return fallbackUrl || "";
  });
  const snapshotRef = useRef(url);

  useEffect(() => {
    if (url === snapshotRef.current) return;
    snapshotRef.current = url;
    localStorage.setItem(storageKey, url);
    const timeout = setTimeout(async () => {
      try {
        await fetch(`/api/content/${storageKey}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: url }),
        });
        toast.success(`L'image ${key === "hero" ? "de couverture" : "de vignette"} a bien été mise à jour`);
      } catch {
        toast.error("Erreur lors de la sauvegarde de l'image");
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [url]);

  return { url, setUrl, storageKey };
}

function ArtistHeroImage({ artistId }: { artistId: string }) {
  const { url, setUrl } = useImageStorage(artistId, "hero");

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg uppercase tracking-wide text-brand-dark">Image Héro</h3>
      <p className="font-mono text-[10px] text-brand-gray">Image d'en-tête de votre page artiste.</p>
      {url && (
        <div className="aspect-video max-w-lg rounded-sm overflow-hidden bg-brand-dark/5 border border-brand-dark/10">
          <img src={url} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div>
        <ImagePicker onSelect={setUrl} />
      </div>
    </div>
  );
}

