import { motion } from "motion/react";
import { ArrowUpRight, Building2, ShieldCheck, HeartHandshake, Eye } from "lucide-react";
import InlineEdit from "../admin/InlineEdit";

export default function ClenPatronage() {
  return (
    <div className="bg-brand-steel py-24 md:py-32 border-t border-brand-dark/10 relative overflow-hidden">
      {/* Decorative architectural grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute top-0 bottom-0 left-1/4 w-[1px] bg-brand-dark" />
        <div className="absolute top-0 bottom-0 left-2/4 w-[1px] bg-brand-dark" />
        <div className="absolute top-0 bottom-0 left-3/4 w-[1px] bg-brand-dark" />
        <div className="absolute left-0 right-0 top-1/3 h-[1px] bg-brand-dark" />
        <div className="absolute left-0 right-0 top-2/3 h-[1px] bg-brand-dark" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: Story, Mécénat, Annie & CLEN */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-brand-rust font-mono text-xs uppercase tracking-widest">
                <Building2 className="w-4 h-4 animate-pulse-slow" />
                <InlineEdit storageKey="morinerie_clen_surtitre" tag="span">Le Mécénat &amp; L'Histoire du Lieu</InlineEdit>
              </div>
              <InlineEdit storageKey="morinerie_clen_titre" tag="h2" className="font-display font-light text-4xl md:text-5xl text-brand-dark uppercase tracking-tight leading-none" defaultHtml="L'Empreinte de CLEN <br /><span class=&quot;font-semibold text-brand-rust&quot;>&amp; d'Annie Goyer</span>">
                L'Empreinte de CLEN <br />
                <span className="font-semibold text-brand-rust">&amp; d'Annie Goyer</span>
              </InlineEdit>
              <div className="w-20 h-[2px] bg-brand-rust/30 mt-2" />
            </div>

            <InlineEdit
              storageKey="morinerie_clen_texte"
              tag="div"
              className="space-y-6 font-sans text-brand-dark/80 text-base md:text-lg leading-relaxed font-light"
              defaultHtml='<p class="font-bold text-brand-dark">Propriétaire et mécène engagé de ce site ferroviaire historique, la société <span class="text-brand-rust font-semibold">CLEN</span> – créatrice et fabricante française de mobilier de bureau ergonomique – porte depuis l&apos;origine l&apos;esprit de préservation et d&apos;émancipation artistique de la Morinerie.</p><p>Sous l&apos;impulsion visionnaire de sa présidente, <span class="font-medium text-brand-dark">Annie Goyer</span>, ces anciens hangars de la SNCF de Saint-Pierre-des-Corps ont évité l&apos;abandon pour renaître en un écosystème créatif d&apos;exception. Un modèle de mécénat industriel rare où l&apos;art de concevoir l&apos;espace s&apos;unit à l&apos;art brut de la création.</p><p class="text-sm md:text-base text-brand-gray">Au quotidien, CLEN conçoit et fabrique en Touraine des solutions d&apos;aménagement de bureaux (bureaux, acoustique, assises, rangements) axées sur la durabilité, le bien-être et le design contemporain. C&apos;est ce même souci de la noblesse des matériaux et de la justesse des lignes qui lie l&apos;entreprise aux 100 résidents de la Morinerie.</p>'
            >
              <p className="font-bold text-brand-dark">
                Propriétaire et mécène engagé de ce site ferroviaire historique, la société <span className="text-brand-rust font-semibold">CLEN</span> – créatrice et fabricante française de mobilier de bureau ergonomique – porte depuis l'origine l'esprit de préservation et d'émancipation artistique de la Morinerie.
              </p>
              <p>
                Sous l'impulsion visionnaire de sa présidente, <span className="font-medium text-brand-dark">Annie Goyer</span>, ces anciens hangars de la SNCF de Saint-Pierre-des-Corps ont évité l'abandon pour renaître en un écosystème créatif d'exception. Un modèle de mécénat industriel rare où l'art de concevoir l'espace s'unit à l'art brut de la création.
              </p>
              <p className="text-sm md:text-base text-brand-gray">
                Au quotidien, CLEN conçoit et fabrique en Touraine des solutions d'aménagement de bureaux (bureaux, acoustique, assises, rangements) axées sur la durabilité, le bien-être et le design contemporain. C’est ce même souci de la noblesse des matériaux et de la justesse des lignes qui lie l'entreprise aux 100 résidents de la Morinerie.
              </p>
            </InlineEdit>

            {/* Core Values grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-brand-dark/10">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-brand-rust uppercase tracking-wider font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <InlineEdit storageKey="morinerie_clen_valeur1_titre" tag="span">Savoir-Faire</InlineEdit>
                </div>
                <InlineEdit storageKey="morinerie_clen_valeur1_texte" tag="p" className="font-sans text-xs text-brand-gray">
                  Fabrication 100% française et éco-conçue en région Centre-Val de Loire.
                </InlineEdit>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-brand-rust uppercase tracking-wider font-bold">
                  <Eye className="w-3.5 h-3.5" />
                  <InlineEdit storageKey="morinerie_clen_valeur2_titre" tag="span">Design Durable</InlineEdit>
                </div>
                <InlineEdit storageKey="morinerie_clen_valeur2_texte" tag="p" className="font-sans text-xs text-brand-gray">
                  Ergonomie haut de gamme, confort acoustique et esthétique épurée.
                </InlineEdit>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-brand-rust uppercase tracking-wider font-bold">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <InlineEdit storageKey="morinerie_clen_valeur3_titre" tag="span">Mécénat d'Art</InlineEdit>
                </div>
                <InlineEdit storageKey="morinerie_clen_valeur3_texte" tag="p" className="font-sans text-xs text-brand-gray">
                  Un soutien constant aux créateurs locaux et à la mémoire industrielle.
                </InlineEdit>
              </div>
            </div>

            {/* Official Website Button */}
            <div className="pt-4">
              <a
                href="https://clen.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-brand-dark text-brand-light hover:bg-brand-rust hover:text-brand-light font-mono text-xs uppercase tracking-widest px-8 py-4 transition-all duration-300 shadow-md hover:shadow-lg group"
              >
                <span>Découvrir le Mobilier CLEN</span>
                <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Right Column: Embedded Architectural Asset & Card Overlay */}
          <div className="lg:col-span-6 relative group/clen">
            {/* Elegant industrial wireframe background element */}
            <div className="absolute -inset-4 border border-brand-rust/20 scale-95 group-hover/clen:scale-100 transition-transform duration-700 pointer-events-none" />
            
            <div className="aspect-[3/2] overflow-hidden border border-brand-dark/10 shadow-xl bg-brand-dark relative z-10">
              <motion.img
                initial={{ scale: 1.1, filter: "grayscale(20%) brightness(0.9)" }}
                whileInView={{ scale: 1, filter: "grayscale(0%) brightness(1)" }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=2000"
                alt="Mobilier de bureau design CLEN dans un loft industriel"
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />
              
              {/* Scanline overlay effect */}
              <div className="absolute inset-x-0 h-[2px] bg-brand-rust/50 opacity-0 group-hover/clen:opacity-100 transition-opacity duration-300 animate-scan top-0 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/40 to-transparent pointer-events-none" />
            </div>

            {/* Small hovering architectural coordinates card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="absolute -bottom-6 -right-4 bg-brand-light border border-brand-dark/10 p-5 shadow-lg max-w-[280px] z-20 pointer-events-none"
            >
              <div className="space-y-2">
                <span className="font-mono text-[9px] text-brand-rust uppercase tracking-wider block font-bold">
                  Manufacture &amp; Conception
                </span>
                <p className="font-display text-sm font-semibold text-brand-dark uppercase tracking-wide">
                  CLEN Solutions d'Agencement
                </p>
                <div className="border-t border-brand-dark/5 pt-2 flex justify-between font-mono text-[9px] text-brand-gray uppercase">
                  <span>Touraine, France</span>
                  <span>Est. 1968</span>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
