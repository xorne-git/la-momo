import { useState, useEffect } from "react";
import { MapPin, Users, Mail, Menu, X, Newspaper, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import MorinerieLogo from "./MorinerieLogo";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  isProMode: boolean;
  onToggleProMode: (val: boolean) => void;
  solid?: boolean;
}

export default function Navbar({ activeSection, onNavigate, isProMode, onToggleProMode, solid }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(window.scrollY > 40);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAdmin, isAuthenticated, currentUser } = useAuth();

  const scrolled = isScrolled || solid;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { id: "artistes", label: "Les Artistes", icon: Users },
    { id: "actualites", label: "Actualités", icon: Newspaper },
    { id: "lieu", label: "Le Lieu", icon: MapPin },
    { id: "contact", label: "Contact", icon: Mail },
  ];

  return (
    <>
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b ${
        scrolled
          ? "bg-brand-light/95 backdrop-blur-md py-4 border-brand-dark/10 shadow-sm"
          : "bg-brand-dark/40 backdrop-blur-md py-6 border-brand-light/10"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center">
        {/* Logo and Brand Title — centered in remaining space */}
        <button
          onClick={() => {
            setIsMenuOpen(false);
            setTimeout(() => {
              onNavigate("top");
            }, 250);
          }}
          className="flex items-center gap-3 md:gap-3.5 group text-left focus:outline-none cursor-pointer flex-1 justify-center"
        >
          <MorinerieLogo
            isScrolled={scrolled}
            className={`transition-all duration-500 w-auto ${
              scrolled ? "h-6 md:h-7" : "h-9 md:h-10"
            }`}
          />
          <div>
            <h1
              className={`font-display font-semibold uppercase tracking-widest leading-none transition-all duration-500 ${
                scrolled ? "text-brand-dark text-base md:text-lg" : "text-brand-light text-xl md:text-2xl"
              }`}
            >
              LA MORINERIE
            </h1>
            <p className="font-mono text-[10px] md:text-[11px] tracking-wider uppercase mt-1 text-brand-rust">
              Ateliers d'Artistes
            </p>
          </div>

        </button>

        {/* Navigation Items — right-aligned, auto width */}
        <div className="hidden md:flex items-center justify-end gap-6 flex-shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 font-display text-sm uppercase tracking-widest transition-all relative pb-1 group focus:outline-none cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "text-brand-rust font-bold"
                    : scrolled
                      ? "text-brand-dark/75 hover:text-brand-dark"
                      : "text-brand-light/85 hover:text-brand-light"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
                <span
                  className={`absolute bottom-0 left-0 h-[2px] bg-brand-rust transition-all duration-300 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Burger Button - Mobile only */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 transition-colors cursor-pointer focus:outline-none ${
              scrolled ? "text-brand-dark hover:text-brand-rust" : "text-brand-light hover:text-brand-rust"
            }`}
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`md:hidden w-full border-t overflow-hidden ${
              scrolled 
                ? "bg-brand-light border-brand-dark/10 text-brand-dark" 
                : "bg-brand-dark/95 backdrop-blur-md border-brand-light/10 text-brand-light"
            }`}
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {/* Navigation Items */}
              <div className="flex flex-col gap-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setIsMenuOpen(false);
                        setTimeout(() => {
                          onNavigate(item.id);
                        }, 250);
                      }}
                      className={`flex items-center gap-3 font-display text-sm uppercase tracking-widest py-2 transition-all text-left w-full cursor-pointer focus:outline-none ${
                        isActive ? "text-brand-rust font-bold" : ""
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </nav>

    {/* Admin / Artiste badge — fixed bottom-right, outside nav to avoid backdrop-filter breaking fixed */}
    {isAdmin && (
      <span className="fixed bottom-4 right-4 z-[60] inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-brand-rust/80 hover:bg-brand-rust text-brand-light font-mono text-[9px] uppercase tracking-wider font-bold rounded-sm shadow-sm backdrop-blur-sm transition-all duration-200 cursor-default" title="Mode administration">
        <Shield className="w-3 h-3" fill="currentColor" />
        Admin
      </span>
    )}
    {isAuthenticated && !isAdmin && (
      <span className="fixed bottom-4 right-4 z-[60] inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-brand-steel/80 hover:bg-brand-steel text-brand-rust font-mono text-[9px] uppercase tracking-wider font-bold rounded-sm shadow-sm backdrop-blur-sm transition-all duration-200 cursor-default" title="Espace artiste">
        Artiste
      </span>
    )}
    </>
  );
}
