# La Morinerie — Rapport d'Administration

## Problèmes Non Résolus

### Bug Critique : Sauvegarde → Navigation vers la home

**Comportement** : Après avoir cliqué "Enregistrer" dans l'éditeur admin des Actualités ou du Diaporama, l'utilisateur est redirigé vers le slider de la page d'accueil, au lieu de rester sur la page admin.

**Investigations menées** :
- Testé avec `alert()` uniquement → pas de bug ⇒ le problème vient du contenu de `handleSave`
- Testé avec `saveActus()` + `setPending()` sans état React → bug toujours présent
- Testé en différant la requête API PUT de 2s (pour éviter HMR) → bug toujours présent
- Hypothèse Vite HMR/database write écartée (le localStorage seul suffit à déclencher le bug)

**Pistes restantes** :
- `setPending()` écrit dans localStorage, ce qui pourrait être détecté par quelque chose
- Le scroll handler d'App.tsx pourrait changer `activeSection` lors du re-render
- Problème de race condition entre l'état React local et le parent App.tsx

**Solution de contournement** : L'édition inline (InlineEdit/ImageEdit sur "Le Lieu") et la médiathèque fonctionnent correctement. Seuls les éditeurs en page dédiée (ActualitesEdit, HeroEdit) ont ce bug.

➡️ **Bloquant** : Sauvegarder un formulaire depuis une page admin dédiée (ActualitesEdit, HeroEdit) et revenir automatiquement sur l'index (liste des contenus) sans être redirigé vers le slider home. Le `setEditingIndex(null)` censé faire le retour à l'index déclenche une navigation inattendue.

### Bug : WysiwygEditor se ferme à la première frappe
L'éditeur avancé dans ActualitesEdit se ferme dès qu'on tape un caractère car `onChange` est appelé sur chaque input mais ferme aussi l'éditeur. Une prop `onSave` séparée existe mais n'est pas utilisée correctement par le parent.

---

## Technologies Utilisées

| Technologie | Version | Usage |
|---|---|---|
| React | 19 | UI Framework |
| TypeScript | ~5.7 | Typage |
| Vite | 6 | Build/Dev Server |
| Tailwind CSS | 4 | Styles atomiques |
| Framer Motion (motion) | 12 | Animations |
| Lucide React | Dernière | Icônes |
| Express | 4 | API backend |
| better-sqlite3 | Latest | Base SQLite |
| bcryptjs | Latest | Hash mots de passe |
| react-hot-toast | 2.x | Notifications (utilisé dans HeroEdit monté) |

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

### Édition de Contenu
- [x] WysiwygEditor (contentEditable, zéro dépendance)
- [x] InlineEdit (wrapper édition au survol)
- [x] ImageEdit (URL + upload fichier)
- [x] ImagePicker (composant réutilisable URL/Upload/Médiathèque)
- [x] SliderEdit (images du Lieu avec DnD, lightbox)
- [x] HeroEdit (diaporama avec liste/édition, ajout/suppression)
- [x] ActualitesEdit (actualités avec liste/édition, ajout/suppression)

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

---

## Structure des Fichiers Admin

```
src/admin/
├── AdminBreadcrumb.tsx      — Fil d'ariane
├── AdminSidebar.tsx          — Menu latéral
├── ImageEdit.tsx             — Édition image inline
├── ImagePicker.tsx           — Composant picker réutilisable
├── InlineEdit.tsx            — Édition texte inline
├── MediaLibrary.tsx          — Médiathèque complète
├── SliderEdit.tsx            — Édition images du Lieu
├── WysiwygEditor.tsx         — Éditeur HTML
├── HeroEdit.tsx              — Éditeur diaporama
└── ActualitesEdit.tsx        — Éditeur actualités

src/context/
├── AuthContext.tsx            — Contexte authentification
└── ToastContext.tsx           — Ancien toast (non utilisé)

src/utils/
├── pendingMsg.ts             — Système de notification localStorage
├── toast.ts                  — Ancien toast DOM (non utilisé)
└── imageOptimizer.ts         — Compression d'images

src/components/
├── PendingMessageDisplay.tsx  — Affichage notifications
└── AdminBadge.tsx             — Badge admin/artiste
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
