import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Artist, ArtistBlogPost } from "../types";
import { Calendar, Tag, Plus, PenSquare, Trash2, BookOpen, AlertCircle, X, Eye, ChevronLeft, ChevronRight } from "lucide-react";

interface ArtistBlogProps {
  artist: Artist;
  isProMode: boolean;
}

const DEFAULT_BLOG_POSTS: ArtistBlogPost[] = [
  { id: "blog-1-1", artistId: "artist-1", title: "Arrivage de traverses SNCF en acier lourd", date: "22 Juin 2026", category: "Matériaux", content: "Un grand merci à la gare de triage de Saint-Pierre-des-Corps pour ce don exceptionnel de traverses de rails usées en acier d'époque.", imageUrl: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800" },
  { id: "blog-1-2", artistId: "artist-1", title: "Rencontre d'été : Atelier ouvert de soudure", date: "10 Juin 2026", category: "Transmission", content: "Ce samedi, de 14h à 18h, j'ouvre les portes de mon espace de soudure au Hangar A.", imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800" },
  { id: "blog-2-1", artistId: "artist-2", title: "Recherche chromatique : L'outremer et le charbon", date: "18 Juin 2026", category: "Technique", content: "Quelques essais de superposition sur de nouveaux supports de lin écru.", imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800" },
  { id: "blog-2-2", artistId: "artist-2", title: "Série 'Cathédrales d'Ombre' sous les verrières", date: "05 Juin 2026", category: "En cours", content: "Les premières toiles de grand format prennent place sous la nef centrale.", imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800" },
  { id: "blog-3-1", artistId: "artist-3", title: "Défournement magique après 72 heures de cuisson au bois", date: "25 Juin 2026", category: "Cuisson", content: "Le grand four anagama partagé a enfin refroidi.", imageUrl: "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?auto=format&fit=crop&q=80&w=800" },
  { id: "blog-3-2", artistId: "artist-3", title: "Collecte de sables et argiles le long de la Loire", date: "14 Juin 2026", category: "Recherche", content: "Expédition matinale très fructueuse sur les bancs de sable sauvages de la Loire.", imageUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800" },
  { id: "blog-4-1", artistId: "artist-4", title: "Séchage et stabilisation d'un chêne bicentenaire", date: "20 Juin 2026", category: "Bois de Pays", content: "Séchage naturel entamé dans la partie haute du Hangar B.", imageUrl: "https://images.unsplash.com/photo-1540206395-68808572332f?auto=format&fit=crop&q=80&w=800" },
  { id: "blog-4-2", artistId: "artist-4", title: "Masterclass sur les assemblages en sifflet invisible", date: "01 Juin 2026", category: "Partage", content: "Heureux d'avoir accueilli hier huit ébénistes et apprentis compagnons.", imageUrl: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=800" },
];

export default function ArtistBlog({ artist, isProMode }: ArtistBlogProps) {
  const [posts, setPosts] = useState<ArtistBlogPost[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    const loadPosts = () => {
      const stored = localStorage.getItem(`morinerie_artist_blog_${artist.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) { setPosts(parsed); return; }
        } catch {}
      }
      const oldCustom = localStorage.getItem("morinerie_artist_custom_blog_posts");
      let customPosts: ArtistBlogPost[] = [];
      if (oldCustom) {
        try {
          const parsed = JSON.parse(oldCustom);
          if (Array.isArray(parsed)) customPosts = parsed.filter((p: any) => p.artistId === artist.id);
        } catch {}
      }
      setPosts([...customPosts, ...DEFAULT_BLOG_POSTS.filter((p) => p.artistId === artist.id)]);
    };
    loadPosts();
    (async () => {
      try {
        const res = await fetch(`/api/content/morinerie_artist_blog_${artist.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.value) {
            const parsed = JSON.parse(data.value);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localStorage.setItem(`morinerie_artist_blog_${artist.id}`, data.value);
              setPosts(parsed);
            }
          }
        }
      } catch {}
    })();
  }, [artist.id]);

  useEffect(() => { setActiveImgIndex(0); }, [activeIndex]);

  // Compute these before the early return to keep hook order consistent
  const activePre = posts[activeIndex];
  const activeImagesPre = activePre?.images && activePre.images.length > 0
    ? activePre.images
    : activePre?.imageUrl ? [activePre.imageUrl] : [];

  // Auto-play — placed before early return to keep hook order stable
  useEffect(() => {
    if (!isAutoPlaying || posts.length <= 1 || !activePre) return;
    const numImages = activeImagesPre.length;
    const interval = setInterval(() => {
      if (activeImgIndex < numImages - 1) {
        setActiveImgIndex((prev) => prev + 1);
      } else {
        setActiveIndex((prev) => (prev + 1) % posts.length);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, activeIndex, activeImgIndex, activeImagesPre?.length, posts.length, activePre]);

  if (posts.length === 0 || !posts[activeIndex]) {
    return (
      <div className="space-y-6">
        <span className="font-mono text-[9px] text-brand-rust uppercase tracking-widest font-bold block">Blog / Journal d'Atelier</span>
        <div className="bg-brand-steel p-10 text-center border border-brand-dark/5 space-y-2">
          <AlertCircle className="w-6 h-6 text-brand-gray mx-auto" />
          <p className="font-mono text-[10px] text-brand-gray uppercase">Aucun article publié pour le moment.</p>
        </div>
      </div>
    );
  }

  const active = posts[activeIndex];
  const activeImages = active.images && active.images.length > 0 ? active.images : (active.imageUrl ? [active.imageUrl] : []);
  const isCustom = active.id.startsWith("blog-custom-");

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div>
        <span className="font-mono text-[9px] text-brand-rust uppercase tracking-widest font-bold block">Blog / Journal d'Atelier</span>
        <h3 className="font-display font-light text-3xl text-brand-dark uppercase tracking-tight mt-1">Les Articles Récents</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Active article — left column */}
        <div
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
          className="lg:col-span-8 bg-brand-steel/30 border border-brand-dark/5 p-4 sm:p-6 shadow-sm">
          
          {/* Image */}
          {activeImages.length > 0 && (
            <div className="relative aspect-[16/10] md:aspect-[16/9] overflow-hidden bg-brand-dark border border-brand-dark/10 group/slider mb-6">
              <AnimatePresence mode="wait">
                <motion.img
                  key={`${activeIndex}-${activeImgIndex}`}
                  src={activeImages[activeImgIndex]}
                  alt={active.title}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/50 via-transparent to-brand-dark/10 pointer-events-none" />
              {activeImages.length > 1 && (
                <>
                  <button onClick={() => setActiveImgIndex((i) => (i - 1 + activeImages.length) % activeImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-dark/80 hover:bg-brand-rust text-brand-light border border-brand-light/10 flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover/slider:opacity-100 z-20 shadow-md">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setActiveImgIndex((i) => (i + 1) % activeImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-dark/80 hover:bg-brand-rust text-brand-light border border-brand-light/10 flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover/slider:opacity-100 z-20 shadow-md">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-brand-dark/75 backdrop-blur-sm border border-brand-light/10 px-2 py-0.5 font-mono text-[9px] text-brand-light tracking-wider z-10">
                    {String(activeImgIndex + 1).padStart(2, "0")} / {String(activeImages.length).padStart(2, "0")}
                  </div>
                </>
              )}
              {isAutoPlaying && (posts.length > 1 || activeImages.length > 1) && (
                <motion.div
                  key={`${activeIndex}-${activeImgIndex}`}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 6, ease: "linear" }}
                  className="absolute bottom-0 left-0 h-[3px] bg-brand-rust z-30 pointer-events-none"
                />
              )}
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-brand-dark/50 font-mono text-xs mb-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-rust" />
              {active.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Tag className="w-3 h-3" />
              <span className="uppercase tracking-wider">{active.category}</span>
            </span>
            {active.tags && active.tags.length > 0 && active.tags.map((t) => (
              <span key={t} className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-brand-steel/50 border border-dashed border-brand-dark/20 text-brand-gray">#{t}</span>
            ))}
          </div>

          <h4 className="font-display font-medium text-2xl sm:text-3xl text-brand-dark tracking-tight uppercase leading-snug mb-4">
            {active.title}
          </h4>

          <div className="font-sans text-brand-dark/75 text-sm sm:text-base leading-relaxed font-light [&_p]:mb-2 [&_p:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: active.content }} />

          {isCustom && isProMode && (
            <button onClick={() => {
              const filtered = posts.filter((_, i) => i !== activeIndex);
              setPosts(filtered);
              localStorage.setItem(`morinerie_artist_blog_${artist.id}`, JSON.stringify(filtered));
              setActiveIndex(Math.min(activeIndex, filtered.length - 1));
            }} className="mt-4 px-3 py-1.5 bg-red-600 text-white font-mono text-[9px] rounded-sm hover:bg-red-500 transition-colors cursor-pointer flex items-center gap-1.5">
              <Trash2 className="w-3 h-3" /> Supprimer cet article
            </button>
          )}
        </div>

        {/* Sidebar — right column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="font-mono text-[10px] tracking-widest text-brand-dark/40 uppercase font-bold px-2">
            Autres Articles
          </div>
          <div className="space-y-2">
            {posts.map((post, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={post.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-full text-left p-3 transition-all border flex gap-3 cursor-pointer focus:outline-none relative overflow-hidden group ${
                    isActive
                      ? "bg-brand-dark border-brand-dark text-brand-light shadow-md"
                      : "bg-brand-steel/10 border-brand-dark/10 hover:border-brand-rust/50 hover:bg-brand-steel/20 text-brand-dark"
                  }`}
                >
                  <div className="w-14 h-14 shrink-0 bg-brand-steel overflow-hidden border border-brand-dark/5 relative">
                    {(post.images?.[0] || post.imageUrl) && (
                      <img src={post.images?.[0] || post.imageUrl!} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div className="flex flex-col justify-between py-0.5 overflow-hidden min-w-0">
                    <div>
                      <span className={`font-mono text-[8px] uppercase tracking-wider ${isActive ? "text-brand-rust" : "text-brand-rust"}`}>{post.category}</span>
                      <span className="font-mono text-[8px] opacity-60 ml-2">{post.date}</span>
                    </div>
                    <h5 className="font-display font-medium text-xs uppercase tracking-wider line-clamp-1 mt-0.5 leading-snug">{post.title}</h5>
                    <p className="font-sans text-[10px] line-clamp-1 opacity-70 font-light mt-0.5">{post.content.replace(/<[^>]*>/g, "")}</p>
                  </div>
                  {isActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand-rust" />}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
