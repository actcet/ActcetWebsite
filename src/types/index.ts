export interface NavLink {
  label: string;
  href: string;
}

export interface PillarItem {
  key: string;
  title: string;
  description: string;
}

export interface JourneyYear {
  id: string;
  year: string;
  title: string;
  events: number;
  outreach: number;
  workshops: number;
  competitions: number;
  stargazing: number;
  podcasts: number;
}

export interface EventItem {
  id: string;
  name: string;
  date: string;
  location: string;
  domain: string;
  category: string;
  participants: string;
  objective: string;
  outcome: string;
  image: string;
  gallery: string[];
}

export interface YearEvents {
  id: string;
  year: string;
  current?: boolean;
  progression: string[];
  events: EventItem[];
}

export interface CommitteeMember {
  id: string;
  name: string;
  position: string;
  year: string;
  photo: string;
  linkedin?: string;
  email?: string;
}

export interface GalleryImage {
  id: string;
  year: string;
  caption: string;
  image: string;
  height: number;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
}

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
}

export interface AchievementItem {
  year: string;
  title: string;
  description: string;
}

export interface ContactItem {
  icon: "mail" | "instagram" | "linkedin" | "youtube" | "music" | "map-pin";
  label: string;
  value: string;
}
