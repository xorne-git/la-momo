import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowDown, Train, HardHat, Compass, Calendar } from "lucide-react";
import type { HeroSlide } from "../admin/HeroEdit";

interface HeroProps {
  onExploreClick: () => void;
  onTicketClick: () => void;
  slides: HeroSlide[];
}

export default function Hero({ onExploreClick, onTicketClick, slides }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [currentIndex, slides.length]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-brand-dark flex flex-col justify-between">
      {/* Background Image Carousel with motion transition */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 0.45, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <img
              src={slides[currentIndex].image}
              alt="Background atmosphere"
              className="w-full h-full object-cover select-none"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/50 via-brand-dark/5 to-brand-dark/25 z-10" />
      </div>

      {/* Hero Content Area */}
      <div className="relative z-20 max-w-7xl mx-auto w-full px-6 md:px-12 pt-32 flex-grow flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Main Typography & Messaging Column */}
          <div className="lg:col-span-9 space-y-6 md:space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 font-mono text-[10px] md:text-xs text-brand-rust tracking-[0.3em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-rust animate-ping" />
              <span>{slides[currentIndex].sub}</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4 flex flex-col items-center lg:items-start"
              >
                <h2 className="font-display font-light text-5xl md:text-8xl text-brand-light tracking-tight leading-[1.1] uppercase whitespace-pre-line text-center lg:text-left">
                  {slides[currentIndex].title}
                </h2>
                <p className="font-sans text-base md:text-xl text-brand-light/80 max-w-2xl font-light leading-relaxed text-center lg:text-left mx-auto lg:mx-0">
                  {slides[currentIndex].desc}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-4 pt-4 w-full sm:w-auto">
              <button
                onClick={onExploreClick}
                className="bg-brand-rust hover:bg-brand-rust/80 text-brand-light font-display text-xs uppercase tracking-widest px-8 py-4 transition-all flex items-center justify-center gap-3 cursor-pointer w-full sm:w-auto"
              >
                <span>Visiter les Ateliers</span>
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Industrial telemetry column (Right side) */}
          <div className="hidden lg:col-span-3 space-y-8 pl-8 border-l border-brand-light/10">
            <div className="space-y-1">
              <span className="block font-mono text-[9px] text-brand-gray tracking-widest uppercase">Gare de Triage</span>
              <div className="flex items-center gap-2 font-display text-sm font-bold text-brand-light uppercase">
                <Train className="w-4 h-4 text-brand-rust" />
                <span>Saint-Pierre-des-Corps</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="block font-mono text-[9px] text-brand-gray tracking-widest uppercase">Surface Totale</span>
              <div className="flex items-center gap-2 font-display text-sm font-bold text-brand-light uppercase">
                <Compass className="w-4 h-4 text-brand-rust" />
                <span>15 000 m² Utiles</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="block font-mono text-[9px] text-brand-gray tracking-widest uppercase">Résidence de création</span>
              <div className="flex items-center gap-2 font-display text-sm font-bold text-brand-light uppercase">
                <HardHat className="w-4 h-4 text-brand-rust" />
                <span>70 Ateliers • 100 Artistes</span>
              </div>
            </div>

            <div className="pt-4">
              <span className="font-mono text-xs text-brand-rust font-bold bg-brand-light/5 px-3 py-1.5 border border-brand-rust/20">
                REF: {slides[currentIndex].code}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Footer-like strip of the Hero page */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 md:px-12 pb-12 flex flex-col md:flex-row justify-between items-center gap-6 text-brand-light/50 font-mono text-xs border-t border-brand-light/10 pt-6">
        <div className="order-2 md:order-1 flex items-center gap-2 justify-center md:justify-start w-full md:w-auto">
          <span>47.3879° N, 0.7235° E</span>
        </div>

        {/* Centered Portes Ouvertes CTA */}
        <div className="order-1 md:order-2 flex justify-center w-full md:w-auto">
          <button
            onClick={onTicketClick}
            className="inline-flex items-center gap-2 font-mono text-[10px] md:text-xs uppercase tracking-widest text-brand-light bg-brand-rust/90 hover:bg-brand-rust px-4 py-2 transition-all cursor-pointer group"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Portes Ouvertes 2026</span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-brand-light" />
            <span className="hidden sm:inline opacity-80">Découvrir le programme</span>
          </button>
        </div>

        <div className="order-3 flex items-center justify-center gap-8 w-full md:w-auto">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`hover:text-brand-light transition-all text-sm tracking-widest cursor-pointer py-1 px-2 focus:outline-none ${currentIndex === index ? "text-brand-rust font-bold scale-110" : "opacity-60"}`}
            >
              {String(index + 1).padStart(2, "0")}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar Loader (6s timer matching ArtistDedicatedPage) */}
      <motion.div
        key={currentIndex}
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 6, ease: "linear" }}
        className="absolute bottom-0 left-0 h-[1.5px] bg-brand-rust z-30 pointer-events-none"
      />
    </div>
  );
}