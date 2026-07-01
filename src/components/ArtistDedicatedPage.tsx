import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Artist, Artwork } from "../types";
import { 
  ArrowLeft, Mail, Hammer, Package, Clock, MessageSquare, Plus, 
  ChevronLeft, ChevronRight, Play, Pause, Settings, Layout, Sparkles, Paintbrush, Globe, Cpu,
  ShieldCheck, Eye, X, ZoomIn, ZoomOut, Maximize2, Minimize2, ArrowUp, Send, Loader2
} from "lucide-react";
import ArtistBlog from "./ArtistBlog";
import InlineEdit from "../admin-core/InlineEdit";
import { getDisciplines } from "../utils/tags";

interface ArtistDedicatedPageProps {
  artist: Artist;
  onBack: () => void;
  isProMode: boolean;
  onToggleProMode: (val: boolean) => void;
}

// Predefined workshop custom configurations per artist to bring authenticity
const WORKSHOP_METADATA: Record<string, {
  coverImage: string;
  tools: string[];
  materials: string[];
  currentProject: string;
  soundscapeName: string;
  soundscapeDesc: string;
  themeColor: string; // Tailwind accent border/text class
  themeBg: string;
}> = {
  "artist-1": {
    coverImage: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2000",
    tools: ["Poste à souder TIG/MIG", "Meuleuse d'angle pneumatique", "Pont roulant SNCF 5 tonnes", "Chalumeau oxyacétylénique", "Presse hydraulique 20t"],
    materials: ["Acier Corten lourd", "Traverses de rails ferroviaires SNCF", "Scories de fonderie", "Boulons de locomotive", "Acide de patine"],
    currentProject: "Forger une sphère géode monumentale de 3 mètres de diamètre pour la cour centrale des hangars.",
    soundscapeName: "Forge & Enclume",
    soundscapeDesc: "Fracas rythmique de la frappe à chaud et sifflement du chalumeau.",
    themeColor: "text-amber-600 border-amber-600/30 bg-amber-500/5",
    themeBg: "bg-amber-500"
  },
  "artist-2": {
    coverImage: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=2000",
    tools: ["Couteaux à peindre XXL", "Brosses épaisses en soie de porc", "Chalumeau à goudron", "Spatules de lissage", "Projecteurs de chantier"],
    materials: ["Toile de lin écru lourd", "Goudron routier liquide", "Poussière de charbon de coke", "Pigments purs d'outremer", "Chaux éteinte"],
    currentProject: "Série 'Cathédrales d'Ombre' explorant la diffraction lumineuse des verrières d'origine de la Morinerie.",
    soundscapeName: "Grattage de Toile",
    soundscapeDesc: "Frottement sourd et hypnotique de la spatule métallique sur le lin tendu.",
    themeColor: "text-blue-600 border-blue-600/30 bg-blue-500/5",
    themeBg: "bg-blue-500"
  },
  "artist-3": {
    coverImage: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=2000",
    tools: ["Tour de potier Shimpo RK-3D", "Estèques en buis", "Four anagama traditionnel à bois", "Seringues à émail", "Estampes de texture"],
    materials: ["Grès de Puisaye brut", "Porcelaine de Limoges", "Émaux de cendres de hêtre locale", "Sables de Loire", "Argile ferrugineuse sauvage"],
    currentProject: "Cuisson collective de 72 heures non-stop au four à bois anagama partagé du Hangar C.",
    soundscapeName: "Tour Céramique",
    soundscapeDesc: "Ronronnement hypnotique du tour électrique et froissement de la barbotine humide.",
    themeColor: "text-emerald-700 border-emerald-700/30 bg-emerald-500/5",
    themeBg: "bg-emerald-600"
  },
  "artist-4": {
    coverImage: "https://images.unsplash.com/photo-1540206395-68808572332f?q=80&w=2000",
    tools: ["Ciseaux à bois japonais ouchi", "Rabot de paume en bronze", "Scie à ruban triphasée Centauro", "Toupies d'usinage", "Gouges de sculpture"],
    materials: ["Troncs de chêne centenaires", "Loupe de noyer du Périgord", "Colle d'os traditionnelle", "Cire d'abeille naturelle", "Uréthane bio"],
    currentProject: "Table de réunion monumentale assemblée par enfourchements d'onglets pour le réfectoire de la coopérative.",
    soundscapeName: "Rabot & Sciure",
    soundscapeDesc: "Glissement feutré du rabot manuel et froissement régulier des copeaux de bois secs.",
    themeColor: "text-orange-700 border-orange-700/30 bg-orange-500/5",
    themeBg: "bg-orange-600"
  }
};

export default function ArtistDedicatedPage({ artist, onBack, isProMode, onToggleProMode }: ArtistDedicatedPageProps) {
  const meta = WORKSHOP_METADATA[artist.id] || {
    coverImage: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=2000",
    tools: ["Outils à main", "Équipements de protection", "Tréteaux d'atelier"],
    materials: ["Matières premières", "Pigments", "Matériaux de récupération"],
    currentProject: "Créations en cours d'expérimentation pour l'exposition collective des Portes Ouvertes.",
    soundscapeName: "Ambiance d'Atelier",
    soundscapeDesc: "Rumeur lointaine des hangars de la Morinerie.",
    themeColor: "text-brand-rust border-brand-rust/30 bg-brand-rust/5",
    themeBg: "bg-brand-rust"
  };

  // Load hero image from storage
  const heroKey = `morinerie_artist_hero_${artist.id}`;
  const [heroImage, setHeroImage] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(heroKey);
      if (saved) return saved;
    } catch {}
    return meta.coverImage;
  });
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/content/${heroKey}`);
        if (res.ok) {
          const data = await res.json();
          if (data.value) { localStorage.setItem(heroKey, data.value); setHeroImage(data.value); }
        }
      } catch {}
    })();
  }, [heroKey]);

  // Load tags from storage
  const [managedTags, setManagedTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`morinerie_artist_tags_${artist.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/content/morinerie_artist_tags_${artist.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.value) {
            const parsed = JSON.parse(data.value);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localStorage.setItem(`morinerie_artist_tags_${artist.id}`, data.value);
              setManagedTags(parsed);
            }
          }
        }
      } catch {}
    })();
  }, [artist.id]);

  // Load artist works from storage with fallback to static data
  const [artistWorks, setArtistWorks] = useState<Artwork[]>(() => {
    try {
      const saved = localStorage.getItem(`morinerie_artist_works_${artist.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return artist.works;
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/content/morinerie_artist_works_${artist.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.value) {
            const parsed = JSON.parse(data.value);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localStorage.setItem(`morinerie_artist_works_${artist.id}`, data.value);
              setArtistWorks(parsed);
            }
          }
        }
      } catch {}
    })();
  }, [artist.id]);

  // Slider State for Artwork Portfolio
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const activeArtwork = artistWorks[activeSlideIndex] || null;
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Fullscreen Portfolio Lightbox State
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);

  const handleOpenFullscreen = (index: number) => {
    setFullscreenIndex(index);
    setZoomScale(1);
    setIsFullscreenOpen(true);
    setIsAutoPlaying(false); // Pause slideshow when viewing fullscreen
  };

  const handleCloseFullscreen = () => {
    setIsFullscreenOpen(false);
    setZoomScale(1);
  };

  const handleNextFullscreen = () => {
    if (artistWorks.length <= 1) return;
    setFullscreenIndex((prev) => (prev + 1) % artistWorks.length);
    setZoomScale(1); // Reset zoom on slide change
  };

  const handlePrevFullscreen = () => {
    if (artistWorks.length <= 1) return;
    setFullscreenIndex((prev) => (prev - 1 + artistWorks.length) % artistWorks.length);
    setZoomScale(1); // Reset zoom on slide change
  };

  const handleDoubleClick = () => {
    if (zoomScale > 1) {
      setZoomScale(1);
    } else {
      setZoomScale(2.5);
    }
  };

  // Keyboard controls for fullscreen gallery
  useEffect(() => {
    if (!isFullscreenOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNextFullscreen();
      } else if (e.key === "ArrowLeft") {
        handlePrevFullscreen();
      } else if (e.key === "Escape") {
        handleCloseFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreenOpen, artistWorks.length]);

  // Auto-play interval for the artwork slider (resets whenever activeSlideIndex changes for perfect UX)
  useEffect(() => {
    if (!isAutoPlaying || artistWorks.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % artistWorks.length);
    }, 6000); // comfortable 6s reading/viewing time
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, activeSlideIndex, artistWorks.length]);

  // Soundscape Play State
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [frequencyBars, setFrequencyBars] = useState<number[]>(Array(12).fill(15));

  // Guestbook simulated storage state
  const [comments, setComments] = useState<{ id: string; name: string; text: string; timestamp: string }[]>([]);
  const [visitorName, setVisitorName] = useState("");
  const [visitorComment, setVisitorComment] = useState("");
  const [commentSuccess, setCommentSuccess] = useState(false);

  // Scroll to top state & effect
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScrollButton = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScrollButton);
    return () => window.removeEventListener("scroll", handleScrollButton);
  }, []);

  // Contact Form State
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;

    setIsContactSubmitting(true);
    setTimeout(() => {
      setIsContactSubmitting(false);
      setContactSuccess(true);
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    }, 1200);
  };

  // Dedicated page tags states
  const [artistTags, setArtistTags] = useState<string[]>(artist.tags || []);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagText, setNewTagText] = useState("");

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagText.trim().replace(/#/g, "");
    if (!trimmed) return;

    const updated = Array.from(new Set([...artistTags, trimmed]));
    setArtistTags(updated);

    // Save to localStorage
    const storedCustomTags = localStorage.getItem("morinerie_custom_artist_tags") || "{}";
    let customTagsMap: Record<string, string[]> = {};
    try {
      customTagsMap = JSON.parse(storedCustomTags);
    } catch (err) {}

    customTagsMap[artist.id] = Array.from(new Set([...(customTagsMap[artist.id] || []), trimmed]));
    localStorage.setItem("morinerie_custom_artist_tags", JSON.stringify(customTagsMap));

    setNewTagText("");
    setShowAddTag(false);
  };

  // Load and sync Guestbook messages & Custom tags for this artist
  useEffect(() => {
    const fetchGuestbook = () => {
      const stored = localStorage.getItem("morinerie_artist_guestbooks");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed[artist.id]) {
            setComments(parsed[artist.id]);
          }
        } catch (e) {
          console.error("Error reading guestbook", e);
        }
      } else {
        // Fallback to defaults
        const defaults = [
          { id: "1", name: "Marc Delpech", text: "Votre travail m'inspire énormément. On sent l'influence du fer industriel.", timestamp: "Il y a 3 jours" },
          { id: "2", name: "Estelle G.", text: "Une présence absolument magnétique lors de ma visite de la semaine dernière.", timestamp: "Il y a 5 jours" }
        ];
        setComments(defaults);
      }
    };

    const fetchCustomTags = () => {
      const storedCustomTags = localStorage.getItem("morinerie_custom_artist_tags");
      if (storedCustomTags) {
        try {
          const customTagsMap = JSON.parse(storedCustomTags);
          const custom = customTagsMap[artist.id] || [];
          const uniqueTags = Array.from(new Set([...(artist.tags || []), ...custom]));
          setArtistTags(uniqueTags);
        } catch (e) {
          console.error("Error reading custom tags", e);
        }
      } else {
        setArtistTags(artist.tags || []);
      }
    };

    fetchGuestbook();
    fetchCustomTags();
    // Scroll to top of page on load
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, [artist.id, artist.tags]);

  // Audio bars generator effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingSound) {
      interval = setInterval(() => {
        setFrequencyBars(Array(12).fill(0).map(() => Math.floor(Math.random() * 40) + 5));
      }, 150);
    } else {
      setFrequencyBars(Array(12).fill(6));
    }
    return () => clearInterval(interval);
  }, [isPlayingSound]);

  const handleNextSlide = () => {
    if (artistWorks.length > 0) {
      setActiveSlideIndex((prev) => (prev + 1) % artistWorks.length);
    }
  };

  const handlePrevSlide = () => {
    if (artistWorks.length > 0) {
      setActiveSlideIndex((prev) => (prev - 1 + artistWorks.length) % artistWorks.length);
    }
  };

  const handlePostComment = () => {
    if (!visitorName.trim() || !visitorComment.trim()) return;

    const newMsg = {
      id: `${artist.id}-user-${Date.now()}`,
      name: visitorName.trim(),
      text: visitorComment.trim(),
      timestamp: "À l'instant"
    };

    const stored = localStorage.getItem("morinerie_artist_guestbooks");
    let currentData: Record<string, any> = {};
    if (stored) {
      try {
        currentData = JSON.parse(stored);
      } catch (e) {}
    }

    const artistComments = [newMsg, ...(currentData[artist.id] || [])];
    currentData[artist.id] = artistComments;
    
    localStorage.setItem("morinerie_artist_guestbooks", JSON.stringify(currentData));
    setComments(artistComments);
    
    setVisitorName("");
    setVisitorComment("");
    setCommentSuccess(true);
    setTimeout(() => setCommentSuccess(false), 3000);
  };

  return (
    <div className="bg-brand-light text-brand-dark min-h-screen relative font-sans">
      


      {/* Hero Header Frame */}
      <div className="w-full relative h-[40vh] md:h-[50vh] bg-brand-dark overflow-hidden flex items-end">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 md:left-8 z-30 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-brand-light bg-brand-rust hover:brightness-110 px-4 py-2.5 transition-all cursor-pointer rounded-sm shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>
        <img
          src={heroImage}
          alt={`Couverture de l'atelier de ${artist.name}`}
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.5] grayscale-[10%] transition-transform duration-1000 scale-105"
          referrerPolicy="no-referrer"
        />
        
        {/* Abstract metallic graphic shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-light via-brand-light/60 to-brand-light/30 z-10" />

        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 pb-16 relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          
          <div className="lg:col-span-8 space-y-4">
            
            <div className="flex items-center gap-2 overflow-x-auto">
              {(() => {
                const tag = (() => { try { const t = localStorage.getItem(`morinerie_artist_vignette_tag_${artist.id}`); if (t) return t; } catch {} return null; })();
                const tags = managedTags.length > 0 ? managedTags : artistTags;
                return (
                  <>
                    {tag && <span className="shrink-0 font-mono text-[9px] text-brand-light bg-brand-rust border border-brand-rust/30 px-2.5 py-1 uppercase tracking-wide font-bold">#{tag}</span>}
                    {tags.map((t) => (
                      <span key={t} className="shrink-0 font-mono text-[9px] text-brand-light bg-brand-rust border border-brand-rust/30 px-2.5 py-1 uppercase tracking-wide font-bold">
                        #{t}
                      </span>
                    ))}
                  </>
                );
              })()}
              
              {isProMode && (
                showAddTag ? (
                  <form onSubmit={handleAddTag} className="inline-flex items-center gap-1.5 bg-white/95 border border-brand-dark/20 px-2 py-0.5">
                    <input
                      autoFocus
                      type="text"
                      value={newTagText}
                      onChange={(e) => setNewTagText(e.target.value)}
                      placeholder="Nouveau tag..."
                      className="font-mono text-[9px] uppercase tracking-wide bg-transparent text-brand-dark max-w-[80px] focus:outline-none"
                    />
                    <button type="submit" className="text-brand-rust hover:text-brand-dark cursor-pointer font-bold text-xs">
                      ✓
                    </button>
                    <button type="button" onClick={() => setShowAddTag(false)} className="text-brand-gray hover:text-brand-dark cursor-pointer text-xs">
                      ✕
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowAddTag(true)}
                    className="font-mono text-[9px] uppercase tracking-wide bg-white/15 hover:bg-white/30 text-white border border-white/20 px-2 py-1 transition-all cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>+ Tag</span>
                  </button>
                )
              )}

              <span className="text-brand-dark/60 font-mono text-[10px] uppercase tracking-widest">
                • Espace Résident Permanent
              </span>
            </div>

            <InlineEdit storageKey={`morinerie_artist_${artist.id}_name`} tag="h1" className="font-display font-light text-5xl md:text-7xl text-brand-dark uppercase tracking-tight leading-none drop-shadow-sm" defaultHtml={artist.name}>
              {artist.name}
            </InlineEdit>

            <div className="border-l-2 border-brand-rust pl-4 py-1.5 max-w-2xl bg-brand-light/20 backdrop-blur-xs p-3">
              <InlineEdit storageKey={`morinerie_artist_${artist.id}_quote`} tag="p" className="font-sans text-brand-dark/90 text-sm italic font-light leading-relaxed" defaultHtml={`&ldquo;${artist.quote}&rdquo;`}>
                &ldquo;{artist.quote}&rdquo;
              </InlineEdit>
            </div>

          </div>

          <div className="lg:col-span-4 flex justify-start lg:justify-end">
            <div className="flex items-center gap-4 bg-white/95 backdrop-blur-md p-5 border border-brand-dark/10 max-w-sm">
              <img
                src={artist.avatarUrl}
                alt={artist.name}
                className="w-16 h-16 rounded-full object-cover border border-brand-dark/10"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="font-display font-bold text-xs uppercase tracking-widest text-brand-dark">Signature Pro</p>
                <p className="font-mono text-[11px] text-brand-rust uppercase tracking-wider">{getDisciplines(artist.id).join(" · ")}</p>
                <p className="font-mono text-[10px] text-brand-gray mt-1">{artist.contactEmail}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Layout Block */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* TOP ROW: 2/3 Bio + 1/3 Tags & Tools */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-2">
            <InlineEdit storageKey="morinerie_artpage_surtitre" tag="span" className="font-mono text-[9px] text-brand-rust uppercase tracking-[0.25em] font-bold block">
              Vision Créatrice
            </InlineEdit>
            <InlineEdit storageKey="morinerie_artpage_titre" tag="h2" className="font-display font-light text-3xl text-brand-dark uppercase tracking-tight">
              Le Geste et la Démarche
            </InlineEdit>
          </div>
          <InlineEdit storageKey={`morinerie_artist_${artist.id}_bio`} tag="p" className="font-sans text-brand-gray text-sm md:text-base leading-relaxed whitespace-pre-line font-light" defaultHtml={artist.bio}>
              {artist.bio}
            </InlineEdit>
        </div>

        <div className="lg:col-span-4 space-y-10">
          {getDisciplines(artist.id).length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-brand-rust font-mono text-[10px] uppercase tracking-widest font-bold">
              <Package className="w-4.5 h-4.5" />
              <span>Disciplines</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {getDisciplines(artist.id).map((d) => (
                <span key={d} className="bg-brand-rust/10 border border-brand-rust/20 text-brand-rust font-sans text-xs px-3 py-1.5 uppercase font-bold">
                  #{d}
                </span>
              ))}
            </div>
          </div>
          )}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-brand-rust font-mono text-[10px] uppercase tracking-widest font-bold">
              <Package className="w-4.5 h-4.5" />
              <span>Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(managedTags.length > 0 ? managedTags : meta.materials).map((tag, i) => (
                <span key={i} className="bg-brand-steel/50 border border-dashed border-brand-dark/20 text-brand-gray font-sans text-xs px-3 py-1.5 uppercase">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

        </div>

      {/* BOTTOM ROW: FULL WIDTH — Slider, Blog, Guestbook */}
        <div className="lg:col-span-12 space-y-16">
          
          {/* Main Portfolio Slide Gallery Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <InlineEdit storageKey="morinerie_artpage_slider_surtitre" tag="span" className="font-mono text-[9px] text-brand-rust uppercase tracking-widest font-bold">
                  Galerie
                </InlineEdit>
                <InlineEdit storageKey="morinerie_artpage_slider_titre" tag="h3" className="font-display font-light text-3xl text-brand-dark uppercase tracking-tight">
                  Le Portfolio
                </InlineEdit>
              </div>
              
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-brand-dark font-bold">{activeSlideIndex + 1}</span>
                <span className="text-brand-gray">/</span>
                <span className="text-brand-gray">{artistWorks.length}</span>
              </div>
            </div>

            {artistWorks.length > 0 && activeArtwork ? (
              <div className="space-y-6">
                
                {/* Massive Slide Showcase with dynamic navigation buttons */}
                <div 
                  className="bg-brand-steel border border-brand-dark/10 relative overflow-hidden group/slider aspect-[4/3] md:aspect-[16/10] flex items-center justify-center"
                  onMouseEnter={() => setIsAutoPlaying(false)}
                  onMouseLeave={() => setIsAutoPlaying(true)}
                >
                  
                  <div 
                    onClick={() => handleOpenFullscreen(activeSlideIndex)}
                    className="absolute inset-0 w-full h-full cursor-zoom-in group"
                  >
                    <AnimatePresence>
                      <motion.img
                        key={activeSlideIndex}
                        src={activeArtwork.imageUrl}
                        alt={activeArtwork.title}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                    </AnimatePresence>
                    
                    {/* Centered Hover Zoom Overlay */}
                    <div className="absolute inset-0 bg-brand-dark/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                      <div className="bg-brand-dark/80 text-brand-light border border-white/20 px-4 py-2 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <Eye className="w-4 h-4 text-brand-rust animate-pulse" />
                        <span>Agrandir / Zoomer (Plein Écran)</span>
                      </div>
                    </div>
                  </div>

                  {/* Absolute Nav Overlays with smooth fade transitions */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/60 to-transparent p-6 pt-28 text-brand-light flex items-end justify-between z-10 pointer-events-none">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={activeSlideIndex}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="space-y-1.5 max-w-xl pointer-events-auto"
                      >
                        <span className="inline-block font-mono text-[9px] text-brand-rust uppercase tracking-widest font-bold bg-brand-dark/80 px-2 py-0.5 border border-white/5">
                          {activeArtwork.medium}
                        </span>
                        {activeArtwork.tags && activeArtwork.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {activeArtwork.tags.map((tag) => (
                              <span key={tag} className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-brand-rust text-brand-light border border-brand-rust/30 font-bold">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <h4 className="font-display font-extrabold text-xl md:text-2xl uppercase tracking-wide text-white drop-shadow-sm">
                          {activeArtwork.title} ({activeArtwork.year})
                        </h4>
                        <div className="font-sans text-xs text-brand-light/95 font-light leading-relaxed [&_p]:text-brand-light/95 [&_span]:text-brand-light/95 [&_div]:text-brand-light/95"
                             dangerouslySetInnerHTML={{ __html: activeArtwork.description }} />
                      </motion.div>
                    </AnimatePresence>

                  </div>

                  {/* Left Slide Arrow */}
                  <button
                    onClick={handlePrevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-brand-dark/80 hover:bg-brand-rust text-brand-light border border-brand-light/10 flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover/slider:opacity-100 focus:outline-none z-20 shadow-md"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Right Slide Arrow */}
                  <button
                    onClick={handleNextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-brand-dark/80 hover:bg-brand-rust text-brand-light border border-brand-light/10 flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover/slider:opacity-100 focus:outline-none z-20 shadow-md"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Custom Progress Bar matching the architecture aesthetic */}
                  {isAutoPlaying && artistWorks.length > 1 && (
                    <motion.div
                      key={activeSlideIndex}
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 6, ease: "linear" }}
                      className="absolute bottom-0 left-0 h-[3px] bg-brand-rust z-30 pointer-events-none"
                    />
                  )}

                </div>

                {/* Thumbnail List Selection Row */}
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {artistWorks.map((work, idx) => (
                    <button
                      key={work.id}
                      onClick={() => {
                        setActiveSlideIndex(idx);
                        handleOpenFullscreen(idx);
                      }}
                      className={`aspect-square overflow-hidden border transition-all cursor-pointer relative group/thumb ${
                        activeSlideIndex === idx 
                          ? "border-brand-rust ring-1 ring-brand-rust" 
                          : "border-brand-dark/10 hover:border-brand-dark"
                      }`}
                    >
                      <img
                        src={work.imageUrl}
                        alt={work.title}
                        className="w-full h-full object-cover select-none transition-transform duration-300 group-hover/thumb:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-brand-dark/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-4 h-4 text-brand-light" />
                      </div>
                      {activeSlideIndex === idx && (
                        <div className="absolute inset-0 bg-brand-rust/10 flex items-center justify-center" />
                      )}
                    </button>
                  ))}
                </div>


              </div>
            ) : (
              <div className="bg-brand-steel py-16 border border-brand-dark/10 text-center font-mono text-xs text-brand-gray uppercase">
                Aucune oeuvre répertoriée pour le moment.
              </div>
            )}

          </div>

          {/* Workshop News & Blog Space */}
          <div className="pt-10 border-t border-brand-dark/10">
            <ArtistBlog artist={artist} isProMode={isProMode} />
          </div>

          {/* Interactive Guestbook Column */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-10 border-t border-brand-dark/10">
            
            <div className="md:col-span-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-brand-rust font-mono text-[10px] uppercase tracking-widest">
                  <MessageSquare className="w-4 h-4" />
                  <span>Registre de Visite</span>
                </div>
                <h4 className="font-display font-light text-2xl text-brand-dark uppercase tracking-tight mt-1">
                  Le Livre d'Or
                </h4>
                <p className="font-sans text-xs text-brand-gray mt-2 leading-relaxed">
                  Laissez une note d'admiration, une impression de visite ou proposez un projet collaboratif directement sur le registre de l'atelier de {artist.name.split(" ")[0]}.
                </p>
              </div>

              {/* Action form */}
              <div className="space-y-3 bg-brand-steel p-5 border border-brand-dark/10">
                <p className="font-mono text-[9px] text-brand-rust uppercase tracking-wider font-bold">Épingler un mot</p>
                
                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Votre Nom / Signature"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="w-full bg-white border border-brand-dark/10 focus:border-brand-rust text-brand-dark font-sans text-xs px-3 py-2 outline-none rounded-none text-brand-dark"
                  />
                  <textarea
                    placeholder="Votre message d'encouragement..."
                    rows={3}
                    value={visitorComment}
                    onChange={(e) => setVisitorComment(e.target.value)}
                    className="w-full bg-white border border-brand-dark/10 focus:border-brand-rust text-brand-dark font-sans text-xs px-3 py-2 outline-none rounded-none resize-none"
                  />
                  
                  <button
                    onClick={handlePostComment}
                    disabled={!visitorName.trim() || !visitorComment.trim()}
                    className="w-full bg-brand-dark hover:bg-brand-rust disabled:bg-brand-dark/20 disabled:cursor-not-allowed text-brand-light font-mono text-[9px] uppercase tracking-widest py-3 transition-colors flex items-center justify-center gap-2 cursor-pointer font-bold select-none"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Épingler le message</span>
                  </button>

                  {commentSuccess && (
                    <p className="text-emerald-600 font-mono text-[9px] text-center uppercase tracking-wider animate-pulse">
                      ✓ Votre note a été ajoutée avec succès !
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-7 space-y-4">
              <h5 className="font-mono text-[9px] text-brand-gray uppercase tracking-widest">Messages du Registre ({comments.length})</h5>
              
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 scrollbar-thin">
                {comments.length === 0 ? (
                  <p className="text-center font-mono text-[10px] text-brand-gray uppercase py-12">Le registre est encore vierge. Laissez le premier mot !</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-white p-4 border border-brand-dark/10 border-l-2 border-l-brand-rust space-y-1.5 shadow-sm">
                      <div className="flex justify-between items-baseline">
                        <span className="font-display font-black text-xs text-brand-dark uppercase tracking-wide">{comment.name}</span>
                        <span className="font-mono text-[8px] text-brand-gray uppercase">{comment.timestamp}</span>
                      </div>
                      <p className="font-sans text-xs text-brand-gray leading-normal italic">
                        "{comment.text}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* CONTACT L'ARTISTE FORM */}
          <div id="artist-contact-form" className="bg-brand-steel p-6 md:p-8 border border-brand-dark/10 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-brand-rust font-mono text-[10px] uppercase tracking-widest font-bold">
                <Mail className="w-4 h-4" />
                <span>Message Direct à l'Atelier</span>
              </div>
              <h4 className="font-display font-light text-2xl text-brand-dark uppercase tracking-tight mt-1">
                Écrire à {artist.name}
              </h4>
              <p className="font-sans text-xs text-brand-gray leading-relaxed">
                  Une question sur son travail, une demande d'acquisition sur-mesure ou de visite privée de son atelier ?<br />
                  Remplissez ce formulaire pour contacter l'artiste directement.
              </p>
            </div>

            {contactSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 text-center space-y-3">
                <p className="text-emerald-700 font-display font-bold text-xs uppercase tracking-wider">
                  ✓ Message Transmis Avec Succès !
                </p>
                <p className="font-sans text-xs text-brand-gray">
                  Merci pour votre démarche. {artist.name.split(" ")[0]} prendra connaissance de votre message et vous répondra sous peu.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold">
                      Votre Nom
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Constance Renaud"
                      className="w-full bg-white border border-brand-dark/10 focus:border-brand-rust text-brand-dark font-sans text-xs px-3 py-2.5 outline-none rounded-none focus:outline-none focus:ring-0 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold">
                      Adresse E-mail
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="constance@email.com"
                      className="w-full bg-white border border-brand-dark/10 focus:border-brand-rust text-brand-dark font-sans text-xs px-3 py-2.5 outline-none rounded-none focus:outline-none focus:ring-0 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold">
                    Votre Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder={`Écrivez votre message pour ${artist.name.split(" ")[0]} ici...`}
                    className="w-full bg-white border border-brand-dark/10 focus:border-brand-rust text-brand-dark font-sans text-xs p-3 outline-none rounded-none resize-none focus:outline-none focus:ring-0 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isContactSubmitting}
                  className="w-full bg-brand-dark hover:bg-brand-rust disabled:bg-brand-gray text-brand-light font-mono text-xs uppercase tracking-widest py-3.5 transition-all flex items-center justify-center gap-2 cursor-pointer font-bold select-none"
                >
                  {isContactSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmission...</span>
                    </>
                  ) : (
                    <>
                      <span>Envoyer le Message</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
            </div>
          </div>

      </div>

      {/* SECURE ADMIN PANEL PORTAL MOCKUP ("note le dans un coin" placeholder) */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pb-20 -mt-16">
        <div className="bg-brand-steel p-6 md:p-8 border border-brand-rust/20 border-l-4 border-l-brand-rust space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="bg-brand-rust/10 p-2 text-brand-rust rounded-sm">
                  <Settings className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <span className="font-mono text-[8px] text-brand-rust uppercase tracking-[0.25em] font-bold block">
                    Bêta d'Administration Individuelle
                  </span>
                  <h4 className="font-display font-extrabold text-sm text-brand-dark uppercase tracking-wider">
                    Espace Artiste • Personnalisation
                  </h4>
                </div>
              </div>

              <span className="self-start sm:self-center bg-brand-dark/10 text-brand-dark font-mono text-[9px] uppercase px-2 py-1">
                Phase de déploiement : Q3 2026
              </span>
            </div>

            <p className="font-sans text-xs text-brand-gray leading-relaxed">
              <strong>Note de développement :</strong> Cet espace numérique respecte l'autonomie de ses créateurs.<br />À terme, cette section donnera lieu à un panneau de gestion privé sécurisé. Chaque résident pourra gérer et alimenter la globalité des contenus présents sur sa page.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white/60 p-3 border border-brand-dark/5 flex flex-col gap-1 text-[10px] font-mono opacity-80">
                <Paintbrush className="w-4 h-4 text-brand-rust" />
                <span className="font-bold text-brand-dark uppercase text-[8px]">Charte &amp; Thèmes</span>
                <span className="text-brand-gray text-[9px]">Palette active</span>
              </div>
              <div className="bg-white/60 p-3 border border-brand-dark/5 flex flex-col gap-1 text-[10px] font-mono opacity-80">
                <Layout className="w-4 h-4 text-brand-rust" />
                <span className="font-bold text-brand-dark uppercase text-[8px]">Agencement Slider</span>
                <span className="text-brand-gray text-[9px]">Mises en page 3D</span>
              </div>
              <div className="bg-white/60 p-3 border border-brand-dark/5 flex flex-col gap-1 text-[10px] font-mono opacity-80">
                <Globe className="w-4 h-4 text-brand-rust" />
                <span className="font-bold text-brand-dark uppercase text-[8px]">Nom de Domaine</span>
                <span className="text-brand-gray text-[9px]">morinerie.fr/{artist.id}</span>
              </div>
              <div className="bg-white/60 p-3 border border-brand-dark/5 flex flex-col gap-1 text-[10px] font-mono opacity-80">
                <Cpu className="w-4 h-4 text-brand-rust" />
                <span className="font-bold text-brand-dark uppercase text-[8px]">Blog &amp; Rédactionnel</span>
                <span className="text-brand-gray text-[9px]">Gestion complète des pages &amp; articles</span>
              </div>
            </div>
          </div>
        </div>

      {/* FULLSCREEN LIGHTBOX PORTFOLIO MODAL WITH ADVANCED ZOOM & PAN */}
      <AnimatePresence>
        {isFullscreenOpen && artistWorks[fullscreenIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-brand-dark/98 z-[200] flex flex-col justify-between overflow-hidden select-none"
          >
            {/* TOP HEADER CONTROLS */}
            <div className="bg-brand-dark/90 border-b border-white/5 px-6 py-4 flex items-center justify-between z-50">
              <div className="flex items-center gap-4">
                <span className="font-mono text-[10px] text-brand-rust uppercase tracking-widest font-bold">
                  Carnet d'Atelier • Plein Écran
                </span>
                <span className="hidden md:inline text-white/20">|</span>
                <span className="hidden md:inline font-mono text-[10px] text-brand-light/60">
                  {artistWorks[fullscreenIndex].title} ({artistWorks[fullscreenIndex].year})
                </span>
              </div>

              {/* Central Zoom indicator */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomScale(prev => Math.max(prev - 0.5, 1))}
                  disabled={zoomScale <= 1}
                  type="button"
                  className="p-1.5 bg-white/5 border border-white/10 text-brand-light hover:bg-brand-rust hover:text-white disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-brand-light transition-colors cursor-pointer"
                  title="Zoom arrière"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <div className="w-16 text-center font-mono text-[10px] text-brand-light/90 uppercase tracking-widest">
                  {Math.round(zoomScale * 100)}%
                </div>
                <button
                  onClick={() => setZoomScale(prev => Math.min(prev + 0.5, 4))}
                  disabled={zoomScale >= 4}
                  type="button"
                  className="p-1.5 bg-white/5 border border-white/10 text-brand-light hover:bg-brand-rust hover:text-white disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-brand-light transition-colors cursor-pointer"
                  title="Zoom avant"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomScale(zoomScale > 1 ? 1 : 2.5)}
                  type="button"
                  className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-brand-rust border border-white/10 font-mono text-[9px] uppercase tracking-widest text-brand-light transition-colors cursor-pointer"
                  title={zoomScale > 1 ? "Ajuster à l'écran" : "Résolution Réelle"}
                >
                  {zoomScale > 1 ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{zoomScale > 1 ? "Ajuster" : "Taille Réelle"}</span>
                </button>
              </div>

              {/* Close button */}
              <button
                onClick={handleCloseFullscreen}
                type="button"
                className="p-2 bg-brand-rust/20 border border-brand-rust/30 text-brand-rust hover:bg-brand-rust hover:text-white transition-all cursor-pointer"
                title="Fermer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* MAIN IMAGE CONTAINER */}
            <div 
              className="relative flex-1 flex items-center justify-center p-4 overflow-hidden"
              style={{ cursor: zoomScale > 1 ? "grab" : "zoom-in" }}
            >
              {/* Floating Instructions */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/45 border border-white/5 px-4 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest text-white/70 pointer-events-none z-10 text-center">
                {zoomScale > 1 ? "Glissez pour explorer l'œuvre • Double-cliquez pour réinitialiser" : "Double-cliquez pour zoomer • Flèches pour naviguer"}
              </div>

              {/* Navigation Arrows inside full screen modal */}
              {artistWorks.length > 1 && (
                <>
                  <button
                    onClick={handlePrevFullscreen}
                    type="button"
                    className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-brand-dark/90 hover:bg-brand-rust text-brand-light border border-white/10 flex items-center justify-center transition-all cursor-pointer z-30"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNextFullscreen}
                    type="button"
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-brand-dark/90 hover:bg-brand-rust text-brand-light border border-white/10 flex items-center justify-center transition-all cursor-pointer z-30"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Scalable & Draggable Image Canvas */}
              <div className="w-full h-full flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={fullscreenIndex}
                    src={artistWorks[fullscreenIndex].imageUrl}
                    alt={artistWorks[fullscreenIndex].title}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ scale: zoomScale, opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      opacity: { duration: 0.25 },
                      scale: { type: "spring", stiffness: 300, damping: 28 }
                    }}
                    drag={zoomScale > 1}
                    dragConstraints={{
                      left: -500 * (zoomScale - 1),
                      right: 500 * (zoomScale - 1),
                      top: -350 * (zoomScale - 1),
                      bottom: 350 * (zoomScale - 1)
                    }}
                    dragElastic={0.15}
                    onDoubleClick={handleDoubleClick}
                    className="max-h-[75vh] max-w-[85vw] object-contain select-none shadow-2xl border border-white/5"
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
              </div>
            </div>

            {/* BOTTOM DETAILS TRAY */}
            <div className="bg-brand-dark/95 border-t border-white/5 p-6 md:p-8 z-50">
              <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-[9px] text-brand-rust uppercase tracking-widest font-bold bg-brand-rust/10 border border-brand-rust/30 px-2 py-0.5">
                      {artistWorks[fullscreenIndex].medium}
                    </span>
                  </div>
                  <h3 className="font-display font-light text-2xl md:text-3xl text-brand-light uppercase tracking-wide leading-tight">
                    {artistWorks[fullscreenIndex].title}{" "}
                    <span className="text-brand-rust">({artistWorks[fullscreenIndex].year})</span>
                  </h3>
                </div>

                <div className="max-w-xl md:border-l md:border-white/10 md:pl-6">
                  <div className="font-sans text-xs md:text-sm text-brand-light/70 font-light leading-relaxed [&_p]:text-brand-light/70 [&_span]:text-brand-light/70 [&_div]:text-brand-light/70"
                     dangerouslySetInnerHTML={{ __html: artistWorks[fullscreenIndex].description }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 z-40 bg-brand-dark hover:bg-brand-rust text-brand-light w-12 h-12 rounded-none flex items-center justify-center transition-all duration-300 border border-brand-light/10 shadow-lg cursor-pointer"
          title="Retour en haut"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

    </div>
  );
}
