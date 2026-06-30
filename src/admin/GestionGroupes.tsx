import { useState, useEffect } from "react";
import { Save, Plus, Trash2, X, Shield, Users, Check, User as UserIcon } from "lucide-react";
import { toast } from "../utils/toast";

interface Permission {
  id: string;
  resource: string;
  can_create: number;
  can_modify: number;
  can_delete: number;
}

interface Group {
  id: string;
  name: string;
  role: string;
  permissions: Permission[];
  memberCount: number;
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

function PermCheckbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => onChange(!checked)} className={`w-7 h-7 flex items-center justify-center rounded-sm border text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${checked ? "bg-brand-rust border-brand-rust text-brand-light" : "bg-brand-steel/50 border border-dashed border-brand-dark/20 text-brand-gray/60 hover:border-brand-rust/50 hover:text-brand-rust"}`} title={label}>
      {checked ? <Check className="w-3 h-3" /> : label[0]}
    </button>
  );
}

export default function GestionGroupes() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "artiste">("artiste");
  const [showNew, setShowNew] = useState(false);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups");
      if (res.ok) setGroups(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadGroups(); }, []);

  const createGroup = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), role: newRole }),
      });
      if (res.ok) {
        const g = await res.json();
        setGroups((prev) => [...prev, g]);
        setNewName("");
        setShowNew(false);
        toast.success(`Groupe "${g.name}" créé`);
      } else {
        const err = await res.json().catch(() => ({ error: "Erreur serveur" }));
        toast.error(err.error || "Erreur lors de la création");
      }
    } catch {
      toast.error("Impossible de contacter le serveur");
    }
  };

  const updateGroupPerms = async (groupId: string, permissions: Permission[]) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });
      if (res.ok) {
        setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, permissions } : g)));
        toast.success("Permissions mises à jour");
      }
    } catch {}
  };

  const deleteGroup = async (groupId: string) => {
    try {
      await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      toast.success("Groupe supprimé");
    } catch {}
  };

  const togglePerm = (group: Group, resource: string, field: "can_create" | "can_modify" | "can_delete") => {
    const updated = group.permissions.map((p) =>
      p.resource === resource ? { ...p, [field]: p[field] ? 0 : 1 } : p
    );
    updateGroupPerms(group.id, updated);
  };

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-8"><p className="font-mono text-sm text-brand-gray">Chargement...</p></div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl uppercase tracking-wide text-brand-dark">Groupes &amp; Permissions</h2>
        <button onClick={() => setShowNew(!showNew)} className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest font-bold px-4 py-2.5 bg-brand-rust text-brand-light hover:brightness-110 rounded-sm transition-all cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
          Nouveau groupe
        </button>
      </div>

      {/* New group form */}
      {showNew && (
        <div className="mb-6 p-4 bg-brand-steel/30 border border-brand-dark/10 rounded-sm flex items-end gap-3">
          <div className="flex-1">
            <label className="block font-mono text-[10px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Nom du groupe</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createGroup()} placeholder="Ex: Contributeurs" className="w-full bg-brand-light border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2 rounded-sm focus:outline-none focus:border-brand-rust transition-colors" />
          </div>
          <div>
            <label className="block font-mono text-[10px] text-brand-gray uppercase tracking-widest font-bold mb-1.5">Rôle cible</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as "admin" | "artiste")} className="bg-brand-light border border-brand-dark/10 text-brand-dark font-sans text-sm px-4 py-2 rounded-sm focus:outline-none focus:border-brand-rust transition-colors">
              <option value="artiste">Artiste</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button onClick={createGroup} className="px-4 py-2 bg-brand-rust text-brand-light font-mono text-[10px] uppercase tracking-widest font-bold rounded-sm hover:brightness-110 transition-all cursor-pointer">
            Créer
          </button>
          <button onClick={() => setShowNew(false)} className="p-2 text-brand-gray/50 hover:text-brand-dark cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Groups list */}
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.id} className="border border-brand-dark/10 rounded-sm bg-brand-light">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-brand-dark/5 bg-brand-steel/20">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-brand-rust/60" />
                <div>
                  <p className="font-display font-bold text-base text-brand-dark">{group.name}</p>
                  <p className="font-mono text-[9px] text-brand-gray flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${group.role === "admin" ? "bg-brand-rust/10 text-brand-rust" : "bg-brand-steel text-brand-dark/60"}`}>{group.role === "admin" ? "Admin" : "Artiste"}</span>
                    <Users className="w-3 h-3" />
                    {group.memberCount} membre{group.memberCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              {group.name !== "Super Admin" && (
                <button onClick={() => deleteGroup(group.id)} className="text-brand-gray/40 hover:text-red-500 transition-colors cursor-pointer p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Permissions grid */}
            <div className="p-5">
              <p className="font-mono text-[11px] text-brand-gray uppercase tracking-widest font-bold mb-3">Permissions</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="font-mono text-[10px] text-brand-gray/60 uppercase tracking-wider">
                      <th className="pb-2 pr-4 font-normal">Ressource</th>
                      <th className="pb-2 pr-4 font-normal text-center">Créer</th>
                      <th className="pb-2 pr-4 font-normal text-center">Modifier</th>
                      <th className="pb-2 font-normal text-center">Supprimer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RESOURCES.map((r) => {
                      const perm = group.permissions.find((p) => p.resource === r.key);
                      return (
                        <tr key={r.key} className="border-t border-brand-dark/5">
                          <td className="py-2 pr-4 font-mono text-[11px] text-brand-dark font-medium">{r.label}</td>
                          <td className="py-2 pr-4 text-center"><PermCheckbox checked={!!perm?.can_create} onChange={(v) => togglePerm(group, r.key, "can_create")} label="C" /></td>
                          <td className="py-2 pr-4 text-center"><PermCheckbox checked={!!perm?.can_modify} onChange={(v) => togglePerm(group, r.key, "can_modify")} label="M" /></td>
                          <td className="py-2 text-center"><PermCheckbox checked={!!perm?.can_delete} onChange={(v) => togglePerm(group, r.key, "can_delete")} label="S" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
