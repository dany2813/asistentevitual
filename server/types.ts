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

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  bio: string;
  avatar: string;
  createdAt: string;
}

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

export interface PersonalityRecord {
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

export interface ChatRecord {
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

export interface FriendshipRecord {
  id: string;
  requesterId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface LikeRecord {
  userId: string;
  personalityId: string;
  createdAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: UserRecord[];
  personalities: PersonalityRecord[];
  chats: ChatRecord[];
  friendships: FriendshipRecord[];
  likes: LikeRecord[];
  sessions: SessionRecord[];
}
