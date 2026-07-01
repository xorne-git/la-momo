import { useState, useRef } from "react";
import { ARTISTS } from "../data";
import { Artist } from "../types";
import { Layers, ArrowRight, Hammer, Info, MapPin, X } from "lucide-react";
import InlineEdit from "../admin-core/InlineEdit";
import { useAuth } from "../context/AuthContext";
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
  // Rich set of 10 points scattered across the historical map
  const MAP_POINTS: MapPoint[] = [
    {
      id: "point-1",
      label: "Atelier 01 — Garance Lemaître",
      artistId: "artist-1", // Garance Lemaître (Real)
      artistName: "Garance Lemaître",
      discipline: "Plasticiens",
      specialty: "Sculpture Métal Monumentale",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      coordinates: { x: 26, y: 38 },
      description: "Travail du fer, de l'acier corten et de la forge lourde. Création de sculptures monumentales habitées par le souffle du feu.",
      hangarName: "Hangar A — Les Volumes",
    },
    {
      id: "point-2",
      label: "Atelier 02 — Fonderie d'Art",
      artistId: "artist-1", // Real
      artistName: "Antoine de Fondeur",
      discipline: "Artisans d'art",
      specialty: "Bronze & Coulée d'Art",
      avatarUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=400",
      coordinates: { x: 18, y: 28 },
      description: "Atelier traditionnel de fonderie d'art. Moulage d'argile, fonte de bronze à cire perdue et ciselure de précision.",
      hangarName: "Hangar A — Les Volumes",
    },
    {
      id: "point-3",
      label: "Atelier 03 — L'Enclume Noire",
      artistId: "artist-1", // Real
      artistName: "Jeanne de la Forge",
      discipline: "Métalliers",
      specialty: "Forge & Mobilier d'Art",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
      coordinates: { x: 35, y: 45 },
      description: "Conception de mobilier contemporain brut combinant le chêne centenaire de la région et l'acier forgé patiné.",
      hangarName: "Hangar A — Les Volumes",
    },
    {
      id: "point-4",
      label: "Atelier 04 — Nolwenn Dubreuil",
      artistId: "artist-3", // Nolwenn Dubreuil (Real)
      artistName: "Nolwenn Dubreuil",
      discipline: "Artisans d'art",
      specialty: "Céramique & Grès Sauvage",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
      coordinates: { x: 55, y: 55 },
      description: "Modelage de porcelaines et grès cuits à haute température. Émaux formulés à partir de cendres de bois locales.",
      hangarName: "Hangar B — Les Matières",
    },
    {
      id: "point-5",
      label: "Atelier 05 — Julien Gauthier",
      artistId: "artist-4", // Julien Gauthier (Real)
      artistName: "Julien Gauthier",
      discipline: "Artisans d'art",
      specialty: "Ébénisterie de Création",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
      coordinates: { x: 48, y: 68 },
      description: "Sublimation des bois nobles locaux. Créations de pièces uniques magnifiant les fissures et cicatrices naturelles du bois.",
      hangarName: "Hangar B — Les Matières",
    },
    {
      id: "point-6",
      label: "Atelier 06 — Lutherie Contemporaine",
      artistId: "artist-4", // Real
      artistName: "Lucie Luthier",
      discipline: "Artisans d'art",
      specialty: "Violons & Instruments à cordes",
      avatarUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400",
      coordinates: { x: 62, y: 58 },
      description: "Conception, réglages acoustiques et restauration d'instruments du quatuor à cordes dans la pure tradition artisanale.",
      hangarName: "Hangar B — Les Matières",
    },
    {
      id: "point-7",
      label: "Atelier 07 — Marc-Antoine Kéruzoré",
      artistId: "artist-2", // Marc-Antoine Kéruzoré (Real)
      artistName: "Marc-Antoine Kéruzoré",
      discipline: "Plasticiens",
      specialty: "Peinture Brutaliste & Goudron",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
      coordinates: { x: 78, y: 25 },
      description: "Grands formats picturaux explorant les profondeurs du noir à travers des mélanges de goudron sauvage, charbon et lin brut.",
      hangarName: "Hangar C — Les Couleurs",
    },
    {
      id: "point-8",
      label: "Atelier 08 — Chambre Claire",
      artistId: "artist-2", // Real
      artistName: "Sasha Silver",
      discipline: "Photographes",
      specialty: "Argentique & Collodion Humide",
      avatarUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400",
      coordinates: { x: 70, y: 18 },
      description: "Laboratoire de photographie d'art spécialisé dans les techniques de tirage du XIXe siècle et les portraits argentiques.",
      hangarName: "Hangar C — Les Couleurs",
    },
    {
      id: "point-9",
      label: "Atelier 09 — L'Encre Bleue",
      artistId: "artist-2", // Real
      artistName: "Rémi Estampe",
      discipline: "Sérigraphes",
      specialty: "Sérigraphie & Gravure d'Art",
      avatarUrl: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&q=80&w=400",
      coordinates: { x: 86, y: 30 },
      description: "Estampes en tirage limité sur papier d'art à fort grammage. Ateliers d'initiation à la gravure sur bois et linoleum.",
      hangarName: "Hangar C — Les Couleurs",
    },
    {
      id: "point-10",
      label: "Atelier 10 — Fusion Silice",
      artistId: "artist-3", // Real
      artistName: "Elena Souffleuse",
      discipline: "Artisans d'art",
      specialty: "Verre Soufflé à la canne",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
      coordinates: { x: 42, y: 52 },
      description: "Modelage du verre en fusion à haute température. Création de luminaires et sculptures de verre organiques et fluides.",
      hangarName: "Hangar B — Les Matières",
    }
  ];

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doSpotlight = (artist: Artist) => {
    setSpotlightArtist(artist);
    localStorage.setItem("morinerie_spotlight_artist", artist.id);
    setConfirmed(true);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirmed(false), 2000);
  };
  const [spotlightArtist, setSpotlightArtist] = useState<Artist>(() => {
    // Check localStorage for a pinned artist, otherwise random
    const saved = localStorage.getItem("morinerie_spotlight_artist");
    if (saved) {
      const found = ARTISTS.find((a) => a.id === saved);
      if (found) return found;
    }
    const randomIndex = Math.floor(Math.random() * ARTISTS.length);
    return ARTISTS[randomIndex] || ARTISTS[0];
  });
  const pickRandomArtist = () => {
    const filtered = ARTISTS.filter((a) => a.id !== spotlightArtist.id);
    const next = filtered[Math.floor(Math.random() * filtered.length)] || ARTISTS[0];
    doSpotlight(next);
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
                <div className="flex justify-between items-start font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">
                  <span className="font-bold text-brand-rust flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 bg-brand-rust animate-pulse rounded-full" />
                    L'Atelier à l'honneur
                  </span>
                  <span>COOPÉRATEUR DU MOMENT</span>
                </div>
                <span className="inline-block font-mono text-[9px] text-brand-rust uppercase tracking-widest font-bold bg-brand-rust/10 border border-brand-rust/20 px-2 py-0.5">
                  {spotlightArtist.discipline}
                </span>
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
                    <span className="font-mono text-[9px] text-brand-rust uppercase tracking-wider font-bold">
                      {spotlightArtist.discipline}
                    </span>
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
                            doSpotlight(artist);
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

          {/* Admin bar — below the artist card, normal flow */}
          {isAdmin && (
            <div className="flex items-center justify-center gap-2 pt-3 pb-1">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); doSpotlight(spotlightArtist); }}
                className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider px-4 py-2 transition-colors cursor-pointer font-bold ${confirmed ? "bg-emerald-600 text-white" : "bg-brand-rust text-white hover:bg-brand-dark"}`}
              >
                {confirmed ? (
                  <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Mis à l'honneur</>
                ) : (
                  "Mettre à l'honneur"
                )}
              </button>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); pickRandomArtist(); }}
                className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider px-4 py-2 bg-brand-dark text-white hover:bg-brand-dark/80 transition-colors cursor-pointer font-bold"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="3" y1="3" x2="9" y2="9"/></svg>
                Aléatoire
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
          {currentPoint && (
            <div className="absolute bottom-6 right-6 left-6 md:left-auto bg-white p-5 md:p-6 shadow-2xl border border-brand-dark/15 z-40 max-w-sm flex flex-col justify-between transition-all duration-300 rounded-sm">
              
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
            </div>
          )}

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

