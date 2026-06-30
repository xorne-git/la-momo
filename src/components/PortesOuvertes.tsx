import { useState } from "react";
import { Calendar, Clock, MapPin, Train, Beer, Sparkles, Music, Download, Check, Compass, Eye, ShieldAlert } from "lucide-react";

export default function PortesOuvertes() {
  const [activeTab, setActiveTab] = useState<"samedi" | "dimanche">("samedi");
  const [calendarSaved, setCalendarSaved] = useState(false);

  // Generate and download a real .ics calendar invite for the event
  const handleDownloadICS = () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Morinerie Ateliers//FR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:morinerie-portes-ouvertes-2026@morinerie.com",
      "DTSTART:20260530T100000",
      "DTEND:20260531T190000",
      "SUMMARY:Portes Ouvertes 2026 - Ateliers de la Morinerie",
      "DESCRIPTION:Évènement exceptionnel : plus de 100 artistes et artisans d'art vous ouvrent leurs portes. Expositions monumentales, démonstrations de forge, ébénisterie, céramique, concerts et restauration sur place.",
      "LOCATION:21 Rue de la Morinerie, 37700 Saint-Pierre-des-Corps",
      "URL:https://www.morinerie.com",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", "Portes_Ouvertes_Morinerie_2026.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCalendarSaved(true);
    setTimeout(() => setCalendarSaved(false), 3000);
  };

  const SaturdayEvents = [
    { time: "10h00", title: "Ouverture des Hangars & Ateliers", desc: "Accueil du public, accès libre aux 70 espaces de création et d'artisanat brut.", category: "Exposition", icon: Eye },
    { time: "14h00", title: "Démonstration de Forge d'Art", desc: "Coulée de métal et façonnage sur enclume par le collectif de fondeurs du Hangar B.", category: "Démonstration", icon: Compass },
    { time: "16h00", title: "Visite guidée historique : Du Rail à l'Art", desc: "Parcours commenté de la friche industrielle, son passé ferroviaire SNCF et sa transition culturelle.", category: "Conférence", icon: Train },
    { time: "18h30", title: "Acoustique sous la Nef & Guinguette", desc: "Concert de jazz manouche et dégustation de bières locales brassées sur place au cœur de la cour centrale.", category: "Musique", icon: Music },
  ];

  const SundayEvents = [
    { time: "10h00", title: "Ouverture du Site", desc: "Seconde journée de rencontres avec les artistes peintres, verriers, ébénistes et sculpteurs.", category: "Exposition", icon: Eye },
    { time: "11h30", title: "Atelier d'initiation au tournage Céramique", desc: "Démonstration interactive de façonnage de l'argile et de la porcelaine (Hangar C).", category: "Atelier", icon: Sparkles },
    { time: "15h00", title: "Performance de Sculpture Monumentale", desc: "Taille en direct de troncs de chênes massifs et d'acier de récupération.", category: "Démonstration", icon: Compass },
    { time: "17h00", title: "Discussion : Artisanat d'Art durable", desc: "Table ronde ouverte avec les résidents sur l'avenir de la création et du réemploi de matériaux en friche.", category: "Conférence", icon: ShieldAlert },
  ];

  return (
    <div className="bg-brand-steel py-24 md:py-32 border-b border-brand-dark/10" id="portes-ouvertes">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Left Column: Context & Details */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-28">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-brand-rust font-mono text-xs uppercase tracking-widest">
                <Calendar className="w-4 h-4" />
                <span>Rendez-vous Public Annuel</span>
              </div>
              <h2 className="font-display font-light text-4xl md:text-5xl text-brand-dark uppercase tracking-tight leading-none">
                Portes Ouvertes 2026
              </h2>
              <p className="font-sans text-brand-gray text-base leading-relaxed">
                Les <strong>30 et 31 Mai 2026</strong>, l'ensemble des résidents des Ateliers de la Morinerie vous ouvrent exceptionnellement leurs hangars. Venez découvrir le travail secret du bois, du verre, de l'acier et de la toile au cours d'un week-end festif en accès libre et gratuit.
              </p>
            </div>

            {/* Quick schedule box */}
            <div className="bg-white/80 backdrop-blur-md border border-brand-dark/10 p-6 space-y-4">
              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-brand-rust mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-display font-extrabold text-sm text-brand-dark uppercase tracking-wide">Horaires d'Ouverture</h4>
                  <p className="font-sans text-xs text-brand-gray mt-1">Samedi et Dimanche de 10h00 à 19h00. Concerts et buvette prolongés le samedi soir jusqu'à 22h00.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 border-t border-brand-dark/5 pt-4">
                <MapPin className="w-5 h-5 text-brand-rust mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-display font-extrabold text-sm text-brand-dark uppercase tracking-wide">Accès au Site</h4>
                  <p className="font-sans text-xs text-brand-gray mt-1">21 Rue de la Morinerie, 37700 Saint-Pierre-des-Corps. Parking gratuit à proximité directe de la friche.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 border-t border-brand-dark/5 pt-4">
                <Train className="w-5 h-5 text-brand-rust mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-display font-extrabold text-sm text-brand-dark uppercase tracking-wide">Navettes Gare TGV</h4>
                  <p className="font-sans text-xs text-brand-gray mt-1">Liaison par navette électrique gratuite toutes les 20 minutes depuis la gare TGV de Saint-Pierre-des-Corps.</p>
                </div>
              </div>
            </div>

            {/* Interactive Add to Calendar CTA */}
            <div className="pt-2">
              <button
                onClick={handleDownloadICS}
                className="w-full bg-brand-dark hover:bg-brand-rust text-brand-light font-mono text-xs uppercase tracking-widest py-4 transition-all duration-300 flex items-center justify-center gap-2 select-none cursor-pointer"
              >
                {calendarSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Ajouté à Votre Agenda !</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Ajouter à mon Agenda (.ics)</span>
                  </>
                )}
              </button>
              <p className="font-mono text-[9px] text-brand-gray/80 text-center mt-2 uppercase tracking-wide">
                Entrée libre et gratuite sans billet ni pass d'accès requis.
              </p>
            </div>
          </div>

          {/* Right Column: Full Program of events */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex justify-between items-center border-b border-brand-dark/10 pb-4">
              <h3 className="font-display font-light text-2xl text-brand-dark uppercase tracking-tight">Le Programme</h3>
              
              {/* Tab Selector */}
              <div className="flex border-b border-brand-dark/10">
                <button
                  onClick={() => setActiveTab("samedi")}
                  className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer -mb-px border border-brand-dark/10 rounded-t-sm ${
                    activeTab === "samedi"
                      ? "text-brand-rust font-bold border-b-brand-light bg-brand-light"
                      : "text-brand-dark/50 hover:text-brand-dark bg-brand-steel/30"
                  }`}
                >
                  Samedi 30
                </button>
                <button
                  onClick={() => setActiveTab("dimanche")}
                  className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer -mb-px border border-brand-dark/10 rounded-t-sm ${
                    activeTab === "dimanche"
                      ? "text-brand-rust font-bold border-b-brand-light bg-brand-light"
                      : "text-brand-dark/50 hover:text-brand-dark bg-brand-steel/30"
                  }`}
                >
                  Dimanche 31
                </button>
              </div>
            </div>

            {/* Events Timeline */}
            <div className="space-y-6">
              {(activeTab === "samedi" ? SaturdayEvents : SundayEvents).map((event, idx) => {
                const IconComponent = event.icon;
                return (
                  <div
                    key={idx}
                    className="group bg-white p-6 border-l-4 border-brand-rust shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Decorative category badge */}
                    <div className="absolute top-6 right-6 font-mono text-[9px] uppercase tracking-wider text-brand-rust/80 bg-brand-rust/5 px-2.5 py-1 rounded-sm">
                      {event.category}
                    </div>

                    <div className="flex items-start gap-4">
                      {/* Event icon circle */}
                      <div className="bg-brand-steel p-3 text-brand-dark/70 rounded-sm flex-shrink-0 group-hover:bg-brand-rust/10 group-hover:text-brand-rust transition-colors duration-300">
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="space-y-1.5 pr-16">
                        <span className="font-mono text-xs font-bold text-brand-rust block">
                          {event.time}
                        </span>
                        <h4 className="font-display font-extrabold text-base text-brand-dark uppercase tracking-wide">
                          {event.title}
                        </h4>
                        <p className="font-sans text-xs text-brand-gray leading-relaxed">
                          {event.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional Info / Facilities banner */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-brand-dark/5 p-4 border border-brand-dark/10 flex items-center gap-3">
                <Beer className="w-5 h-5 text-brand-rust flex-shrink-0" />
                <span className="font-sans text-[11px] text-brand-dark leading-tight">
                  <strong>Restauration &amp; Buvette</strong> : Foodtrucks bios et brasserie artisanale locale sur place.
                </span>
              </div>
              <div className="bg-brand-dark/5 p-4 border border-brand-dark/10 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-brand-rust flex-shrink-0" />
                <span className="font-sans text-[11px] text-brand-dark leading-tight">
                  <strong>Espaces créatifs</strong> : Ateliers ouverts pour enfants et familles tout le week-end.
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
