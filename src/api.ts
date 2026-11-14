import type {
  Chat,
  ChatMessage,
  CommunityFeedResponse,
  DashboardResponse,
  FriendshipItem,
  Personality,
  PublicUser,
  Visibility,
} from "./types";

const SESSION_KEY = "persona_ai_session_token";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(SESSION_KEY, token);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore storage errors
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("X-Session-Token", token);
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Error en la solicitud.") as Error & {
      status?: number;
      deleted?: boolean;
    };
    err.status = res.status;
    err.deleted = Boolean(data.deleted);
    throw err;
  }
  return data as T;
}

export const api = {
  // Auth
  me: () => request<{ user: PublicUser | null }>("/api/auth/me"),
  login: (identifier: string, password: string) =>
    request<{ token: string; user: PublicUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }),
  register: (payload: {
    email: string;
    username: string;
    password: string;
    bio?: string;
    avatar?: string;
  }) =>
    request<{ token: string; user: PublicUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

  // Users
  updateProfile: (bio: string, avatar: string) =>
    request<{ user: PublicUser }>("/api/users/me", {
      method: "PUT",
      body: JSON.stringify({ bio, avatar }),
    }),
  getUserProfile: (username: string) =>
    request<{
      user: PublicUser;
      personalities: Personality[];
      isSelf: boolean;
      areFriends: boolean;
      pendingStatus: "sent" | "received" | null;
      friendshipId: string | null;
    }>(`/api/users/${encodeURIComponent(username)}`),

  // Dashboard
  getDashboard: () => request<DashboardResponse>("/api/dashboard"),

  // Personalities
  getPersonalities: () =>
    request<{
      myPersonalities: Personality[];
      systemPersonalities: Personality[];
      likedIds: string[];
    }>("/api/personalities"),
  getPersonality: (id: string) =>
    request<{
      personality: Personality;
      owner: PublicUser | null;
      isLiked: boolean;
      canEdit: boolean;
    }>(`/api/personalities/${encodeURIComponent(id)}`),
  createPersonality: (payload: {
    name: string;
    description: string;
    systemPrompt: string;
    avatar: string;
    visibility: Visibility;
    category: string;
    tags: string;
  }) =>
    request<{ personality: Personality }>("/api/personalities", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePersonality: (
    id: string,
    payload: {
      name: string;
      description: string;
      systemPrompt: string;
      avatar: string;
      visibility: Visibility;
      category: string;
      tags: string;
      changeNotes: string;
    }
  ) =>
    request<{ personality: Personality }>(
      `/api/personalities/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    ),
  deletePersonality: (id: string) =>
    request<{ ok: boolean }>(`/api/personalities/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  toggleLike: (id: string) =>
    request<{ isLiked: boolean; likesCount: number }>(
      `/api/personalities/${encodeURIComponent(id)}/like`,
      { method: "POST" }
    ),

  // Community
  getCommunity: (params: {
    q?: string;
    category?: string;
    tag?: string;
    sort?: string;
    page?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.category && params.category !== "all")
      qs.set("category", params.category);
    if (params.tag) qs.set("tag", params.tag);
    if (params.sort) qs.set("sort", params.sort);
    if (params.page) qs.set("page", String(params.page));
    return request<CommunityFeedResponse>(`/api/community?${qs.toString()}`);
  },

  // Chats
  getChats: () =>
    request<{
      chats: Chat[];
      systemPersonalities: Personality[];
      myPersonalities: Personality[];
    }>("/api/chats"),
  createChat: (personalityId: string, version?: number) =>
    request<{ chat: Chat }>("/api/chats", {
      method: "POST",
      body: JSON.stringify({ personalityId, version }),
    }),
  getChat: (id: string) =>
    request<{ chat: Chat; personality: Personality | null }>(
      `/api/chats/${encodeURIComponent(id)}`
    ),
  syncChatPersonality: (chatId: string, version?: number) =>
    request<{ chat: Chat }>(
      `/api/chats/${encodeURIComponent(chatId)}/sync-personality`,
      {
        method: "POST",
        body: JSON.stringify({ version }),
      }
    ),
  sendMessage: (chatId: string, content: string) =>
    request<{
      userMessage: ChatMessage;
      assistantMessage: ChatMessage;
      chat: Chat;
    }>(`/api/chats/${encodeURIComponent(chatId)}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  deleteChat: (chatId: string) =>
    request<{ ok: boolean }>(`/api/chats/${encodeURIComponent(chatId)}`, {
      method: "DELETE",
    }),

  // Friendships
  getFriendships: () =>
    request<{
      friends: FriendshipItem[];
      pendingReceived: FriendshipItem[];
      pendingSent: FriendshipItem[];
    }>("/api/friendships"),
  sendFriendRequest: (username: string) =>
    request<{ ok: boolean; message: string }>("/api/friendships/request", {
      method: "POST",
      body: JSON.stringify({ username }),
    }),
  acceptFriendRequest: (id: string) =>
    request<{ ok: boolean }>(
      `/api/friendships/${encodeURIComponent(id)}/accept`,
      { method: "POST" }
    ),
  rejectFriendRequest: (id: string) =>
    request<{ ok: boolean }>(
      `/api/friendships/${encodeURIComponent(id)}/reject`,
      { method: "POST" }
    ),
  removeFriendship: (targetUserId: string) =>
    request<{ ok: boolean }>(
      `/api/friendships/${encodeURIComponent(targetUserId)}`,
      { method: "DELETE" }
    ),
};
