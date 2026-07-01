import { useState, useEffect, useRef, type FormEvent } from "react";
import { Toaster } from "react-hot-toast";
import { consumePending } from "./utils/pendingMsg";
import { demoMode } from "./utils/demo";
import { motion } from "motion/react";
import Navbar from "./components/Navbar";
import MorinerieLogo from "./components/MorinerieLogo";
import Hero from "./components/Hero";
import HangarMap from "./components/HangarMap";
import ArtistGallery from "./components/ArtistGallery";
import HistoryTimeline from "./components/HistoryTimeline";
import PortesOuvertes from "./components/PortesOuvertes";
import ContactForm from "./components/ContactForm";
import ClenPatronage from "./components/ClenPatronage";
import ArtistDedicatedPage from "./components/ArtistDedicatedPage";
import Actualites from "./components/Actualites";
import { Artist } from "./types";
import { ARTISTS } from "./data";
import { Hammer, Users, Calendar, ArrowRight, ArrowUp, Mail, ShieldAlert, LogIn, LogOut } from "lucide-react";
import lieuKhara from "./assets/images/khara-woods-KR84RpMCb0w-unsplash.jpg";
import { useAuth } from "./context/AuthContext";
import InlineEdit from "./admin-core/InlineEdit";
import ImageEdit from "./admin-core/ImageEdit";
import SliderEdit from "./admin-core/SliderEdit";
import MediaLibrary from "./admin-core/MediaLibrary";
import AdminLayout from "./admin-core/AdminLayout";
import AdminSidebar from "./admin/AdminSidebar";
import HeroEdit, { loadHeroSlides, fetchHeroSlidesFromApi } from "./admin/HeroEdit";
import ActualitesEdit from "./admin/ActualitesEdit";
import ArtistSliderEdit from "./admin/ArtistSliderEdit";
import MonCompte from "./admin/MonCompte";
import GestionComptes from "./admin/GestionComptes";
import GestionGroupes from "./admin/GestionGroupes";
import GestionTags from "./admin/GestionTags";

const TOAST_OPTIONS = {
  duration: 4000,
  style: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    letterSpacing: "0.05em",
    borderRadius: "0px",
    boxShadow: "4px 4px 0px rgba(0, 0, 0, 0.15)",
    padding: "10px 16px",
  },
};

export default function App() {
  const [activeSection, setActiveSection] = useState(() => {
    // En mode démo, ignorer tous les hash admin
    if (demoMode) return "top";
    // Check if we're in media admin page (from sidebar)
    if (window.location.hash === "#media") return "media";
    if (window.location.hash === "#hero") return "hero";
    if (window.location.hash === "#admin-actualites") return "admin-actualites";
    if (window.location.hash === "#artist-slider") return "artist-slider";
    if (window.location.hash === "#mon-espace") return "mon-espace";
    if (window.location.hash === "#mon-compte") return "mon-compte";
    if (window.location.hash === "#gestion-comptes") return "gestion-comptes";
    if (window.location.hash === "#groupes-droits") return "groupes-droits";
    if (window.location.hash === "#tags") return "tags";
    if (window.location.hash === "#actualites") return "top";
    return "top";
  });
  const activeSectionRef = useRef(activeSection);
  activeSectionRef.current = activeSection;
  const prevSectionRef = useRef("top");
  const lastFrontendRef = useRef("top");
  const [lastFrontend, setLastFrontend] = useState("top");
  const frontendSections = ["top", "lieu", "artistes", "actualites", "portes-ouvertes", "contact"];
  const adminSections = ["media", "hero", "admin-actualites", "artist-slider", "mon-espace", "mon-compte", "gestion-comptes", "groupes-droits", "tags"];
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeArtistPage, setActiveArtistPage] = useState<Artist | null>(null);
  const [isProMode, setIsProMode] = useState<boolean>(() => {
    return localStorage.getItem("morinerie_pro_mode") === "true";
  });

  const { isAuthenticated, isAdmin, currentUser, login, logout } = useAuth();
  const isAdminRef = useRef(isAdmin);
  isAdminRef.current = isAdmin;
  const [heroSlides, setHeroSlides] = useState(() => loadHeroSlides());
  const [artistTab, setArtistTab] = useState("slides");

  // On mount, fetch Hero slides from server (shared across users)
  useEffect(() => {
    (async () => {
      const fromApi = await fetchHeroSlidesFromApi();
      if (fromApi) setHeroSlides(fromApi);
    })();
  }, []);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleToggleProMode = (val: boolean) => {
    setIsProMode(val);
    localStorage.setItem("morinerie_pro_mode", String(val));
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const result = await login(loginEmail, loginPassword);
    if (result.success) {
      setShowLoginModal(false);
      setLoginEmail("");
      setLoginPassword("");
    } else {
      setLoginError(result.error || "Erreur de connexion");
    }
  };

  // Dynamic document title update
  useEffect(() => {
    let pageName = "Accueil";
    if (activeArtistPage) {
      pageName = activeArtistPage.name;
    } else {
      switch (activeSection) {
        case "top":
          pageName = "Accueil";
          break;
        case "lieu":
          pageName = "Le Lieu";
          break;
        case "artistes":
          pageName = "Les Artistes";
          break;
        case "actualites":
          pageName = "Actualités";
          break;
        case "portes-ouvertes":
          pageName = "Portes Ouvertes";
          break;
        case "contact":
          pageName = "Contact";
          break;
        case "media":
          pageName = "Médiathèque";
          break;
        case "hero":
          pageName = "Diaporama";
          break;
        case "admin-actualites":
          pageName = "Actualités";
          break;
        case "artist-slider":
          pageName = "Espace des artistes";
          break;
        case "mon-espace":
          pageName = "Mon espace";
          break;
        case "mon-compte":
          pageName = "Mon compte";
          break;
        case "gestion-comptes":
          pageName = "Gestion des comptes";
          break;
        case "groupes-droits":
          pageName = "Groupes & droits";
          break;
        case "tags":
          pageName = "Tags";
          break;
        default:
          pageName = "Accueil";
      }
    }
    document.title = `${pageName} | Les Ateliers de la Morinerie`;
  }, [activeSection, activeArtistPage]);

  // Monitor scroll height for "Scroll to top" button and active section menu rollover
  useEffect(() => {
    // Don't register scroll handler on admin pages at all
    if (activeSection === "media" || activeSection === "hero" || activeSection === "admin-actualites" || activeSection === "artist-slider" || activeSection === "mon-espace" || activeSection === "mon-compte" || activeSection === "gestion-comptes" || activeSection === "groupes-droits" || activeSection === "tags") return;

    const handleScrollEffects = () => {

      // 1. "Scroll to top" button visibility
      setShowScrollTop(window.scrollY > 500);

      // 2. Active section detection for header menu rollover
      const sectionIds = ["top", "artistes", "actualites", "portes-ouvertes", "lieu", "contact"];
      
      // If we are close to the very bottom, highlight the contact section
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;
      if (isAtBottom) {
        setActiveSection("contact");
        return;
      }

      let currentActive = "top";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            currentActive = id;
          }
        }
      }
      setActiveSection(currentActive);
    };

    window.addEventListener("scroll", handleScrollEffects);
    // Execute once initially to set correct active states
    handleScrollEffects();
    return () => window.removeEventListener("scroll", handleScrollEffects);
  }, [activeSection]);

  // Smooth scroll helper
  const handleNavigate = (sectionId: string) => {
    // En mode démo, ignorer toute navigation vers une page admin
    if (demoMode && adminSections.includes(sectionId)) return;
    if (activeSection !== sectionId) prevSectionRef.current = activeSection;
    if (frontendSections.includes(sectionId)) {
      lastFrontendRef.current = sectionId; setLastFrontend(sectionId);
      setActiveArtistPage(null);
    }
    if (sectionId === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActiveSection("top");
      setHeroSlides(loadHeroSlides());
      window.location.hash = "";
      return;
    }
    if (sectionId === "media") {
      setActiveSection("media");
      window.location.hash = "media";
      return;
    }
    if (sectionId === "hero") {
      setActiveSection("hero");
      window.location.hash = "hero";
      return;
    }
    if (sectionId === "actualites") {
      // Main site section scroll
      setActiveSection(sectionId);
      requestAnimationFrame(() => {
        const el = document.getElementById(sectionId);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: "smooth" });
      });
      return;
    }
    if (sectionId === "admin-actualites") {
      setActiveSection("admin-actualites");
      window.location.hash = "admin-actualites";
      return;
    }
    if (sectionId === "artist-slider") {
      setActiveSection("artist-slider");
      window.location.hash = "artist-slider";
      return;
    }
    if (sectionId === "mon-espace") {
      setActiveSection("mon-espace");
      window.location.hash = "mon-espace";
      return;
    }
    if (sectionId === "mon-compte") {
      setActiveSection("mon-compte");
      window.location.hash = "mon-compte";
      return;
    }
    if (sectionId === "gestion-comptes") {
      setActiveSection("gestion-comptes");
      window.location.hash = "gestion-comptes";
      return;
    }
    if (sectionId === "groupes-droits") {
      setActiveSection("groupes-droits");
      window.location.hash = "groupes-droits";
      return;
    }
    if (sectionId === "tags") {
      setActiveSection("tags");
      window.location.hash = "tags";
      return;
    }

    // Normal sections: scroll to anchor
    setActiveSection(sectionId);
    // Use rAF to let React re-render first if coming from admin page
    requestAnimationFrame(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        const offset = 64;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
      }
    });
  };

  // Trigger when a visitor clicks on an artist in the interactive Hangar map
  const handleSelectArtistFromMap = (artistId: string) => {
    // Find the actual artist object to display their dedicated page
    const artist = ARTISTS.find((a) => a.id === artistId);
    if (artist) {
      setActiveArtistPage(artist);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setSelectedArtistId(artistId);
      // Fallback: Smoothly scroll to the artist gallery section
      setTimeout(() => {
        handleNavigate("artistes");
      }, 100);
    }
  };

  // ─── Admin pages ───────────────────────────────────
  switch (activeSection) {
    case "media":
      return <AdminLayout section="media" breadcrumbLabel="Médiathèque" showToaster={false} onNavigate={handleNavigate} isProMode={isProMode} onToggleProMode={handleToggleProMode} lastFrontend={lastFrontend}><MediaLibrary /></AdminLayout>;
    case "hero":
      return <AdminLayout section="hero" breadcrumbLabel="Diaporama" onNavigate={handleNavigate} isProMode={isProMode} onToggleProMode={handleToggleProMode} lastFrontend={lastFrontend}><HeroEdit /></AdminLayout>;
    case "admin-actualites":
      return <AdminLayout section="admin-actualites" breadcrumbLabel="Actualités" onNavigate={handleNavigate} isProMode={isProMode} onToggleProMode={handleToggleProMode} lastFrontend={lastFrontend}><ActualitesEdit onViewClick={() => handleNavigate("actualites")} /></AdminLayout>;
    case "artist-slider": {
      const tabLabel = artistTab === "blog" ? "Blog" : artistTab === "tags" ? "Tags" : artistTab === "hero" ? "Héro" : artistTab === "vignette" ? "Vignette" : "Slides";
      return <AdminLayout section="artist-slider" breadcrumbLabel={`Espace des artistes — ${tabLabel}`} onNavigate={handleNavigate} isProMode={isProMode} onToggleProMode={handleToggleProMode} lastFrontend={lastFrontend}><ArtistSliderEdit onTabChange={setArtistTab} /></AdminLayout>;
    }
    case "mon-espace": {
      const tabLabel = artistTab === "blog" ? "Blog" : artistTab === "tags" ? "Tags" : artistTab === "hero" ? "Héro" : artistTab === "vignette" ? "Vignette" : "Slides";
      return <AdminLayout section="mon-espace" breadcrumbLabel={`Mon espace — ${tabLabel}`} onNavigate={handleNavigate} isProMode={isProMode} onToggleProMode={handleToggleProMode} lastFrontend={lastFrontend}><ArtistSliderEdit onTabChange={setArtistTab} preselectArtistId={currentUser?.artistId || null} /></AdminLayout>;
    }
    case "mon-compte":
      return <AdminLayout section="mon-compte" breadcrumbLabel="Mon compte" onNavigate={handleNavigate} isProMode={isProMode} onToggleProMode={handleToggleProMode} lastFrontend={lastFrontend}><MonCompte /></AdminLayout>;
    case "gestion-comptes":
      return <AdminLayout section="gestion-comptes" breadcrumbLabel="Gestion des comptes" onNavigate={handleNavigate} isProMode={isProMode} onToggleProMode={handleToggleProMode} lastFrontend={lastFrontend}><GestionComptes /></AdminLayout>;
    case "groupes-droits":
      return <AdminLayout section="groupes-droits" breadcrumbLabel="Groupes & droits" onNavigate={handleNavigate} isProMode={isProMode} onToggleProMode={handleToggleProMode} lastFrontend={lastFrontend}><GestionGroupes /></AdminLayout>;
    case "tags":
      return <AdminLayout section="tags" breadcrumbLabel="Tags" onNavigate={handleNavigate} isProMode={isProMode} onToggleProMode={handleToggleProMode} lastFrontend={lastFrontend}><GestionTags /></AdminLayout>;
  }

  if (activeArtistPage) {
    const page = (
      <>
        <Navbar
          activeSection="artistes"
          onNavigate={handleNavigate}
          isProMode={isProMode}
          onToggleProMode={handleToggleProMode}
          solid
        />
        <ArtistDedicatedPage
          artist={activeArtistPage}
          isProMode={isProMode}
          onToggleProMode={handleToggleProMode}
            onBack={() => {
              setActiveArtistPage(null);
              handleNavigate(lastFrontendRef.current);
            }}
        />
      </>
    );

    if (isAdmin) {
      return (
        <div className="bg-brand-light text-brand-dark min-h-screen font-sans flex border-l-2 border-brand-rust/20">
          <AdminSidebar onNavigate={handleNavigate} lastFrontend={lastFrontend} />
          <div className="flex-1 min-w-0 pt-16">
            {page}
          </div>
        </div>
      );
    }
    return page;
  }

  return (
    <div className={`bg-brand-light text-brand-dark min-h-screen selection:bg-brand-rust selection:text-brand-light font-sans relative flex ${isAdmin ? "border-l-2 border-brand-rust/15" : ""}`}>
      
      {/* Admin Sidebar — left drawer */}
      <AdminSidebar onNavigate={handleNavigate} lastFrontend={lastFrontend} />

      {/* Main content area */}
      <div className="flex-1 min-w-0">

      {/* Floating Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          onClick={() => handleNavigate("top")}
          className="fixed bottom-8 right-8 z-40 bg-brand-dark hover:bg-brand-rust text-brand-light w-12 h-12 rounded-none flex items-center justify-center transition-all duration-300 border border-brand-light/10 shadow-lg cursor-pointer"
          title="Retour en haut"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Navigation Header */}
      <Navbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        isProMode={isProMode}
        onToggleProMode={handleToggleProMode}
      />

      {/* Fullscreen Hero Cover */}
      <div id="top">
        <Hero
          slides={heroSlides}
          onExploreClick={() => handleNavigate("artistes")}
          onTicketClick={() => handleNavigate("portes-ouvertes")}
        />
      </div>

      {/* SECTION 1: Artistes & Galerie */}
      <section id="artistes">
        <ArtistGallery
          onRefArtistId={selectedArtistId}
          onClearRefArtist={() => setSelectedArtistId(null)}
          onEnterArtistSpace={(artist) => { 
            if (frontendSections.includes(activeSection)) { lastFrontendRef.current = activeSection; setLastFrontend(activeSection); }
            prevSectionRef.current = activeSection; 
            setActiveArtistPage(artist); 
          }}
          isProMode={isProMode}
          onToggleProMode={handleToggleProMode}
        />
      </section>

      {/* SECTION 2: Actualités & Événements */}
      <section id="actualites" className="border-b border-brand-dark/10 bg-brand-light">
        <Actualites onEditClick={() => handleNavigate("admin-actualites")} />
      </section>

      {/* SECTION 3: Portes Ouvertes */}
      <section id="portes-ouvertes">
        <PortesOuvertes />
      </section>

      {/* SECTION 4: Le Lieu / Histoire / Plan / CLEN */}
      <section id="lieu" className="py-24 md:py-32 border-b border-brand-dark/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Column: Visual raw landscape */}
            <div className="lg:col-span-6 relative group/imagecontainer">
              <SliderEdit
                storageKey="morinerie_lieu_images"
                defaultImages={[lieuKhara]}
                alt="Ancien atelier ferroviaire SNCF"
                wrapperClassName="lg:col-span-6"
              />

              <div className="absolute inset-x-0 h-1 bg-brand-rust/40 opacity-0 group-hover/imagecontainer:opacity-100 pointer-events-none transition-opacity duration-300 animate-scan top-0" />
              <div className="absolute inset-0 bg-brand-rust/5 opacity-0 group-hover/imagecontainer:opacity-100 pointer-events-none transition-opacity duration-500" />
            </div>

            {/* Right Column: Narrative Copy with high contrast typography */}
            <div className="lg:col-span-6 space-y-8">
              <div className="space-y-4">
                <InlineEdit storageKey="morinerie_lieu_tagline" tag="span" className="font-mono text-xs text-brand-rust uppercase tracking-[0.3em] font-bold block">
                  L'Âme Du Territoire
                </InlineEdit>
                <InlineEdit storageKey="morinerie_lieu_title" tag="h2" className="font-display font-light text-4xl md:text-6xl text-brand-dark uppercase tracking-tight leading-none">
                  Un Bastion d'Art et de Fer
                </InlineEdit>
              </div>

              <InlineEdit
                storageKey="morinerie_lieu_body"
                tag="div"
                className="space-y-6 font-sans text-brand-dark/80 text-base md:text-lg leading-relaxed font-light"
                defaultHtml='<p class="font-bold text-brand-dark">Au 21 rue de la Morinerie à Saint-Pierre-des-Corps, la matière s&apos;exprime sans fioritures. Nos hangars préservent l&apos;histoire brute de milliers de cheminots du rail fran&ccedil;ais.</p><p>Ici, pas de galeries aseptis&eacute;es aux cimaises blanches de m&eacute;tropole. Les verri&egrave;res fatigu&eacute;es, les poutres d&apos;acier rivet&eacute;es Eiffel et la rugosit&eacute; du ciment constituent le paysage quotidien de plus de cent cr&eacute;ateurs.</p><p>Dans ce silence interrompu par le fracas des marteaux-pilons ou les meuleuses, des sculpteurs monumentaux, des peintres abstraits, des luthiers et des ma&icirc;tres c&eacute;ramistes s&apos;&eacute;panouissent loin de l&apos;agitation marchande.</p>'
              >
                <p className="font-bold text-brand-dark">
                  Au 21 rue de la Morinerie à Saint-Pierre-des-Corps, la matière s'exprime sans fioritures. Nos hangars préservent l'histoire brute de milliers de cheminots du rail français.
                </p>
                <p>
                  Ici, pas de galeries aseptisées aux cimaises blanches de métropole. Les verrières fatiguées, les poutres d'acier rivetées Eiffel et la rugosité du ciment constituent le paysage quotidien de plus de cent créateurs.
                </p>
                <p>
                  Dans ce silence interrompu par le fracas des marteaux-pilons ou les meuleuses, des sculpteurs monumentaux, des peintres abstraits, des luthiers et des maîtres céramistes s'épanouissent loin de l'agitation marchande.
                </p>
              </InlineEdit>

              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-brand-dark/10 font-mono">
                <div>
                  <InlineEdit storageKey="morinerie_lieu_stat1_value" tag="span" className="block text-brand-rust font-bold text-2xl">70+</InlineEdit>
                  <InlineEdit storageKey="morinerie_lieu_stat1_label" tag="span" className="block text-[9px] text-brand-gray uppercase tracking-wider">Ateliers</InlineEdit>
                </div>
                <div>
                  <InlineEdit storageKey="morinerie_lieu_stat2_value" tag="span" className="block text-brand-rust font-bold text-2xl">100+</InlineEdit>
                  <InlineEdit storageKey="morinerie_lieu_stat2_label" tag="span" className="block text-[9px] text-brand-gray uppercase tracking-wider">Artistes</InlineEdit>
                </div>
                <div>
                  <InlineEdit storageKey="morinerie_lieu_stat3_value" tag="span" className="block text-brand-rust font-bold text-2xl">15K m²</InlineEdit>
                  <InlineEdit storageKey="morinerie_lieu_stat3_label" tag="span" className="block text-[9px] text-brand-gray uppercase tracking-wider">D'Invention</InlineEdit>
                </div>
              </div>

              {!demoMode && (
              <div className="pt-4 flex gap-6">
                <button
                  onClick={() => handleNavigate("plan-section")}
                  className="font-display text-xs uppercase tracking-widest text-brand-rust hover:text-brand-dark font-bold flex items-center gap-2 group cursor-pointer"
                >
                  <span>Voir le plan des ateliers</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                </button>
              </div>
              )}
            </div>

          </div>

          {!demoMode && (
          /* Sub-section: Plan */
          <div className="border-t border-brand-dark/10 pt-16 mt-16" id="plan-section">
            <HangarMap onArtistSelect={handleSelectArtistFromMap} />
          </div>
          )}

          {/* Sub-section: Histoire */}
          <div className="border-t border-brand-dark/10 pt-16 mt-16" id="histoire-section">
            <HistoryTimeline />
          </div>

          {/* Sub-section: Empreinte CLEN */}
          <div className="border-t border-brand-dark/10 pt-16 mt-16" id="clen-section">
            <ClenPatronage />
          </div>

        </div>
      </section>

      {/* SECTION 5: Contact & Commissions */}
      <section id="contact">
        <ContactForm />
      </section>

      {/* FOOTER */}
      <footer className="bg-brand-dark text-brand-light/90 border-t border-brand-light/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            
            {/* Branding Column */}
            <div className="md:col-span-5 space-y-6">
              <div className="flex items-center gap-[11px]">
                <MorinerieLogo
                  className="h-5 w-auto"
                />
                <div>
                  <h4 className="font-display font-extrabold text-sm uppercase tracking-widest text-brand-light leading-none">
                    LES ATELIERS DE LA MORINERIE
                  </h4>
                  <span className="font-mono text-[8px] text-brand-rust uppercase tracking-wider mt-1 block">
                    Saint-Pierre-des-Corps • Coopérative Solidaire
                  </span>
                </div>
              </div>

              <p className="font-sans text-brand-light/60 text-xs leading-relaxed max-w-sm">
                Un espace de création collective autogéré préservant la mémoire industrielle et ferroviaire locale à travers les métiers d'art.
              </p>

              <div className="flex gap-4 font-mono text-[9px] text-brand-light/50">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-brand-rust rounded-full" />
                  <span>SNCF Réseau d'origine</span>
                </div>
                <span>•</span>
                <span>Portes Ouvertes Annuelles</span>
              </div>
            </div>

            {/* Quick Links Column */}
            <div className="md:col-span-3 space-y-4">
              <h5 className="font-display font-bold text-xs uppercase tracking-widest text-brand-rust">Navigation</h5>
              <ul className="space-y-2.5 font-mono text-xs text-brand-light/60 uppercase">
                <li>
                  <button onClick={() => handleNavigate("lieu")} className="hover:text-brand-rust transition-colors text-left cursor-pointer">
                    Le Lieu Historique
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavigate("artistes")} className="hover:text-brand-rust transition-colors text-left cursor-pointer">
                    Artistes &amp; Créations
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavigate("actualites")} className="hover:text-brand-rust transition-colors text-left cursor-pointer">
                    Actualités &amp; Événements
                  </button>
                </li>
                {!demoMode && (
                <li>
                  <button onClick={() => handleNavigate("plan-section")} className="hover:text-brand-rust transition-colors text-left cursor-pointer">
                    Le Plan des Ateliers
                  </button>
                </li>
                )}
                <li>
                  <button onClick={() => handleNavigate("lieu")} className="hover:text-brand-rust transition-colors text-left cursor-pointer">
                    Histoire &amp; Mécénat CLEN
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact quick details */}
            <div className="md:col-span-4 space-y-4">
              <h5 className="font-display font-bold text-xs uppercase tracking-widest text-brand-rust">Inquiries &amp; Secrétariat</h5>
              <p className="font-sans text-brand-light/60 text-xs leading-relaxed">
                Pour toute demande d'adhésion, réservation d'atelier temporaire ou acquisition de pièces.
              </p>
              <div className="font-mono text-xs text-brand-light/80 space-y-1">
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-brand-rust" />
                  <span>ateliersdelamorinerie@gmail.com</span>
                </p>
                <p>+33 (0)6 47 82 34 34</p>
              </div>
            </div>

          </div>

          {/* Subfoot credit lines */}
          <div className="mt-16 pt-8 border-t border-brand-light/10 flex flex-col sm:flex-row justify-between items-center gap-4 font-mono text-[9px] text-brand-light/40 tracking-widest uppercase">
            <span>© 2026 LES ATELIERS DE LA MORINERIE. TOUS DROITS RÉSERVÉS.</span>
            <div className="flex flex-wrap gap-4 sm:gap-6 justify-center sm:justify-end items-center">
              <a href="#" className="hover:text-brand-rust transition-all">Mentions Légales</a>
              <span>•</span>
              <span>Anciennes Friches SNCF</span>
              <span>•</span>
              {demoMode ? null : isAuthenticated ? (
                <button
                  onClick={(e) => { e.preventDefault(); logout(); }}
                  className="hover:text-brand-rust transition-all cursor-pointer font-bold uppercase tracking-widest text-brand-light flex items-center gap-1.5"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Déconnexion ({currentUser?.name})</span>
                </button>
              ) : (
                <button
                  onClick={(e) => { e.preventDefault(); setShowLoginModal(true); }}
                  className="hover:text-brand-rust transition-all cursor-pointer font-bold uppercase tracking-widest text-brand-light/60 flex items-center gap-1.5"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Connexion Admin / Artiste</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </footer>

      <Toaster position="top-center" toastOptions={TOAST_OPTIONS} />

      {/* Login Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLoginModal(false); }}
        >
          <div className="bg-brand-light border border-brand-dark/10 shadow-2xl p-8 rounded-sm max-w-sm w-full mx-4">
            <h2 className="font-display text-xl uppercase tracking-wide text-brand-dark mb-2">Connexion</h2>
            <p className="font-sans text-xs text-brand-gray mb-6">Espace réservé aux administrateurs et artistes de la Morinerie</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold">Email</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@morinerie.art"
                  className="w-full bg-brand-steel border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-brand-rust transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold">Mot de passe</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-brand-steel border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-brand-rust transition-colors"
                />
              </div>

              {loginError && (
                <p className="font-sans text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-sm">{loginError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 px-4 py-3 font-mono text-xs uppercase tracking-widest border border-brand-dark/10 text-brand-dark/60 hover:text-brand-dark transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 font-mono text-xs uppercase tracking-widest bg-brand-dark text-brand-light hover:bg-brand-rust transition-colors cursor-pointer"
                >
                  Se connecter
                </button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-brand-dark/5">
              <p className="font-mono text-[8px] text-brand-gray/60 uppercase tracking-wider text-center">
                Admin : admin@morinerie.art / admin123
              </p>
            </div>
          </div>
        </div>
      )}

      </div>{/* End main content wrapper */}
    </div>
  );
}
