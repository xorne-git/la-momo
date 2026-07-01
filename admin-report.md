# La Morinerie — Rapport d'Administration

## Problèmes Résolus

### Bug Critique : Sauvegarde → Navigation vers la home

**Statut : corrigé** (avant refacto)

**Comportement** : Après avoir cliqué "Enregistrer" dans l'éditeur admin des Actualités ou du Diaporama, l'utilisateur était redirigé vers le slider de la page d'accueil, au lieu de rester sur la page admin.

**Investigations menées** :
- Testé avec `alert()` uniquement → pas de bug ⇒ le problème vient du contenu de `handleSave`
- Testé avec `saveActus()` + `setPending()` sans état React → bug toujours présent
- Testé en différant la requête API PUT de 2s (pour éviter HMR) → bug toujours présent
- Hypothèse Vite HMR/database write écartée (le localStorage seul suffisait à déclencher le bug)

**Pistes explorées** :
- `setPending()` écrit dans localStorage, ce qui pourrait être détecté par quelque chose
- Le scroll handler d'App.tsx pourrait changer `activeSection` lors du re-render
- Problème de race condition entre l'état React local et le parent App.tsx

**Solution de contournement** : L'édition inline (InlineEdit/ImageEdit sur "Le Lieu") et la médiathèque fonctionnaient correctement. Seuls les éditeurs en page dédiée (ActualitesEdit, HeroEdit) avaient ce bug.

### Bug : WysiwygEditor se ferme à la première frappe

**Statut : corrigé** (avant refacto)

L'éditeur avancé dans ActualitesEdit se fermait dès qu'on tapait un caractère car `onChange` était appelé sur chaque input et fermait aussi l'éditeur. Une prop `onSave` séparée existait mais n'était pas utilisée correctement par le parent.

### Bug : Serveur Express — uuid ESM → CJS

**Statut : corrigé** (2026-07-01)

`uuid@14` est ESM-only et cassait `require()` dans les fichiers CommonJS du serveur. Remplacé par `crypto.randomUUID()` natif de Node.js (disponible depuis Node 14.17+) dans :
- `server/db.cjs`
- `server/routes/auth.cjs`
- `server/routes/media.cjs`
- `server/routes/permissions.cjs`

`uuid` et `@types/uuid` retirés du `package.json`.

---

## Fonctionnalités Implémentées

### ✅ Mode démo (2026-07-01)

- Création de `src/utils/demo.ts` — flag `demoMode` via `VITE_DEMO_MODE`
- `.env` avec `VITE_DEMO_MODE=true`
- Blocage des hash URLs admin dans App.tsx
- Blocage de la navigation vers les pages admin dans `handleNavigate()`
- Caché du lien « Connexion Admin / Artiste » dans le footer
- Caché de la section Plan (HangarMap + bouton + lien footer)
- Tree-shaking complet du code admin par Vite en production

### ✅ Déploiement (2026-07-01)

- Copie du projet vers `/var/www/xorne/la-morinerie/`
- Build de production
- Installation et configuration du certificat HTTPS (Let's Encrypt via Certbot)
- Service systemd `la-morinerie-api.service` pour Express
- Vhost Apache avec proxy `/api` et `/media` → Express

### ✅ Refactoring structurel (2026-07-01)

- Création de `src/admin-core/` — 10 composants réutilisables (AdminLayout, InlineEdit, ImageEdit, ImagePicker, SliderEdit, MediaLibrary, WysiwygEditor, TagEditor, AdminBreadcrumb, EditContext)
- Migration de `src/admin/` vers les nouveaux chemins (14 fichiers modifiés)
- Création de `AdminLayout.tsx` — wrapper admin unique qui élimine ~100 lignes de duplication dans App.tsx
- App.tsx : passage de 9 blocs `if/return` à un `switch` unique (878 → 724 lignes)

---

## Problèmes Non Résolus

Aucun pour le moment.

---

## Technologies Utilisées

| Technologie | Version | Usage |
|---|---|---|
| React | 19 | UI Framework |
| TypeScript | ~5.8 | Typage |
| Vite | 6 | Build/Dev Server |
| Tailwind CSS | 4 | Styles atomiques |
| Framer Motion (motion) | 12 | Animations |
| Lucide React | Dernière | Icônes |
| Express | 4 | API backend |
| better-sqlite3 | Latest | Base SQLite |
| bcryptjs | Latest | Hash mots de passe |
| react-hot-toast | 2.x | Notifications |

---

## Fonctionnalités Implémentées

### Admin Système
- [x] Authentification admin/artiste via API Express + SQLite
- [x] AuthContext avec localStorage pour session persistée
- [x] Seed users : admin@morinerie.art + 4 artistes
- [x] AdminSidebar avec accordéon, collapse icons-only, hover-to-expand
- [x] AdminBreadcrumb pour les pages admin
- [x] Badge admin (bas droite) + bordure gauche fine
- [x] Pages admin protégées par rôle
- [x] Gestion des groupes et permissions granulaires (14 ressources)
- [x] Gestion des comptes utilisateurs

### Édition de Contenu
- [x] WysiwygEditor (contentEditable, zéro dépendance)
- [x] InlineEdit (wrapper édition au survol)
- [x] ImageEdit (URL + upload fichier)
- [x] ImagePicker (composant réutilisable URL/Upload/Médiathèque)
- [x] SliderEdit (images du Lieu avec DnD, lightbox)
- [x] HeroEdit (diaporama avec liste/édition, ajout/suppression)
- [x] ActualitesEdit (actualités avec liste/édition, ajout/suppression)
- [x] ArtistSliderEdit (espace artiste : slides, blog, tags)
- [x] Gestion des tags (pool global)

### Médiathèque
- [x] Upload fichier avec compression automatique (> 10 Mo → redimensionné)
- [x] Upload par URL (téléchargement distant)
- [x] Dossiers (création, navigation breadcrumb)
- [x] Drag & drop entre dossiers
- [x] Lightbox plein écran avec navigation ← →
- [x] Noms originaux des fichiers conservés
- [x] Affichage résolution/poids au rollover
- [x] Stockage par utilisateur (`server/media/users/{userId}/`)
- [x] Limite 32 Mo côté client

### Notifications Utilisateur
- [x] Système pendingMsg (localStorage) → PendingMessageDisplay
- [x] Affichage en haut de page, disparition après 3s
- [x] Icônes succès/erreur/info
- [x] Utilisé pour save/add/delete dans les éditeurs

### Front Public
- [x] Hero diaporama (4 slides animés)
- [x] Galerie artistes avec recherche/filtre
- [x] Carte interactive Hangar avec spotlight artist
- [x] Timeline historique 1920-2026
- [x] Actualités carousel
- [x] Portes Ouvertes avec programme
- [x] Formulaire de contact (simulation)
- [x] Design responsive mobile/desktop
- [x] Mode "pro" toggle
- [x] Mode démo (VITE_DEMO_MODE)

---

## Structure des Fichiers (refacto 2026-07-01)

```
src/
├── admin-core/              # Composants réutilisables (portables)
│   ├── AdminLayout.tsx       # Layout admin (sidebar + navbar + breadcrumb + toaster)
│   ├── AdminBreadcrumb.tsx   # Fil d'ariane
│   ├── InlineEdit.tsx        # Édition texte inline
│   ├── ImageEdit.tsx         # Édition image inline
│   ├── ImagePicker.tsx       # Composant picker réutilisable
│   ├── SliderEdit.tsx        # Édition images du Lieu
│   ├── MediaLibrary.tsx      # Médiathèque complète
│   ├── WysiwygEditor.tsx     # Éditeur HTML
│   ├── TagEditor.tsx         # Éditeur de tags
│   └── EditContext.tsx       # Contexte d'édition
│
├── admin/                    # Pages site-specific
│   ├── AdminSidebar.tsx      # Menu latéral
│   ├── HeroEdit.tsx          # Éditeur diaporama
│   ├── ActualitesEdit.tsx    # Éditeur actualités
│   ├── ArtistSliderEdit.tsx  # Espace artiste
│   ├── ArtistBlogEdit.tsx    # Blog artiste
│   ├── GestionComptes.tsx    # Gestion des comptes
│   ├── GestionGroupes.tsx    # Groupes & droits
│   ├── GestionTags.tsx       # Tags
│   └── MonCompte.tsx         # Profil utilisateur
│
├── components/              # Composants publics
│   ├── PendingMessageDisplay.tsx
│   └── AdminBadge.tsx
│
├── context/
│   └── AuthContext.tsx       # Contexte authentification
│
└── utils/
    ├── demo.ts               # Flag mode démo
    ├── pendingMsg.ts          # Système notification localStorage
    ├── toast.ts               # Ancien toast DOM (non utilisé)
    ├── imageOptimizer.ts      # Compression d'images
    ├── tags.ts                # Gestion des tags
    └── sortNews.ts            # Tri des actualités
```

---

## Points Techniques Notables

- **Media upload** : toujours avec `userId` dans le body pour routage serveur
- **`setPending()`** : écrit dans localStorage pour survivre aux re-renders
- **`PendingMessageDisplay`** : polling 500ms quand aucun message affiché
- **`ImagePicker`** : auto-upload vers `/api/media/upload` avec userId
- **Images > 10 Mo** : redimensionnées à 2048px max, qualité ajustée
- **Images < 10 Mo** : qualité 0.95, pas de perte visible, EXIF supprimé
- **Noms originaux** : stockés dans `server/media/.filenames.json`
- **AdminLayout** : prend `section`, `breadcrumbLabel`, `children`, `showToaster?`, `onNavigate`, `isProMode`, `onToggleProMode`, `lastFrontend`
- **Routing App.tsx** : switch sur `activeSection` au lieu de 9 if/return
- **`crypto.randomUUID()`** : remplace `uuid` pour compatibilité CJS
