import { useState, useEffect } from "react";
import { Save, ArrowLeft, User as UserIcon, Shield, Paintbrush, Calendar, Trash2, Phone, Plus, X, Check } from "lucide-react";
import { ARTISTS } from "../data";
import ImagePicker from "../admin-core/ImagePicker";
import { toast } from "../utils/toast";

interface Compte {
  id: string;
  email: string;
  name: string;
  role: "admin" | "artiste";
  artist_id: string | null;
}

interface Group {
  id: string;
  name: string;
  role: string;
}

const RESOURCES = [
  { key: "hero", label: "Diaporama" },
  { key: "lieu", label: "Le Lieu" },
  { key: "histoire", label: "Notre Histoire" },
  { key: "clen", label: "CLEN / Patronage" },
  { key: "map", label: "Carte interactive" },
  { key: "gallery", label: "Galerie artistes" },
  { key: "actualites", label: "Actualités" },
  { key: "artpage", label: "Pages artistes" },
  { key: "slides", label: "Portfolio artistes" },
  { key: "blog", label: "Blog artistes" },
  { key: "tags", label: "Tags" },
  { key: "media", label: "Médiathèque" },
  { key: "comptes", label: "Gestion des comptes" },
  { key: "groupes", label: "Groupes & droits" },
];

interface Compte {
  id: string;
  email: string;
  name: string;
  role: "admin" | "artiste";
  artist_id: string | null;
}

export default function GestionComptes() {
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [selected, setSelected] = useState<Compte | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editPrenom, setEditPrenom] = useState("");
  const [editNom, setEditNom] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "artiste">("artiste");
  const [editPassword, setEditPassword] = useState("");
  const [editBirthdate, setEditBirthdate] = useState("");
  const [editTelephone, setEditTelephone] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [userGroupIds, setUserGroupIds] = useState<string[]>([]);
  const [userPerms, setUserPerms] = useState<Record<string, { can_create: number; can_modify: number; can_delete: number }>>({});
  const [effectivePerms, setEffectivePerms] = useState<Record<string, { can_create: number; can_modify: number; can_delete: number }>>({});
  const [dirty, setDirty] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  const loadComptes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/users");
      if (res.ok) {
        const data = await res.json();
        setComptes(Array.isArray(data) ? data : []);
      } else {
        const err = await res.json().catch(() => ({ error: "Erreur serveur" }));
        setError(err.error || "Erreur lors du chargement");
      }
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez que le backend est bien lancé (npm run dev:api).");
    }
    setLoading(false);
  };

  useEffect(() => { loadComptes(); }, []);

  const loadProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/content/morinerie_user_profile_${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.value) {
          const p = JSON.parse(data.value);
          return p;
        }
      }
    } catch {}
    return {};
  };

  const saveProfile = async (userId: string, profile: Record<string, any>) => {
    const key = `morinerie_user_profile_${userId}`;
    // Merge with existing
    try {
      const res = await fetch(`/api/content/${key}`);
      let existing: Record<string, any> = {};
      if (res.ok) {
        const data = await res.json();
        if (data.value) existing = JSON.parse(data.value);
      }
      const merged = { ...existing, ...profile };
      await fetch(`/api/content/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: JSON.stringify(merged) }),
      });
    } catch {}
  };

  const loadBirthdate = async (userId: string) => {
    try {
      const res = await fetch(`/api/content/morinerie_user_birthdate_${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.value) return data.value;
      }
    } catch {}
    return "";
  };

  const openEdit = async (c: Compte) => {
    setSelected(c);
    setEditEmail(c.email);
    setEditRole(c.role);
    setEditPassword("");
    const [profile, bd, groupsRes, userPermsRes] = await Promise.all([
      loadProfile(c.id),
      loadBirthdate(c.id),
      fetch("/api/groups"),
      fetch(`/api/users/${c.id}/permissions`),
    ]);
    setEditPrenom(profile.prenom ?? "");
    setEditNom(profile.nom ?? "");
    setEditTelephone(profile.telephone ?? "");
    setEditAvatar(profile.avatarUrl ?? "");
    setEditBirthdate(bd);
    // Groups
    if (groupsRes.ok) {
      const all = await groupsRes.json();
      setAllGroups(all);
      const ugRes = await fetch(`/api/users/${c.id}/groups`);
      if (ugRes.ok) {
        const ug = await ugRes.json();
        setUserGroupIds(ug.map((g: any) => g.id));
      }
    }
    // User permissions
    if (userPermsRes.ok) {
      const perms = await userPermsRes.json();
      const map: Record<string, any> = {};
      for (const p of perms) map[p.resource] = { can_create: p.can_create, can_modify: p.can_modify, can_delete: p.can_delete };
      setUserPerms(map);
    }
    // Effective permissions
    try {
      const effRes = await fetch(`/api/users/${c.id}/effective`);
      if (effRes.ok) setEffectivePerms(await effRes.json());
    } catch {}
    setDirty(false);
    setShowGroupPicker(false);
  };

  const toggleUserPerm = (resource: string, field: "can_create" | "can_modify" | "can_delete") => {
    setUserPerms((prev) => {
      const current = prev[resource] || { can_create: 0, can_modify: 0, can_delete: 0 };
      return { ...prev, [resource]: { ...current, [field]: current[field] ? 0 : 1 } };
    });
    setDirty(true);
  };

  const addGroupToUser = async (groupId: string) => {
    if (!selected) return;
    await fetch(`/api/users/${selected.id}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });
    setUserGroupIds((prev) => [...prev, groupId]);
    setShowGroupPicker(false);
    toast.success("Groupe ajouté");
    setDirty(true);
  };

  const removeGroupFromUser = async (groupId: string) => {
    if (!selected) return;
    await fetch(`/api/users/${selected.id}/groups/${groupId}`, { method: "DELETE" });
    setUserGroupIds((prev) => prev.filter((id) => id !== groupId));
    toast.success("Groupe retiré");
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    if (!editPrenom.trim() || !editNom.trim() || !editEmail.trim()) {
      toast.error("Prénom, Nom et Email sont obligatoires");
      return;
    }
    const combinedName = `${editPrenom} ${editNom}`.trim();
    const body: Record<string, any> = { name: combinedName, email: editEmail, role: editRole };
    if (editPassword) body.password = editPassword;
    try {
      const res = await fetch(`/api/auth/users/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setComptes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setSelected(updated);
        setDirty(false);
        // Save profile (prenom, nom, telephone, avatarUrl)
        await saveProfile(selected.id, {
          prenom: editPrenom,
          nom: editNom,
          telephone: editTelephone,
          avatarUrl: editAvatar,
        });
        // Save birthdate separately
        await fetch(`/api/content/morinerie_user_birthdate_${selected.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: editBirthdate }),
        });
        // Save user permissions
        const permsPayload = RESOURCES.map((r) => ({
          resource: r.key,
          can_create: userPerms[r.key]?.can_create || 0,
          can_modify: userPerms[r.key]?.can_modify || 0,
          can_delete: userPerms[r.key]?.can_delete || 0,
        }));
        await fetch(`/api/users/${selected.id}/permissions`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: permsPayload }),
        });
        toast.success("Compte mis à jour");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const artistOptions = ARTISTS.map((a) => ({ id: a.id, name: a.name }));

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="font-mono text-sm text-brand-gray">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="font-display text-2xl uppercase tracking-wide text-brand-dark mb-6">Gestion des comptes</h2>
        <div className="bg-red-50 border border-red-200 text-red-700 font-sans text-sm px-4 py-3 rounded-sm">
          {error}
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center bg-brand-dark/5 hover:bg-brand-dark/10 rounded-sm transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-dark">Modifier le compte</h2>
        </div>

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block font-mono text-[10px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">
              Prénom <span className="text-brand-rust">*</span>
            </label>
            <input type="text" value={editPrenom} onChange={(e) => { setEditPrenom(e.target.value); setDirty(true); }} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" />
          </div>
          <div>
            <label className="block font-mono text-[10px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">
              Nom <span className="text-brand-rust">*</span>
            </label>
            <input type="text" value={editNom} onChange={(e) => { setEditNom(e.target.value); setDirty(true); }} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" />
          </div>
          <div>
            <label className="block font-mono text-[10px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">
              Email <span className="text-brand-rust">*</span>
            </label>
            <input type="email" value={editEmail} onChange={(e) => { setEditEmail(e.target.value); setDirty(true); }} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" />
          </div>
          <div>
            <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Rôle</label>
            <select value={editRole} onChange={(e) => { setEditRole(e.target.value as "admin" | "artiste"); setDirty(true); }} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors">
              <option value="artiste">Artiste</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray/40" />
              <input type="tel" value={editTelephone} onChange={(e) => { setEditTelephone(e.target.value); setDirty(true); }} placeholder="06 12 34 56 78" className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm pl-10 pr-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" />
            </div>
          </div>
          <div>
            <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Date de naissance</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray/40" />
              <input type="date" value={editBirthdate} onChange={(e) => { setEditBirthdate(e.target.value); setDirty(true); }} className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm pl-10 pr-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" />
            </div>
          </div>
          <div>
            <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Avatar</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-brand-steel border border-brand-dark/10 flex items-center justify-center shrink-0">
                {editAvatar ? (
                  <img src={editAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-6 h-6 text-brand-gray/40" />
                )}
              </div>
              <div className="flex-1">
                <ImagePicker onSelect={(url) => { setEditAvatar(url); setDirty(true); }} />
              </div>
              {editAvatar && (
                <button onClick={() => { setEditAvatar(""); setDirty(true); }} className="text-red-500 hover:text-red-700 transition-colors cursor-pointer p-1.5" title="Supprimer l'avatar">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Nouveau mot de passe</label>
            <input type="text" value={editPassword} onChange={(e) => { setEditPassword(e.target.value); setDirty(true); }} placeholder="Laisser vide pour ne pas changer" className="w-full bg-brand-steel/50 border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" />
          </div>

          {/* Groupes */}
          <div className="pt-4">
            <label className="block font-mono text-[9px] text-brand-gray uppercase tracking-widest font-bold mb-2">Groupes</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {userGroupIds.map((gid) => {
                const g = allGroups.find((g) => g.id === gid);
                if (!g) return null;
                return (
                  <span key={gid} className="inline-flex items-center gap-1 bg-brand-steel/50 border border-dashed border-brand-dark/20 text-brand-gray font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-sm">
                    <Shield className="w-2.5 h-2.5" />
                    {g.name}
                    <button onClick={() => removeGroupFromUser(gid)} className="text-brand-gray/50 hover:text-red-500 transition-colors cursor-pointer">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                );
              })}
              <div className="relative">
                <button onClick={() => setShowGroupPicker(!showGroupPicker)} className="inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-brand-steel/50 border border-dashed border-brand-dark/20 text-brand-gray hover:text-brand-rust hover:border-brand-rust/50 rounded-sm transition-colors cursor-pointer">
                  <Plus className="w-2.5 h-2.5" />
                  Groupe
                </button>
                {showGroupPicker && (
                  <div className="absolute z-10 top-full mt-1 left-0 bg-brand-light border border-brand-dark/10 shadow-md rounded-sm p-1 min-w-[160px]">
                    {allGroups.filter((g) => !userGroupIds.includes(g.id)).map((g) => (
                      <button key={g.id} onClick={() => addGroupToUser(g.id)} className="w-full text-left font-mono text-[10px] uppercase tracking-wider px-2 py-1.5 text-brand-dark/70 hover:text-brand-rust hover:bg-brand-rust/5 rounded-sm transition-colors cursor-pointer">
                        {g.name}
                      </button>
                    ))}
                    {allGroups.filter((g) => !userGroupIds.includes(g.id)).length === 0 && (
                      <p className="font-mono text-[9px] text-brand-gray/60 px-2 py-1.5">Tous les groupes sont assignés</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Permissions effectives (groupe + individuelles) */}
          <div className="pt-2">
            <label className="block font-mono text-[11px] text-brand-gray uppercase tracking-widest font-bold mb-1">Permissions effectives</label>
            <p className="font-mono text-[9px] text-brand-gray/60 mb-2">Fusion des droits groupe et individuels. Les droits individuels remplacent ceux du groupe.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="font-mono text-[10px] text-brand-gray/60 uppercase tracking-wider">
                    <th className="pb-1.5 pr-3 font-normal">Ressource</th>
                    <th className="pb-1.5 pr-3 font-normal text-center">Créer</th>
                    <th className="pb-1.5 pr-3 font-normal text-center">Modifier</th>
                    <th className="pb-1.5 font-normal text-center">Supprimer</th>
                  </tr>
                </thead>
                <tbody>
                  {RESOURCES.map((r) => {
                    const p = effectivePerms[r.key] || { can_create: 0, can_modify: 0, can_delete: 0 };
                    const hasOverride = !!(userPerms[r.key]);
                    return (
                      <tr key={r.key} className="border-t border-brand-dark/5">
                        <td className="py-1.5 pr-3 font-mono text-xs text-brand-dark flex items-center gap-1.5">
                          {r.label}
                          {hasOverride && <span className="text-[7px] text-brand-rust font-mono uppercase tracking-wider">(override)</span>}
                        </td>
                        <td className="py-1.5 pr-3 text-center">
                          <span className={`inline-flex w-6 h-6 items-center justify-center rounded-sm border text-[8px] font-mono font-bold ${p.can_create ? "bg-brand-rust/20 border-brand-rust/30 text-brand-rust" : "bg-brand-steel/30 border-dashed border-brand-dark/10 text-brand-gray/40"}`}>
                            {p.can_create ? "✓" : "—"}
                          </span>
                        </td>
                        <td className="py-1.5 pr-3 text-center">
                          <span className={`inline-flex w-6 h-6 items-center justify-center rounded-sm border text-[8px] font-mono font-bold ${p.can_modify ? "bg-brand-rust/20 border-brand-rust/30 text-brand-rust" : "bg-brand-steel/30 border-dashed border-brand-dark/10 text-brand-gray/40"}`}>
                            {p.can_modify ? "✓" : "—"}
                          </span>
                        </td>
                        <td className="py-1.5 text-center">
                          <span className={`inline-flex w-6 h-6 items-center justify-center rounded-sm border text-[8px] font-mono font-bold ${p.can_delete ? "bg-brand-rust/20 border-brand-rust/30 text-brand-rust" : "bg-brand-steel/30 border-dashed border-brand-dark/10 text-brand-gray/40"}`}>
                            {p.can_delete ? "✓" : "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Permissions individuelles */}
          <div className="pt-2">
            <label className="block font-mono text-[11px] text-brand-gray uppercase tracking-widest font-bold mb-1">Permissions individuelles</label>
            <p className="font-mono text-[9px] text-brand-gray/60 mb-2">Les droits individuels remplacent ceux du groupe en cas de conflit.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="font-mono text-[10px] text-brand-gray/60 uppercase tracking-wider">
                    <th className="pb-1.5 pr-3 font-normal">Ressource</th>
                    <th className="pb-1.5 pr-3 font-normal text-center">Créer</th>
                    <th className="pb-1.5 pr-3 font-normal text-center">Modifier</th>
                    <th className="pb-1.5 font-normal text-center">Supprimer</th>
                  </tr>
                </thead>
                <tbody>
                  {RESOURCES.map((r) => {
                    const p = userPerms[r.key] || { can_create: 0, can_modify: 0, can_delete: 0 };
                    return (
                      <tr key={r.key} className="border-t border-brand-dark/5">
                        <td className="py-1.5 pr-3 font-mono text-xs text-brand-dark">{r.label}</td>
                        <td className="py-1.5 pr-3 text-center">
                          <button onClick={() => toggleUserPerm(r.key, "can_create")} className={`w-6 h-6 flex items-center justify-center rounded-sm border text-[8px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${p.can_create ? "bg-brand-rust border-brand-rust text-brand-light" : "bg-brand-steel/50 border border-dashed border-brand-dark/20 text-brand-gray/60 hover:border-brand-rust/50 hover:text-brand-rust"}`}>
                            {p.can_create ? <Check className="w-2.5 h-2.5" /> : "C"}
                          </button>
                        </td>
                        <td className="py-1.5 pr-3 text-center">
                          <button onClick={() => toggleUserPerm(r.key, "can_modify")} className={`w-6 h-6 flex items-center justify-center rounded-sm border text-[8px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${p.can_modify ? "bg-brand-rust border-brand-rust text-brand-light" : "bg-brand-steel/50 border border-dashed border-brand-dark/20 text-brand-gray/60 hover:border-brand-rust/50 hover:text-brand-rust"}`}>
                            {p.can_modify ? <Check className="w-2.5 h-2.5" /> : "M"}
                          </button>
                        </td>
                        <td className="py-1.5 text-center">
                          <button onClick={() => toggleUserPerm(r.key, "can_delete")} className={`w-6 h-6 flex items-center justify-center rounded-sm border text-[8px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${p.can_delete ? "bg-brand-rust border-brand-rust text-brand-light" : "bg-brand-steel/50 border border-dashed border-brand-dark/20 text-brand-gray/60 hover:border-brand-rust/50 hover:text-brand-rust"}`}>
                            {p.can_delete ? <Check className="w-2.5 h-2.5" /> : "S"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button onClick={handleSave} disabled={!dirty} className={`inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest font-bold px-5 py-3 rounded-sm transition-all cursor-pointer ${dirty ? "bg-brand-rust text-brand-light hover:brightness-110" : "bg-brand-steel text-brand-gray/50 cursor-not-allowed"}`}>
              <Save className="w-3.5 h-3.5" />
              Enregistrer
            </button>
            {dirty && <span className="font-mono text-[10px] text-brand-rust">Modifications non enregistrées</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h2 className="font-display text-2xl uppercase tracking-wide text-brand-dark mb-6">Gestion des comptes</h2>

      <div className="space-y-2">
        {comptes.map((c) => (
          <button key={c.id} onClick={() => openEdit(c)} className="w-full flex items-center gap-4 p-4 bg-brand-steel/30 border border-brand-dark/10 hover:border-brand-rust/50 transition-colors rounded-sm text-left cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-brand-dark/5 border border-brand-dark/10 flex items-center justify-center shrink-0">
              {c.role === "admin" ? <Shield className="w-5 h-5 text-brand-rust/60" /> : <UserIcon className="w-5 h-5 text-brand-gray/50" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm text-brand-dark font-bold truncate">{c.name}</p>
              <p className="font-mono text-[10px] text-brand-gray truncate">{c.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${c.role === "admin" ? "bg-brand-rust/10 text-brand-rust border border-brand-rust/30" : "bg-brand-steel border border-brand-dark/10 text-brand-dark/60"}`}>
                {c.role === "admin" ? "Admin" : "Artiste"}
              </span>
              {c.artist_id && (
                <span className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-brand-steel/50 border border-dashed border-brand-dark/20 text-brand-gray rounded-sm flex items-center gap-1">
                  <Paintbrush className="w-2.5 h-2.5" />
                  {ARTISTS.find((a) => a.id === c.artist_id)?.name || c.artist_id}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
