# La Morinerie — Guide pour agents OpenCode

**Stack :** React 19 · TypeScript · Vite 6 · Tailwind v4 · Framer Motion (`motion/react`) · Lucide React · Express 4 · SQLite (better-sqlite3) · bcryptjs · react-hot-toast

---

## Commandes

| Commande | Action |
|---|---|
| `npm run dev` | Express (3001) + Vite (3000) en parallèle |
| `npm run dev:api` | Express seul |
| `npm run dev:client` | Vite seul |
| `npm run build` | Build Vite → `dist/` |
| `npm run lint` | `tsc --noEmit` (exclut `server/**/*.cjs`) |
| `npm run clean` | `rm -rf dist server.js` |

**Pas de tests** — Aucun runner. Ne pas chercher à en lancer.

---

## Architecture (retenir ça, le code fait le reste)

- **SPA sans routeur.** Navigation par `useState` + ancres HTML (`#lieu`, `#artistes`, …) + `window.scrollTo`. Pas de `react-router-dom`.
- **Vite proxie `/api` et `/media`** vers Express (port 3001). Les deux écouteurs sont sur `0.0.0.0`.
- **Backend CommonJS** (`.cjs`) — pas transpilé, exclu de `tsc`.
- **Données statiques** dans `src/data.ts` (`HANGARS`, `ARTISTS`, `TIMELINE`, `NEWS_ITEMS`). Source de vérité par défaut.
- **Persistance client** : `localStorage` (clés préfixées `morinerie_*`). **Persistance serveur** : SQLite via `PUT /api/content/:key`.
- **Édition inline** : `InlineEdit`, `ImageEdit`, `SliderEdit` écrivent d'abord dans `localStorage`, puis `PUT /api/content/:key` pour synchronisation.
- **Pages admin plein écran** (remplacent tout le contenu) activées par hash : `#media` → `MediaLibrary`, `#hero` → `HeroEdit`, etc. Désactivent le scroll listener.
- **Auth** : `src/context/AuthContext.tsx` — login via `POST /api/auth/login`. Token UUID stocké dans `localStorage`, **aucune validation côté serveur** des requêtes suivantes.
- **Formulaire de contact** factice : simule un envoi, pas de backend email.
- **`GEMINI_API_KEY` et `@google/genai`** installés mais **inactifs** dans le code.
- **HMR contrôlé** : la variable `DISABLE_HMR=true` désactive HMR et le watching (utile en AI Studio). `watch.ignored` couvre `server/media/` et `morinerie.db*`.
- **Alias `@`** → racine du projet, pas `src/`.

---

## Structure des dossiers (refactoré le 2026-07-01)

```
src/
├── admin-core/              # Composants réutilisables (portables entre projets)
│   ├── AdminLayout.tsx       # Layout admin : sidebar + navbar + breadcrumb + toaster
│   ├── InlineEdit.tsx        # Édition inline au survol (texte, wysiwyg)
│   ├── ImageEdit.tsx         # Édition image (URL + upload)
│   ├── ImagePicker.tsx       # Picker média (URL / upload / médiathèque)
│   ├── SliderEdit.tsx        # Slider images avec DnD et lightbox
│   ├── MediaLibrary.tsx      # Médiathèque complète (upload, dossiers, DnD)
│   ├── WysiwygEditor.tsx     # Éditeur HTML contentEditable
│   ├── TagEditor.tsx         # Éditeur de tags
│   ├── AdminBreadcrumb.tsx   # Fil d'ariane admin
│   └── EditContext.tsx       # Contexte d'édition (bloque le scroll)
│
├── admin/                    # Pages site-specific (dépendent du design La Morinerie)
│   ├── AdminSidebar.tsx      # Menu latéral avec accordéon et notifications
│   ├── HeroEdit.tsx          # Éditeur diaporama (exporte HeroSlide et fonctions)
│   ├── ActualitesEdit.tsx    # CRUD actualités
│   ├── ArtistSliderEdit.tsx  # Espace artiste (slides + blog + tags)
│   ├── ArtistBlogEdit.tsx    # Blog d'artiste
│   ├── GestionComptes.tsx    # CRUD utilisateurs
│   ├── GestionGroupes.tsx    # Groupes et permissions
│   ├── GestionTags.tsx       # Gestion du pool global de tags
│   └── MonCompte.tsx         # Profil utilisateur
│
├── components/              # Composants publics (vitrine)
├── context/                 # AuthContext
├── utils/                   # Utilitaires
└── App.tsx                  # ~724 lignes, switch routing
```

---

## API Backend

Fichier : `server/index.cjs`. Routes :

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Authentification |
| GET | `/api/auth/users` | Liste des utilisateurs |
| PUT | `/api/auth/users/:id` | Modifier un utilisateur |
| GET/PUT | `/api/content/:key` | Lire/sauvegarder contenu partagé |
| GET | `/api/media` | Lister médias et dossiers |
| POST | `/api/media/upload` | Upload image (base64) |
| POST | `/api/media/folder` | Créer dossier |
| POST | `/api/media/move` | Déplacer fichier |
| DELETE | `/api/media/:filename` | Supprimer fichier |
| DELETE | `/api/media/folder/:folder` | Supprimer dossier vide |
| GET/POST/PUT/DELETE | `/api/groups` | CRUD groupes |
| GET/PUT | `/api/groups/:id/permissions` | Droits des groupes |
| GET/POST/DELETE | `/api/users/:userId/groups` | Assignation user ↔ groupe |
| GET/PUT | `/api/users/:userId/permissions` | Droits utilisateur (surcouche) |
| GET | `/api/users/:userId/effective` | Droits fusionnés groupe + user |
| GET | `/api/health` | Health check |

**DB** : `morinerie.db` (WAL), tables `users`, `contents`, `groups`, `group_permissions`, `user_groups`, `user_permissions`. **Seed auto** si table `users` vide :
- Admin : `admin@morinerie.art` / `admin123`
- 4 artistes : mot de passe `artiste123` (voir `server/db.cjs`)

Uploads rangés par user : `server/media/users/<userId>/`. Noms originaux dans `.filenames.json`.

---

## Mode démo

Actif via `VITE_DEMO_MODE=true` dans `.env` (fichier à créer). Active le flag `demoMode` dans `src/utils/demo.ts`.

Effets :
- Bloque les hash URLs admin (`#media`, `#hero`, …) dès le state initial de App.tsx
- Bloque toute navigation vers les sections admin dans `handleNavigate()`
- Cache le lien « Connexion Admin / Artiste » dans le footer
- Cache la section Plan (HangarMap) + bouton + lien footer
- Tree-shake : Vite retire tout le code admin mort du bundle

---

## Refactoring — 2026-07-01

### Composants admin réutilisables

Les composants `src/admin-core/` sont indépendants du thème La Morinerie. Pour les réutiliser sur un autre projet :

```tsx
import AdminLayout from "./admin-core/AdminLayout";
import InlineEdit from "./admin-core/InlineEdit";
import MediaLibrary from "./admin-core/MediaLibrary";
```

`AdminLayout` prend : `section`, `breadcrumbLabel`, `children`, `showToaster?`, `onNavigate`, `isProMode`, `onToggleProMode`, `lastFrontend`.

### Routing

App.tsx utilise un `switch (activeSection)` au lieu de 9 blocs `if/return`. Réduit de 878 à 724 lignes.

---

## Bugs résolus

1. **Sauvegarde admin → navigation intempestive** : après "Enregistrer" dans `ActualitesEdit` ou `HeroEdit`, l'utilisateur était redirigé vers le slider home au lieu de rester sur la page admin. Corrigé.
2. **WysiwygEditor se ferme à la première frappe** dans `ActualitesEdit` : `onChange` était appelé à chaque input et fermait aussi l'éditeur. Corrigé.
3. **Serveur Express : `uuid` ESM → CJS** : `uuid@14` est ESM-only et cassait `require()`. Remplacé par `crypto.randomUUID()` natif de Node dans `db.cjs`, `auth.cjs`, `media.cjs`, `permissions.cjs`. `uuid` retiré du `package.json`.

---

## Conventions repo

- **Tous les textes UI en français.**
- Pas de modules CSS — Tailwind uniquement. Thème dans `src/index.css` via `@theme`.
- Icônes : imports individuels depuis `lucide-react`.
- `try/catch` + `console.error` autour des parsings localStorage et appels API (pas de gestion d'erreur réseau explicite).
- Mode admin visible : badge "Admin" rouille, bordure gauche, sidebar accordéon, breadcrumb.
- **Pas de dépôt Git** — `git init` n'a pas été fait.

---

## Pipeline image (upload)

1. Frontend compresse côté client (`imageOptimizer.ts`) : > 10 Mo → redimensionne à 2048px max.
2. Envoi base64 → `POST /api/media/upload` avec `userId`.
3. Serveur accepte JSON jusqu'à 50 Mo, limite les types à `image/png,image/jpeg,image/webp,image/gif`.
4. Sécurité : `safePath()` évite les traversées de répertoire.
