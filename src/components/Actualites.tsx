import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Calendar, ArrowRight, Tag, Pencil } from "lucide-react";
import { NewsItem } from "../types";
import { NEWS_ITEMS } from "../data";
import { sortNewsByDate } from "../utils/sortNews";
import { useAuth } from "../context/AuthContext";

const ACTU_STORAGE_KEY = "morinerie_actualites";
function loadActus(): NewsItem[] {
  try {
    const saved = localStorage.getItem(ACTU_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return sortNewsByDate(parsed);
    }
  } catch {}
  return sortNewsByDate(NEWS_ITEMS);
}

// Import from admin — fetch from server
async function fetchActusFromApi(): Promise<NewsItem[] | null> {
  try {
    const res = await fetch("/api/content/morinerie_actualites");
    if (res.ok) {
      const data = await res.json();
      if (data.value) {
        const parsed = JSON.parse(data.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(ACTU_STORAGE_KEY, data.value);
          return sortNewsByDate(parsed);
        }
      }
    }
  } catch {}
  return null;
}

export default function Actualites({ onEditClick }: { onEditClick?: () => void }) {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<NewsItem[]>(loadActus);

  // On mount, fetch from server to get edits from other users
  useEffect(() => {
    (async () => {
      const fromApi = await fetchActusFromApi();
      if (fromApi) setItems(fromApi);
    })();
  }, []);
  const [activeNewsIndex, setActiveNewsIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const activeNews = items[activeNewsIndex];

  // Reset active image index whenever the active news item changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [activeNewsIndex]);

  // Auto-play interval for the news slider (cycles through images of the current news first, then moves to the next news)
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      const numImages = activeNews.images.length;
      if (activeImageIndex < numImages - 1) {
        // Go to the next image of the current news
        setActiveImageIndex((prev) => prev + 1);
      } else {
        // Move to the next news item (activeImageIndex will reset to 0 via useEffect)
        setActiveNewsIndex((prev) => (prev + 1) % items.length);
      }
    }, 5000); // 5 seconds per slide
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, activeNewsIndex, activeImageIndex, activeNews.images.length]);

  const handleNextNews = () => {
    setActiveNewsIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrevNews = () => {
    setActiveNewsIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeNews.images && activeNews.images.length > 0) {
      setActiveImageIndex((prev) => (prev + 1) % activeNews.images.length);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeNews.images && activeNews.images.length > 0) {
      setActiveImageIndex((prev) => (prev - 1 + activeNews.images.length) % activeNews.images.length);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div>
          <span className="font-mono text-xs text-brand-rust tracking-[0.2em] uppercase block mb-3">
            Vie de la Coopérative
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-brand-dark tracking-tight leading-none uppercase">
            Actualités &amp; Événements
          </h2>
        </div>
        <p className="font-sans text-brand-dark/60 text-sm max-w-md font-light leading-relaxed">
          Retrouvez les dernières annonces, les lancements de projets et les moments forts de la vie créative des anciens hangars SNCF.
        </p>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Active News Showcase: lg:col-span-8 */}
        <div 
          className="lg:col-span-8 bg-brand-steel/30 border border-brand-dark/5 p-4 sm:p-6 shadow-sm"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          
          {/* Multi-image Slider */}
          <div className="relative aspect-[16/10] md:aspect-[16/9] overflow-hidden bg-brand-dark border border-brand-dark/10 group/slider">
            
            <AnimatePresence mode="wait">
              <motion.img
                key={`${activeNewsIndex}-${activeImageIndex}`}
                src={activeNews.images[activeImageIndex]}
                alt={`${activeNews.title} - visuel ${activeImageIndex + 1}`}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>

            {/* Image overlay / vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/50 via-transparent to-brand-dark/10 pointer-events-none" />

            {/* Slider Controls (Only if multiple images exist) */}
            {activeNews.images.length > 1 ? (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-brand-dark/80 hover:bg-brand-rust text-brand-light border border-brand-light/10 flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover/slider:opacity-100 focus:outline-none z-20 shadow-md"
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-brand-dark/80 hover:bg-brand-rust text-brand-light border border-brand-light/10 flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover/slider:opacity-100 focus:outline-none z-20 shadow-md"
                  aria-label="Image suivante"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Counter / Bullet indicators */}
                <div className="absolute bottom-4 left-4 bg-brand-dark/75 backdrop-blur-sm border border-brand-light/10 px-3 py-1 font-mono text-[10px] text-brand-light tracking-wider z-10">
                  {String(activeImageIndex + 1).padStart(2, "0")} / {String(activeNews.images.length).padStart(2, "0")}
                </div>
              </>
            ) : null}

            {/* Badge Category */}
            <div className="absolute top-4 right-4 bg-brand-rust text-brand-light px-3 py-1 font-mono text-[10px] uppercase tracking-widest border border-brand-light/10 z-10">
              {activeNews.category}
            </div>

            {/* Custom Progress Bar matching the architecture aesthetic */}
            {isAutoPlaying && (items.length > 1 || activeNews.images.length > 1) && (
              <motion.div
                key={`${activeNewsIndex}-${activeImageIndex}`}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 5, ease: "linear" }}
                className="absolute bottom-0 left-0 h-[3px] bg-brand-rust z-30 pointer-events-none"
              />
            )}
          </div>

          {/* Active News Description Content */}
          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-brand-dark/50 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-rust" />
                <span>{activeNews.date}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span className="uppercase tracking-wider">{activeNews.badgeLabel || "Actualité"}</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeNewsIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <h3 className="font-display font-medium text-2xl sm:text-3xl text-brand-dark tracking-tight uppercase leading-snug">
                  {activeNews.title}
                </h3>

                <p className="font-sans font-medium text-brand-rust/90 text-sm sm:text-base leading-relaxed">
                  {activeNews.subtitle}
                </p>

                <div className="font-sans text-brand-dark/75 text-sm sm:text-base leading-relaxed font-light pt-2 border-t border-brand-dark/5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic"
                  dangerouslySetInnerHTML={{ __html: activeNews.content }} />
                {activeNews.tags && activeNews.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-3">
                    {activeNews.tags.map((t) => (
                      <span key={t} className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-brand-steel/50 border border-dashed border-brand-dark/20 text-brand-gray">#{t}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Admin edit button */}
          {isAdmin && onEditClick && (
            <div className="mt-6 pt-4 border-t border-brand-dark/5 flex justify-end">
              <button
                onClick={() => {
                  localStorage.setItem("morinerie_edit_actu_id", activeNews.id);
                  onEditClick();
                }}
                className="font-mono text-[10px] uppercase tracking-widest text-brand-light bg-brand-rust hover:brightness-110 px-3 py-1.5 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Pencil className="w-3 h-3" /> Éditer cette actualité
              </button>
            </div>
          )}
        </div>

        {/* Sidebar News Selector: lg:col-span-4 */}
        <div className="lg:col-span-4 space-y-4">
          <div className="font-mono text-[11px] tracking-widest text-brand-dark/40 uppercase font-bold px-2">
            Autres Actualités
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const isActive = index === activeNewsIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNewsIndex(index)}
                  className={`w-full text-left p-4 transition-all border flex gap-4 cursor-pointer focus:outline-none relative overflow-hidden group ${
                    isActive
                      ? "bg-brand-dark border-brand-dark text-brand-light shadow-md"
                      : "bg-brand-steel/10 border-brand-dark/10 hover:border-brand-rust/50 hover:bg-brand-steel/20 text-brand-dark"
                  }`}
                >
                  {/* Small Thumbnail */}
                  <div className="w-16 h-16 shrink-0 bg-brand-steel overflow-hidden border border-brand-dark/5 relative">
                    <img
                      src={item.images[0]}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Text contents */}
                  <div className="flex flex-col justify-between py-0.5 overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-mono text-[9px] uppercase tracking-wider ${isActive ? "text-brand-rust" : "text-brand-rust"}`}>
                          {item.category}
                        </span>
                        <span className="font-mono text-[9px] opacity-60">
                          {item.date}
                        </span>
                      </div>
                      <h4 className="font-display font-medium text-xs sm:text-sm uppercase tracking-wider line-clamp-1 mt-1 leading-snug">
                        {item.title}
                      </h4>
                    </div>
                    <p className={`font-sans text-[11px] line-clamp-1 opacity-70 font-light mt-1`}>
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Active highlight side marker */}
                  {isActive && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand-rust" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Info card for visitors */}
          <div className="bg-brand-rust/10 border border-brand-rust/20 p-6 mt-6">
            <h4 className="font-display font-bold text-xs uppercase tracking-widest text-brand-rust mb-2">
              Suivre le Tiers-Lieu
            </h4>
            <p className="font-sans text-brand-dark/80 text-xs leading-relaxed font-light mb-4">
              Abonnez-vous pour être tenu au courant de nos expositions hors-les-murs et de nos appels à candidatures.
            </p>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-brand-rust hover:text-brand-dark font-bold transition-colors"
            >
              <span>S'abonner à la newsletter</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
