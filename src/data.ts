import { Artist, Hangar, TimelineItem, NewsItem } from "./types";

export const HANGARS: Hangar[] = [
  {
    id: "hangar-a",
    name: "Hangar A — Les Volumes",
    description: "Ancien atelier de chaudronnerie lourde de la SNCF. Aujourd'hui doté de ponts roulants opérationnels pour la sculpture monumentale, la fonderie d'art et le travail du fer ou de l'acier brut.",
    badge: "SNCF-V1",
    residentCount: 24,
    specialty: "Sculpture & Métallerie d'Art",
    coordinates: { x: 28, y: 35 }
  },
  {
    id: "hangar-b",
    name: "Hangar B — Les Matières",
    description: "Anciens magasins de stockage de matériel ferroviaire. Un espace de silence où le bois précieux côtoie la terre cuite, la céramique et la marqueterie contemporaine.",
    badge: "SNCF-M2",
    residentCount: 18,
    specialty: "Ébénisterie, Céramique & Cuir",
    coordinates: { x: 55, y: 55 }
  },
  {
    id: "hangar-c",
    name: "Hangar C — Les Couleurs",
    description: "Grand atelier de peinture ferroviaire baigné d'une lumière zénithale constante grâce à sa structure Eiffel entièrement vitrée. Idéal pour la création picturale, la sérigraphie et la photographie argentique.",
    badge: "SNCF-C3",
    residentCount: 28,
    specialty: "Peinture, Sérigraphie & Photo",
    coordinates: { x: 78, y: 25 }
  }
];

export const ARTISTS: Artist[] = [
  {
    id: "artist-1",
    name: "Garance Lemaître",
    discipline: "Plasticiens",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    quote: "Le métal ferroviaire a une mémoire de tension. Je ne le plie pas, je l'écoute raconter son passé de rail et de feu.",
    bio: "Formée à l'École Boulle, Garance travaille l'acier corten et les métaux de récupération trouvés directement sur la friche ferroviaire de Saint-Pierre-des-Corps. Ses pièces monumentales jouent sur l'équilibre entre la rudesse industrielle et la fragilité organique.",
    hangarId: "hangar-a",
    contactEmail: "garance.lemaitre@morinerie.art",
    featuredWorkUrl: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&q=80&w=800",
    tags: ["Acier Corten", "Soudure TIG", "Monumental", "Métal de récupération"],
    works: [
      {
        id: "a1-w1",
        title: "Tension n°4 — Mémoire Ferrée",
        year: 2024,
        medium: "Acier soudé et patine à l'acide",
        imageUrl: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&q=80&w=800",
        description: "Une œuvre monumentale forgée à partir de traverses de rails SNCF d'origine, symbolisant l'énergie cinétique accumulée au fil des décennies de transit."
      },
      {
        id: "a1-w2",
        title: "Souffle de Rouille",
        year: 2025,
        medium: "Fer forgé et fil d'acier oxydé",
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA04ey65KefAN9Ma0F501HgRLTk7wAcoGVLfeUxDY0EYN7qyqyTjekL-hZJbi7fZqlhw22p8CBP6zTtYftw_ucR_P3VRI5ZdMFsHMzn2vF_wIEfhq35J38r_8uI_4Qnc2-1vrhSidWlxAQ7h5TlPw0xa8eGzuhqxJ8jD68FwJieY-IlPy4KzeAMl0FUPkCRpR7ccdMAOPLQpJvP5_skycW4ZaDyy3MJm64j4dgfFnFQyJ7zk16Xhy00kCwDyE6dyHMdGR_CJrF8LsC7",
        description: "Dentelle métallique explorant la dégradation naturelle induite par le climat des ateliers ouverts au vent."
      }
    ]
  },
  {
    id: "artist-2",
    name: "Marc-Antoine Kéruzoré",
    discipline: "Plasticiens",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    quote: "La toile est un réceptacle de matière brute : goudron, poussière de charbon et pigments purs se percutent pour révéler des paysages oubliés.",
    bio: "Marc-Antoine s'est installé à la Morinerie en 2012. Inspiré par l'esthétique brutaliste et les contrastes violents de l'ombre et de la lumière à travers les verrières industrielles, il crée des œuvres picturales d'une puissance physique saisissante.",
    hangarId: "hangar-c",
    contactEmail: "keruzore.paint@morinerie.art",
    featuredWorkUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800",
    tags: ["Brutalisme", "Goudron routier", "Poudre de charbon", "Grands Formats"],
    works: [
      {
        id: "a2-w1",
        title: "Verrière Noire II",
        year: 2025,
        medium: "Huile, goudron et poudre de charbon sur toile de lin",
        imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800",
        description: "Une exploration de l'obscurité majestueuse des toits des hangars au crépuscule, lacérés par les faisceaux lumineux extérieurs."
      },
      {
        id: "a2-w2",
        title: "Sédiments Industriels",
        year: 2023,
        medium: "Pigments naturels et liant acrylique",
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAeH33brKcVAv2tQHJo3ZQPlOJCvfi0kwQAKty2viR2aRx4a8-lhv5Iv0ODUBPk26hGhSUHKGJRo2zPx_tklkr_WHAtYFjIBQTkktmyolo9C9f5xGP0qPJ-PscGkuTPLJmI1Gna2X6Xc12YhYx9WPxeBuWFuAHNfvZ2OukP-YuiFPiwueSJW3UJdreHk1HTbKh6HvxlT6I1r5750nJT1JL7B-luWgLTOl0OZ2BNvrN85aUujQ682PFMUh_G3h4pt-BVehhj53Gpr625",
        description: "Incrustation de limaille de fer collectée sur le sol des ateliers, créant une œuvre en constante auto-oxydation."
      }
    ]
  },
  {
    id: "artist-3",
    name: "Nolwenn Dubreuil",
    discipline: "Artisans d'art",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
    quote: "Modeler la terre au milieu du béton armé, c'est une façon de rappeler la fragilité originelle du sol sous nos pieds.",
    bio: "Nolwenn façonne des grès bruts et des porcelaines translucides aux formes asymétriques. Elle récupère des résidus de combustion industrielle du site pour concevoir ses propres émaux haute température.",
    hangarId: "hangar-b",
    contactEmail: "n.dubreuil@morinerie.art",
    featuredWorkUrl: "https://images.unsplash.com/photo-1565192647048-f997ded87958?auto=format&fit=crop&q=80&w=800",
    tags: ["Grès sauvage", "Four Anagama", "Céramique", "Émail de cendres"],
    works: [
      {
        id: "a3-w1",
        title: "Érosion Silencieuse — Série Crémations",
        year: 2024,
        medium: "Grès de Puisaye, émail de cendres et scories ferroviaires",
        imageUrl: "https://images.unsplash.com/photo-1565192647048-f997ded87958?auto=format&fit=crop&q=80&w=800",
        description: "Vase sculptural modelé à la main, cuit à 1280°C dans un four à bois, dont la texture rugueuse rappelle l'écorce et le charbon fondu."
      }
    ]
  },
  {
    id: "artist-4",
    name: "Julien Gauthier",
    discipline: "Artisans d'art",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
    quote: "Le bois n'est pas inerte. Les nœuds, les fissures et les blessures de croissance sont la véritable géométrie du mobilier d'art.",
    bio: "Compagnon du Devoir, Julien réinterprète le mobilier haut de gamme. À la Morinerie, il profite du grand volume pour travailler des troncs entiers de chêne ou de noyer d'origine locale, en les assemblant à de l'acier usiné.",
    hangarId: "hangar-b",
    contactEmail: "julien.gauthier@morinerie.art",
    featuredWorkUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAeH33brKcVAv2tQHJo3ZQPlOJCvfi0kwQAKty2viR2aRx4a8-lhv5Iv0ODUBPk26hGhSUHKGJRo2zPx_tklkr_WHAtYFjIBQTkktmyolo9C9f5xGP0qPJ-PscGkuTPLJmI1Gna2X6Xc12YhYx9WPxeBuWFuAHNfvZ2OukP-YuiFPiwueSJW3UJdreHk1HTbKh6HvxlT6I1r5750nJT1JL7B-luWgLTOl0OZ2BNvrN85aUujQ682PFMUh_G3h4pt-BVehhj53Gpr625",
    tags: ["Ébénisterie", "Chêne massif", "Mobilier d'art", "Noyer"],
    works: [
      {
        id: "a4-w1",
        title: "Table Console Fissurée",
        year: 2024,
        medium: "Plateau de noyer massif, piètement en fer brut patiné",
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAeH33brKcVAv2tQHJo3ZQPlOJCvfi0kwQAKty2viR2aRx4a8-lhv5Iv0ODUBPk26hGhSUHKGJRo2zPx_tklkr_WHAtYFjIBQTkktmyolo9C9f5xGP0qPJ-PscGkuTPLJmI1Gna2X6Xc12YhYx9WPxeBuWFuAHNfvZ2OukP-YuiFPiwueSJW3UJdreHk1HTbKh6HvxlT6I1r5750nJT1JL7B-luWgLTOl0OZ2BNvrN85aUujQ682PFMUh_G3h4pt-BVehhj53Gpr625",
        description: "Une console épurée sublimant les faiblesses naturelles du bois, stabilisées par des inserts papillons en acier."
      }
    ]
  },
  {
    id: "artist-admin",
    name: "Gestion de mon espace",
    discipline: "Gestion",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
    quote: "Espace de test pour la gestion des slides artistes.",
    bio: "Page dédiée à l'administrateur du site pour tester la gestion des slides et œuvres dans l'interface d'administration.",
    hangarId: "hangar-a",
    contactEmail: "admin@morinerie.art",
    featuredWorkUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=800",
    tags: ["Administration", "Test"],
    works: [
      {
        id: "admin-w1",
        title: "Slide de test n°1",
        year: 2026,
        medium: "Photographie numérique",
        imageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=800",
        description: "Premier slide de test pour valider le fonctionnement de l'éditeur."
      },
      {
        id: "admin-w2",
        title: "Slide de test n°2",
        year: 2026,
        medium: "Photographie numérique",
        imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800",
        description: "Deuxième slide avec une description plus détaillée pour tester l'affichage dans le slider."
      },
      {
        id: "admin-w3",
        title: "Présentation Atelier",
        year: 2026,
        medium: "Photographie — Argentique",
        imageUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800",
        description: "Vue d'atelier capturée lors des portes ouvertes."
      }
    ]
  }
];

export const TIMELINE: TimelineItem[] = [
  {
    id: "time-1",
    year: "1920",
    title: "Le Cœur Ferroviaire",
    description: "Inauguration des hangars par la compagnie Paris-Orléans (puis SNCF). Plus de 300 ouvriers y réparent et entretiennent les locomotives à vapeur de la gare de triage de Saint-Pierre-des-Corps.",
    badgeLabel: "SNCF ORIGINE"
  },
  {
    id: "time-2",
    year: "1990",
    title: "L'Heure du Silence",
    description: "Avec la modernisation des réseaux ferrés, les activités de maintenance se décentralisent. Les ateliers ferment progressivement leurs portes, plongeant les 15 000 m² de hangars dans un profond sommeil industriel.",
    badgeLabel: "FRICHE BRUTE"
  },
  {
    id: "time-3",
    year: "2007",
    title: "La Première Étincelle",
    description: "Un collectif pionnier d'artistes et d'artisans découvre le site. Séduits par les volumes phénoménaux et la lumière cathédrale, ils signent des conventions d'occupation pour transformer les ruines industrielles en pôles de création.",
    badgeLabel: "RÉHABILITATION"
  },
  {
    id: "time-4",
    year: "2015",
    title: "L'Essor de la Coopérative",
    description: "La Morinerie devient un pôle culturel et artisanal majeur de la région Centre-Val de Loire. Création de structures associatives solides pour préserver le statut coopératif et solidaire du lieu.",
    badgeLabel: "COOPÉRATION"
  },
  {
    id: "time-5",
    year: "2026",
    title: "Le Phare Créatif",
    description: "Aujourd'hui, plus de 100 créateurs permanents (sculpteurs, luthiers, fondeurs, plasticiens, photographes) collaborent et font rayonner l'esprit brut des anciens hangars à l'échelle européenne.",
    badgeLabel: "AUJOURD'HUI"
  }
];

export const NEWS_ITEMS: NewsItem[] = [
  {
    id: "news-1",
    title: "Résidence d'Art 2026 : Appel à candidatures",
    subtitle: "Rejoignez le Hangar A de la Morinerie pour une session intensive de création de 3 mois",
    date: "15 Juin 2026",
    category: "Résidence",
    badgeLabel: "APPEL À PROJETS",
    images: [
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1200"
    ],
    content: "Le tiers-lieu ouvre officiellement son appel à candidatures pour l'édition d'automne 2026. Quatre lauréats bénéficieront d'un atelier partagé, d'un accès aux ponts roulants du Hangar A et d'une bourse de création de 3 000 €. Une occasion unique de confronter sa pratique artistique à l'échelle monumentale de l'ancienne chaudronnerie SNCF."
  },
  {
    id: "news-2",
    title: "Nouvel Espace Fonderie de Bronze",
    subtitle: "Inauguration du four de fusion haute température pour les sculpteurs et résidents",
    date: "12 Mai 2026",
    category: "Équipement",
    badgeLabel: "INNOVATION ARTISANALE",
    images: [
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200"
    ],
    content: "Grâce au soutien déterminant du mécénat du Groupe CLEN et des collectivités territoriales, la Morinerie s'équipe d'un tout nouveau four de coulée à induction. Cet équipement exceptionnel permettra aux artisans d'art et sculpteurs sur métal de réaliser des coulées de bronze d'art en totale autonomie directement au sein du tiers-lieu."
  },
  {
    id: "news-3",
    title: "Exposition Hors-les-murs : Vestiges & Visions",
    subtitle: "Les résidents s'exposent au Centre d'Art Contemporain de Tours",
    date: "04 Avril 2026",
    category: "Exposition",
    badgeLabel: "ÉVÉNEMENT",
    images: [
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1531058020387-3be344559be6?auto=format&fit=crop&q=80&w=1200"
    ],
    content: "Trente-cinq artistes plasticiens, céramistes et ébénistes de la Morinerie unissent leurs forces pour une exposition collective majeure. À travers des sculptures de fer, des céramiques imprégnées de scories de charbon et des peintures au goudron, l'exposition explore les liens indéfectibles entre le passé laborieux du rail et la création plastique contemporaine."
  }
];

