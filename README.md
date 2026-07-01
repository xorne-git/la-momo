# Les Ateliers de la Morinerie

Site vitrine du collectif d'artistes de Saint-Pierre-des-Corps, installé dans les anciens hangars SNCF.

**[la-morinerie.moondogs.fr](https://la-morinerie.moondogs.fr)**

---

## Stack

**Frontend** : React 19 · TypeScript · Vite 6 · Tailwind v4 · Framer Motion · Lucide React
**Backend** : Express 4 · SQLite (better-sqlite3) · bcryptjs
**Auth** : Login par email/mot de passe, token UUID stocké localStorage (pas de validation côté serveur)

## Commandes

```bash
npm run dev        # Express (3001) + Vite (3000) en parallèle
npm run dev:api    # Express seul
npm run dev:client # Vite seul
npm run build      # Build Vite → dist/
npm run lint       # tsc --noEmit (exclut server/**/*.cjs)
npm run clean      # rm -rf dist server.js
```

## Structure du projet

```
src/
├── admin-core/          # Composants admin réutilisables (portables)
│   ├── AdminLayout.tsx   # Layout admin unique (sidebar + navbar + breadcrumb)
│   ├── InlineEdit.tsx    # Édition inline au survol
│   ├── ImageEdit.tsx     # Édition image (URL + upload)
│   ├── ImagePicker.tsx   # Picker média réutilisable (URL/upload/médiathèque)
│   ├── SliderEdit.tsx    # Slider d'images avec DnD
│   ├── MediaLibrary.tsx  # Médiathèque complète
│   ├── WysiwygEditor.tsx # Éditeur HTML contentEditable
│   ├── TagEditor.tsx     # Éditeur de tags
│   ├── AdminBreadcrumb.tsx
│   ├── EditContext.tsx
│   └── ...
├── admin/               # Pages admin site-specific
│   ├── AdminSidebar.tsx
│   ├── HeroEdit.tsx
│   ├── ActualitesEdit.tsx
│   ├── ArtistSliderEdit.tsx
│   ├── ArtistBlogEdit.tsx
│   ├── GestionComptes.tsx
│   ├── GestionGroupes.tsx
│   ├── GestionTags.tsx
│   └── MonCompte.tsx
├── components/          # Composants publics
├── context/             # AuthContext
├── utils/               # Utilitaires (pendingMsg, tags, demo, sortNews…)
├── data.ts              # Données statiques (artistes, hangars, timeline…)
├── types.ts             # Types TypeScript
└── App.tsx              # Point d'entrée — routing par switch + sections
```

## Architecture

- **SPA sans routeur** — navigation par `useState` + ancres HTML + `window.scrollTo`
- **Dashboard admin** — 9 pages protégées par rôle, routées par switch dans App.tsx
- **Persistance** : `localStorage` (immédiat) ↔ `PUT /api/content/:key` (synchro serveur)
- **Édition inline** : InlineEdit/ImageEdit/SliderEdit → localStorage + API différée (2s debounce)
- **Auth** : `POST /api/auth/login` → token UUID stocké localStorage
- **Contact** : simulation côté frontend uniquement

## Mode démo

Active via `VITE_DEMO_MODE=true` dans `.env` :
- Bloque toute navigation vers les pages admin
- Cache le lien « Connexion Admin » dans le footer
- Cache la section Plan (HangarMap)
- Tree-shake complet du code admin dans le bundle de production
