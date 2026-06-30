export interface Artwork {
  id: string;
  title: string;
  year: number;
  medium: string;
  imageUrl: string;
  description: string;
  tags?: string[];
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  discipline: string;
  avatarUrl: string;
  works: Artwork[];
  hangarId: string;
  contactEmail: string;
  quote: string;
  featuredWorkUrl: string;
  tags?: string[];
}

export interface Hangar {
  id: string;
  name: string;
  description: string;
  badge: string;
  residentCount: number;
  specialty: string;
  coordinates: { x: number; y: number }; // Percentage for custom SVG map
}

export interface TimelineItem {
  id: string;
  year: string;
  title: string;
  description: string;
  badgeLabel: string;
  image?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  content: string;
  images: string[];
  category: string;
  badgeLabel?: string;
  tags?: string[];
}

export interface ArtistBlogPost {
  id: string;
  artistId: string;
  title: string;
  date: string;
  category: string;
  content: string;
  imageUrl?: string;
  tags?: string[];
  images?: string[];
}

export type UserRole = "admin" | "artiste";

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  artistId?: string;
}

export const ADMIN_STORAGE_KEY = "morinerie_admin_content";

export interface LieuContent {
  tagline: string;
  title: string;
  paragraph1: string;
  paragraph2: string;
  paragraph3: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  imageUrl: string;
  imageUrls?: string[];
}



