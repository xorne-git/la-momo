import { useState, useEffect, useRef } from "react";
import { Save, User as UserIcon, Phone, Calendar } from "lucide-react";
import ImagePicker from "../admin-core/ImagePicker";
import { useAuth } from "../context/AuthContext";
import { toast } from "../utils/toast";

function splitName(full: string) {
  const i = full.lastIndexOf(" ");
  if (i === -1) return { prenom: full, nom: "" };
  return { prenom: full.slice(0, i), nom: full.slice(i + 1) };
}

export default function MonCompte() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const storageKey = `morinerie_user_profile_${userId}`;

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [dirty, setDirty] = useState(false);
  const savedSnapshot = useRef("");

  useEffect(() => {
    if (!userId) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const p = JSON.parse(saved);
        setNom(p.nom ?? "");
        setPrenom(p.prenom ?? "");
        setEmail(p.email ?? currentUser?.email ?? "");
        setTelephone(p.telephone ?? "");
        setAvatarUrl(p.avatarUrl ?? "");
        savedSnapshot.current = saved;
      } else {
        const parts = splitName(currentUser?.name ?? "");
        setNom(parts.nom);
        setPrenom(parts.prenom);
        setEmail(currentUser?.email ?? "");
        setTelephone("");
        setAvatarUrl("");
        savedSnapshot.current = "";
      }
    } catch {}
  }, [userId, currentUser]);

  const handleSave = () => {
    if (!userId) return;
    const profile = { nom, prenom, email, telephone, avatarUrl };
    const json = JSON.stringify(profile);
    localStorage.setItem(storageKey, json);
    savedSnapshot.current = json;
    setDirty(false);
    try {
      const auth = JSON.parse(localStorage.getItem("morinerie_auth_user") || "{}");
      auth.name = `${prenom} ${nom}`.trim();
      auth.email = email;
      if (avatarUrl) auth.avatarUrl = avatarUrl;
      localStorage.setItem("morinerie_auth_user", JSON.stringify(auth));
    } catch {}
    fetch(`/api/content/${storageKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: json }),
    }).catch(() => {});
    toast.success("Profil mis à jour");
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h2 className="font-display text-2xl uppercase tracking-wide text-brand-dark mb-6">Mon compte</h2>

      <div className="space-y-6">
        {/* Avatar */}
        <div>
          <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-2">Avatar</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-brand-steel border border-brand-dark/10 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-8 h-8 text-brand-gray/40" />
              )}
            </div>
            <div className="flex-1">
              <ImagePicker onSelect={(url) => { setAvatarUrl(url); setDirty(true); }} />
            </div>
          </div>
        </div>

        {/* Prénom */}
        <div>
          <label className="block font-mono text-[10px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">
            Prénom <span className="text-brand-rust">*</span>
          </label>
          <input
            type="text"
            value={prenom}
            onChange={(e) => { setPrenom(e.target.value); setDirty(true); }}
            className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors"
          />
        </div>

        {/* Nom */}
        <div>
          <label className="block font-mono text-[10px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">
            Nom <span className="text-brand-rust">*</span>
          </label>
          <input
            type="text"
            value={nom}
            onChange={(e) => { setNom(e.target.value); setDirty(true); }}
            className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block font-mono text-[10px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">
            Email <span className="text-brand-rust">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setDirty(true); }}
            className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors"
          />
        </div>

        {/* Téléphone */}
        <div>
          <label className="block font-mono text-[10px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Téléphone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray/40" />
            <input
              type="tel"
              value={telephone}
              onChange={(e) => { setTelephone(e.target.value); setDirty(true); }}
              placeholder="06 12 34 56 78"
              className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm pl-10 pr-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors"
            />
          </div>
        </div>

        {/* Save */}
        <div className="pt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!dirty}
            className={`inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest font-bold px-5 py-3 rounded-sm transition-all cursor-pointer ${
              dirty
                ? "bg-brand-rust text-brand-light hover:brightness-110"
                : "bg-brand-steel text-brand-gray/50 cursor-not-allowed"
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            Enregistrer
          </button>
          {dirty && <span className="font-mono text-[10px] text-brand-rust">Modifications non enregistrées</span>}
        </div>
      </div>
    </div>
  );
}
