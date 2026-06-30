import { useState, useEffect, useRef, type ReactNode } from "react";
import { Edit3, Loader2, X } from "lucide-react";
import WysiwygEditor from "./WysiwygEditor";
import { useAuth } from "../context/AuthContext";
import { useEditContext } from "./EditContext";
import { toast } from "../utils/toast";

interface InlineEditProps {
  storageKey: string;
  tag?: "span" | "div" | "p" | "h1" | "h2" | "h3" | "h4";
  className?: string;
  defaultHtml?: string;
  children: ReactNode;
}

async function saveToApi(key: string, value: string) {
  try {
    const res = await fetch(`/api/content/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function InlineEdit({ storageKey, tag: Tag = "span", className = "", defaultHtml, children }: InlineEditProps) {
  const { isAdmin } = useAuth();
  const { activeKey, dirtyKey, hoveredKey, requestEdit, releaseEdit, forceSwitchEdit, setDirty, setHovered } = useEditContext();
  const [publishedContent, setPublishedContent] = useState<string>("");
  const [draftContent, setDraftContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close if another editor takes the active slot
  useEffect(() => {
    if (isEditing && activeKey !== storageKey) {
      setDraftContent(null);
      setIsEditing(false);
    }
  }, [activeKey]);

  // On mount: try API first, fallback localStorage, fallback children
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/content/${storageKey}`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data.value) {
            setPublishedContent(data.value);
            localStorage.setItem(storageKey, data.value);
            setLoading(false);
            return;
          }
        }
      } catch {}
      try {
        const saved = localStorage.getItem(storageKey);
        if (!cancelled && saved) {
          setPublishedContent(saved);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [storageKey]);

  const stripControls = (html: string) => {
    return html.replace(/<div[^>]*contenteditable="false"[^>]*>[\s\S]*?<\/div>/gi, "").trim();
  };

  const handleAutoSave = (html: string) => {
    setDraftContent(html);
  };

  const handlePublish = async (html?: string) => {
    const source = html ?? draftContent;
    if (source === null) {
      releaseEdit(storageKey);
      setIsEditing(false);
      return;
    }
    const clean = stripControls(source);
    setPublishedContent(clean);
    setDraftContent(null);
    localStorage.setItem(storageKey, clean);
    const ok = await saveToApi(storageKey, clean);
    setSaveError(!ok);
    releaseEdit(storageKey);
    setIsEditing(false);
    toast.success("Le contenu a bien été publié");
  };

  const handleCancel = () => {
    setDraftContent(null);
    releaseEdit(storageKey);
    setIsEditing(false);
  };

  const displayContent = (draftContent ?? publishedContent) || defaultHtml || (typeof children === "string" ? children : undefined);
  const hasDraft = draftContent !== null && draftContent !== publishedContent;

  // Track dirty state in context
  useEffect(() => {
    setDirty(isEditing && hasDraft ? storageKey : null);
  }, [hasDraft, isEditing]);

  if (loading && isAdmin) {
    return (
      <Tag className={`${className} flex items-center gap-2 opacity-40`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        Chargement...
      </Tag>
    );
  }

  if (!isAdmin) {
    if (displayContent) {
      return <Tag className={className} dangerouslySetInnerHTML={{ __html: displayContent }} />;
    }
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`relative ${Tag === "span" ? "inline-block" : "block"} group/edit hover:ring-1 hover:ring-stone-400/40 rounded-sm transition-all duration-200`}
        onMouseEnter={() => setHovered(storageKey)}
        onMouseLeave={() => setHovered(null)}
      >
        {!isEditing ? (
          <>
            {displayContent ? (
              <Tag className={className} dangerouslySetInnerHTML={{ __html: displayContent }} />
            ) : (
              <Tag className={className}>{children}</Tag>
            )}

            {saveError && (
              <span className="ml-2 text-red-500 font-mono text-[10px]" title="Échec de la sauvegarde API">
                ⚠
              </span>
            )}

            {hasDraft && (
              <span className="absolute -top-2 -right-2 z-10 px-1.5 py-0.5 bg-brand-rust text-brand-light font-mono text-[8px] uppercase tracking-wider font-bold rounded-sm shadow-sm pointer-events-none">
                Preview
              </span>
            )}

            {hoveredKey === storageKey && (
              <div className="absolute top-1/2 -translate-y-1/2 right-1 z-10 flex items-center gap-1">
                {hasDraft && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePublish(); }}
                      className="w-7 h-7 flex items-center justify-center bg-emerald-600/90 hover:bg-emerald-600 text-brand-light rounded-sm transition-all duration-200 cursor-pointer shadow-sm"
                      title="Publier"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                      className="w-7 h-7 flex items-center justify-center bg-brand-dark/80 hover:bg-brand-dark text-brand-light rounded-sm transition-all duration-200 cursor-pointer shadow-sm"
                      title="Annuler"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeKey && activeKey !== storageKey) {
                      if (dirtyKey === activeKey) {
                        toast.warning("Ce contenu a été modifié — publiez ou annulez avant d'en éditer un autre");
                        return;
                      }
                      forceSwitchEdit(storageKey);
                      setIsEditing(true);
                      return;
                    }
                    if (requestEdit(storageKey)) {
                      setIsEditing(true);
                    }
                  }}
                  className="w-7 h-7 flex items-center justify-center bg-brand-rust/80 hover:bg-brand-rust text-brand-light rounded-sm transition-all duration-200 cursor-pointer shadow-sm opacity-70 hover:opacity-100"
                  title="Modifier"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full space-y-3">
            <WysiwygEditor
              value={displayContent || ""}
              onChange={handleAutoSave}
              onSave={handlePublish}
              onClose={handleCancel}
              inline
              editableClassName={className}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                className="px-4 py-2.5 font-mono text-xs uppercase tracking-widest rounded-sm transition-all cursor-pointer bg-brand-rust text-brand-light hover:brightness-110 flex items-center gap-1.5"
              >
                <X className="w-3 h-3" /> Annuler
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handlePublish(); }}
                className="px-4 py-2.5 font-mono text-xs uppercase tracking-widest rounded-sm transition-all cursor-pointer bg-emerald-600 text-brand-light hover:bg-emerald-500 flex items-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Publier
              </button>
            </div>
          </div>
        )}
      </div>
      {saveError && (
        <p className="font-mono text-[9px] text-red-500 mt-1">
          ⚠ Échec de la sauvegarde — contenu conservé en localStorage
        </p>
      )}
    </>
  );
}
