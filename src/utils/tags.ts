import { ARTISTS } from "../data";

const ACTU_STORAGE_KEY = "morinerie_actualites";
const GLOBAL_TAGS_KEY = "morinerie_global_tags";

export function getDisciplines(artistId: string): string[] {
  try {
    const saved = localStorage.getItem(`morinerie_artist_disciplines_${artistId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  const artist = ARTISTS.find((a) => a.id === artistId);
  return artist?.discipline ? [artist.discipline.toUpperCase()] : [];
}

export function saveDisciplines(artistId: string, tags: string[]) {
  localStorage.setItem(`morinerie_artist_disciplines_${artistId}`, JSON.stringify(tags));
  fetch(`/api/content/morinerie_artist_disciplines_${artistId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: JSON.stringify(tags) }),
  }).catch(() => {});
}

export function getGlobalTagPool(): string[] {
  try {
    const saved = localStorage.getItem(GLOBAL_TAGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveGlobalTagPool(tags: string[]) {
  localStorage.setItem(GLOBAL_TAGS_KEY, JSON.stringify(tags));
  fetch("/api/content/morinerie_global_tags", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: JSON.stringify(tags) }),
  }).catch(() => {});
}

export function getAllGlobalTags(): string[] {
  const set = new Set<string>();

  // Global tag pool
  getGlobalTagPool().forEach((t) => set.add(t));

  // Static artist tags
  ARTISTS.forEach((a) => {
    if (a.tags) a.tags.forEach((t) => set.add(t.toUpperCase()));
  });

  // Per-artist stored tags + works + blog
  ARTISTS.forEach((a) => {
    try {
      const saved = localStorage.getItem(`morinerie_artist_tags_${a.id}`);
      if (saved) { const p = JSON.parse(saved); if (Array.isArray(p)) p.forEach((t: string) => set.add(t)); }
    } catch {}
    try {
      const wt = localStorage.getItem(`morinerie_artist_works_${a.id}`);
      if (wt) { const p = JSON.parse(wt); if (Array.isArray(p)) p.forEach((x: any) => { if (x.tags) x.tags.forEach((t: string) => set.add(t)); }); }
    } catch {}
    try {
      const bp = localStorage.getItem(`morinerie_artist_blog_${a.id}`);
      if (bp) { const p = JSON.parse(bp); if (Array.isArray(p)) p.forEach((x: any) => { if (x.tags) x.tags.forEach((t: string) => set.add(t)); }); }
    } catch {}
  });

  // Custom tags from pro mode
  try {
    const ct = localStorage.getItem("morinerie_custom_artist_tags");
    if (ct) { const p = JSON.parse(ct); Object.values(p).forEach((arr: any) => { if (Array.isArray(arr)) arr.forEach((t: string) => set.add(t)); }); }
  } catch {}

  // News / actualites
  try {
    const saved = localStorage.getItem(ACTU_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) parsed.forEach((item: any) => { if (item.tags) item.tags.forEach((t: string) => set.add(t)); });
    }
  } catch {}

  return Array.from(set);
}
