import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Save, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "../utils/toast";
import type { ArtistBlogPost, Artist } from "../types";
import { ARTISTS } from "../data";
import ImagePicker from "../admin-core/ImagePicker";
import WysiwygEditor from "../admin-core/WysiwygEditor";
import TagEditor from "../admin-core/TagEditor";
import { getAllGlobalTags } from "../utils/tags";

function loadPosts(artistId: string): ArtistBlogPost[] {
  try {
    const saved = localStorage.getItem(`morinerie_artist_blog_${artistId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

let _pendingSave: ReturnType<typeof setTimeout> | null = null;
function savePosts(artistId: string, posts: ArtistBlogPost[]) {
  localStorage.setItem(`morinerie_artist_blog_${artistId}`, JSON.stringify(posts));
  if (_pendingSave) clearTimeout(_pendingSave);
  _pendingSave = setTimeout(() => {
    fetch(`/api/content/morinerie_artist_blog_${artistId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(posts) }),
    }).catch(() => {});
  }, 2000);
}

export default function ArtistBlogEdit({ artistId, onBack }: { artistId: string; onBack?: () => void }) {
  const { isAdmin, currentUser } = useAuth();
  const isArtist = currentUser?.role === "artiste";
  const [posts, setPosts] = useState<ArtistBlogPost[]>(() => loadPosts(artistId));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [postIndex, setPostIndex] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);
  const [deleteImgIdx, setDeleteImgIdx] = useState<number | null>(null);

  if (!isAdmin && !isArtist) return null;

  const current = postIndex < posts.length
    ? posts[postIndex]
    : { id: `blog-${Date.now()}`, artistId, title: "", date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }), category: "Général", content: "", imageUrl: "" } as ArtistBlogPost;

  const currentBlogImages = current.images && current.images.length > 0 ? current.images : (current.imageUrl ? [current.imageUrl] : []);

  const addBlogImage = (url: string) => {
    setPosts((prev) => {
      const next = [...prev];
      const base = postIndex < prev.length ? next[postIndex] : { id: `blog-${Date.now()}`, artistId, title: "", date: "", category: "", content: "", imageUrl: "" };
      next[postIndex] = { ...base, images: [...currentBlogImages, url], imageUrl: url };
      return next;
    });
    setDirty(true);
  };

  const removeBlogImg = (idx: number) => {
    setPosts((prev) => {
      const next = [...prev];
      const base = postIndex < prev.length ? next[postIndex] : { id: `blog-${Date.now()}`, artistId, title: "", date: "", category: "", content: "", imageUrl: "" };
      const updated = currentBlogImages.filter((_, i) => i !== idx);
      next[postIndex] = { ...base, images: updated.length > 0 ? updated : undefined, imageUrl: updated.length > 0 ? updated[0] : "" };
      return next;
    });
    setDirty(true);
    setDeleteImgIdx(null);
  };

  const updateField = (field: keyof ArtistBlogPost, value: string) => {
    setPosts((prev) => {
      const next = [...prev];
      const base = postIndex < prev.length ? next[postIndex] : { id: `blog-${Date.now()}`, artistId, title: "", date: "", category: "", content: "", imageUrl: "" };
      next[postIndex] = { ...base, [field]: value };
      return next;
    });
    setDirty(true);
  };

  const handleSave = () => {
    let next = posts;
    if (editingIndex !== null && editingIndex >= posts.length) {
      const newPost: ArtistBlogPost = {
        id: `blog-${Date.now()}`,
        artistId,
        title: current.title || "Nouvel article",
        date: current.date || new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
        category: current.category || "Général",
        content: current.content || "",
        imageUrl: current.imageUrl || "",
      };
      next = [...posts, newPost];
      setPosts(next);
    }
    savePosts(artistId, next);
    setEditingIndex(null);
    setDirty(false);
    toast.success("L'article a bien été sauvegardé");
  };

  const addPost = () => {
    setEditingIndex(posts.length);
    setPostIndex(posts.length);
  };

  const deletePost = (idx: number) => {
    setPosts((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      savePosts(artistId, next);
      return next;
    });
    setDeleteConfirmIdx(null);
    setDirty(true);
    if (editingIndex === idx) setEditingIndex(null);
    toast.success("Article supprimé");
  };

  // LIST VIEW
  if (editingIndex === null) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg uppercase tracking-wide text-brand-dark">Blog / Articles</h3>
          {onBack && (
            <button onClick={onBack} className="w-7 h-7 flex items-center justify-center bg-brand-dark/5 hover:bg-brand-dark/10 rounded-sm transition-colors cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {posts.length === 0 ? (
          <p className="font-mono text-[11px] text-brand-gray py-6 text-center border border-dashed border-brand-dark/10 rounded-sm">
            Aucun article pour le moment
          </p>
        ) : (
          <div className="space-y-2">
            {posts.map((post, idx) => (
              <div key={post.id} className="flex items-center gap-3 bg-brand-steel/30 border border-brand-dark/10 p-3 rounded-sm hover:border-brand-dark/20 transition-colors">
                <div className="w-12 h-10 shrink-0 bg-brand-dark/5 border border-brand-dark/10 overflow-hidden rounded-sm">
                  {post.imageUrl ? <img src={post.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-mono text-[16px] text-brand-gray/30">{idx + 1}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xs text-brand-dark truncate font-bold">{post.title}</p>
                  <p className="font-mono text-[8px] text-brand-gray/60">{post.date} — {post.category}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setEditingIndex(idx); setPostIndex(idx); }} className="p-1.5 hover:bg-brand-dark/10 text-brand-dark/50 hover:text-brand-dark transition-colors rounded-sm cursor-pointer" title="Modifier">
                    <Pencil className="w-3 h-3" />
                  </button>
                  {deleteConfirmIdx === idx ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => deletePost(idx)} className="px-1.5 py-0.5 bg-red-600 text-white font-mono text-[8px] rounded-sm cursor-pointer">Oui</button>
                      <button onClick={() => setDeleteConfirmIdx(null)} className="px-1.5 py-0.5 bg-brand-dark/10 text-brand-dark font-mono text-[8px] rounded-sm cursor-pointer">Non</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirmIdx(idx)} className="p-1.5 hover:bg-red-100 text-brand-dark/50 hover:text-red-600 transition-colors rounded-sm cursor-pointer" title="Supprimer">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={addPost} className="w-full py-2.5 border-2 border-dashed border-brand-dark/10 hover:border-brand-rust/40 text-brand-gray hover:text-brand-rust font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer rounded-sm flex items-center justify-center gap-2">
          <Plus className="w-3.5 h-3.5" /> Ajouter un article
        </button>
      </div>
    );
  }

  // EDIT VIEW
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditingIndex(null); setDirty(false); }} className="w-7 h-7 flex items-center justify-center bg-brand-dark/5 hover:bg-brand-dark/10 rounded-sm transition-colors cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <h3 className="font-display text-lg uppercase tracking-wide text-brand-dark">Article {editingIndex! + 1}</h3>
        </div>
        <button onClick={handleSave} className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest rounded-sm transition-all cursor-pointer flex items-center gap-1.5 ${dirty ? "bg-brand-rust text-brand-light hover:brightness-110" : "bg-brand-dark/10 text-brand-dark/30 cursor-not-allowed"}`} disabled={!dirty}>
          <Save className="w-3 h-3" /> Enregistrer
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setPostIndex((i) => Math.max(0, i - 1))} disabled={postIndex === 0} className="w-7 h-7 flex items-center justify-center bg-brand-dark/5 hover:bg-brand-dark/10 disabled:opacity-20 rounded-sm transition-all cursor-pointer disabled:cursor-not-allowed">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[10px] text-brand-dark/60">Article {postIndex + 1} / {posts.length}</span>
        <button onClick={() => setPostIndex((i) => Math.min(posts.length - 1, i + 1))} disabled={postIndex >= posts.length - 1} className="w-7 h-7 flex items-center justify-center bg-brand-dark/5 hover:bg-brand-dark/10 disabled:opacity-20 rounded-sm transition-all cursor-pointer disabled:cursor-not-allowed">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Images */}
      <div>
        <label className="block font-mono text-[8px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Images ({current.images?.length || (current.imageUrl ? 1 : 0)})</label>
        {(() => {
          const imgs = current.images && current.images.length > 0 ? current.images : (current.imageUrl ? [current.imageUrl] : []);
          return imgs.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 mb-2 max-w-sm">
              {imgs.map((img, i) => (
                <div key={i} className="relative aspect-video bg-brand-dark/5 border border-brand-dark/10 rounded-sm overflow-hidden group/img">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  {deleteImgIdx === i ? (
                    <div className="absolute inset-0 bg-brand-dark/70 flex items-center justify-center gap-1.5">
                      <button onClick={() => removeBlogImg(i)} className="px-2 py-1 bg-red-600 text-white font-mono text-[8px] rounded-sm cursor-pointer">Confirmer</button>
                      <button onClick={() => setDeleteImgIdx(null)} className="px-2 py-1 bg-white/20 text-white font-mono text-[8px] rounded-sm cursor-pointer">Annuler</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteImgIdx(i)} className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center bg-black/30 hover:bg-red-600 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-all cursor-pointer">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : null;
        })()}
        <div>
          <ImagePicker onSelect={(url) => addBlogImage(url)} />
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <div>
          <label className="block font-mono text-[8px] text-brand-gray uppercase tracking-widest font-bold mb-1">Titre</label>
          <input type="text" value={current.title} onChange={(e) => updateField("title", e.target.value)} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" />
        </div>
        <div>
          <label className="block font-mono text-[8px] text-brand-gray uppercase tracking-widest font-bold mb-1">Catégorie</label>
          <input type="text" value={current.category} onChange={(e) => updateField("category", e.target.value)} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" placeholder="ex: Atelier, Technique, Événement" />
        </div>
        <div>
          <label className="block font-mono text-[8px] text-brand-gray uppercase tracking-widest font-bold mb-1">Date</label>
          <input
            type="date"
            value={(() => {
              const d = new Date(current.date);
              return isNaN(d.getTime()) ? new Date().toISOString().split("T")[0] : d.toISOString().split("T")[0];
            })()}
            onChange={(e) => {
              const d = new Date(e.target.value + "T12:00:00");
              updateField("date", d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }));
            }}
            className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-brand-rust transition-colors"
          />
        </div>
        <div>
          <label className="block font-mono text-[8px] text-brand-gray uppercase tracking-widest font-bold mb-1">Contenu</label>
          <WysiwygEditor
            value={current.content}
            onChange={(html) => updateField("content", html)}
            inline
          />
      </div>
        <div>
          <label className="block font-mono text-[8px] text-brand-gray uppercase tracking-widest font-bold mb-1">Tags</label>
          <TagEditor
            tags={current.tags || []}
            onChange={(newTags) => {
              setPosts((prev) => {
                const next = [...prev];
                next[postIndex] = { ...next[postIndex], tags: newTags };
                return next;
              });
              setDirty(true);
            }}
            suggestions={getAllGlobalTags()}
          />
        </div>
      </div>

      {dirty && <p className="font-mono text-[9px] text-brand-rust">Modifications non enregistrées</p>}
    </div>
  );
}
