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
- **Pages admin plein écran** (remplacent tout le contenu) activées par hash : `#media` → `MediaLibrary`, `#hero` → `HeroEdit`, `#admin-actualites` → `ActualitesEdit`. Désactivent le scroll listener.
- **Auth** : `src/context/AuthContext.tsx` — login via `POST /api/auth/login`. Token UUID stocké dans `localStorage`, **aucune validation côté serveur** des requêtes suivantes.
- **Formulaire de contact** factice : simule un envoi, pas de backend email.
- **`GEMINI_API_KEY` et `@google/genai`** installés mais **inactifs** dans le code.
- **HMR contrôlé** : la variable `DISABLE_HMR=true` désactive HMR et le watching (utile en AI Studio). `watch.ignored` couvre `server/media/` et `morinerie.db*`.
- **Alias `@`** → racine du projet, pas `src/`.

---

## API Backend

Fichier : `server/index.cjs`. Routes :

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Authentification |
| GET/PUT | `/api/content/:key` | Lire/sauvegarder contenu partagé |
| GET | `/api/media` | Lister médias et dossiers |
| POST | `/api/media/upload` | Upload image (base64) |
| POST | `/api/media/folder` | Créer dossier |
| POST | `/api/media/move` | Déplacer fichier |
| DELETE | `/api/media/:filename` | Supprimer fichier |
| DELETE | `/api/media/folder/:folder` | Supprimer dossier vide |
| GET | `/api/health` | Health check |

**DB** : `morinerie.db` (WAL), tables `users` et `contents`. **Seed auto** si table `users` vide :
- Admin : `admin@morinerie.art` / `admin123`
- 4 artistes : mot de passe `artiste123` (voir `server/db.cjs`)

Uploads rangés par user : `server/media/users/<userId>/`. Noms originaux dans `.filenames.json`.

---

## Bugs résolus

1. **Sauvegarde admin → navigation intempestive** : après "Enregistrer" dans `ActualitesEdit` ou `HeroEdit`, l'utilisateur était redirigé vers le slider home au lieu de rester sur la page admin. Corrigé.
2. **WysiwygEditor se ferme à la première frappe** dans `ActualitesEdit` : `onChange` était appelé à chaque input et fermait aussi l'éditeur. Corrigé.

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
