import { LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface BreadcrumbItem {
  label: string;
  sectionId?: string;
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate?: (sectionId: string) => void;
}

const SECTION_LABELS: Record<string, string> = {
  media: "Bibliothèque d'images",
  lieu: "Le Lieu",
  artistes: "Artistes",
  actualites: "Actualités",
  histoire: "Histoire",
  "portes-ouvertes": "Portes Ouvertes",
  contact: "Contact",
};

/**
 * Fil d'Ariane admin affiché sous la barre de navigation.
 * Montre : Administration > Section courante > Sous-section
 */
export default function AdminBreadcrumb({ items, onNavigate }: AdminBreadcrumbProps) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;

  return (
    <div className="bg-brand-dark/5 border-b border-brand-dark/5 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex items-center gap-2 py-2.5 font-mono text-[10px] text-brand-gray/70 tracking-wide">
        <LayoutDashboard className="w-3 h-3 text-brand-rust/60" />
        {items.length === 0 ? (
          <span className="text-brand-dark/80 font-semibold">Administration</span>
        ) : (
          <>
            {onNavigate ? (
              <button
                onClick={() => onNavigate("top")}
                className="hover:text-brand-rust transition-colors cursor-pointer underline decoration-dotted underline-offset-2 decoration-brand-dark/20 hover:decoration-brand-rust/50"
              >
                Administration
              </button>
            ) : (
              <span>Administration</span>
            )}
            {items.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-brand-gray/30">/</span>
                {item.sectionId && onNavigate ? (
                  <button
                    onClick={() => onNavigate(item.sectionId!)}
                    className="hover:text-brand-rust transition-colors cursor-pointer underline decoration-dotted underline-offset-2 decoration-brand-dark/20 hover:decoration-brand-rust/50"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className={i === items.length - 1 ? "text-brand-dark font-semibold" : ""}>
                    {item.label}
                  </span>
                )}
              </span>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export { SECTION_LABELS };
export type { BreadcrumbItem };
