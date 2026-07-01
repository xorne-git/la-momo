import { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { ARTISTS } from "../data";
import { Artist, Artwork } from "../types";
import { Search, SlidersHorizontal, ArrowRight, X, Mail, Maximize2, Tag, Hammer, Package, MessageSquare, Plus, Clock, Compass, ShieldCheck } from "lucide-react";
import InlineEdit from "../admin-core/InlineEdit";
import { getAllGlobalTags, getDisciplines } from "../utils/tags";

interface ArtistGalleryProps {
  onRefArtistId?: string | null;
  onClearRefArtist?: () => void;
  onEnterArtistSpace?: (artist: Artist) => void;
  isProMode: boolean;
  onToggleProMode: (val: boolean) => void;
}

interface GuestbookMessage {
  id: string;
  artistId: string;
  name: string;
  text: string;
  timestamp: string;
}

// Custom workshop details matching our theme and artists
const WORKSHOP_DETAILS: Record<string, {
  workspaceImage: string;
  tools: string[];
  materials: string[];
  currentProject: string;
  atmosphereSound: string;
  defaultMessages: { name: string; text: string; timestamp: string }[];
}> = {
  "artist-1": {
    workspaceImage: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=1200",
    tools: ["Poste à souder TIG/MIG", "Meuleuse d'angle pneumatique", "Pont roulant SNCF 5 tonnes", "Chalumeau oxyacétylénique"],
    materials: ["Acier Corten", "Traverses de rails ferroviaires SNCF", "Scories de fonderie", "Acide sulfurique (patine)"],
    currentProject: "Forger une sphère géode monumentale de 3 mètres de diamètre pour la cour centrale.",
    atmosphereSound: "Bourdonnement électrique du poste à souder et percussion rythmique de l'enclume.",
    defaultMessages: [
      { name: "Arnaud P.", text: "Votre sculpture monumentale dans la cour est à couper le souffle. On sent la tension de l'ancien rail.", timestamp: "Il y a 2 jours" },
      { name: "Léa & Tom", text: "Merci pour la démonstration de forge lors des dernières répétitions, c'était absolument magique !", timestamp: "Il y a 5 jours" }
    ]
  },
  "artist-2": {
    workspaceImage: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200",
    tools: ["Couteaux à peindre XXL", "Brosses épaisses en soie de porc", "Chalumeau (fixation du goudron)", "Projecteurs de chantier"],
    materials: ["Toile de lin écru lourd", "Goudron routier liquide", "Poussière de charbon de coke", "Pigments purs d'outremer"],
    currentProject: "Série 'Cathédrales d'Ombre' explorant la diffraction lumineuse des verrières d'origine.",
    atmosphereSound: "Frottement sourd de la spatule métallique sur le lin lourd.",
    defaultMessages: [
      { name: "Isabelle G.", text: "La texture de vos toiles au goudron est d'une puissance incroyable en vrai. On a hâte de les revoir.", timestamp: "Il y a 1 jour" },
      { name: "Michel R.", text: "Cette verrière noire capture l'âme même de la friche industrielle. Magnifique travail de texture.", timestamp: "Il y a 4 jours" }
    ]
  },
  "artist-3": {
    workspaceImage: "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?q=80&w=1200",
    tools: ["Tour de potier traditionnel Shimpo", "Estèques en bois de buis", "Four à bois artisanal anagama", "Pyromètre optique"],
    materials: ["Grès de Puisaye brut", "Porcelaine de Limoges", "Émaux de cendres de hêtre locale", "Sables de Loire récupérés"],
    currentProject: "Cuisson collective de 72 heures au four à bois anagama partagé.",
    atmosphereSound: "Ronronnement hypnotique du tour électrique et craquements de la terre en cours de séchage.",
    defaultMessages: [
      { name: "Camille L.", text: "Les nuances de l'émail de cendres sur vos tasses sont subtiles et incroyablement douces.", timestamp: "Il y a 3 jours" },
      { name: "Pierre-Yves", text: "Vos grès bruts ont une présence tellurique fascinante. On sent la friche et la terre sauvage.", timestamp: "Il y a 6 jours" }
    ]
  },
  "artist-4": {
    workspaceImage: "https://images.unsplash.com/photo-1540206395-68808572332f?q=80&w=1200",
    tools: ["Ciseaux à bois japonais", "Rabot de paume en bronze", "Scie à ruban triphasée monumentale", "Presse d'établi en fonte"],
    materials: ["Troncs de chêne centenaires", "Loupe de noyer du Périgord", "Colle d'os traditionnelle", "Cire d'abeille naturelle"],
    currentProject: "Table de réunion monumentale assemblée par enfourchements complexes pour le réfectoire de la coopérative.",
    atmosphereSound: "Glissement feutré du rabot manuel et odeur enveloppante de sciure de cèdre.",
    defaultMessages: [
      { name: "Chantal de Tours", text: "Un travail d'ébénisterie d'une finesse rare. Le mariage du noyer et du piétement métallique est superbe.", timestamp: "Il y a 3 jours" },
      { name: "F. Mercier", text: "Vos pièces de design d'art respectent l'arbre et sa croissance de façon tout à fait remarquable.", timestamp: "Il y a 1 semaine" }
    ]
  }
};

export default function ArtistGallery({ 
  onRefArtistId, 
  onClearRefArtist, 
  onEnterArtistSpace,
  isProMode,
  onToggleProMode
}: ArtistGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("Tous");
  const [tagSearchInput, setTagSearchInput] = useState("");
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [newTagCreatorForArtist, setNewTagCreatorForArtist] = useState<string | null>(null);
  
  const [activeArtwork, setActiveArtwork] = useState<{ artist: Artist; work: Artwork } | null>(null);
  const [artists, setArtists] = useState<Artist[]>(() =>
    ARTISTS.map((a) => ({ ...a, tags: [] }))
  );
  const [activeInlineTagInput, setActiveInlineTagInput] = useState<string | null>(null);
  const [inlineTagText, setInlineTagText] = useState("");
  
  // Immersive dedicated workshop space state
  const [activeArtistSpace, setActiveArtistSpace] = useState<Artist | null>(null);
  
  // Live simulated Guestbook state
  const [guestbook, setGuestbook] = useState<Record<string, GuestbookMessage[]>>({});
  const [visitorName, setVisitorName] = useState("");
  const [visitorComment, setVisitorComment] = useState("");

  // Load and initialize artists and guestbook from localStorage
  useEffect(() => {
    // Merging custom and managed tags (no static tags)
    setArtists((prev) =>
      prev.map((artist) => {
        const merged = new Set<string>();

        // Custom tags (pro mode)
        try {
          const customMap = JSON.parse(localStorage.getItem("morinerie_custom_artist_tags") || "{}");
          (customMap[artist.id] || []).forEach((t: string) => merged.add(t));
        } catch {}

        // Managed page tags (Mon espace → Tags)
        try {
          const pageTags = JSON.parse(localStorage.getItem(`morinerie_artist_tags_${artist.id}`) || "[]");
          if (Array.isArray(pageTags)) pageTags.forEach((t: string) => merged.add(t));
        } catch {}

        return { ...artist, tags: Array.from(merged) };
      })
    );

    // Guestbook
    const stored = localStorage.getItem("morinerie_artist_guestbooks");
    if (stored) {
      try {
        setGuestbook(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse guestbooks", e);
      }
    } else {
      // Setup initial defaults
      const initial: Record<string, GuestbookMessage[]> = {};
      Object.keys(WORKSHOP_DETAILS).forEach((key) => {
        initial[key] = WORKSHOP_DETAILS[key].defaultMessages.map((msg, i) => ({
          id: `${key}-default-${i}`,
          artistId: key,
          name: msg.name,
          text: msg.text,
          timestamp: msg.timestamp
        }));
      });
      setGuestbook(initial);
      localStorage.setItem("morinerie_artist_guestbooks", JSON.stringify(initial));
    }
  }, []);

  const handleAddComment = (artistId: string) => {
    if (!visitorName.trim() || !visitorComment.trim()) return;

    const newMessage: GuestbookMessage = {
      id: `${artistId}-user-${Date.now()}`,
      artistId,
      name: visitorName.trim(),
      text: visitorComment.trim(),
      timestamp: "À l'instant"
    };

    const updated = {
      ...guestbook,
      [artistId]: [newMessage, ...(guestbook[artistId] || [])]
    };

    setGuestbook(updated);
    localStorage.setItem("morinerie_artist_guestbooks", JSON.stringify(updated));
    setVisitorName("");
    setVisitorComment("");
  };

  const handleAddTagToArtist = (artistId: string, newTag: string) => {
    const trimmed = newTag.trim().replace(/#/g, "");
    if (!trimmed) return;

    // Save to localStorage
    const storedCustomTags = localStorage.getItem("morinerie_custom_artist_tags") || "{}";
    let customTagsMap: Record<string, string[]> = {};
    try {
      customTagsMap = JSON.parse(storedCustomTags);
    } catch (e) {}

    const currentCustom = customTagsMap[artistId] || [];
    if (!currentCustom.includes(trimmed)) {
      customTagsMap[artistId] = [...currentCustom, trimmed];
      localStorage.setItem("morinerie_custom_artist_tags", JSON.stringify(customTagsMap));
    }

    // Update state
    setArtists((prev) =>
      prev.map((artist) => {
        if (artist.id === artistId) {
          const uniqueTags = Array.from(new Set([...(artist.tags || []), trimmed]));
          return { ...artist, tags: uniqueTags };
        }
        return artist;
      })
    );
  };

  // Tag options list
  const allTags = useMemo(() => {
    const list = new Set<string>();
    artists.forEach((a) => {
      const addTags = (tags: string[] | undefined) => {
        if (tags) tags.forEach((t) => { if (t) list.add(t.trim().toUpperCase()); });
      };
      // Static tags from data
      addTags(a.tags);
      // Custom tags from pro mode
      try {
        const custom = localStorage.getItem("morinerie_custom_artist_tags");
        if (custom) {
          const parsed = JSON.parse(custom);
          if (parsed[a.id]) addTags(parsed[a.id]);
        }
      } catch {}

      // Managed page tags (Mon espace → Tags)
      try {
        const pageTags = localStorage.getItem(`morinerie_artist_tags_${a.id}`);
        if (pageTags) addTags(JSON.parse(pageTags));
      } catch {}

      // Tags from works slides
      try {
        const works = localStorage.getItem(`morinerie_artist_works_${a.id}`);
        if (works) {
          const parsed = JSON.parse(works);
          if (Array.isArray(parsed)) parsed.forEach((w: any) => addTags(w.tags));
        }
      } catch {}

      // Tags from blog articles
      try {
        const posts = localStorage.getItem(`morinerie_artist_blog_${a.id}`);
        if (posts) {
          const parsed = JSON.parse(posts);
          if (Array.isArray(parsed)) parsed.forEach((p: any) => addTags(p.tags));
        }
      } catch {}
    });
    // Global tag pool (admin-managed tags)
    getAllGlobalTags().forEach((t) => list.add(t));
    return ["Tous", ...Array.from(list)];
  }, [artists]);

  // Tag popularity: count how many artists use each tag
  const tagPopularity = useMemo(() => {
    const freq = new Map<string, number>();
    artists.forEach((a) => {
      const seen = new Set<string>();
      const count = (tags: string[] | undefined) => {
        if (tags) tags.forEach((t) => { if (t) { const key = t.trim().toUpperCase(); if (!seen.has(key)) { seen.add(key); freq.set(key, (freq.get(key) || 0) + 1); } } });
      };
      count(a.tags);
      try { const c = localStorage.getItem("morinerie_custom_artist_tags"); if (c) { const p = JSON.parse(c); if (p[a.id]) count(p[a.id]); } } catch {}
      try { const pt = localStorage.getItem(`morinerie_artist_tags_${a.id}`); if (pt) count(JSON.parse(pt)); } catch {}
      try { const w = localStorage.getItem(`morinerie_artist_works_${a.id}`); if (w) { const p = JSON.parse(w); if (Array.isArray(p)) p.forEach((x: any) => count(x.tags)); } } catch {}
      try { const b = localStorage.getItem(`morinerie_artist_blog_${a.id}`); if (b) { const p = JSON.parse(b); if (Array.isArray(p)) p.forEach((x: any) => count(x.tags)); } } catch {}
    });
    // Global tag pool — give them a baseline count so they appear in popular list
    getAllGlobalTags().forEach((t) => { if (!freq.has(t)) freq.set(t, 0); });
    return freq;
  }, [artists]);

  // Autocomplete filtered list of tags based on typed value
  const autocompleteSuggestions = useMemo(() => {
    const query = tagSearchInput.trim().toLowerCase();
    const tagsWithoutTous = allTags.filter((t) => t !== "Tous");
    if (!query) {
      return tagsWithoutTous;
    }
    return tagsWithoutTous.filter((tag) => tag.toLowerCase().includes(query));
  }, [allTags, tagSearchInput]);

  // Filter logic
  // Load all tags per artist from storage for filtering
  const allArtistTags = useMemo(() => {
    const map = new Map<string, Set<string>>();
    artists.forEach((a) => {
      const set = new Set<string>();
      try {
        const custom = localStorage.getItem("morinerie_custom_artist_tags");
        if (custom) { const p = JSON.parse(custom); if (p[a.id]) p[a.id].forEach((t: string) => set.add(t)); }
      } catch {}
      try {
        const pt = localStorage.getItem(`morinerie_artist_tags_${a.id}`);
        if (pt) JSON.parse(pt).forEach((t: string) => set.add(t));
      } catch {}
      try {
        const w = localStorage.getItem(`morinerie_artist_works_${a.id}`);
        if (w) { const p = JSON.parse(w); if (Array.isArray(p)) p.forEach((x: any) => { if (x.tags) x.tags.forEach((t: string) => set.add(t)); }); }
      } catch {}
      try {
        const b = localStorage.getItem(`morinerie_artist_blog_${a.id}`);
        if (b) { const p = JSON.parse(b); if (Array.isArray(p)) p.forEach((x: any) => { if (x.tags) x.tags.forEach((t: string) => set.add(t)); }); }
      } catch {}
      map.set(a.id, set);
    });
    return map;
  }, [artists]);

  const filteredArtists = useMemo(() => {
    return artists.filter((artist) => {
      // Filter by tag
      const artistTagSet = allArtistTags.get(artist.id);
      const matchTag = selectedTag === "Tous" || (artistTagSet && artistTagSet.has(selectedTag));
      // Filter by search query
      const matchSearch =
        artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getDisciplines(artist.id).some(d => d.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (artist.tags && artist.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        artist.works.some(
          (w) =>
            w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.medium.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Handle external anchor focus if provided
      const matchRef = !onRefArtistId || artist.id === onRefArtistId;

      return matchTag && matchSearch && matchRef;
    });
  }, [artists, searchQuery, selectedTag, onRefArtistId, allArtistTags]);

  return (
    <div className="bg-brand-light py-24 md:py-32" id="artistes-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Header and filters area */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-brand-rust font-mono text-xs uppercase tracking-widest">
              <Tag className="w-4 h-4" />
              <InlineEdit storageKey="morinerie_gallery_surtitre" tag="span">Catalogues &amp; Créations par Tags</InlineEdit>
            </div>
            <InlineEdit storageKey="morinerie_gallery_titre" tag="h2" className="font-display font-light text-4xl md:text-6xl text-brand-dark uppercase tracking-tight leading-none">
              Les Créateurs Du Lieu
            </InlineEdit>
            <InlineEdit storageKey="morinerie_gallery_texte" tag="p" className="font-sans text-brand-gray text-base md:text-lg max-w-xl">
              Cherchez par tags d'ateliers, matières ou techniques pour découvrir les démarches artistiques.
            </InlineEdit>
          </div>

          {onRefArtistId && (
            <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <button
                onClick={onClearRefArtist}
                className="bg-brand-rust hover:bg-brand-dark text-brand-light font-mono text-[10px] uppercase tracking-widest px-4 py-3 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Filtre Artiste Actif</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Active tag filter badge */}
        {selectedTag !== "Tous" && (
          <div className="flex items-center gap-3 mb-6 bg-brand-rust/5 border border-brand-rust/20 px-4 py-3 self-start">
            <span className="font-mono text-xs uppercase text-brand-gray tracking-wider">Filtre de recherche actif :</span>
            <span className="font-mono text-xs uppercase bg-brand-rust text-brand-light px-2.5 py-1 font-bold flex items-center gap-2">
              #{selectedTag}
              <button onClick={() => setSelectedTag("Tous")} className="hover:text-brand-dark cursor-pointer transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}

        {/* Tag selection autocomplete & Popular Tags */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border-b border-brand-dark/10 pb-8 mb-12 items-start">
          {/* Autocomplete Input Column */}
          <div className="md:col-span-6 space-y-6">
            
            {/* Full-text search */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-brand-gray mb-2 flex items-center gap-2">
                <Search className="w-3.5 h-3.5" />
                <span>Recherche d'artistes ou d'œuvres :</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un nom d'artiste, une œuvre, un matériau..."
                  className="w-full bg-brand-steel border border-brand-dark/10 focus:border-brand-rust text-brand-dark placeholder:text-brand-gray/50 font-sans text-sm px-4 py-2.5 pl-10 rounded-none focus:outline-none focus:ring-0 transition-all"
                />
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-gray/50" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2.5 text-brand-gray hover:text-brand-dark cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Tag filter autocomplete input */}
            <div className="relative">
              <label className="block font-mono text-[10px] uppercase tracking-widest text-brand-gray mb-2 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />
                <span>Rechercher un tag d'atelier :</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tagSearchInput}
                  onChange={(e) => {
                    setTagSearchInput(e.target.value);
                    setIsTagDropdownOpen(true);
                  }}
                  onFocus={() => setIsTagDropdownOpen(true)}
                  placeholder="Saisir un tag d'atelier (ex: Acier Corten, Grès sauvage...)"
                  className="w-full bg-brand-steel border border-brand-dark/10 focus:border-brand-rust text-brand-dark placeholder:text-brand-gray/50 font-sans text-sm px-4 py-2.5 rounded-none focus:outline-none focus:ring-0 transition-all"
                />
                {tagSearchInput && (
                  <button
                    onClick={() => setTagSearchInput("")}
                    className="absolute right-10 top-2.5 text-brand-gray hover:text-brand-dark cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                  className="absolute right-3 top-2.5 text-brand-gray hover:text-brand-dark cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Dropdown list */}
              {isTagDropdownOpen && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-brand-light border border-brand-dark/15 shadow-xl max-h-60 overflow-y-auto divide-y divide-brand-dark/5">
                  <div 
                    className="px-4 py-1.5 bg-brand-steel/50 text-right text-[10px] font-mono text-brand-gray uppercase tracking-widest cursor-pointer hover:bg-brand-steel"
                    onClick={() => setIsTagDropdownOpen(false)}
                  >
                    Fermer ✕
                  </div>

                  <div
                    onClick={() => {
                      setSelectedTag("Tous");
                      setTagSearchInput("");
                      setIsTagDropdownOpen(false);
                    }}
                    className={`px-4 py-2 text-xs font-mono uppercase cursor-pointer transition-colors hover:bg-brand-steel ${
                      selectedTag === "Tous" ? "bg-brand-steel text-brand-rust font-bold" : "text-brand-dark"
                    }`}
                  >
                    Tous les résidents (Réinitialiser)
                  </div>

                  {autocompleteSuggestions.map((tag) => (
                    <div
                      onClick={() => {
                        setSelectedTag(tag);
                        setTagSearchInput("");
                        setIsTagDropdownOpen(false);
                      }}
                      key={tag}
                      className={`px-4 py-2 text-xs font-mono uppercase cursor-pointer transition-colors hover:bg-brand-steel flex justify-between items-center ${
                        selectedTag === tag ? "bg-brand-steel text-brand-rust font-bold" : "text-brand-dark"
                      }`}
                    >
                      <span>#{tag}</span>
                      <span className="text-[9px] text-brand-gray">
                        ({artists.filter(a => a.tags?.includes(tag)).length} artiste{artists.filter(a => a.tags?.includes(tag)).length > 1 ? 's' : ''})
                      </span>
                    </div>
                  ))}

                  {tagSearchInput.trim() && !allTags.some(t => t.toLowerCase() === tagSearchInput.trim().toLowerCase()) && (
                    isProMode ? (
                      <div
                        onClick={() => {
                          setNewTagCreatorForArtist(tagSearchInput.trim());
                          setIsTagDropdownOpen(false);
                        }}
                        className="px-4 py-3 bg-brand-rust/5 text-brand-rust text-xs font-mono uppercase tracking-wider font-bold cursor-pointer hover:bg-brand-rust hover:text-brand-light transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Créer le nouveau tag "#{tagSearchInput.trim()}"</span>
                      </div>
                    ) : (
                      <div className="px-4 py-3 bg-brand-steel/30 text-brand-gray text-[10px] font-sans italic text-center">
                        La création de nouveaux tags est réservée aux artistes de la Morinerie.
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Click Popular Tags Column */}
          <div className="md:col-span-6">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-brand-gray mb-2">
              Tags d'Atelier Populaires :
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedTag("Tous")}
                className={`font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 border transition-all cursor-pointer ${
                  selectedTag === "Tous"
                    ? "bg-brand-dark border-brand-dark text-brand-light font-bold"
                    : "bg-brand-steel/50 border-brand-dark/5 text-brand-dark/70 hover:border-brand-dark/20 hover:bg-brand-steel"
                }`}
              >
                Tous
              </button>
              {allTags.filter(t => t !== "Tous").sort((a, b) => (tagPopularity.get(b) || 0) - (tagPopularity.get(a) || 0)).slice(0, 15).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 border transition-all cursor-pointer ${
                    selectedTag === tag
                      ? "bg-brand-rust border-brand-rust text-brand-light font-bold shadow-sm"
                      : "bg-brand-steel/50 border-dashed border-brand-dark/20 text-brand-gray hover:border-brand-rust/50 hover:bg-brand-steel"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal/Choice box to assign newly created tag */}
        {newTagCreatorForArtist && (
          <div className="bg-brand-steel border border-brand-rust/30 p-6 mb-12 rounded-none animate-fadeIn">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-display font-bold text-lg text-brand-dark uppercase tracking-wide">
                  Nouveau Tag Détecté : #{newTagCreatorForArtist}
                </h4>
                <p className="font-sans text-xs text-brand-gray mt-1">
                  Ce tag n'existe pas encore. Associez-le à un artiste pour l'ajouter aux filtres d'atelier :
                </p>
              </div>
              <button 
                onClick={() => setNewTagCreatorForArtist(null)}
                className="text-brand-gray hover:text-brand-dark cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {artists.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => {
                    handleAddTagToArtist(artist.id, newTagCreatorForArtist);
                    setSelectedTag(newTagCreatorForArtist);
                    setTagSearchInput("");
                    setNewTagCreatorForArtist(null);
                  }}
                  className="bg-brand-light border border-brand-dark/10 hover:border-brand-rust hover:bg-brand-rust/5 text-left p-3 transition-all cursor-pointer group"
                >
                  <p className="font-display font-bold text-xs uppercase text-brand-dark group-hover:text-brand-rust leading-none">{artist.name}</p>
                  <p className="font-sans text-[10px] text-brand-gray mt-1">{getDisciplines(artist.id).join(" · ")}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredArtists.length === 0 && (
          <div className="text-center py-24 border border-dashed border-brand-dark/15">
            <p className="font-display font-extrabold text-xl text-brand-dark uppercase tracking-wide">Aucun résident ne correspond à votre recherche</p>
            <p className="font-sans text-brand-gray text-sm mt-2">Essayez d'autres mots clés ou réinitialisez les filtres.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTag("Tous");
                if (onClearRefArtist) onClearRefArtist();
              }}
              className="mt-6 bg-brand-dark hover:bg-brand-rust text-brand-light font-mono text-xs uppercase tracking-widest px-6 py-3 transition-all cursor-pointer"
            >
              Réinitialiser
            </button>
          </div>
        )}

        {/* Artists Directory List - Grid of Cards (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
          {filteredArtists.map((artist) => {
            const storedVignette = (() => { try { const v = localStorage.getItem(`morinerie_artist_vignette_${artist.id}`); if (v) return v; } catch {} return null; })();
            const featuredImage = storedVignette || artist.featuredWorkUrl || artist.works[0]?.imageUrl || artist.avatarUrl;
            return (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                id={`artist-${artist.id}`}
                className="group relative h-[480px] w-full bg-brand-steel overflow-hidden border border-brand-dark/10 shadow-sm hover:shadow-xl transition-all duration-500 ease-out flex flex-col justify-end cursor-pointer"
                onClick={() => {
                  if (onEnterArtistSpace) {
                    onEnterArtistSpace(artist);
                  } else {
                    setActiveArtistSpace(artist);
                  }
                }}
              >
                {/* Visual Chosen by the Artist (Cover) */}
                <div className="absolute inset-0 w-full h-full bg-brand-dark overflow-hidden">
                  <img
                    src={featuredImage}
                    alt={artist.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale-[25%] group-hover:grayscale-0"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle Elegant Overlay Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-brand-dark/40 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-80" />
                </div>

                {/* Always-Visible Standard Face Info (At the bottom of the card) */}
                <div className="relative z-10 p-6 space-y-3 transition-all duration-500 group-hover:opacity-0 group-hover:translate-y-4">
                  <div className="space-y-1">
                    {(() => { try { const vt = localStorage.getItem(`morinerie_artist_vignette_tag_${artist.id}`); if (vt) return <span className="inline-block font-mono text-[9px] text-brand-light bg-brand-rust border border-brand-rust/30 px-2 py-0.5 uppercase tracking-widest font-bold">#{vt}</span>; } catch {} return null; })()}
                    {getDisciplines(artist.id).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {getDisciplines(artist.id).map((d) => (
                          <span key={d} className="inline-block font-mono text-[8px] text-brand-light bg-brand-rust/80 border border-brand-rust/30 px-1.5 py-0.5 uppercase tracking-widest">#{d}</span>
                        ))}
                      </div>
                    )}
                    <h3 className="font-display font-extrabold text-xl text-brand-light uppercase tracking-wide leading-tight mt-1">
                      {artist.name}
                    </h3>
                  </div>

                  {/* Top Popular Tags */}
                  <div className="flex flex-wrap gap-1">
                    {artist.tags && artist.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-white/5 border border-dashed border-white/20 text-white/70"
                      >
                        #{tag}
                      </span>
                    ))}
                    {artist.tags && artist.tags.length > 3 && (
                      <span className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-white/5 text-white/40 border border-dashed border-white/10">
                        +{artist.tags.length - 3}
                      </span>
                    )}
                  </div>

                  <p className="font-mono text-[9px] text-white/50 uppercase tracking-widest pt-2 flex items-center gap-1">
                    <span>Voir l'atelier</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </p>
                </div>

                {/* Hover Reveal Face: Complete quote, biography snippet, contact & full action options */}
                <div className="absolute inset-0 bg-white p-6 md:p-8 flex flex-col justify-between z-20 transition-all duration-500 translate-y-full group-hover:translate-y-0 ease-out border border-brand-dark/15 shadow-2xl">
                  <div className="space-y-4">
                    {/* Header of hover pane with mini avatar */}
                    <div className="flex items-center gap-3 pb-3 border-b border-brand-dark/10">
                      <img
                        src={artist.avatarUrl}
                        alt={artist.name}
                        className="w-10 h-10 rounded-full object-cover border border-brand-dark/15"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="font-display font-bold text-base text-brand-dark uppercase leading-none">
                          {artist.name}
                        </h4>
                        {(() => { try { const vt = localStorage.getItem(`morinerie_artist_vignette_tag_${artist.id}`); if (vt) return <span className="font-mono text-[9px] text-brand-rust uppercase tracking-wider font-bold">#{vt}</span>; } catch {} return null; })()}
                        {getDisciplines(artist.id).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {getDisciplines(artist.id).map((d) => (
                              <span key={d} className="font-mono text-[8px] text-brand-light bg-brand-rust/80 border border-brand-rust/30 px-1.5 py-0.5 uppercase tracking-widest">#{d}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Artist Quote (from localStorage if edited) */}
                    <blockquote className="font-serif italic text-brand-dark/90 text-xs md:text-sm leading-relaxed border-l border-brand-rust pl-3 py-0.5">
                      &ldquo;{(() => { try { const v = localStorage.getItem(`morinerie_artist_${artist.id}_quote`); if (v) return v; } catch {} return artist.quote; })()}&rdquo;
                    </blockquote>

                    {/* Artist Biography snippet (from localStorage if edited) */}
                    <p className="font-sans text-brand-gray text-[11px] leading-relaxed line-clamp-4">
                      {(() => { try { const v = localStorage.getItem(`morinerie_artist_${artist.id}_bio`); if (v) return v; } catch {} return artist.bio; })()}
                    </p>

                    {/* Dynamic Tags with active filtering + Inline tag adder support */}
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      {artist.tags && artist.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTag(tag);
                          }}
                          className={`font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 border transition-all cursor-pointer ${
                            selectedTag === tag
                              ? "bg-brand-rust border-brand-rust text-brand-light font-bold"
                              : "bg-brand-steel/50 border-dashed border-brand-dark/20 text-brand-gray hover:border-brand-rust/50 hover:text-brand-rust"
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}

                      {/* Backwards-compatible inline tag adder */}
                      {isProMode && (
                        activeInlineTagInput === artist.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddTagToArtist(artist.id, inlineTagText);
                              setInlineTagText("");
                              setActiveInlineTagInput(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 bg-white border border-brand-rust px-1.5 py-0.5"
                          >
                            <input
                              autoFocus
                              type="text"
                              value={inlineTagText}
                              onChange={(e) => setInlineTagText(e.target.value)}
                              placeholder="Tag..."
                              className="font-mono text-[8px] uppercase tracking-wider bg-transparent text-brand-dark max-w-[60px] focus:outline-none"
                            />
                            <button type="submit" className="text-brand-rust hover:text-brand-dark cursor-pointer font-bold text-[10px]">
                              ✓
                            </button>
                            <button type="button" onClick={() => setActiveInlineTagInput(null)} className="text-brand-gray hover:text-brand-dark cursor-pointer text-[10px]">
                              ✕
                            </button>
                          </form>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveInlineTagInput(artist.id);
                              setInlineTagText("");
                            }}
                            className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 border border-dashed border-brand-dark/20 text-brand-gray/70 hover:border-brand-rust hover:text-brand-rust transition-all cursor-pointer flex items-center gap-0.5"
                          >
                            <Plus className="w-2 h-2" />
                            <span>+ Tag</span>
                          </button>
                        )
                      )}
                    </div>

                  </div>

                  {/* Actions Area */}
                  <div className="pt-4 border-t border-brand-dark/10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEnterArtistSpace) {
                          onEnterArtistSpace(artist);
                        } else {
                          setActiveArtistSpace(artist);
                        }
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-rust hover:bg-brand-dark text-brand-light font-mono text-[9px] uppercase tracking-widest py-2.5 transition-all cursor-pointer font-bold shadow-sm"
                    >
                      <span>Entrer dans l'atelier</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* Fullscreen Art Detail Slide-over / Modal with motion */}
      {activeArtwork && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-fade-in">
          <div className="bg-brand-light w-full max-w-5xl border border-brand-light/10 shadow-2xl overflow-hidden relative flex flex-col md:flex-row items-stretch">
            
            {/* Close button */}
            <button
              onClick={() => setActiveArtwork(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-brand-dark text-brand-light hover:bg-brand-rust transition-all flex items-center justify-center focus:outline-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* High-res image display */}
            <div className="w-full md:w-1/2 bg-brand-dark relative flex items-center justify-center min-h-[300px]">
              <img
                src={activeArtwork.work.imageUrl}
                alt={activeArtwork.work.title}
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-4 left-4 font-mono text-[9px] text-brand-light/50 bg-brand-dark/60 px-2 py-1">
                © {activeArtwork.artist.name}
              </div>
            </div>

            {/* Technical layout details */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-brand-rust bg-brand-rust/10 border border-brand-rust/20 px-2.5 py-1 uppercase tracking-widest font-bold">
                    {getDisciplines(activeArtwork.artist.id).join(" · ") || activeArtwork.artist.discipline}
                  </span>
                  <span className="font-mono text-[9px] text-brand-gray">
                    Hangar {activeArtwork.artist.hangarId.toUpperCase().replace("HANGAR-", "")}
                  </span>
                </div>

                <h3 className="font-display font-extrabold text-3xl md:text-4xl text-brand-dark uppercase tracking-tight leading-none">
                  {activeArtwork.work.title}
                </h3>

                <p className="font-mono text-xs text-brand-gray border-b border-brand-dark/10 pb-4">
                  Créé par <span className="font-bold text-brand-dark">{activeArtwork.artist.name}</span> en {activeArtwork.work.year}
                </p>

                {/* Technical registry box */}
                <div className="bg-brand-steel p-4 space-y-2 border border-brand-dark/5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-brand-gray uppercase">Support/Matière :</span>
                    <span className="text-brand-dark font-bold text-right">{activeArtwork.work.medium}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-brand-gray uppercase">Dimensions :</span>
                    <span className="text-brand-dark font-bold">{activeArtwork.work.dimensions}</span>
                  </div>
                </div>

                <div className="font-sans text-brand-dark/80 text-sm leading-relaxed pt-2"
                   dangerouslySetInnerHTML={{ __html: activeArtwork.work.description }} />
              </div>

              {/* Inquiry block */}
              <div className="pt-6 border-t border-brand-dark/10 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                <div>
                  <p className="font-mono text-[9px] text-brand-gray uppercase tracking-widest">Inquiries &amp; Visites</p>
                  <p className="font-sans text-xs text-brand-dark font-bold">{activeArtwork.artist.contactEmail}</p>
                </div>
                
                <a
                  href={`mailto:${activeArtwork.artist.contactEmail}?subject=Intérêt pour l'œuvre : ${activeArtwork.work.title}`}
                  className="bg-brand-dark hover:bg-brand-rust text-brand-light font-display text-xs uppercase tracking-widest py-3.5 px-6 text-center transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Acquérir ou Visiter</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* IMMERSIVE DEDICATED VIRTUAL WORKSHOP PORTAL MODAL */}
      {activeArtistSpace && (() => {
        const details = WORKSHOP_DETAILS[activeArtistSpace.id];
        const comments = guestbook[activeArtistSpace.id] || [];
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-fade-in">
            <div className="bg-brand-light w-full max-w-5xl border border-brand-dark/20 shadow-2xl overflow-hidden relative flex flex-col md:flex-row items-stretch my-8">
              
              {/* Close Button */}
              <button
                onClick={() => {
                  setActiveArtistSpace(null);
                  setVisitorName("");
                  setVisitorComment("");
                }}
                className="absolute top-4 right-4 z-20 w-10 h-10 bg-brand-dark text-brand-light hover:bg-brand-rust transition-all flex items-center justify-center focus:outline-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Wing: Studio ambiance, photos, materials & tools */}
              <div className="w-full md:w-1/2 bg-brand-steel border-r border-brand-dark/10 flex flex-col justify-between overflow-hidden relative">
                
                {/* Background Workshop Atmosphere Image */}
                <div className="h-64 md:h-72 w-full relative overflow-hidden bg-brand-dark">
                  <img
                    src={details?.workspaceImage || activeArtistSpace.avatarUrl}
                    alt={`Atelier de ${activeArtistSpace.name}`}
                    className="w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark to-transparent opacity-85" />
                  <div className="absolute bottom-6 left-6 right-6 text-brand-light space-y-1">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-brand-rust font-bold">
                      Espace de Création Individuel
                    </span>
                    <h3 className="font-display font-extrabold text-2xl uppercase tracking-wide">
                      L'Atelier de {activeArtistSpace.name.split(" ")[0]}
                    </h3>
                    <p className="font-mono text-[10px] text-brand-light/70 uppercase">
                      Hangar {activeArtistSpace.hangarId.toUpperCase().replace("HANGAR-", "")} — Stand dédié
                    </p>
                  </div>
                </div>

                {/* Craft details, tools & materials */}
                <div className="p-8 space-y-6 flex-grow overflow-y-auto">
                  
                  {/* Favourite raw materials */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-brand-rust font-mono text-[10px] uppercase tracking-widest font-bold">
                      <Package className="w-4 h-4" />
                      <span>Matières de Prédilection</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {details?.materials.map((mat, i) => (
                        <span key={i} className="bg-brand-dark/5 border border-dashed border-brand-dark/20 text-brand-gray font-sans text-xs px-2.5 py-1">
                          {mat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tools / Machinery */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-brand-rust font-mono text-[10px] uppercase tracking-widest font-bold">
                      <Hammer className="w-4 h-4" />
                      <span>Outils &amp; Machinerie d'atelier</span>
                    </div>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono text-brand-dark/80">
                      {details?.tools.map((tool, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-brand-rust rounded-full" />
                          <span>{tool}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Current experimental project */}
                  <div className="bg-white/80 p-4 border border-brand-rust/20 border-l-4 border-l-brand-rust space-y-1.5">
                    <div className="flex items-center gap-2 text-brand-rust font-mono text-[9px] uppercase tracking-widest font-bold">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span>Sur l'Établi en ce moment</span>
                    </div>
                    <p className="font-sans text-xs text-brand-dark leading-relaxed">
                      {details?.currentProject}
                    </p>
                    {details?.atmosphereSound && (
                      <p className="font-mono text-[9px] text-brand-gray uppercase italic">
                        Ambiance : {details.atmosphereSound}
                      </p>
                    )}
                  </div>

                </div>

                {/* Footer space branding */}
                <div className="p-4 bg-brand-dark text-brand-light/40 font-mono text-[8px] text-center uppercase tracking-widest border-t border-brand-light/5">
                  Morinerie Digital Spaces v2026.1 // Autonomie Artistique
                </div>

              </div>

              {/* Right Wing: Interactive digital guestbook / message portal */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between space-y-8">
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 text-brand-rust font-mono text-[10px] uppercase tracking-widest">
                      <MessageSquare className="w-4 h-4" />
                      <span>Registre de l'Atelier</span>
                    </div>
                    <h4 className="font-display font-light text-2xl text-brand-dark uppercase tracking-tight mt-1">
                      Le Livre d'Or Virtuel
                    </h4>
                    <p className="font-sans text-xs text-brand-gray mt-1">
                      Laissez un message à l'artiste ou proposez-lui un projet de commande de passage. Votre note sera stockée sur son tableau de bord d'atelier.
                    </p>
                  </div>

                  {/* Add guestbook comment form */}
                  <div className="space-y-3 bg-brand-steel p-4 border border-brand-dark/5">
                    <p className="font-mono text-[9px] text-brand-rust uppercase tracking-wider font-bold">Laisser un mot doux</p>
                    
                    <div className="grid grid-cols-1 gap-2.5">
                      <input
                        type="text"
                        placeholder="Votre nom / Signature"
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                        className="w-full bg-white border border-brand-dark/10 focus:border-brand-rust text-brand-dark font-sans text-xs px-3 py-2 outline-none rounded-none"
                      />
                      <textarea
                        placeholder="Votre message (ex: admiration pour vos textures, demande d'ouverture, etc.)"
                        rows={3}
                        value={visitorComment}
                        onChange={(e) => setVisitorComment(e.target.value)}
                        className="w-full bg-white border border-brand-dark/10 focus:border-brand-rust text-brand-dark font-sans text-xs px-3 py-2 outline-none rounded-none resize-none"
                      />
                      
                      <button
                        onClick={() => handleAddComment(activeArtistSpace.id)}
                        disabled={!visitorName.trim() || !visitorComment.trim()}
                        className="bg-brand-dark hover:bg-brand-rust disabled:bg-brand-dark/20 disabled:cursor-not-allowed text-brand-light font-mono text-[9px] uppercase tracking-widest py-2.5 transition-colors flex items-center justify-center gap-1.5 select-none"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Épingler sur le mur</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Board timeline stream */}
                  <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
                    {comments.length === 0 ? (
                      <p className="text-center font-mono text-[10px] text-brand-gray uppercase py-8">Aucun message pour le moment. Soyez le premier !</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-white p-3.5 border-l-2 border-brand-dark/25 shadow-xs space-y-1">
                          <div className="flex justify-between items-baseline">
                            <span className="font-display font-black text-xs text-brand-dark uppercase tracking-wide">{comment.name}</span>
                            <span className="font-mono text-[8px] text-brand-gray uppercase">{comment.timestamp}</span>
                          </div>
                          <p className="font-sans text-xs text-brand-gray/90 leading-normal">{comment.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Direct contact info block */}
                <div className="pt-6 border-t border-brand-dark/10 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[8px] text-brand-gray uppercase tracking-widest">Coordonnées Pro</span>
                    <p className="font-mono text-[11px] text-brand-dark font-bold">{activeArtistSpace.contactEmail}</p>
                  </div>
                  
                  <a
                    href={`mailto:${activeArtistSpace.contactEmail}?subject=Demande de visite d'atelier - ${activeArtistSpace.name}`}
                    className="bg-brand-dark hover:bg-brand-rust text-brand-light font-mono text-[9px] uppercase tracking-widest py-3 px-5 text-center transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Réserver une visite</span>
                  </a>
                </div>

              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
