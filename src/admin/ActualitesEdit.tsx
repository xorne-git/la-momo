import React, { useState, useEffect, useRef } from "react";
import { Save, ChevronLeft, ChevronRight, X, Plus, Pencil, Trash2, ArrowLeft, Eye } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "../utils/toast";
import { NewsItem } from "../types";
import { NEWS_ITEMS } from "../data";
import { sortNewsByDate } from "../utils/sortNews";
import WysiwygEditor from "./WysiwygEditor";
import ImagePicker from "./ImagePicker";
import TagEditor from "./TagEditor";
import { getAllGlobalTags } from "../utils/tags";

const ACTU_STORAGE_KEY = "morinerie_actualites";

function loadActus(): NewsItem[] {
  try {
    const saved = localStorage.getItem(ACTU_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return sortNewsByDate(parsed);
    }
  } catch {}
  return sortNewsByDate(NEWS_ITEMS);
}

let _pendingSave: ReturnType<typeof setTimeout> | null = null;
function saveActus(items: NewsItem[]) {
  localStorage.setItem(ACTU_STORAGE_KEY, JSON.stringify(items));
  // Defer API sync — avoid triggering Vite HMR via DB write during render
  if (_pendingSave) clearTimeout(_pendingSave);
  _pendingSave = setTimeout(() => {
    fetch("/api/content/morinerie_actualites", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(items) }),
    }).catch(() => {});
  }, 2000);
}

function resetActus() {
  localStorage.removeItem(ACTU_STORAGE_KEY);
  fetch("/api/content/morinerie_actualites", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: "" }),
  }).catch(() => {});
}

export async function fetchActusFromApi(): Promise<NewsItem[] | null> {
  try {
    const res = await fetch("/api/content/morinerie_actualites");
    if (res.ok) {
      const data = await res.json();
      if (data.value) {
        const parsed = JSON.parse(data.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(ACTU_STORAGE_KEY, data.value);
          return sortNewsByDate(parsed);
        }
      }
    }
  } catch {}
  return null;
}

export default function ActualitesEdit({ onViewClick }: { onViewClick?: () => void }) {
  const { isAdmin, currentUser } = useAuth();
  const [items, setItems] = useState<NewsItem[]>(loadActus);
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // null = list view
  const [itemIndex, setItemIndex] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [deleteImgIdx, setDeleteImgIdx] = useState<number | null>(null);
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [showWysiwyg, setShowWysiwyg] = useState(false);
  const [contentDraft, setContentDraft] = useState("");
  const [pendingEditIndex, setPendingEditIndex] = useState<number | null>(null);
  const savedRef = useRef<NewsItem[]>(loadActus());

  // Navigate to edit view after items state settles
  useEffect(() => {
    if (pendingEditIndex !== null) {
      setEditingIndex(pendingEditIndex);
      setItemIndex(pendingEditIndex);
      setPendingEditIndex(null);
    }
  }, [pendingEditIndex]);

  // On mount, check for a news item to edit directly from the frontend
  useEffect(() => {
    const editId = localStorage.getItem("morinerie_edit_actu_id");
    if (editId) {
      localStorage.removeItem("morinerie_edit_actu_id");
      const idx = items.findIndex((item) => item.id === editId);
      if (idx >= 0) {
        setEditingIndex(idx);
        setItemIndex(idx);
      }
    }
  }, []);

  const cancelEditing = () => {
    if (editingIndex !== null && editingIndex >= items.length) {
      // New unsaved item — just go back, nothing to revert
      setEditingIndex(null);
    } else {
      setItems(savedRef.current.map((item) => ({ ...item })));
      setEditingIndex(null);
      setDirty(false);
    }
  };

  const current = itemIndex < items.length ? items[itemIndex] : { id: "new", title: "", subtitle: "", date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }), category: "Général", content: "", images: [], badgeLabel: "" } as NewsItem;

  const updateField = (field: keyof NewsItem, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      const base = itemIndex < prev.length ? next[itemIndex] : { id: `news-${Date.now()}`, title: "", subtitle: "", date: "", category: "", content: "", images: [], badgeLabel: "" };
      next[itemIndex] = { ...base, [field]: value };
      return next;
    });
    setDirty(true);
  };

  const addImage = (url: string) => {
    setItems((prev) => {
      const next = [...prev];
      const base = itemIndex < prev.length ? next[itemIndex] : { id: `news-${Date.now()}`, title: "", subtitle: "", date: "", category: "", content: "", images: [], badgeLabel: "" };
      next[itemIndex] = { ...base, images: [...(base.images || []), url] };
      return next;
    });
    setDirty(true);
  };

  const removeImage = (idx: number) => {
    setItems((prev) => {
      const next = [...prev];
      const base = itemIndex < prev.length ? next[itemIndex] : { id: `news-${Date.now()}`, title: "", subtitle: "", date: "", category: "", content: "", images: [], badgeLabel: "" };
      next[itemIndex] = { ...base, images: (base.images || []).filter((_, i) => i !== idx) };
      return next;
    });
    setDirty(true);
    setDeleteImgIdx(null);
  };

  const handleSave = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    saveActus(items);
    savedRef.current = items.map((item) => ({ ...item }));
    setEditingIndex(null);
    setDirty(false);
    toast.success("L'actualité a bien été sauvegardée");
  };

  const addItem = () => {
    // Just enter edit mode at the end of the list — item is created on save
    setEditingIndex(items.length);
    setItemIndex(items.length);
  };

  const deleteItem = (idx: number) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      saveActus(next);
      savedRef.current = next.map((i) => ({ ...i }));
      return next;
    });
    setDeleteConfirmIdx(null);
    setDirty(true);
    if (editingIndex === idx) { setEditingIndex(null); }
    toast.success("Actualité supprimée");
  };

  if (!isAdmin) return null;

  // LIST VIEW
  if (editingIndex === null) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-dark">Actualités</h2>
          {onViewClick && (
            <button onClick={onViewClick} className="font-mono text-[10px] uppercase tracking-widest text-brand-light bg-brand-rust hover:brightness-110 px-3 py-1.5 flex items-center gap-1.5 transition-all cursor-pointer rounded-sm">
              <Eye className="w-3 h-3" /> Voir les actus
            </button>
          )}
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-4 bg-brand-steel/30 border border-brand-dark/10 p-4 rounded-sm hover:border-brand-dark/20 transition-colors">
              <div className="w-16 h-16 shrink-0 bg-brand-dark/5 border border-brand-dark/10 overflow-hidden rounded-sm">
                {item.images[0] ? <img src={item.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-mono text-[18px] text-brand-gray/30">{idx + 1}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {item.badgeLabel && <span className="font-mono text-[8px] text-brand-dark/40 uppercase tracking-wider bg-brand-dark/5 px-1.5 py-0.5 rounded-sm">{item.badgeLabel}</span>}
                  <span className="font-mono text-[8px] text-brand-gray">{item.date}</span>
                </div>
                <p className="font-display text-sm text-brand-dark truncate font-bold">{item.title}</p>
                <p className="font-mono text-[9px] text-brand-gray/60 truncate">{item.subtitle}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => { setEditingIndex(idx); setItemIndex(idx); }} className="p-2 hover:bg-brand-dark/10 text-brand-dark/50 hover:text-brand-dark transition-colors rounded-sm cursor-pointer" title="Modifier">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {deleteConfirmIdx === idx ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => deleteItem(idx)} className="px-2 py-1 bg-red-600 text-white font-mono text-[9px] rounded-sm cursor-pointer">Confirmer</button>
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

        <button onClick={addItem} className="mt-4 w-full py-3 border-2 border-dashed border-brand-dark/10 hover:border-brand-rust/40 text-brand-gray hover:text-brand-rust font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer rounded-sm flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Ajouter une actualité
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
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-dark">Actualité {editingIndex! + 1}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSave(e); }} className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest rounded-sm transition-all cursor-pointer flex items-center gap-1.5 ${savedFlash ? "bg-emerald-600 text-white" : dirty ? "bg-brand-rust text-brand-light hover:brightness-110" : "bg-brand-dark/10 text-brand-dark/30 cursor-not-allowed"}`} disabled={!dirty && !savedFlash}>
            {savedFlash ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Sauvegardé</> : <><Save className="w-3 h-3" /> Enregistrer</>}
          </button>
        </div>
      </div>

      {/* Item selector */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setItemIndex((i) => Math.max(0, i - 1))} disabled={itemIndex === 0} className="w-8 h-8 flex items-center justify-center bg-brand-dark/5 hover:bg-brand-dark/10 disabled:opacity-20 rounded-sm transition-all cursor-pointer disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-mono text-[11px] text-brand-dark/60">
          Actualité {itemIndex + 1} / {items.length}
        </span>
        <button onClick={() => setItemIndex((i) => Math.min(items.length - 1, i + 1))} disabled={itemIndex >= items.length - 1} className="w-8 h-8 flex items-center justify-center bg-brand-dark/5 hover:bg-brand-dark/10 disabled:opacity-20 rounded-sm transition-all cursor-pointer disabled:cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Basic fields */}
      <div className="space-y-4 mb-8">
        <div>
          <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Badge</label>
          <input type="text" value={current.badgeLabel || ""} onChange={(e) => { updateField("badgeLabel", e.target.value); dirty || setDirty(true); }} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" placeholder="ex: APPEL À PROJETS" />
        </div>
        <div>
          <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Catégorie</label>
          <input type="text" value={current.category} onChange={(e) => updateField("category", e.target.value)} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" placeholder="ex: Résidence, Équipement, Exposition" />
        </div>

        <div>
          <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Titre</label>
          <input type="text" value={current.title} onChange={(e) => updateField("title", e.target.value)} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" />
        </div>
        <div>
          <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Sous-titre</label>
          <input type="text" value={current.subtitle} onChange={(e) => updateField("subtitle", e.target.value)} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" />
        </div>
        <div>
          <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Contenu</label>
          <div className="bg-brand-steel/50 border border-brand-dark/10 rounded-sm overflow-hidden">
            <div className="p-3 border-b border-brand-dark/5 flex items-center gap-2">
              <button onClick={() => { setContentDraft(current.content); setShowWysiwyg(true); }} className="px-3 py-1.5 bg-brand-dark/10 hover:bg-brand-dark/20 text-brand-dark/70 font-mono text-[9px] uppercase tracking-wider rounded-sm transition-colors cursor-pointer flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Éditeur avancé
              </button>
            </div>
            <div className="p-3 max-h-32 overflow-y-auto" dangerouslySetInnerHTML={{ __html: current.content }} />
          </div>
        </div>
        {showWysiwyg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setShowWysiwyg(false)}>
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl mx-4">
              <WysiwygEditor
                value={contentDraft}
                onChange={setContentDraft}
                onSave={(html) => { updateField("content", html); setShowWysiwyg(false); }}
                onClose={() => setShowWysiwyg(false)}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Tags</label>
          <TagEditor
            tags={current.tags || []}
            onChange={(newTags) => {
              setItems((prev) => {
                const next = [...prev];
                next[itemIndex] = { ...next[itemIndex], tags: newTags };
                return next;
              });
              setDirty(true);
            }}
            suggestions={getAllGlobalTags()}
          />
        </div>
      </div>

      {/* Images */}
      <div className="mb-8">
        <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-2">
          Images ({current.images.length})
        </label>
        
        {/* Current images */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {current.images.map((img, i) => (
            <div key={i} className="relative aspect-video bg-brand-dark/5 border border-brand-dark/10 rounded-sm overflow-hidden group/actuimg">
              <img src={img} alt="" className="w-full h-full object-cover" />
              {deleteImgIdx === i ? (
                <div className="absolute inset-0 bg-brand-dark/70 flex items-center justify-center gap-1.5">
                  <button onClick={() => removeImage(i)} className="px-2 py-1 bg-red-600 text-white font-mono text-[9px] rounded-sm cursor-pointer">Confirmer</button>
                  <button onClick={() => setDeleteImgIdx(null)} className="px-2 py-1 bg-white/20 text-white font-mono text-[9px] rounded-sm cursor-pointer">Annuler</button>
                </div>
              ) : (
                <button onClick={() => setDeleteImgIdx(i)} className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/30 hover:bg-red-600 text-white rounded-full opacity-0 group-hover/actuimg:opacity-100 transition-all cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        <ImagePicker onSelect={addImage} />
      </div>

      {dirty && (
        <p className="font-mono text-[10px] text-brand-rust">Modifications non enregistrées</p>
      )}
    </div>
  );
}
