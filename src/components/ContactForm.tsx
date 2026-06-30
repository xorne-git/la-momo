import { useState, FormEvent } from "react";
import { Mail, CheckCircle2, ArrowRight, Loader2, MapPin, Send, HelpCircle } from "lucide-react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
      setIsSent(true);
      setIsSubmitting(false);
      // Reset fields
      setName("");
      setEmail("");
      setMessage("");
    }, 1200);
  };

  return (
    <div className="bg-brand-light py-24 md:py-32" id="contact-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Left Column: Direct info and map marker */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-28">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-brand-rust font-mono text-xs uppercase tracking-widest">
                <Mail className="w-4 h-4" />
                <span>Contact &amp; Inquiries</span>
              </div>
              <h2 className="font-display font-light text-4xl md:text-5xl text-brand-dark uppercase tracking-tight leading-none">
                Écrire Aux Ateliers
              </h2>
              <p className="font-sans text-brand-gray text-base leading-relaxed">
                Une question sur un résident, une demande de visite privée, ou un projet de commande artistique sur-mesure ? Nos équipes vous répondent sous 48h.
              </p>
            </div>

            {/* Geographical localization info */}
            <div className="space-y-6 pt-6 border-t border-brand-dark/10">
              <div className="flex gap-4 items-start">
                <MapPin className="w-5 h-5 text-brand-rust flex-shrink-0 mt-0.5" />
                <div className="space-y-1 font-sans text-sm text-brand-dark">
                  <p className="font-bold">Les Ateliers de la Morinerie</p>
                  <p className="text-brand-gray">21 Rue de la Morinerie</p>
                  <p className="text-brand-gray">37700 Saint-Pierre-des-Corps, France</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <HelpCircle className="w-5 h-5 text-brand-rust flex-shrink-0 mt-0.5" />
                <div className="space-y-1 font-sans text-sm text-brand-dark">
                  <p className="font-bold">Demandes d'Ateliers libres</p>
                  <p className="text-brand-gray">
                    Pour postuler à une place d'atelier permanent, veuillez spécifier "Candidature" dans le sujet de votre message avec un portfolio PDF en lien.
                  </p>
                </div>
              </div>
            </div>

            {/* Embed small visual footer credit in margin to avoid tech larping */}
            <div className="pt-6 font-mono text-[9px] text-brand-gray/50 uppercase tracking-widest">
              <span>Région Centre-Val de Loire • St-Pierre-des-Corps</span>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-7 bg-brand-steel p-8 md:p-12 border border-brand-dark/5 shadow-sm">
            {isSent ? (
              <div className="space-y-6 text-center py-12">
                <div className="flex justify-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-600 animate-float" />
                </div>
                <h3 className="font-display font-extrabold text-2xl text-brand-dark uppercase tracking-wider">Message Transmis Avec Succès</h3>
                <p className="font-sans text-brand-gray text-sm max-w-md mx-auto leading-relaxed">
                  Merci pour votre message. La coordination des Ateliers ou l'artiste concerné va prendre connaissance de votre demande et reviendra vers vous très rapidement.
                </p>
                <button
                  onClick={() => setIsSent(false)}
                  className="bg-brand-dark hover:bg-brand-rust text-brand-light font-mono text-xs uppercase tracking-widest px-6 py-3.5 transition-all cursor-pointer"
                >
                  Envoyer un nouveau message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold">
                      Nom &amp; Prénom
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Constance Renaud"
                      className="w-full bg-brand-light border border-brand-dark/10 focus:border-brand-rust text-brand-dark font-sans text-sm px-4 py-3 rounded-none focus:outline-none focus:ring-0 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold">
                      Adresse e-mail
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="constance@email.com"
                      className="w-full bg-brand-light border border-brand-dark/10 focus:border-brand-rust text-brand-dark font-sans text-sm px-4 py-3 rounded-none focus:outline-none focus:ring-0 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold">
                    Sujet de la demande
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: "general", label: "Général / Visite" },
                      { value: "commission", label: "Commande d'œuvre" },
                      { value: "candidature", label: "Candidature Atelier" }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSubject(opt.value)}
                        className={`font-mono text-[10px] uppercase py-3 border transition-all cursor-pointer ${
                          subject === opt.value
                            ? "bg-brand-dark border-brand-dark text-brand-light font-bold"
                            : "bg-brand-light border-brand-dark/10 text-brand-dark/80 hover:border-brand-dark"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Détaillez votre projet de commande, demande d'atelier libre, ou d'informations ici..."
                    className="w-full bg-brand-light border border-brand-dark/10 focus:border-brand-rust text-brand-dark font-sans text-sm p-4 rounded-none focus:outline-none focus:ring-0 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-rust hover:bg-brand-dark disabled:bg-brand-gray text-brand-light font-display text-xs uppercase tracking-widest py-4 transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmission...</span>
                    </>
                  ) : (
                    <>
                      <span>Envoyer la Demande</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
