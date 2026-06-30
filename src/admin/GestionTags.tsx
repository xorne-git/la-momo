import { useState, useMemo, type KeyboardEvent } from "react";
import { Plus, X, Pencil, Check, Trash2, AlertCircle, Search } from "lucide-react";
import { getAllGlobalTags, getGlobalTagPool, saveGlobalTagPool } from "../utils/tags";
import { toast } from "../utils/toast";

export default function GestionTags() {
  const [globalTags, setGlobalTags] = useState<string[]>(() => {
    const existing = getGlobalTagPool();
    if (existing.length > 0) return existing;
    const all = getAllGlobalTags();
    if (all.length > 0) saveGlobalTagPool(all);
    return all;
  });
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const allTags = useMemo(() => getAllGlobalTags(), [globalTags]);

  const filteredTags = useMemo(() => {
    if (!search.trim()) return [...globalTags].sort();
    const q = search.trim().toUpperCase();
    return [...globalTags].filter((t) => t.includes(q)).sort();
  }, [globalTags, search]);

  const addTag = () => {
    const trimmed = input.trim().toUpperCase();
    if (!trimmed) return;
    if (globalTags.includes(trimmed)) {
      toast.warning("Ce tag existe déjà");
      return;
    }
    const next = [...globalTags, trimmed];
    setGlobalTags(next);
    saveGlobalTagPool(next);
    setInput("");
    toast.success(`Tag #${trimmed} ajouté`);
  };

  const startEdit = (tag: string) => {
    setEditingTag(tag);
    setEditValue(tag);
  };

  const confirmEdit = () => {
    if (!editingTag) return;
    const trimmed = editValue.trim().toUpperCase();
    if (!trimmed) return;
    const next = globalTags.map((t) => t === editingTag ? trimmed : t);
    setGlobalTags(next);
    saveGlobalTagPool(next);
    setEditingTag(null);
    toast.success(`Tag #${trimmed} mis à jour`);
  };

  const deleteTag = (tag: string) => {
    const next = globalTags.filter((t) => t !== tag);
    setGlobalTags(next);
    saveGlobalTagPool(next);
    setDeleteConfirm(null);
    toast.success(`Tag #${tag} supprimé`);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") addTag();
    if (e.key === "Escape") setInput("");
  };

  const handleEditKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") confirmEdit();
    if (e.key === "Escape") setEditingTag(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h2 className="font-display text-2xl uppercase tracking-wide text-brand-dark mb-6">Gestion des tags</h2>

      {/* Add new tag */}
      <div className="bg-brand-steel/30 border border-brand-dark/10 p-4 rounded-sm mb-8">
        <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-2">Ajouter un tag</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="NOUVEAU TAG"
            className="flex-1 bg-brand-light border border-brand-dark/10 text-brand-dark font-mono text-xs uppercase tracking-wider px-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors"
          />
          <button onClick={addTag} className="px-4 py-2.5 bg-brand-rust text-brand-light rounded-sm hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest">
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un tag..."
          className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-mono text-xs uppercase tracking-wider pl-10 pr-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray hover:text-brand-dark transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Global tags list */}
      <div className="space-y-1">
        {globalTags.length === 0 ? (
          <div className="flex items-center gap-2 py-8 text-brand-dark/40 justify-center">
            <AlertCircle className="w-4 h-4" />
            <span className="font-mono text-[10px]">Aucun tag pour le moment</span>
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="flex items-center gap-2 py-8 text-brand-dark/40 justify-center">
            <AlertCircle className="w-4 h-4" />
            <span className="font-mono text-[10px]">Aucun tag correspondant à votre recherche</span>
          </div>
        ) : (
          filteredTags.map((tag) => (
            <div key={tag} className="flex items-center gap-3 bg-brand-steel/20 border border-brand-dark/10 px-4 py-2.5 rounded-sm group/tag hover:border-brand-dark/20 transition-colors">
              {editingTag === tag ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    autoFocus
                    className="flex-1 bg-brand-light border border-brand-rust text-brand-dark font-mono text-xs uppercase px-3 py-1.5 rounded-sm focus:outline-none"
                  />
                  <button onClick={confirmEdit} className="w-7 h-7 flex items-center justify-center bg-emerald-600 text-white rounded-sm hover:brightness-110 transition-all cursor-pointer">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditingTag(null)} className="w-7 h-7 flex items-center justify-center bg-brand-dark/10 text-brand-dark rounded-sm hover:bg-brand-dark/20 transition-all cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-mono text-xs uppercase tracking-wider text-brand-dark flex-1">#{tag}</span>
                  <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded-sm ${allTags.filter((t) => t === tag).length > 0 ? "bg-brand-rust/10 text-brand-rust" : "bg-brand-dark/5 text-brand-gray"}`}>
                    {allTags.filter((t) => t === tag).length > 0 ? "Utilisé" : "Non utilisé"}
                  </span>
                  <button onClick={() => startEdit(tag)} className="w-7 h-7 flex items-center justify-center text-brand-dark/30 hover:text-brand-dark transition-colors cursor-pointer opacity-0 group-hover/tag:opacity-100">
                    <Pencil className="w-3 h-3" />
                  </button>
                  {deleteConfirm === tag ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => deleteTag(tag)} className="px-2 py-1 bg-red-600 text-white font-mono text-[8px] rounded-sm cursor-pointer">Confirmer</button>
                      <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-brand-dark/10 text-brand-dark font-mono text-[8px] rounded-sm cursor-pointer">Annuler</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(tag)} className="w-7 h-7 flex items-center justify-center text-brand-dark/30 hover:text-red-600 transition-colors cursor-pointer opacity-0 group-hover/tag:opacity-100">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
