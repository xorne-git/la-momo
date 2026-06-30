import { useState, useRef, useEffect, useCallback } from "react";
import {
  LayoutDashboard, FileText, Image, Users, ChevronDown, ChevronRight,
  MapPin, Paintbrush, Newspaper, Calendar, Mail, ArrowLeft, Bell, X, Shield, LogOut, Tag
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import MorinerieLogo from "../components/MorinerieLogo";
import { getToastHistory, unreadCount, markAllRead, dismissToast, subscribe } from "../utils/toast";

interface MenuGroup {
  label: string;
  icon: typeof FileText;
  defaultOpen?: boolean;
  items: { label: string; icon: typeof MapPin; sectionId: string }[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    label: "Tableau de bord",
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { label: "Médiathèque", icon: Image, sectionId: "media" },
      { label: "Mon espace", icon: Paintbrush, sectionId: "mon-espace" },
      { label: "Mon compte", icon: Users, sectionId: "mon-compte" },
    ],
  },
  {
    label: "Contenu du site",
    icon: FileText,
    defaultOpen: true,
    items: [
      { label: "Les Artistes", icon: Paintbrush, sectionId: "artistes" },
      { label: "Actualités", icon: Newspaper, sectionId: "admin-actualites" },
      { label: "Le Lieu", icon: MapPin, sectionId: "lieu" },
      { label: "Contact", icon: Mail, sectionId: "contact" },
      { label: "Diaporama", icon: LayoutDashboard, sectionId: "hero" },
      { label: "Espace des artistes", icon: Paintbrush, sectionId: "artist-slider" },
      { label: "Portes Ouvertes", icon: Calendar, sectionId: "portes-ouvertes" },
    ],
  },
  {
    label: "Administration",
    icon: Users,
    defaultOpen: true,
    items: [
      { label: "Gérer les comptes", icon: Users, sectionId: "gestion-comptes" },
      { label: "Groupes & droits", icon: Shield, sectionId: "groupes-droits" },
      { label: "Tags", icon: Tag, sectionId: "tags" },
    ],
  },
];

export default function AdminSidebar({ onNavigate, lastFrontend }: { onNavigate: (id: string) => void; lastFrontend?: string }) {
  const { isAdmin, currentUser, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [version, setVersion] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    const groups = currentUser?.role === "artiste"
      ? [{ label: "Mon espace", icon: LayoutDashboard, defaultOpen: true, items: [] }]
      : MENU_GROUPS;
    return groups.filter((g) => g.defaultOpen).map((g) => g.label);
  });

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      setShowHistory(false);
    }, 200);
  }, [cancelClose]);

  useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem("morinerie_auth_user") || "{}");
      if (auth.avatarUrl) setAvatarUrl(auth.avatarUrl);
    } catch {}
  }, []);

  useEffect(() => {
    const unsub = subscribe(() => setVersion((v) => v + 1));
    return () => { unsub(); cancelClose(); };
  }, [cancelClose]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        cancelClose();
        setOpen(false);
        setShowHistory(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    const handleHistoryClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const btn = document.getElementById("sidebar-avatar-btn");
      if (btn && btn.contains(target)) return;
      if (historyRef.current && !historyRef.current.contains(target)) {
        setShowHistory(false);
      }
    };
    if (showHistory) document.addEventListener("mousedown", handleHistoryClick);
    return () => document.removeEventListener("mousedown", handleHistoryClick);
  }, [showHistory]);

  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    setOpen(false);
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  if (!isAdmin && currentUser?.role !== "artiste") return null;
  const isArtist = currentUser?.role === "artiste";

  const menuGroups = isArtist
    ? [
        {
          label: "Mon espace",
          icon: LayoutDashboard,
          defaultOpen: true,
          items: [
      { label: "Mon espace", icon: Paintbrush, sectionId: "artist-slider" },
          ],
        },
      ]
    : MENU_GROUPS;

  const history = getToastHistory();

  const timeAgo = (t: number) => {
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return "à l'instant";
    if (s < 3600) return `il y a ${Math.floor(s / 60)}min`;
    return `il y a ${Math.floor(s / 3600)}h`;
  };

  const typeStyles: Record<string, string> = {
    success: "bg-[#EAF7EE] text-[#1B5E20] border-[#B7E1CD]",
    error: "bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]",
    danger: "bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]",
    info: "bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]",
    warning: "bg-[#FEF7E0] text-[#B06000] border-[#FDE293]",
  };

  return (
    <div ref={menuRef} className="fixed top-3 left-0 z-[60]" onMouseLeave={scheduleClose}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => { cancelClose(); setOpen(true); }}
        className="flex flex-col items-center gap-0.5 p-1.5 my-1.5 mx-0.5 bg-brand-steel border border-brand-dark/10 rounded-sm hover:bg-brand-dark/5 transition-colors cursor-pointer shadow-sm w-10"
      >
        <MorinerieLogo className="h-3 w-auto" />
        <span className="font-mono text-[7px] text-brand-rust uppercase tracking-widest font-bold leading-tight">Admin</span>
        {unreadCount() > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-rust text-brand-light text-[6px] font-bold rounded-full flex items-center justify-center">
            {unreadCount() > 9 ? "9+" : unreadCount()}
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="absolute top-full left-0.5 mt-1 w-[280px] bg-brand-light border border-brand-dark/10 shadow-2xl rounded-sm max-h-[80vh] overflow-y-auto"
        >
          {/* Header avec avatar + retour */}
          <div className="px-4 pt-4 pb-3 border-b border-brand-dark/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-[30px] h-[30px] shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full rounded-full object-cover border-2 border-brand-dark/10" />
                ) : (
                  <div className="w-full h-full rounded-full bg-brand-dark/10 border-2 border-brand-dark/10" />
                )}
                {unreadCount() > 0 && (
                  <button
                    id="sidebar-avatar-btn"
                    onClick={(e) => { e.stopPropagation(); setShowHistory(!showHistory); }}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-rust text-brand-light text-[7px] font-bold rounded-full flex items-center justify-center cursor-pointer"
                  >
                    {unreadCount() > 9 ? "9+" : unreadCount()}
                  </button>
                )}
              </div>
              <div>
                <p className="font-mono text-[10px] text-brand-dark font-bold uppercase tracking-wider">{currentUser?.name}</p>
                <p className="font-mono text-[8px] text-brand-gray">{currentUser?.email}</p>
              </div>
            </div>
            <button onClick={() => handleNavClick(lastFrontend || "top")} className="text-brand-rust hover:text-brand-dark transition-colors cursor-pointer p-1" title="Retour au site">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Notifications panel */}
          {showHistory && (
            <div ref={historyRef} className="border-b border-brand-dark/10">
              <div className="flex items-center justify-between px-4 py-2">
                <p className="font-mono text-[9px] text-brand-dark font-bold uppercase tracking-wider">Notifications</p>
                {history.some((e) => !e.read) && (
                  <button onClick={() => { markAllRead(); setVersion((v) => v + 1); }} className="font-mono text-[8px] text-brand-rust hover:text-brand-dark uppercase tracking-wider cursor-pointer transition-colors">
                    Tout marquer comme lu
                  </button>
                )}
              </div>
              <div className="px-3 pb-3 max-h-[200px] overflow-y-auto space-y-1">
                {history.length === 0 ? (
                  <p className="font-mono text-[9px] text-brand-gray/60 text-center py-2">Aucune notification</p>
                ) : (
                  history.map((entry) => (
                    <div key={entry.id} className={`relative font-sans text-xs px-2.5 py-1.5 rounded-sm border ${typeStyles[entry.type] || typeStyles.info} ${!entry.read ? "ring-1 ring-inset ring-brand-rust/20" : "opacity-70"}`}>
                      <button onClick={(e) => { e.stopPropagation(); dismissToast(entry.id); setVersion((v) => v + 1); }} className="absolute top-1 right-1 text-current opacity-40 hover:opacity-100 transition-opacity cursor-pointer">
                        <X className="w-2.5 h-2.5" />
                      </button>
                      <span className="block leading-snug pr-4">{entry.message}</span>
                      <span className="block text-[9px] opacity-60 mt-0.5 font-mono">{timeAgo(entry.time)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Menu groups */}
          <div className="py-2 px-2">
            {menuGroups.map((group) => {
              const isGroupOpen = openGroups.includes(group.label);
              const GroupIcon = group.icon;
              return (
                <div key={group.label}>
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left font-mono text-xs uppercase tracking-widest text-brand-dark/50 hover:text-brand-dark hover:bg-brand-dark/5 transition-all rounded-sm cursor-pointer"
                  >
                    <GroupIcon className="w-[18px] h-[18px] flex-shrink-0" />
                    <span className="flex-1 font-semibold">{group.label}</span>
                    {isGroupOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                  {isGroupOpen && (
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-brand-rust/30 pl-3">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <button
                            key={item.label}
                            onClick={() => handleNavClick(item.sectionId)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-brand-dark/60 hover:text-brand-rust hover:bg-brand-rust/5 transition-all rounded-sm cursor-pointer"
                          >
                            <ItemIcon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="font-medium">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Logout */}
          <div className="border-t border-brand-dark/10 px-2 py-2">
            <button
              onClick={() => { cancelClose(); logout(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-brand-dark/50 hover:text-brand-rust hover:bg-brand-rust/5 transition-all rounded-sm cursor-pointer"
            >
              <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
