export type Visibility = "public" | "friends" | "private";

export const DEFAULT_CATEGORIES = [
  "Programación",
  "Educación",
  "Escritura",
  "Productividad",
  "Entretenimiento",
  "Creatividad",
  "Negocios",
  "Idiomas",
  "Otros",
] as const;

export interface PublicUser {
  id: string;
  username: string;
  bio: string;
  avatar: string;
  createdAt: string;
}

export interface PersonalityVersion {
  versionNumber: number;
  versionLabel: string;
  name: string;
  description: string;
  systemPrompt: string;
  avatar: string;
  category: string;
  tags: string[];
  visibility: Visibility;
  changeNotes: string;
  createdAt: string;
}

export interface Personality {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  avatar: string;
  ownerId: string | null;
  isSystem: boolean;
  visibility: Visibility;
  category: string;
  tags: string[];
  likesCount: number;
  usesCount: number;
  currentVersion: number;
  versions: PersonalityVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatSnapshot {
  name: string;
  description: string;
  systemPrompt: string;
  avatar: string;
  category: string;
  versionNumber: number;
  versionLabel: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  userId: string;
  personalityId: string | null;
  personalityVersion: number;
  personalitySnapshot: ChatSnapshot;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface FriendshipItem {
  friendshipId: string;
  user: PublicUser;
  createdAt: string;
}

export interface CommunityFeedItem {
  personality: Personality;
  creatorName: string;
  creatorAvatar: string;
  creatorUsername: string | null;
  isLiked: boolean;
}

export interface CommunityFeedResponse {
  items: CommunityFeedItem[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface DashboardResponse {
  recentChats: Chat[];
  systemPersonalities: Personality[];
  myPersonalities: Personality[];
  likedIds: string[];
  friendsCount: number;
  pendingRequestsCount: number;
}
