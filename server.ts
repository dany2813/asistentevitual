import "dotenv/config";
import path from "node:path";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { store } from "./server/store.ts";
import { generatePersonaReply } from "./server/ai.ts";
import type { UserRecord, Visibility } from "./server/types.ts";

interface AuthedRequest extends Request {
  currentUser?: UserRecord | null;
  sessionToken?: string | null;
}

function extractToken(req: Request): string | null {
  const headerToken = req.header("x-session-token");
  if (headerToken && headerToken.trim()) return headerToken.trim();
  const auth = req.header("authorization");
  if (auth && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  return null;
}

function attachUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  req.sessionToken = token;
  req.currentUser = token ? store.getUserBySessionToken(token) : null;
  next();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.currentUser) {
    res.status(401).json({ error: "Debes iniciar sesión para continuar." });
    return;
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "6mb" }));
  app.use(attachUser);

  // ---- Auth ----
  app.get("/api/auth/me", (req: AuthedRequest, res: Response) => {
    if (!req.currentUser) {
      res.json({ user: null });
      return;
    }
    res.json({ user: store.toPublicUser(req.currentUser) });
  });

  app.post("/api/auth/register", (req: Request, res: Response) => {
    const { email, username, password, bio, avatar } = req.body ?? {};
    const result = store.registerUser({
      email: String(email || ""),
      username: String(username || ""),
      password: String(password || ""),
      bio: String(bio || ""),
      avatar: String(avatar || "👤"),
    });
    if (result.error || !result.user) {
      res.status(400).json({ error: result.error || "No se pudo registrar." });
      return;
    }
    const token = store.createSession(result.user.id);
    res.status(201).json({
      token,
      user: store.toPublicUser(result.user),
    });
  });

  app.post("/api/auth/login", (req: Request, res: Response) => {
    const { identifier, password } = req.body ?? {};
    const result = store.authenticateUser(
      String(identifier || ""),
      String(password || "")
    );
    if (result.error || !result.user) {
      res.status(401).json({ error: result.error || "Credenciales inválidas." });
      return;
    }
    const token = store.createSession(result.user.id);
    res.json({
      token,
      user: store.toPublicUser(result.user),
    });
  });

  app.post("/api/auth/logout", (req: AuthedRequest, res: Response) => {
    if (req.sessionToken) {
      store.deleteSession(req.sessionToken);
    }
    res.json({ ok: true });
  });

  // ---- Users & Profiles ----
  app.put("/api/users/me", requireAuth, (req: AuthedRequest, res: Response) => {
    const { bio, avatar } = req.body ?? {};
    const updated = store.updateUserProfile(
      req.currentUser!.id,
      String(bio ?? ""),
      String(avatar ?? "👤")
    );
    if (!updated) {
      res.status(404).json({ error: "Usuario no encontrado." });
      return;
    }
    res.json({ user: store.toPublicUser(updated) });
  });

  app.get("/api/users/:username", (req: AuthedRequest, res: Response) => {
    const username = String(req.params.username || "");
    const target = store.getUserByUsername(username);
    if (!target) {
      res.status(404).json({ error: "Usuario no encontrado." });
      return;
    }

    const viewerId = req.currentUser?.id ?? null;
    const allPersonalities = store.getUserPersonalities(target.id);
    const visiblePersonalities = allPersonalities.filter((p) =>
      store.canUserAccessPersonality(viewerId, p)
    );

    const isSelf = viewerId === target.id;
    const areFriends = viewerId ? store.areFriends(viewerId, target.id) : false;
    const relation = viewerId
      ? store.findFriendshipBetween(viewerId, target.id)
      : null;

    res.json({
      user: store.toPublicUser(target),
      personalities: visiblePersonalities,
      isSelf,
      areFriends,
      pendingStatus:
        relation && relation.status === "pending"
          ? relation.requesterId === viewerId
            ? "sent"
            : "received"
          : null,
      friendshipId: relation?.id ?? null,
    });
  });

  // ---- Dashboard ----
  app.get("/api/dashboard", requireAuth, (req: AuthedRequest, res: Response) => {
    const userId = req.currentUser!.id;
    const recentChats = store.getUserChats(userId, 6);
    const systemPersonalities = store.getSystemPersonalities();
    const myPersonalities = store.getUserPersonalities(userId);
    const likedIds = Array.from(store.getUserLikedIds(userId));
    const friendships = store.getFriendshipsDetailed(userId);

    res.json({
      recentChats,
      systemPersonalities,
      myPersonalities,
      likedIds,
      friendsCount: friendships.friends.length,
      pendingRequestsCount: friendships.pendingReceived.length,
    });
  });

  // ---- Personalities ----
  app.get(
    "/api/personalities",
    requireAuth,
    (req: AuthedRequest, res: Response) => {
      const userId = req.currentUser!.id;
      res.json({
        myPersonalities: store.getUserPersonalities(userId),
        systemPersonalities: store.getSystemPersonalities(),
        likedIds: Array.from(store.getUserLikedIds(userId)),
      });
    }
  );

  app.post(
    "/api/personalities",
    requireAuth,
    (req: AuthedRequest, res: Response) => {
      const { name, description, systemPrompt, avatar, visibility, category, tags } =
        req.body ?? {};
      const result = store.createPersonality({
        userId: req.currentUser!.id,
        name: String(name || ""),
        description: String(description || ""),
        systemPrompt: String(systemPrompt || ""),
        avatar: String(avatar || "🤖"),
        visibility: visibility as Visibility,
        category: String(category || "Otros"),
        tags: tags ?? [],
      });
      if (result.error || !result.personality) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.status(201).json({ personality: result.personality });
    }
  );

  app.get("/api/personalities/:id", (req: AuthedRequest, res: Response) => {
    const id = String(req.params.id || "");
    const personality = store.getPersonalityById(id);
    if (!personality) {
      res.status(404).json({ error: "Personalidad eliminada o no encontrada.", deleted: true });
      return;
    }
    const viewerId = req.currentUser?.id ?? null;
    if (!store.canUserAccessPersonality(viewerId, personality)) {
      res
        .status(403)
        .json({ error: "No tienes permiso para ver esta personalidad privada." });
      return;
    }
    const owner =
      personality.ownerId && !personality.isSystem
        ? store.getUserById(personality.ownerId)
        : null;
    const likedIds = store.getUserLikedIds(viewerId);
    res.json({
      personality,
      owner: owner ? store.toPublicUser(owner) : null,
      isLiked: likedIds.has(personality.id),
      canEdit: store.canUserEditPersonality(viewerId, personality),
    });
  });

  app.put(
    "/api/personalities/:id",
    requireAuth,
    (req: AuthedRequest, res: Response) => {
      const id = String(req.params.id || "");
      const {
        name,
        description,
        systemPrompt,
        avatar,
        visibility,
        category,
        tags,
        changeNotes,
      } = req.body ?? {};
      const result = store.updatePersonality({
        userId: req.currentUser!.id,
        personalityId: id,
        name: String(name || ""),
        description: String(description || ""),
        systemPrompt: String(systemPrompt || ""),
        avatar: avatar ? String(avatar) : undefined,
        visibility: visibility as Visibility,
        category: String(category || "Otros"),
        tags: tags ?? [],
        changeNotes: changeNotes ? String(changeNotes) : undefined,
      });
      if (result.error || !result.personality) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.json({ personality: result.personality });
    }
  );

  app.delete(
    "/api/personalities/:id",
    requireAuth,
    (req: AuthedRequest, res: Response) => {
      const id = String(req.params.id || "");
      const result = store.deletePersonality(req.currentUser!.id, id);
      if (!result.ok) {
        res.status(403).json({ error: result.error });
        return;
      }
      res.json({ ok: true });
    }
  );

  app.post(
    "/api/personalities/:id/like",
    requireAuth,
    (req: AuthedRequest, res: Response) => {
      const id = String(req.params.id || "");
      const result = store.toggleLike(req.currentUser!.id, id);
      if (result.error) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.json(result);
    }
  );

  // ---- Community ----
  app.get("/api/community", (req: AuthedRequest, res: Response) => {
    const query = typeof req.query.q === "string" ? req.query.q : "";
    const category =
      typeof req.query.category === "string" ? req.query.category : "all";
    const tag = typeof req.query.tag === "string" ? req.query.tag : "";
    const sortBy =
      typeof req.query.sort === "string" ? req.query.sort : "popular";
    const page = Number(req.query.page || 1);
    const perPage = Number(req.query.per_page || 12);

    const feed = store.getCommunityFeed({
      query,
      category,
      tag,
      sortBy,
      page,
      perPage,
      currentUserId: req.currentUser?.id ?? null,
    });
    res.json(feed);
  });

  // ---- Chats ----
  app.get("/api/chats", requireAuth, (req: AuthedRequest, res: Response) => {
    const userId = req.currentUser!.id;
    res.json({
      chats: store.getUserChats(userId),
      systemPersonalities: store.getSystemPersonalities(),
      myPersonalities: store.getUserPersonalities(userId),
    });
  });

  app.post("/api/chats", requireAuth, (req: AuthedRequest, res: Response) => {
    const { personalityId, version } = req.body ?? {};
    const parsedVersion =
      version !== undefined && version !== null && version !== ""
        ? Number(version)
        : undefined;
    const result = store.createChat(
      req.currentUser!.id,
      String(personalityId || ""),
      parsedVersion
    );
    if (result.error || !result.chat) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json({ chat: result.chat });
  });

  app.get("/api/chats/:id", requireAuth, (req: AuthedRequest, res: Response) => {
    const chatId = String(req.params.id || "");
    const { chat, error } = store.getChatForUser(req.currentUser!.id, chatId);
    if (error || !chat) {
      res.status(404).json({ error: error || "Conversación no encontrada." });
      return;
    }
    const linkedPersonality = chat.personalityId
      ? store.getPersonalityById(chat.personalityId)
      : null;
    res.json({
      chat,
      personality: linkedPersonality,
    });
  });

  app.post(
    "/api/chats/:id/sync-personality",
    requireAuth,
    (req: AuthedRequest, res: Response) => {
      const chatId = String(req.params.id || "");
      const { version } = req.body ?? {};
      const parsedVersion =
        version !== undefined && version !== null && version !== ""
          ? Number(version)
          : undefined;
      const result = store.syncChatPersonalityVersion(
        req.currentUser!.id,
        chatId,
        parsedVersion
      );
      if (result.error || !result.chat) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.json({ chat: result.chat });
    }
  );

  app.post(
    "/api/chats/:id/messages",
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const chatId = String(req.params.id || "");
      const content = String(req.body?.content || "").trim();
      if (!content) {
        res.status(400).json({ error: "El mensaje no puede estar vacío." });
        return;
      }

      const { chat, error } = store.getChatForUser(req.currentUser!.id, chatId);
      if (error || !chat) {
        res.status(404).json({ error: error || "Chat no encontrado." });
        return;
      }

      const userMsg = store.appendChatMessage(chat.id, "user", content);
      const updatedChat = store.getChatForUser(req.currentUser!.id, chat.id).chat!;

      const aiReply = await generatePersonaReply(
        updatedChat.personalitySnapshot.systemPrompt,
        updatedChat.messages
      );

      if (aiReply.error) {
        res.status(502).json({
          error: aiReply.error,
          userMessage: userMsg,
          chatTitle: updatedChat.title,
        });
        return;
      }

      const assistantMsg = store.appendChatMessage(
        chat.id,
        "assistant",
        aiReply.text
      );
      const finalChat = store.getChatForUser(req.currentUser!.id, chat.id).chat!;

      res.json({
        userMessage: userMsg,
        assistantMessage: assistantMsg,
        chat: finalChat,
      });
    }
  );

  app.delete(
    "/api/chats/:id",
    requireAuth,
    (req: AuthedRequest, res: Response) => {
      const chatId = String(req.params.id || "");
      const result = store.deleteChat(req.currentUser!.id, chatId);
      if (!result.ok) {
        res.status(404).json({ error: result.error });
        return;
      }
      res.json({ ok: true });
    }
  );

  // ---- Friendships ----
  app.get(
    "/api/friendships",
    requireAuth,
    (req: AuthedRequest, res: Response) => {
      res.json(store.getFriendshipsDetailed(req.currentUser!.id));
    }
  );

  app.post(
    "/api/friendships/request",
    requireAuth,
    (req: AuthedRequest, res: Response) => {
      const username = String(req.body?.username || "");
      const result = store.sendFriendRequest(req.currentUser!.id, username);
      if (result.error) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.json({ ok: true, message: result.message });
    }
  );

  app.post(
    "/api/friendships/:id/accept",
    requireAuth,
    (req: AuthedRequest, res: Response) => {
      const id = String(req.params.id || "");
      const result = store.acceptFriendRequest(req.currentUser!.id, id);
      if (!result.ok) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.json({ ok: true });
    }
  );

  app.post(
    "/api/friendships/:id/reject",
    requireAuth,
    (req: AuthedRequest, res: Response) => {
      const id = String(req.params.id || "");
      const result = store.rejectFriendRequest(req.currentUser!.id, id);
      if (!result.ok) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.json({ ok: true });
    }
  );

  app.delete(
    "/api/friendships/:targetUserId",
    requireAuth,
    (req: AuthedRequest, res: Response) => {
      const targetUserId = String(req.params.targetUserId || "");
      const result = store.removeFriendship(req.currentUser!.id, targetUserId);
      if (!result.ok) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.json({ ok: true });
    }
  );

  // ---- Vite Dev / Static Prod ----
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.get("/{*splat}", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dochad server listening on http://localhost:${PORT}`);
  });
}

startServer();
