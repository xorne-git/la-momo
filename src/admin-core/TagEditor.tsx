import { useState, useMemo, type KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";

interface TagEditorProps {
  tags: string[];
  onChange?: (tags: string[]) => void;
  readonly?: boolean;
  suggestions?: string[];
  chipClassName?: string;
}

export default function TagEditor({ tags, onChange, readonly, suggestions = [], chipClassName = "bg-brand-steel/50 border-dashed border-brand-dark/20 text-brand-gray" }: TagEditorProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const currentTags = tags;

  const filteredSuggestions = useMemo(() => {
    if (!input.trim()) return [];
    const q = input.trim().toUpperCase();
    return suggestions.filter((s) => s.startsWith(q) && !currentTags.includes(s)).slice(0, 8);
  }, [input, suggestions, currentTags]);

  const addTag = (tag?: string) => {
    if (!onChange) return;
    const trimmed = (tag || input).trim().toUpperCase();
    if (!trimmed || currentTags.includes(trimmed)) return;
    onChange([...currentTags, trimmed]);
    setInput("");
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    if (!onChange) return;
    onChange(currentTags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addTag(); }
    if (e.key === "Escape") setShowSuggestions(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {currentTags.map((tag) => (
          <span key={tag} className={`inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-sm ${chipClassName}`}>
            #{tag}
            {!readonly && onChange && (
              <button onClick={() => removeTag(tag)} className="text-brand-gray hover:text-red-500 transition-colors cursor-pointer">
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </span>
        ))}
      </div>
      {!readonly && onChange && (
        <div className="relative">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Ajouter un tag..."
              className="flex-1 bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-xs px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors"
            />
            <button onClick={() => addTag()} className="px-2 py-1.5 bg-brand-rust text-brand-light rounded-sm hover:brightness-110 transition-all cursor-pointer flex items-center">
              <Plus className="w-3 h-3" />
            </button>
          </div>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-brand-light border border-brand-dark/10 shadow-md rounded-sm p-1.5 flex flex-wrap gap-1">
              {filteredSuggestions.map((s) => (
                <button
                  key={s}
                  onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                  className="font-mono text-[9px] uppercase tracking-wider px-2 py-1 bg-brand-steel/50 border border-dashed border-brand-dark/20 text-brand-gray hover:bg-brand-rust hover:text-brand-light rounded-sm transition-colors cursor-pointer"
                >
                  #{s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {!readonly && onChange && suggestions.length > 0 && currentTags.length < suggestions.length && (
        <div className="flex flex-wrap gap-1">
          <span className="font-mono text-[7px] text-brand-gray uppercase tracking-wider mt-1 mr-1">Suggestions :</span>
          {suggestions.filter((s) => !currentTags.includes(s)).slice(0, 12).map((s) => (
            <button
              key={s}
              onClick={() => addTag(s)}
              className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-brand-steel/50 border border-dashed border-brand-dark/20 text-brand-gray hover:text-brand-rust hover:border-brand-rust/50 rounded-sm transition-colors cursor-pointer"
            >
              +{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
