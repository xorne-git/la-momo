import { useState, useMemo } from "react";
import { ARTISTS } from "../data";
import { Artist } from "../types";
import { AnimatePresence, motion } from "motion/react";
import { Layers, ArrowRight, Hammer, Info, MapPin, X } from "lucide-react";
import InlineEdit from "../admin-core/InlineEdit";
import { useAuth } from "../context/AuthContext";
import { toast } from "../utils/toast";
import { getDisciplines } from "../utils/tags";
import { demoMode } from "../utils/demo";

interface HangarMapProps {
  onArtistSelect: (artistId: string) => void;
}

interface MapPoint {
  id: string;
  label: string;
  artistId?: string; // Links to real artist if available
  artistName: string;
  discipline: string;
  specialty: string;
  avatarUrl: string;
  coordinates: { x: number; y: number };
  description: string;
  hangarName: string;
}

export default function HangarMap({ onArtistSelect }: HangarMapProps) {
  // Rich set of 10 points with randomized artist assignments
  const MAP_POINTS = useMemo((): MapPoint[] => {
    const ids = ["artist-1", "artist-2", "artist-3", "artist-4"];
    const pool = [...ids, ...ids, ...ids].slice(0, 10);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const hangars = ["Hangar A — Les Volumes", "Hangar A — Les Volumes", "Hangar A — Les Volumes", "Hangar B — Les Matières", "Hangar B — Les Matières", "Hangar B — Les Matières", "Hangar C — Les Couleurs", "Hangar C — Les Couleurs", "Hangar C — Les Couleurs", "Hangar C — Les Couleurs"];
    const coords: { x: number; y: number }[] = [
      { x: 26, y: 38 }, { x: 18, y: 28 }, { x: 35, y: 45 },
      { x: 55, y: 55 }, { x: 48, y: 68 }, { x: 62, y: 58 },
      { x: 78, y: 25 }, { x: 70, y: 18 }, { x: 86, y: 30 },
      { x: 82, y: 36 }
    ];
    return pool.map((artistId, i) => {
      const artist = ARTISTS.find((a) => a.id === artistId);
      return {
        id: `point-${i + 1}`,
        label: `Atelier ${String(i + 1).padStart(2, "0")} — ${artist?.name || ""}`,
        artistId,
        artistName: artist?.name || "",
        discipline: artist?.discipline || "",
        specialty: artist?.tags?.[0] || "",
        avatarUrl: artist?.avatarUrl || "",
        coordinates: coords[i],
        description: artist?.bio || "",
        hangarName: hangars[i],
      };
    });
  }, []);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  type SpotlightMode = "pinned" | "random";
  const [mode, setMode] = useState<SpotlightMode>(() => {
    return (localStorage.getItem("morinerie_spotlight_mode") as SpotlightMode) || "random";
  });

  const doSpotlight = (artist: Artist) => {
    setSpotlightArtist(artist);
    localStorage.setItem("morinerie_spotlight_artist", artist.id);
    setMode("pinned");
    localStorage.setItem("morinerie_spotlight_mode", "pinned");
    toast.success(`${artist.name} mis·e à l'honneur`);
  };

  const [spotlightArtist, setSpotlightArtist] = useState<Artist>(() => {
    const saved = localStorage.getItem("morinerie_spotlight_artist");
    if (saved && mode === "pinned") {
      const found = ARTISTS.find((a) => a.id === saved);
      if (found) return found;
    }
    // Random fallback
    const randomIndex = Math.floor(Math.random() * ARTISTS.length);
    return ARTISTS[randomIndex] || ARTISTS[0];
  });

  const pickRandomArtist = (showToast = true) => {
    setMode("random");
    localStorage.setItem("morinerie_spotlight_mode", "random");
    localStorage.removeItem("morinerie_spotlight_artist");
    const filtered = ARTISTS.filter((a) => a.id !== spotlightArtist.id);
    const next = filtered[Math.floor(Math.random() * filtered.length)] || ARTISTS[0];
    setSpotlightArtist(next);
    if (showToast) toast.info(`🎲 ${next.name} à l'affiche`);
  };

  const currentPoint = MAP_POINTS.find((p) => p.id === selectedPointId) || null;

  return (
    <div className="bg-brand-light py-16 md:py-24" id="plan-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Title Section */}
        <div className="mb-12 md:mb-16 space-y-4">
          <div className="flex items-center gap-2 text-brand-rust font-mono text-xs uppercase tracking-widest">
            <Layers className="w-4 h-4" />
            <InlineEdit storageKey="morinerie_map_surtitre" tag="span">Orientation &amp; Cartographie</InlineEdit>
          </div>
          <InlineEdit storageKey="morinerie_map_title" tag="h2" className="font-display font-light text-4xl md:text-5xl text-brand-dark uppercase tracking-tight leading-none">
            Plan interactif des ateliers
          </InlineEdit>
          <InlineEdit storageKey="morinerie_map_desc" tag="p" className="font-sans text-brand-gray text-base max-w-2xl">
            Découvrez la friche industrielle de la Morinerie. Cliquez sur le plan ci-dessous pour ouvrir la cartographie interactive complète ou parcourez les studios de nos résidents.
          </InlineEdit>
        </div>

        {/* New Split Layout: Left Map Preview, Right Random Spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          
          {/* Left Column: Interactive Map Preview Card */}
          <div className="lg:col-span-7 bg-[#fdfdfc] border border-brand-dark/10 p-5 md:p-6 flex flex-col justify-between rounded-sm shadow-md group relative overflow-hidden h-[450px]">
            {/* Architectural grid overlay */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[linear-gradient(to_right,#d16436_1px,transparent_1px),linear-gradient(to_bottom,#d16436_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            <div className="relative z-10 flex justify-between items-start font-mono text-[9px] text-brand-dark/40 uppercase tracking-widest mb-3">
              <span className="font-bold text-brand-rust">ORIENTATION DES ATELIERS</span>
              <span>CARTE DU SITE</span>
            </div>

            {/* Clickable Map image preview wrapper */}
            <div 
              onClick={() => { if (!demoMode) setIsModalOpen(true); }}
              className={`relative flex-1 w-full rounded-sm border border-brand-dark/10 overflow-hidden ${demoMode ? "" : "cursor-pointer"} group-hover:border-brand-rust/50 transition-all duration-300 select-none bg-[#faf8f5] flex items-center justify-center shadow-inner`}
            >
              <img
                src="/images/carte_website.png"
                alt="Plan des ateliers de la Morinerie"
                className="w-full h-full object-cover opacity-80 filter grayscale sepia saturate-[1.4] hue-rotate-[340deg] contrast-[1.05] brightness-[1.02] transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-brand-dark/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-brand-rust shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <Layers className="w-5 h-5 animate-pulse" />
                </span>
                <span className="mt-3 font-mono text-[10px] text-white uppercase tracking-widest font-bold">
                  Explorer le plan complet
                </span>
              </div>

              {/* Mobile friendly tap tag */}
              <div className="absolute bottom-3 left-3 bg-brand-dark/95 border border-white/10 text-white font-mono text-[8px] px-2.5 py-1 uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                <Layers className="w-3.5 h-3.5 text-brand-rust" />
                <span>Cliquer pour ouvrir</span>
              </div>
            </div>

            {/* Bottom details of the card */}
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end pt-4 mt-3 gap-3 border-t border-brand-dark/10">
              <div>
                <h3 className="font-display font-extrabold text-base text-brand-dark uppercase tracking-tight">Vue générale</h3>
                <p className="font-sans text-[11px] text-brand-gray">Ouvrir la cartographie interactive complète du site.</p>
              </div>
              {!demoMode && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-brand-rust hover:bg-brand-dark text-white font-mono text-[9px] uppercase tracking-wider px-4 py-2 transition-colors cursor-pointer font-bold rounded-sm shadow-sm"
              >
                <span>Agrandir le plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              )}
            </div>
          </div>

          {/* Right Column: Artist Spotlight Card */}
          <div className="lg:col-span-5 flex flex-col gap-0">
          <div 
            className="group relative min-h-[450px] w-full bg-brand-steel overflow-hidden border border-brand-dark/10 shadow-md hover:shadow-xl transition-all duration-500 ease-out flex flex-col justify-end cursor-pointer"
            onClick={() => onArtistSelect(spotlightArtist.id)}
          >
            {/* Mode badge on spotlight card */}
            {isAdmin && mode === "pinned" && (
              <div className="absolute top-2 right-2 z-20 bg-brand-rust text-white font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 shadow-sm">
                Épinglé
              </div>
            )}
            {isAdmin && mode === "random" && (
              <div className="absolute top-2 right-2 z-20 bg-brand-dark/70 text-white font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 shadow-sm border border-white/10">
                Aléatoire
              </div>
            )}

            {/* Visual Chosen by the Artist (Cover) */}
            <div className="absolute inset-0 w-full h-full bg-brand-dark overflow-hidden">
              <img
                src={spotlightArtist.featuredWorkUrl || spotlightArtist.works?.[0]?.imageUrl || spotlightArtist.avatarUrl}
                alt={spotlightArtist.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale-[20%] group-hover:grayscale-0"
                referrerPolicy="no-referrer"
              />
              {/* Subtle Elegant Overlay Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-brand-dark/45 to-transparent opacity-95 transition-opacity duration-300 group-hover:opacity-85" />
            </div>

            {/* Always-Visible Standard Face Info (At the bottom of the card) */}
            <div className="relative z-10 p-6 space-y-3 transition-all duration-500 group-hover:opacity-0 group-hover:translate-y-4">
              <div className="space-y-1">
                <div className="flex items-start font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">
                  <span className="font-bold text-brand-rust flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 bg-brand-rust animate-pulse rounded-full" />
                    L'Atelier à l'honneur
                  </span>
                </div>
                {(() => { try { const vt = localStorage.getItem(`morinerie_artist_vignette_tag_${spotlightArtist.id}`); if (vt) return <span className="inline-block font-mono text-[9px] text-brand-light bg-brand-rust border border-brand-rust/30 px-2 py-0.5 uppercase tracking-widest font-bold mb-1">#{vt}</span>; } catch {} return null; })()}
                <div className="flex flex-wrap gap-1 mb-1">
                  {getDisciplines(spotlightArtist.id).map((d) => (
                    <span key={d} className="inline-block font-mono text-[8px] text-brand-light bg-brand-rust/80 border border-brand-rust/30 px-1.5 py-0.5 uppercase tracking-widest">#{d}</span>
                  ))}
                </div>
                <h3 className="font-display font-extrabold text-xl text-brand-light uppercase tracking-wide leading-none mt-1">
                  {spotlightArtist.name}
                </h3>
              </div>

              {/* Top Popular Tags */}
              <div className="flex flex-wrap gap-1">
                {spotlightArtist.tags?.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-white/5 border border-dashed border-white/20 text-white/70"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <p className="font-mono text-[9px] text-white/50 uppercase tracking-widest pt-2 flex items-center gap-1">
                <span>Survolez pour en savoir plus</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </p>


            </div>

            {/* Hover Reveal Face: Complete quote, biography snippet, contact & full action options */}
            <div className="absolute inset-0 bg-white p-6 md:p-8 flex flex-col justify-between z-20 transition-all duration-500 translate-y-full group-hover:translate-y-0 ease-out border border-brand-dark/15 shadow-2xl">
              <div className="space-y-4">
                {/* Header of hover pane with mini avatar */}
                <div className="flex items-center gap-3 pb-3 border-b border-brand-dark/10">
                  <img
                    src={spotlightArtist.avatarUrl}
                    alt={spotlightArtist.name}
                    className="w-10 h-10 rounded-full object-cover border border-brand-dark/15"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="font-display font-bold text-base text-brand-dark uppercase leading-none mb-0.5">
                      {spotlightArtist.name}
                    </h4>
                    {(() => { try { const vt = localStorage.getItem(`morinerie_artist_vignette_tag_${spotlightArtist.id}`); if (vt) return <span className="font-mono text-[9px] text-brand-rust uppercase tracking-wider font-bold block mb-0.5">#{vt}</span>; } catch {} return null; })()}
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {getDisciplines(spotlightArtist.id).map((d) => (
                        <span key={d} className="font-mono text-[8px] text-brand-light bg-brand-rust/80 border border-brand-rust/30 px-1.5 py-0.5 uppercase tracking-widest">#{d}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative pl-3 border-l-2 border-brand-rust/35 py-0.5">
                  <p className="font-serif italic text-brand-dark/80 text-[12px] leading-relaxed line-clamp-3">
                    &ldquo;{spotlightArtist.quote}&rdquo;
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {spotlightArtist.tags?.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-brand-steel/50 border border-dashed border-brand-dark/20 text-brand-gray"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Vignettes Selector Row (Integrated seamlessly in the roll-over screen) */}
                <div className="border-t border-brand-dark/5 pt-3 mt-1" onClick={(e) => e.stopPropagation()}>
                  <span className="block font-mono text-[8px] text-brand-gray uppercase tracking-widest mb-1.5 font-bold">
                    Découvrir d'autres résidents :
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {ARTISTS.map((artist) => {
                      const isActive = spotlightArtist.id === artist.id;
                      return (
                        <button
                          key={artist.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSpotlightArtist(artist);
                          }}
                          className={`relative w-8 h-8 shrink-0 overflow-hidden transition-all cursor-pointer rounded-none group/thumb ${
                            isActive 
                              ? "border border-brand-rust ring-1 ring-brand-rust scale-105" 
                              : "border border-brand-dark/10 hover:border-brand-dark/30 hover:scale-102"
                          }`}
                          title={artist.name}
                        >
                          <img
                            src={artist.avatarUrl}
                            alt={artist.name}
                            className={`w-full h-full object-cover select-none transition-all duration-300 ${
                              isActive ? "grayscale-0" : "grayscale hover:grayscale-0"
                            }`}
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action row inside rollover */}
              <div className="flex items-center justify-end pt-3 mt-1 border-t border-brand-dark/10">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onArtistSelect(spotlightArtist.id);
                  }}
                  className="inline-flex items-center gap-1 bg-brand-rust hover:bg-brand-dark text-white font-mono text-[10px] uppercase tracking-wider px-4 py-2 transition-colors cursor-pointer font-bold"
                >
                  <span>Visiter l'atelier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>


          </div>

          {/* Admin bar — redesigned ergonomics */}
          {isAdmin && (
            <div className="pt-3 space-y-3">
              {/* Mode toggle */}
              <div className="flex items-center justify-center gap-0 border border-brand-dark/20 rounded-sm overflow-hidden">
                <button
                  title="Épingler l'artiste prévisualisé"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); doSpotlight(spotlightArtist); }}
                  className={`flex-1 font-mono text-[10px] uppercase tracking-wider py-2.5 transition-colors cursor-pointer font-bold ${
                    mode === "pinned"
                      ? "bg-brand-rust text-white"
                      : "bg-brand-light text-brand-gray hover:bg-brand-steel"
                  }`}
                >
                  🎯 À l'honneur
                </button>
                <button
                  title="Sélection aléatoire parmi les résidents"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); pickRandomArtist(false); toast.info("Mode aléatoire activé"); }}
                  className={`flex-1 font-mono text-[10px] uppercase tracking-wider py-2.5 transition-colors cursor-pointer font-bold ${
                    mode === "random"
                      ? "bg-brand-rust text-white"
                      : "bg-brand-light text-brand-gray hover:bg-brand-steel"
                  }`}
                >
                  🎲 Aléatoire
                </button>
              </div>

              {/* Contextual hint */}
              {mode === "pinned" ? (
                <p className="text-center font-mono text-[9px] text-brand-gray/60 uppercase tracking-wider leading-relaxed">
                  Pr&eacute;visualisez un atelier ci-dessous,<br />puis cliquez sur &laquo;&nbsp;&#xc0; l'honneur&nbsp;&raquo;
                </p>
              ) : (
                <span className="block text-center font-mono text-[9px] text-brand-gray/60 uppercase tracking-wider">
                  Aléatoire — change à chaque visite
                </span>
              )}
            </div>
          )}
          {mode === "random" && (
            <div className="flex justify-center pt-2">
              <button
                title="Passer au hasard à un autre artiste"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); pickRandomArtist(false); }}
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider px-4 py-2 bg-brand-dark text-white hover:bg-brand-dark/80 transition-colors cursor-pointer font-bold"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="3" y1="3" x2="9" y2="9"/></svg>
                Suivant
              </button>
            </div>
          )}

          </div>

        </div>

      </div>

      {/* Fullscreen Interactive Map Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#faf8f5]/98 backdrop-blur-md flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="bg-[#fcfbf9] border-b border-brand-dark/10 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-brand-rust p-1.5 rounded-sm text-white">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-base text-brand-dark uppercase tracking-tight leading-none mb-0.5">
                  Plan interactif des ateliers
                </h2>
                <p className="font-sans text-[10px] text-brand-gray uppercase tracking-wider">
                  La Morinerie &mdash; Cartographie immersive des hangars
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsModalOpen(false);
                setSelectedPointId(null);
              }}
              className="inline-flex items-center gap-1.5 bg-brand-dark hover:bg-brand-rust text-white font-mono text-[9px] uppercase tracking-widest px-4 py-2 transition-all cursor-pointer font-bold shadow-md"
            >
              <X className="w-3.5 h-3.5" />
              <span>Fermer le plan</span>
            </button>
          </div>

          {/* Interactive view container - Scrollable layout */}
          <div className="flex-1 w-full overflow-auto p-4 md:p-8 flex items-start justify-start relative bg-brand-steel/30 scrollbar-thin">
            
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:32px_32px]" />

            {/* The Map frame - with a minimum width to support mobile scroll & zoom without shrinking the graphic */}
            <div className="relative w-full max-w-[95vw] min-w-[1100px] lg:min-w-0 aspect-[21/9] bg-[#faf8f5] rounded-md border border-brand-dark/15 shadow-2xl select-none">
              
              {/* Map Image - Set to object-fill to ensure 100% of the image is visible on the sides */}
              <img
                src="/images/carte_website.png"
                alt="Plan complet des ateliers de la Morinerie"
                className="w-full h-full object-fill opacity-90 filter grayscale sepia saturate-[1.5] hue-rotate-[340deg] contrast-[1.05] brightness-[1.02]"
                referrerPolicy="no-referrer"
              />

              {/* Ambient warmth */}
              <div className="absolute inset-0 bg-brand-rust/[0.04] mix-blend-multiply pointer-events-none" />

              {/* Interactive Pastilles (Pins) */}
              {MAP_POINTS.map((point) => {
                const isSelected = selectedPointId === point.id;
                
                return (
                  <button
                    key={point.id}
                    onClick={() => {
                      setSelectedPointId(point.id);
                    }}
                    onMouseEnter={() => setSelectedPointId(point.id)}
                    className="absolute group z-30 transform -translate-x-1/2 -translate-y-1/2 focus:outline-none cursor-pointer"
                    style={{ left: `${point.coordinates.x}%`, top: `${point.coordinates.y}%` }}
                  >
                    {/* Ring ping on hover/select */}
                    <span className={`absolute -inset-3.5 rounded-full transition-all duration-500 ${
                      isSelected 
                        ? "animate-ping opacity-35 bg-brand-rust" 
                        : "opacity-0 group-hover:opacity-30 group-hover:animate-ping bg-brand-rust"
                    }`} />
                    
                    {/* Glow */}
                    <span className={`absolute -inset-1.5 rounded-full transition-all duration-300 ${
                      isSelected ? "bg-brand-rust/35 blur-xs" : "bg-transparent group-hover:bg-brand-rust/15"
                    }`} />

                    {/* Central Pastille */}
                    <span className={`relative flex h-6 w-6 items-center justify-center rounded-full border shadow-lg transition-all duration-300 ${
                      isSelected
                        ? "bg-brand-rust border-brand-rust text-white scale-115 shadow-brand-rust/40"
                        : "bg-white border-brand-rust border-2 text-brand-rust group-hover:bg-brand-rust group-hover:text-white"
                    }`}>
                      <span className={`w-2 h-2 rounded-full transition-colors ${
                        isSelected 
                          ? "bg-white" 
                          : "bg-brand-rust group-hover:bg-white"
                      }`} />
                    </span>

                    {/* Simple tag tooltip label */}
                    <span className={`absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-3.5 px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider border whitespace-nowrap transition-all duration-300 pointer-events-none z-40 ${
                      isSelected
                        ? "bg-brand-rust border-brand-rust text-brand-light opacity-100 translate-y-0 shadow-lg"
                        : "bg-brand-dark/95 border-brand-dark/10 text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1"
                    }`}>
                      {point.label.split(" — ")[0]}
                    </span>
                  </button>
                );
              })}

            </div>
          </div>

          {/* Sibling Details Overlay: Fixed at modal wrapper level. This avoids scrolling layout shifts! */}
          <AnimatePresence mode="wait">
            {currentPoint && (
            <motion.div
              key={currentPoint.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute bottom-6 right-6 left-6 md:left-auto bg-white p-5 md:p-6 shadow-2xl border border-brand-dark/15 z-40 max-w-sm flex flex-col justify-between rounded-sm"
            >
              
              {/* Popin Close Button */}
              <button
                onClick={() => setSelectedPointId(null)}
                className="absolute top-3 right-3 text-brand-dark/40 hover:text-brand-rust transition-colors cursor-pointer p-1 rounded-full hover:bg-brand-steel"
                aria-label="Fermer la popin"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start justify-between gap-4 pb-4 border-b border-brand-dark/10 pr-6">
                <div className="flex items-center gap-3">
                  <img
                    src={currentPoint.avatarUrl}
                    alt={currentPoint.artistName}
                    className="w-12 h-12 rounded-full object-cover border border-brand-dark/15"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="font-mono text-[9px] text-brand-rust uppercase tracking-wider font-bold">
                      {currentPoint.label}
                    </span>
                    <h4 className="font-display font-extrabold text-base text-brand-dark uppercase leading-tight">
                      {currentPoint.artistName}
                    </h4>
                    <p className="font-sans text-[11px] text-brand-gray">
                      {currentPoint.discipline} &mdash; {currentPoint.specialty}
                    </p>
                  </div>
                </div>
              </div>

              <div className="py-4">
                <p className="font-sans text-brand-dark/85 text-[12px] leading-relaxed">
                  {currentPoint.description}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 font-mono text-[9px] text-brand-gray uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-brand-rust" />
                  <span>{currentPoint.hangarName}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (currentPoint.artistId) {
                    onArtistSelect(currentPoint.artistId);
                    setIsModalOpen(false);
                    setSelectedPointId(null);
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand-rust hover:bg-brand-dark text-white font-mono text-[10px] uppercase tracking-widest py-2.5 transition-all cursor-pointer font-bold shadow-md hover:shadow-lg"
              >
                <span>Entrer dans l'atelier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Footer */}
          <div className="bg-[#fcfbf9] border-t border-brand-dark/10 px-6 py-3.5 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-brand-dark/50 gap-2">
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <span>COOPÉRATIVE DE LA MORINERIE &copy; 2026</span>
              <span>•</span>
              <span className="text-brand-rust font-bold">10 ATELIERS DE LOCALISATION</span>
              <span>•</span>
              <span className="hidden md:inline">PINCEZ ET FAITES GLISSER POUR NAVIGUER</span>
              <span className="md:hidden">GLISSEZ LE PLAN POUR NAVIGUER</span>
            </div>
            <span className="flex items-center gap-1 font-medium">
              <Info className="w-3.5 h-3.5 text-brand-rust" />
              <span>Cliquez sur une pastille pour afficher les détails du studio</span>
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
