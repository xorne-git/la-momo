import { TIMELINE } from "../data";
import { History, Milestone, Compass, Activity } from "lucide-react";
import InlineEdit from "../admin/InlineEdit";

export default function HistoryTimeline() {
  return (
    <div className="bg-brand-dark py-24 md:py-32 text-brand-light border-b border-brand-light/10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Title area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 items-end">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2 text-brand-rust font-mono text-xs uppercase tracking-widest">
              <History className="w-4 h-4 animate-spin-slow" />
              <InlineEdit storageKey="morinerie_histoire_surtitre" tag="span">Héritage &amp; Résilience</InlineEdit>
            </div>
            <InlineEdit storageKey="morinerie_histoire_titre" tag="h2" className="font-display font-light text-4xl md:text-6xl uppercase tracking-tight leading-none text-brand-light">
              De La Vapeur À La Création
            </InlineEdit>
            <InlineEdit storageKey="morinerie_histoire_texte" tag="p" className="font-sans text-brand-light/75 text-base md:text-lg max-w-2xl">
              Plus d'un siècle d'histoire ferroviaire et d'effervescence artistique gravé dans le béton armé, le verre et la sueur.
            </InlineEdit>
          </div>
          <div className="lg:col-span-4 hidden lg:flex justify-end font-mono text-[10px] text-brand-light/40 uppercase tracking-widest">
            <span>CHRONOLOGIE DU LIEU — DEP-37</span>
          </div>
        </div>

        {/* Vertical Timeline Structure */}
        <div className="relative border-l border-brand-light/20 ml-4 md:ml-40 pl-8 md:pl-16 space-y-16">
          
          {/* Timeline Node Items */}
          {TIMELINE.map((item, index) => {
            return (
              <div key={item.id} className="relative group">
                
                {/* Timeline node dot indicator */}
                <div className="absolute -left-[41px] md:-left-[73px] top-1 w-6 h-6 rounded-full bg-brand-dark border-2 border-brand-rust group-hover:bg-brand-rust group-hover:scale-110 transition-all duration-300 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-light" />
                </div>

                {/* Left Side Floating Year (Desktop only) */}
                <div className="absolute -left-48 md:-left-52 top-0 hidden md:block w-28 text-right">
                  <InlineEdit storageKey={`morinerie_timeline_${item.id}_year`} tag="span" className="font-display font-light text-4xl text-brand-rust tracking-tighter leading-none block">
                    {item.year}
                  </InlineEdit>
                  <InlineEdit storageKey={`morinerie_timeline_${item.id}_badge`} tag="span" className="font-mono text-[9px] text-brand-light/40 tracking-widest uppercase mt-1 block">
                    {item.badgeLabel}
                  </InlineEdit>
                </div>

                {/* Timeline body content card */}
                <div className="space-y-3 max-w-3xl">
                  {/* Mobile Date Header */}
                  <div className="flex items-center gap-3 md:hidden">
                    <InlineEdit storageKey={`morinerie_timeline_${item.id}_year`} tag="span" className="font-display font-light text-3xl text-brand-rust tracking-tighter leading-none">
                      {item.year}
                    </InlineEdit>
                    <InlineEdit storageKey={`morinerie_timeline_${item.id}_badge`} tag="span" className="font-mono text-[8px] px-2 py-0.5 bg-brand-light/10 text-brand-light/80 uppercase tracking-widest font-bold">
                      {item.badgeLabel}
                    </InlineEdit>
                  </div>

                  <InlineEdit storageKey={`morinerie_timeline_${item.id}_title`} tag="h3" className="font-display font-extrabold text-xl md:text-2xl text-brand-light uppercase group-hover:text-brand-rust transition-colors tracking-wide">
                    {item.title}
                  </InlineEdit>

                  <InlineEdit storageKey={`morinerie_timeline_${item.id}_desc`} tag="p" className="font-sans text-brand-light/80 text-sm md:text-base leading-relaxed font-light">
                    {item.description}
                  </InlineEdit>
                </div>

              </div>
            );
          })}

          {/* Timeline terminating track connector */}
          <div className="absolute -bottom-8 -left-[2px] w-1 h-8 bg-gradient-to-b from-brand-light/20 to-transparent pointer-events-none" />

        </div>

        {/* Highlight Banner of the space rehabilitation */}
        <div className="mt-24 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-brand-light/5 border border-brand-light/10 p-8 md:p-12 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2 text-brand-rust font-mono text-xs uppercase tracking-widest">
              <Milestone className="w-4 h-4" />
              <InlineEdit storageKey="morinerie_histoire_banner_surtitre" tag="span">Patrimoine Vivant</InlineEdit>
            </div>
            <InlineEdit storageKey="morinerie_histoire_banner_titre" tag="h3" className="font-display font-extrabold text-2xl md:text-3xl text-brand-light uppercase tracking-tight">
              Une Friche Industrielle Préservée
            </InlineEdit>
            <InlineEdit storageKey="morinerie_histoire_banner_texte" tag="p" className="font-sans text-brand-light/75 text-sm md:text-base leading-relaxed">
              Plutôt que d'aseptiser ou de raser ce chef-d'œuvre de l'architecture industrielle du début du XXe siècle, les résidents de la Morinerie ont choisi d'habiter ses blessures, d'apprivoiser sa rouille, et de prolonger son histoire par la création contemporaine de pointe.
            </InlineEdit>
          </div>
          <div className="lg:col-span-4 flex flex-col md:flex-row lg:flex-col gap-6 items-stretch lg:pl-12 border-t lg:border-t-0 lg:border-l border-brand-light/10 pt-8 lg:pt-0">
            <div>
              <div className="flex items-center gap-1.5 text-brand-rust font-mono text-xs uppercase tracking-widest font-bold mb-1">
                <Compass className="w-4 h-4" />
                <span>Situation Géographique</span>
              </div>
              <p className="font-sans text-brand-light/80 text-xs">
                Mitoyen de la ligne TGV Paris-Tours, au cœur du bassin ferroviaire historique.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-brand-rust font-mono text-xs uppercase tracking-widest font-bold mb-1">
                <Activity className="w-4 h-4" />
                <span>Statut d'Occupation</span>
              </div>
              <p className="font-sans text-brand-light/80 text-xs">
                Coopérative solidaire d'artistes et artisans d'art autogérée.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
