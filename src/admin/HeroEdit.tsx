import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Save, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import ImagePicker from "./ImagePicker";
import { useAuth } from "../context/AuthContext";
import { toast } from "../utils/toast";

const HERO_STORAGE_KEY = "morinerie_hero_slides";

export interface HeroSlide {
  image: string;
  sub: string;
  title: string;
  desc: string;
  code: string;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    image: "",
    sub: "Événement Annuel — Saint-Pierre-des-Corps",
    title: "Portes Ouvertes\nÉdition 2026",
    desc: "Plongez au cœur de l'effervescence créative : 70 ateliers ouverts, expositions monumentales, performances et rencontres privilégiées avec les artistes.",
    code: "PORTE_OUVERTE_2026",
  },
  {
    image: "",
    sub: "Friche Industrielle d'exception — Saint-Pierre-des-Corps",
    title: "La Mémoire\n& Le Geste",
    desc: "Ancien centre de chaudronnerie lourde de la SNCF métamorphosé en pôle de création autonome.",
    code: "SNCF_KP_192.4",
  },
  {
    image: "",
    sub: "70 Ateliers de Création brute",
    title: "Faire Parler\nLa Matière",
    desc: "Où l'acier, le bois noble, le verre et la porcelaine fusionnent dans la brutalité du béton historique.",
    code: "COOP_MORINERIE_37",
  },
  {
    image: "",
    sub: "Une Cathédrale Lumineuse",
    title: "L'Espace\net Le Silence",
    desc: "15 000 m² libérés pour donner aux artistes plasticiens, fondeurs et sculpteurs l'audace du format monumental.",
    code: "EIFFEL_GRID_90",
  },
];

// Load or fallback
export function loadHeroSlides(): HeroSlide[] {
  try {
    const saved = localStorage.getItem(HERO_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_SLIDES;
}

// Async fetch from server API (call on mount to pull shared data)
export async function fetchHeroSlidesFromApi(): Promise<HeroSlide[] | null> {
  try {
    const res = await fetch("/api/content/morinerie_hero_slides");
    if (res.ok) {
      const data = await res.json();
      if (data.value) {
        const parsed = JSON.parse(data.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(HERO_STORAGE_KEY, data.value);
          return parsed;
        }
      }
    }
  } catch {}
  return null;
}

let _heroPendingSave: ReturnType<typeof setTimeout> | null = null;
export function saveHeroSlides(slides: HeroSlide[]) {
  localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(slides));
  if (_heroPendingSave) clearTimeout(_heroPendingSave);
  _heroPendingSave = setTimeout(() => {
    fetch("/api/content/morinerie_hero_slides", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(slides) }),
    }).catch(() => {});
  }, 2000);
}

export function resetHeroSlides() {
  localStorage.removeItem(HERO_STORAGE_KEY);
  fetch("/api/content/morinerie_hero_slides", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: "" }),
  }).catch(() => {});
}

export default function HeroEdit() {
  const { isAdmin } = useAuth();
  const [slides, setSlides] = useState<HeroSlide[]>(loadHeroSlides());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [pendingEditIndex, setPendingEditIndex] = useState<number | null>(null);
  const savedRef = useRef<HeroSlide[]>(loadHeroSlides());

  useEffect(() => {
    if (pendingEditIndex !== null) {
      setEditingIndex(pendingEditIndex);
      setSlideIndex(pendingEditIndex);
      setPendingEditIndex(null);
    }
  }, [pendingEditIndex]);

  const cancelEditing = () => {
    if (editingIndex !== null && editingIndex >= slides.length) {
      setEditingIndex(null);
    } else {
      setSlides(savedRef.current.map((s) => ({ ...s })));
      setEditingIndex(null);
      setDirty(false);
    }
  };


  useEffect(() => {
    if (!lightboxUrl) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxUrl(null); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxUrl]);

  const current = slideIndex < slides.length ? slides[slideIndex] : { image: "", sub: "", title: "", desc: "", code: "" } as HeroSlide;

  const updateField = (field: keyof HeroSlide, value: string) => {
    setSlides((prev) => {
      const next = [...prev];
      next[slideIndex] = { ...next[slideIndex], [field]: value };
      return next;
    });
    setDirty(true);
  };

  const handleSave = () => {
    let next = slides;
    if (editingIndex !== null && editingIndex >= slides.length) {
      const newSlide: HeroSlide = {
        image: current.image || "",
        sub: current.sub || "",
        title: current.title || "Nouveau slide",
        desc: current.desc || "",
        code: current.code || "",
      };
      next = [...slides, newSlide];
      setSlides(next);
    }
    saveHeroSlides(next);
    savedRef.current = next.map((s) => ({ ...s }));
    setEditingIndex(null);
    setDirty(false);
    toast.success("Le diaporama a bien été sauvegardé");
  };

  const addSlide = () => {
    setEditingIndex(slides.length);
    setSlideIndex(slides.length);
  };

  const deleteSlide = (idx: number) => {
    setSlides((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      saveHeroSlides(next);
      savedRef.current = next.map((s) => ({ ...s }));
      return next;
    });
    setDeleteConfirmIdx(null);
    setDirty(true);
    if (editingIndex === idx) setEditingIndex(null);
    toast.success("Slide supprimé");
  };

  if (!isAdmin) return null;

  // LIST VIEW
  if (editingIndex === null) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-dark">Héro — Diaporama</h2>
        </div>

        <div className="space-y-3">
          {slides.map((slide, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-brand-steel/30 border border-brand-dark/10 p-4 rounded-sm hover:border-brand-dark/20 transition-colors">
              <div className="w-20 h-14 shrink-0 bg-brand-dark/5 border border-brand-dark/10 overflow-hidden rounded-sm">
                {slide.image ? <img src={slide.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-mono text-[20px] text-brand-gray/30">{idx + 1}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm text-brand-dark truncate font-bold">{slide.title.replace("\\n", " ")}</p>
                <p className="font-mono text-[9px] text-brand-gray/60 truncate">{slide.sub}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => { setEditingIndex(idx); setSlideIndex(idx); }} className="p-2 hover:bg-brand-dark/10 text-brand-dark/50 hover:text-brand-dark transition-colors rounded-sm cursor-pointer" title="Modifier">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {deleteConfirmIdx === idx ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => deleteSlide(idx)} className="px-2 py-1 bg-red-600 text-white font-mono text-[9px] rounded-sm cursor-pointer">Confirmer</button>
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

        <button onClick={addSlide} className="mt-4 w-full py-3 border-2 border-dashed border-brand-dark/10 hover:border-brand-rust/40 text-brand-gray hover:text-brand-rust font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer rounded-sm flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Ajouter un slide
        </button>
      </div>
    );
  }

  // EDIT VIEW
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={cancelEditing} className="w-8 h-8 flex items-center justify-center bg-brand-dark/5 hover:bg-brand-dark/10 rounded-sm transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-dark">Slide {editingIndex! + 1}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest rounded-[4px] transition-all cursor-pointer flex items-center gap-1.5 ${savedFlash ? "bg-emerald-600 text-white" : dirty ? "bg-brand-rust text-brand-light hover:brightness-110" : "bg-brand-dark/10 text-brand-dark/30 cursor-not-allowed"}`} disabled={!dirty && !savedFlash}>
            {savedFlash ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Sauvegardé</> : <><Save className="w-3 h-3" /> Enregistrer</>}
          </button>
        </div>
      </div>

      {/* Slide selector */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setSlideIndex((i) => Math.max(0, i - 1))} disabled={slideIndex === 0} className="w-8 h-8 flex items-center justify-center bg-brand-dark/5 hover:bg-brand-dark/10 disabled:opacity-20 rounded-[4px] transition-all cursor-pointer disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-mono text-[11px] text-brand-dark/60">
          Slide {slideIndex + 1} / {slides.length}
        </span>
        <button onClick={() => setSlideIndex((i) => Math.min(slides.length - 1, i + 1))} disabled={slideIndex >= slides.length - 1} className="w-8 h-8 flex items-center justify-center bg-brand-dark/5 hover:bg-brand-dark/10 disabled:opacity-20 rounded-[4px] transition-all cursor-pointer disabled:cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Image */}
      <div className="mb-6">
        <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-2">Image de fond</label>
        {current.image && (
          <div className="aspect-video mb-3 rounded-[4px] overflow-hidden bg-brand-dark/5 border border-brand-dark/10 max-w-lg cursor-pointer group relative">
            <img src={current.image} alt="" className="w-full h-full object-cover" onClick={() => setLightboxUrl(current.image)} />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all duration-200 pointer-events-none">
              <span className="opacity-0 group-hover:opacity-100 text-brand-light text-xs font-mono tracking-wider bg-black/40 px-3 py-1.5 rounded-[4px] transition-opacity">Agrandir</span>
            </div>
          </div>
        )}
        <div>
          <ImagePicker onSelect={(url) => updateField("image", url)} />
        </div>
      </div>

      {/* Text fields */}
      <div className="space-y-4">
        <div>
          <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Sous-titre</label>
          <input type="text" value={current.sub} onChange={(e) => updateField("sub", e.target.value)} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-[4px] focus:outline-none focus:border-brand-rust transition-colors" />
        </div>
        <div>
          <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Titre</label>
          <textarea value={current.title} onChange={(e) => updateField("title", e.target.value)} rows={3} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-[4px] focus:outline-none focus:border-brand-rust transition-colors resize-y" placeholder="Utilisez \n pour les sauts de ligne" />
          <p className="font-mono text-[8px] text-brand-gray/40 mt-1">Les sauts de ligne sont marqués par \n</p>
        </div>
        <div>
          <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Description</label>
          <textarea value={current.desc} onChange={(e) => updateField("desc", e.target.value)} rows={3} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-[4px] focus:outline-none focus:border-brand-rust transition-colors resize-y" />
        </div>
        <div>
          <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Code de référence</label>
          <input type="text" value={current.code} onChange={(e) => updateField("code", e.target.value)} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-[4px] focus:outline-none focus:border-brand-rust transition-colors" />
        </div>
      </div>

      {dirty && <p className="font-mono text-[10px] text-brand-rust mt-4">Modifications non enregistrées</p>}

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4 md:p-10 cursor-zoom-out" onClick={() => setLightboxUrl(null)}>
          <button onClick={() => setLightboxUrl(null)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-brand-light/60 hover:text-brand-light bg-black/40 hover:bg-black/60 rounded-full transition-all cursor-pointer z-10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          <img src={lightboxUrl} alt="Aperçu" className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
