import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type {
  ChatRecord,
  ChatSnapshot,
  DatabaseSchema,
  FriendshipRecord,
  PersonalityRecord,
  PersonalityVersion,
  PublicUser,
  UserRecord,
  Visibility,
} from "./types.ts";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const SYSTEM_PERSONALITIES_SEED = [
  {
    id: "sys-asistente-general",
    name: "Asistente general",
    description:
      "Asistente inteligente versátil, equilibrado y dispuesto a ayudarte en cualquier tarea o duda.",
    systemPrompt:
      "Eres un asistente de inteligencia artificial general, altamente capacitado, educado, claro y conciso. Ayudas al usuario con respuestas estructuradas, precisas y fundamentadas en cualquier tema.",
    avatar: "🧠",
    category: "Productividad",
    tags: ["General", "Productividad", "Asistente", "Eficiencia"],
    usesCount: 142,
    likesCount: 38,
  },
  {
    id: "sys-programador",
    name: "Programador",
    description:
      "Experto en desarrollo de software, arquitectura limpia, depuración y mejores prácticas de código.",
    systemPrompt:
      "Eres un Ingeniero de Software Senior y arquitecto de código. Proporcionas soluciones de programación limpias, eficientes, tipadas y bien documentadas. Explica el razonamiento técnico y proporciona ejemplos funcionales con bloques de código legibles.",
    avatar: "💻",
    category: "Programación",
    tags: ["Python", "JavaScript", "Backend", "Frontend", "Clean Code", "Arquitectura"],
    usesCount: 218,
    likesCount: 64,
  },
  {
    id: "sys-tutor",
    name: "Tutor",
    description:
      "Pedagogo paciente que desglosa conceptos complejos usando la técnica Feynman y ejemplos claros.",
    systemPrompt:
      "Eres un tutor académico y pedagogo experto con gran paciencia. Tu objetivo es ayudar al usuario a aprender y comprender a fondo cualquier concepto. Utiliza analogías intuitivas, haz preguntas socráticas para estimular el pensamiento crítico y desglosa temas difíciles paso a paso.",
    avatar: "🎓",
    category: "Educación",
    tags: ["Educación", "Aprendizaje", "Ciencia", "Matemáticas", "Feynman"],
    usesCount: 95,
    likesCount: 29,
  },
  {
    id: "sys-escritor",
    name: "Escritor",
    description:
      "Especialista en redacción, narrativa persuasiva, corrección de estilo y creatividad literaria.",
    systemPrompt:
      "Eres un escritor, editor y maestro de la prosa. Ayudas a redactar textos elocuentes, artículos cautivadores, correcciones de estilo, ensayos y narrativas creativas con un tono adaptado al público objetivo.",
    avatar: "✍️",
    category: "Escritura",
    tags: ["Escritura", "Redacción", "Literatura", "Copywriting", "Storytelling"],
    usesCount: 110,
    likesCount: 41,
  },
  {
    id: "sys-analista",
    name: "Analista",
    description:
      "Pensador analítico enfocado en datos, resolución de problemas lógicos y toma de decisiones estratégicas.",
    systemPrompt:
      "Eres un analista de datos y estratega de negocios. Analizas problemas con rigor lógico, identificas patrones, evalúas pros y contras y ofreces recomendaciones basadas en datos y marcos analíticos probados.",
    avatar: "📊",
    category: "Negocios",
    tags: ["Datos", "Estrategia", "Finanzas", "Análisis", "Decisiones"],
    usesCount: 84,
    likesCount: 25,
  },
  {
    id: "sys-creativo",
    name: "Asistente creativo",
    description:
      "Generador de ideas innovadoras, lluvia de ideas lateral y conceptos fuera de lo común.",
    systemPrompt:
      "Eres un director creativo y facilitador de innovación. Tu misión es desafiar el pensamiento convencional, generar ideas disruptivas para proyectos, marcas, juegos o historias, y encontrar ángulos frescos e imaginativos.",
    avatar: "🎨",
    category: "Creatividad",
    tags: ["Creatividad", "Brainstorming", "Diseño", "Innovación", "Ideas"],
    usesCount: 127,
    likesCount: 47,
  },
];

function createInitialDb(): DatabaseSchema {
  const now = new Date().toISOString();
  const earlier = new Date(Date.now() - 86400000 * 6).toISOString();
  const midEarlier = new Date(Date.now() - 86400000 * 2).toISOString();

  const demoPassHash = bcrypt.hashSync("demo1234", 8);

  const users: UserRecord[] = [
    {
      id: "user-demo",
      email: "demo@persona.ai",
      username: "demo",
      passwordHash: demoPassHash,
      bio: "Explorando asistentes especializados y flujos de productividad minimalista.",
      avatar: "👤",
      createdAt: earlier,
    },
    {
      id: "user-elena",
      email: "elena@persona.ai",
      username: "elena_dev",
      passwordHash: demoPassHash,
      bio: "Arquitecta de sistemas y diseñadora de prompts técnicos.",
      avatar: "👩‍💻",
      createdAt: earlier,
    },
    {
      id: "user-mateo",
      email: "mateo@persona.ai",
      username: "mateo_edu",
      passwordHash: demoPassHash,
      bio: "Docente e investigador interesado en pedagogía socrática.",
      avatar: "🧑‍🏫",
      createdAt: earlier,
    },
  ];

  const systemPersonalities: PersonalityRecord[] = SYSTEM_PERSONALITIES_SEED.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    systemPrompt: s.systemPrompt,
    avatar: s.avatar,
    ownerId: null,
    isSystem: true,
    visibility: "public",
    category: s.category,
    tags: s.tags,
    likesCount: s.likesCount,
    usesCount: s.usesCount,
    currentVersion: 1,
    versions: [
      {
        versionNumber: 1,
        versionLabel: "v1.0",
        name: s.name,
        description: s.description,
        systemPrompt: s.systemPrompt,
        avatar: s.avatar,
        category: s.category,
        tags: s.tags,
        visibility: "public",
        changeNotes: "Versión inicial oficial",
        createdAt: earlier,
      },
    ],
    createdAt: earlier,
    updatedAt: earlier,
  }));

  const communityPersonalities: PersonalityRecord[] = [
    {
      id: "comm-arquitecto-cloud",
      name: "Arquitecto Cloud",
      description:
        "Especialista en sistemas distribuidos, Kubernetes, observabilidad y diseño resiliente.",
      systemPrompt:
        "Eres un Arquitecto Cloud Principal. Evalúas compromisos entre latencia, costo y resiliencia. Cuando propongas una arquitectura, incluye diagramas textuales claros y pasos concretos de implementación.",
      avatar: "☁️",
      ownerId: "user-elena",
      isSystem: false,
      visibility: "public",
      category: "Programación",
      tags: ["Cloud", "Kubernetes", "Arquitectura", "DevOps"],
      likesCount: 31,
      usesCount: 74,
      currentVersion: 2,
      versions: [
        {
          versionNumber: 1,
          versionLabel: "v1.0",
          name: "Arquitecto Cloud",
          description: "Especialista en infraestructura cloud y contenedores.",
          systemPrompt:
            "Eres un Arquitecto Cloud. Responde con claridad sobre servicios en la nube y Docker.",
          avatar: "☁️",
          category: "Programación",
          tags: ["Cloud", "Docker"],
          visibility: "public",
          changeNotes: "Versión inicial",
          createdAt: earlier,
        },
        {
          versionNumber: 2,
          versionLabel: "v2.0",
          name: "Arquitecto Cloud",
          description:
            "Especialista en sistemas distribuidos, Kubernetes, observabilidad y diseño resiliente.",
          systemPrompt:
            "Eres un Arquitecto Cloud Principal. Evalúas compromisos entre latencia, costo y resiliencia. Cuando propongas una arquitectura, incluye diagramas textuales claros y pasos concretos de implementación.",
          avatar: "☁️",
          category: "Programación",
          tags: ["Cloud", "Kubernetes", "Arquitectura", "DevOps"],
          visibility: "public",
          changeNotes: "Enfoque en resiliencia, observabilidad y trade-offs de costo",
          createdAt: midEarlier,
        },
      ],
      createdAt: earlier,
      updatedAt: midEarlier,
    },
    {
      id: "comm-coach-idiomas",
      name: "Coach de Inglés Técnico",
      description:
        "Practica entrevistas técnicas, documentación y redacción profesional en inglés.",
      systemPrompt:
        "Eres un coach de inglés profesional enfocado en tecnología y negocios. Corrige suavemente los errores gramaticales del usuario explicando el porqué y sugiere expresiones más naturales y concisas.",
      avatar: "🌐",
      ownerId: "user-mateo",
      isSystem: false,
      visibility: "public",
      category: "Idiomas",
      tags: ["Inglés", "Entrevistas", "Comunicación"],
      likesCount: 22,
      usesCount: 53,
      currentVersion: 1,
      versions: [
        {
          versionNumber: 1,
          versionLabel: "v1.0",
          name: "Coach de Inglés Técnico",
          description:
            "Practica entrevistas técnicas, documentación y redacción profesional en inglés.",
          systemPrompt:
            "Eres un coach de inglés profesional enfocado en tecnología y negocios. Corrige suavemente los errores gramaticales del usuario explicando el porqué y sugiere expresiones más naturales y concisas.",
          avatar: "🌐",
          category: "Idiomas",
          tags: ["Inglés", "Entrevistas", "Comunicación"],
          visibility: "public",
          changeNotes: "Versión inicial",
          createdAt: midEarlier,
        },
      ],
      createdAt: midEarlier,
      updatedAt: midEarlier,
    },
    {
      id: "comm-amigos-notas",
      name: "Sintetizador de Reuniones",
      description:
        "Transforma notas desordenadas en minutas ejecutivas con acuerdos y próximos pasos.",
      systemPrompt:
        "Eres un asistente ejecutivo experto en síntesis. Convierte apuntes en resúmenes claros con: Decisiones clave, Tareas pendientes con responsables y Preguntas abiertas.",
      avatar: "📝",
      ownerId: "user-elena",
      isSystem: false,
      visibility: "friends",
      category: "Productividad",
      tags: ["Minutas", "Equipos", "Productividad"],
      likesCount: 9,
      usesCount: 18,
      currentVersion: 1,
      versions: [
        {
          versionNumber: 1,
          versionLabel: "v1.0",
          name: "Sintetizador de Reuniones",
          description:
            "Transforma notas desordenadas en minutas ejecutivas con acuerdos y próximos pasos.",
          systemPrompt:
            "Eres un asistente ejecutivo experto en síntesis. Convierte apuntes en resúmenes claros con: Decisiones clave, Tareas pendientes con responsables y Preguntas abiertas.",
          avatar: "📝",
          category: "Productividad",
          tags: ["Minutas", "Equipos", "Productividad"],
          visibility: "friends",
          changeNotes: "Compartido solo con amigos",
          createdAt: midEarlier,
        },
      ],
      createdAt: midEarlier,
      updatedAt: midEarlier,
    },
    {
      id: "user-demo-p1",
      name: "Revisor Minimalista",
      description:
        "Edita textos técnicos y correos eliminando redundancias para comunicar con máxima claridad.",
      systemPrompt:
        "Eres un editor minimalista obsesionado con la claridad. Toma cualquier borrador del usuario y devuélvelo en una versión directa, amable y libre de relleno, explicando brevemente los 2 o 3 cambios principales.",
      avatar: "✂️",
      ownerId: "user-demo",
      isSystem: false,
      visibility: "public",
      category: "Escritura",
      tags: ["Edición", "Claridad", "Síntesis"],
      likesCount: 5,
      usesCount: 12,
      currentVersion: 1,
      versions: [
        {
          versionNumber: 1,
          versionLabel: "v1.0",
          name: "Revisor Minimalista",
          description:
            "Edita textos técnicos y correos eliminando redundancias para comunicar con máxima claridad.",
          systemPrompt:
            "Eres un editor minimalista obsesionado con la claridad. Toma cualquier borrador del usuario y devuélvelo en una versión directa, amable y libre de relleno, explicando brevemente los 2 o 3 cambios principales.",
          avatar: "✂️",
          category: "Escritura",
          tags: ["Edición", "Claridad", "Síntesis"],
          visibility: "public",
          changeNotes: "Versión inicial",
          createdAt: midEarlier,
        },
      ],
      createdAt: midEarlier,
      updatedAt: midEarlier,
    },
  ];

  const friendships: FriendshipRecord[] = [
    {
      id: "fr-demo-elena",
      requesterId: "user-demo",
      receiverId: "user-elena",
      status: "accepted",
      createdAt: earlier,
      updatedAt: earlier,
    },
    {
      id: "fr-mateo-demo",
      requesterId: "user-mateo",
      receiverId: "user-demo",
      status: "pending",
      createdAt: midEarlier,
      updatedAt: midEarlier,
    },
  ];

  const chats: ChatRecord[] = [
    {
      id: "chat-demo-welcome",
      userId: "user-demo",
      personalityId: "sys-programador",
      personalityVersion: 1,
      personalitySnapshot: {
        name: "Programador",
        description: SYSTEM_PERSONALITIES_SEED[1].description,
        systemPrompt: SYSTEM_PERSONALITIES_SEED[1].systemPrompt,
        avatar: "💻",
        category: "Programación",
        versionNumber: 1,
        versionLabel: "v1.0",
      },
      title: "Estructura limpia en TypeScript",
      messages: [
        {
          id: "msg-1",
          role: "user",
          content: "¿Cómo organizo un servicio pequeño en TypeScript para que sea fácil de mantener?",
          createdAt: midEarlier,
        },
        {
          id: "msg-2",
          role: "assistant",
          content:
            "Para mantener un servicio en TypeScript limpio y predecible, separa **tres responsabilidades** desde el inicio:\n\n1. **Tipos y contratos (`types.ts`)**: Define tus interfaces antes de escribir lógica.\n2. **Acceso a datos (`store.ts`)**: Encapsula lectura, escritura y validaciones de persistencia.\n3. **Capa HTTP (`server.ts`)**: Mantén las rutas delgadas; solo validan entradas, llaman al servicio y devuelven respuestas JSON consistentes.\n\n```ts\nexport interface ApiResult<T> {\n  ok: boolean;\n  data?: T;\n  error?: string;\n}\n```\n\nSi quieres, revisamos un módulo concreto que estés diseñando.",
          createdAt: midEarlier,
        },
      ],
      createdAt: midEarlier,
      updatedAt: now,
    },
  ];

  return {
    users,
    personalities: [...systemPersonalities, ...communityPersonalities],
    chats,
    friendships,
    likes: [{ userId: "user-demo", personalityId: "comm-arquitecto-cloud", createdAt: midEarlier }],
    sessions: [],
  };
}

class Store {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(DB_FILE)) {
        const seeded = createInitialDb();
        fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2), "utf8");
        return seeded;
      }
      const raw = fs.readFileSync(DB_FILE, "utf8");
      const parsed = JSON.parse(raw) as DatabaseSchema;
      if (!parsed.users || !parsed.personalities) {
        const seeded = createInitialDb();
        fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2), "utf8");
        return seeded;
      }
      return parsed;
    } catch {
      return createInitialDb();
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), "utf8");
    } catch (err) {
      console.error("Error persisting DB:", err);
    }
  }

  public toPublicUser(user: UserRecord): PublicUser {
    return {
      id: user.id,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };
  }

  // ---- Auth & Sessions ----
  public createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString("hex");
    this.db.sessions.push({
      token,
      userId,
      createdAt: new Date().toISOString(),
    });
    if (this.db.sessions.length > 200) {
      this.db.sessions = this.db.sessions.slice(-200);
    }
    this.save();
    return token;
  }

  public deleteSession(token: string) {
    this.db.sessions = this.db.sessions.filter((s) => s.token !== token);
    this.save();
  }

  public getUserBySessionToken(token: string | undefined): UserRecord | null {
    if (!token) return null;
    const session = this.db.sessions.find((s) => s.token === token);
    if (!session) return null;
    return this.db.users.find((u) => u.id === session.userId) ?? null;
  }

  public registerUser(params: {
    email: string;
    username: string;
    password: string;
    bio?: string;
    avatar?: string;
  }): { user?: UserRecord; error?: string } {
    const email = params.email.trim().toLowerCase();
    const username = params.username.trim();
    const password = params.password;

    if (!email || !email.includes("@")) {
      return { error: "Ingresa un correo electrónico válido." };
    }
    if (!username || username.length < 3 || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return {
        error:
          "El nombre de usuario debe tener al menos 3 caracteres (letras, números, guion o punto).",
      };
    }
    if (!password || password.length < 6) {
      return { error: "La contraseña debe tener al menos 6 caracteres." };
    }
    if (this.db.users.some((u) => u.email.toLowerCase() === email)) {
      return { error: "Ya existe una cuenta con ese correo electrónico." };
    }
    if (
      this.db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())
    ) {
      return { error: "Ese nombre de usuario ya está en uso." };
    }

    const user: UserRecord = {
      id: `user-${crypto.randomUUID()}`,
      email,
      username,
      passwordHash: bcrypt.hashSync(password, 8),
      bio: (params.bio || "").trim(),
      avatar: (params.avatar || "👤").trim() || "👤",
      createdAt: new Date().toISOString(),
    };
    this.db.users.push(user);
    this.save();
    return { user };
  }

  public authenticateUser(
    identifier: string,
    password: string
  ): { user?: UserRecord; error?: string } {
    const clean = identifier.trim().toLowerCase();
    const user = this.db.users.find(
      (u) => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean
    );
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return { error: "Credenciales incorrectas. Verifica tu usuario y contraseña." };
    }
    return { user };
  }

  public getUserById(id: string): UserRecord | null {
    return this.db.users.find((u) => u.id === id) ?? null;
  }

  public getUserByUsername(username: string): UserRecord | null {
    const clean = username.trim().toLowerCase();
    return this.db.users.find((u) => u.username.toLowerCase() === clean) ?? null;
  }

  public updateUserProfile(
    userId: string,
    bio: string,
    avatar: string
  ): UserRecord | null {
    const user = this.getUserById(userId);
    if (!user) return null;
    user.bio = bio.trim();
    user.avatar = avatar.trim() || "👤";
    this.save();
    return user;
  }

  // ---- Friendships ----
  public areFriends(userAId: string | null, userBId: string | null): boolean {
    if (!userAId || !userBId) return false;
    if (userAId === userBId) return true;
    const rel = this.findFriendshipBetween(userAId, userBId);
    return rel !== null && rel.status === "accepted";
  }

  public findFriendshipBetween(
    userAId: string,
    userBId: string
  ): FriendshipRecord | null {
    return (
      this.db.friendships.find(
        (f) =>
          (f.requesterId === userAId && f.receiverId === userBId) ||
          (f.requesterId === userBId && f.receiverId === userAId)
      ) ?? null
    );
  }

  public sendFriendRequest(
    requesterId: string,
    receiverUsername: string
  ): { friendship?: FriendshipRecord; message?: string; error?: string } {
    const clean = receiverUsername.trim().replace(/^@/, "");
    if (!clean) return { error: "Debes especificar el nombre del usuario." };
    const receiver = this.getUserByUsername(clean);
    if (!receiver) return { error: `No se encontró al usuario '${clean}'.` };
    if (receiver.id === requesterId) {
      return { error: "No puedes enviarte una solicitud de amistad a ti mismo." };
    }

    const existing = this.findFriendshipBetween(requesterId, receiver.id);
    if (existing) {
      if (existing.status === "accepted") {
        return { error: "Ya son amigos." };
      }
      if (existing.status === "pending") {
        if (existing.requesterId === requesterId) {
          return { error: "Ya enviaste una solicitud pendiente a este usuario." };
        }
        existing.status = "accepted";
        existing.updatedAt = new Date().toISOString();
        this.save();
        return {
          friendship: existing,
          message: "¡Solicitud mutua aceptada! Ahora son amigos.",
        };
      }
      if (existing.status === "rejected") {
        existing.status = "pending";
        existing.requesterId = requesterId;
        existing.receiverId = receiver.id;
        existing.updatedAt = new Date().toISOString();
        this.save();
        return { friendship: existing, message: `Solicitud enviada a @${receiver.username}.` };
      }
    }

    const now = new Date().toISOString();
    const friendship: FriendshipRecord = {
      id: `fr-${crypto.randomUUID()}`,
      requesterId,
      receiverId: receiver.id,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    this.db.friendships.push(friendship);
    this.save();
    return { friendship, message: `Solicitud de amistad enviada a @${receiver.username}.` };
  }

  public acceptFriendRequest(
    userId: string,
    friendshipId: string
  ): { ok: boolean; error?: string } {
    const rel = this.db.friendships.find((f) => f.id === friendshipId);
    if (!rel) return { ok: false, error: "Solicitud no encontrada." };
    if (rel.receiverId !== userId) {
      return { ok: false, error: "No tienes permiso para responder a esta solicitud." };
    }
    rel.status = "accepted";
    rel.updatedAt = new Date().toISOString();
    this.save();
    return { ok: true };
  }

  public rejectFriendRequest(
    userId: string,
    friendshipId: string
  ): { ok: boolean; error?: string } {
    const rel = this.db.friendships.find((f) => f.id === friendshipId);
    if (!rel) return { ok: false, error: "Solicitud no encontrada." };
    if (rel.receiverId !== userId && rel.requesterId !== userId) {
      return { ok: false, error: "No tienes permiso para modificar esta relación." };
    }
    this.db.friendships = this.db.friendships.filter((f) => f.id !== friendshipId);
    this.save();
    return { ok: true };
  }

  public removeFriendship(
    userId: string,
    targetUserId: string
  ): { ok: boolean; error?: string } {
    const rel = this.findFriendshipBetween(userId, targetUserId);
    if (!rel) return { ok: false, error: "No existe una relación de amistad." };
    this.db.friendships = this.db.friendships.filter((f) => f.id !== rel.id);
    this.save();
    return { ok: true };
  }

  public getFriendshipsDetailed(userId: string) {
    const all = this.db.friendships.filter(
      (f) => f.requesterId === userId || f.receiverId === userId
    );
    const friends: Array<{
      friendshipId: string;
      user: PublicUser;
      createdAt: string;
    }> = [];
    const pendingReceived: Array<{
      friendshipId: string;
      user: PublicUser;
      createdAt: string;
    }> = [];
    const pendingSent: Array<{
      friendshipId: string;
      user: PublicUser;
      createdAt: string;
    }> = [];

    for (const rel of all) {
      const isRequester = rel.requesterId === userId;
      const otherId = isRequester ? rel.receiverId : rel.requesterId;
      const otherUser = this.getUserById(otherId);
      if (!otherUser) continue;
      const item = {
        friendshipId: rel.id,
        user: this.toPublicUser(otherUser),
        createdAt: rel.createdAt,
      };
      if (rel.status === "accepted") {
        friends.push(item);
      } else if (rel.status === "pending") {
        if (isRequester) pendingSent.push(item);
        else pendingReceived.push(item);
      }
    }
    return { friends, pendingReceived, pendingSent };
  }

  // ---- Personalities ----
  public getSystemPersonalities(): PersonalityRecord[] {
    return this.db.personalities.filter((p) => p.isSystem);
  }

  public getUserPersonalities(userId: string): PersonalityRecord[] {
    return this.db.personalities
      .filter((p) => p.ownerId === userId && !p.isSystem)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  public getPersonalityById(id: string): PersonalityRecord | null {
    return this.db.personalities.find((p) => p.id === id) ?? null;
  }

  public canUserAccessPersonality(
    userId: string | null,
    personality: PersonalityRecord
  ): boolean {
    if (personality.isSystem) return true;
    if (personality.visibility === "public") return true;
    if (!userId) return false;
    if (personality.ownerId === userId) return true;
    if (personality.visibility === "friends" && personality.ownerId) {
      return this.areFriends(userId, personality.ownerId);
    }
    return false;
  }

  public canUserEditPersonality(
    userId: string | null,
    personality: PersonalityRecord
  ): boolean {
    if (!userId || personality.isSystem) return false;
    return personality.ownerId === userId;
  }

  public createPersonality(params: {
    userId: string;
    name: string;
    description: string;
    systemPrompt: string;
    avatar?: string;
    visibility?: Visibility;
    category?: string;
    tags?: string[] | string;
  }): { personality?: PersonalityRecord; error?: string } {
    const name = params.name.trim();
    const description = params.description.trim();
    const systemPrompt = params.systemPrompt.trim();
    if (!name) return { error: "El nombre de la personalidad es obligatorio." };
    if (!description) return { error: "La descripción breve es obligatoria." };
    if (!systemPrompt) return { error: "El System Prompt es obligatorio." };

    const rawTags = Array.isArray(params.tags)
      ? params.tags
      : (params.tags || "").split(",");
    const tags = Array.from(
      new Set(rawTags.map((t) => t.trim()).filter(Boolean))
    );

    const visibility: Visibility =
      params.visibility === "private" ||
      params.visibility === "friends" ||
      params.visibility === "public"
        ? params.visibility
        : "public";

    const avatar = (params.avatar || "🤖").trim() || "🤖";
    const category = (params.category || "Otros").trim() || "Otros";
    const now = new Date().toISOString();

    const firstVersion: PersonalityVersion = {
      versionNumber: 1,
      versionLabel: "v1.0",
      name,
      description,
      systemPrompt,
      avatar,
      category,
      tags,
      visibility,
      changeNotes: "Versión inicial",
      createdAt: now,
    };

    const personality: PersonalityRecord = {
      id: `pers-${crypto.randomUUID()}`,
      name,
      description,
      systemPrompt,
      avatar,
      ownerId: params.userId,
      isSystem: false,
      visibility,
      category,
      tags,
      likesCount: 0,
      usesCount: 0,
      currentVersion: 1,
      versions: [firstVersion],
      createdAt: now,
      updatedAt: now,
    };

    this.db.personalities.push(personality);
    this.save();
    return { personality };
  }

  public updatePersonality(params: {
    userId: string;
    personalityId: string;
    name: string;
    description: string;
    systemPrompt: string;
    avatar?: string;
    visibility?: Visibility;
    category?: string;
    tags?: string[] | string;
    changeNotes?: string;
  }): { personality?: PersonalityRecord; error?: string } {
    const personality = this.getPersonalityById(params.personalityId);
    if (!personality) return { error: "Personalidad no encontrada." };
    if (!this.canUserEditPersonality(params.userId, personality)) {
      return { error: "No tienes permiso para modificar esta personalidad." };
    }

    const name = params.name.trim();
    const description = params.description.trim();
    const systemPrompt = params.systemPrompt.trim();
    if (!name) return { error: "El nombre no puede estar vacío." };
    if (!description) return { error: "La descripción no puede estar vacía." };
    if (!systemPrompt) return { error: "El System Prompt no puede estar vacío." };

    const rawTags = Array.isArray(params.tags)
      ? params.tags
      : (params.tags || "").split(",");
    const tags = Array.from(
      new Set(rawTags.map((t) => t.trim()).filter(Boolean))
    );

    const visibility: Visibility =
      params.visibility === "private" ||
      params.visibility === "friends" ||
      params.visibility === "public"
        ? params.visibility
        : personality.visibility;

    const avatar = (params.avatar || personality.avatar || "🤖").trim();
    const category = (params.category || personality.category || "Otros").trim();
    const now = new Date().toISOString();
    const nextVersionNumber =
      (personality.versions.length > 0
        ? Math.max(...personality.versions.map((v) => v.versionNumber))
        : personality.currentVersion) + 1;

    const notes =
      params.changeNotes && params.changeNotes.trim()
        ? params.changeNotes.trim()
        : `Actualización a v${nextVersionNumber}.0`;

    const newVersion: PersonalityVersion = {
      versionNumber: nextVersionNumber,
      versionLabel: `v${nextVersionNumber}.0`,
      name,
      description,
      systemPrompt,
      avatar,
      category,
      tags,
      visibility,
      changeNotes: notes,
      createdAt: now,
    };

    personality.versions.push(newVersion);
    personality.currentVersion = nextVersionNumber;
    personality.name = name;
    personality.description = description;
    personality.systemPrompt = systemPrompt;
    personality.avatar = avatar;
    personality.category = category;
    personality.tags = tags;
    personality.visibility = visibility;
    personality.updatedAt = now;

    this.save();
    return { personality };
  }

  public deletePersonality(
    userId: string,
    personalityId: string
  ): { ok: boolean; error?: string } {
    const personality = this.getPersonalityById(personalityId);
    if (!personality) return { ok: false, error: "Personalidad no encontrada." };
    if (!this.canUserEditPersonality(userId, personality)) {
      return { ok: false, error: "No tienes permiso para eliminar esta personalidad." };
    }
    this.db.personalities = this.db.personalities.filter(
      (p) => p.id !== personalityId
    );
    this.db.likes = this.db.likes.filter((l) => l.personalityId !== personalityId);
    this.save();
    return { ok: true };
  }

  public getUserLikedIds(userId: string | null): Set<string> {
    if (!userId) return new Set();
    return new Set(
      this.db.likes
        .filter((l) => l.userId === userId)
        .map((l) => l.personalityId)
    );
  }

  public toggleLike(
    userId: string,
    personalityId: string
  ): { isLiked: boolean; likesCount: number; error?: string } {
    const personality = this.getPersonalityById(personalityId);
    if (!personality) {
      return { isLiked: false, likesCount: 0, error: "Personalidad no encontrada." };
    }
    if (!this.canUserAccessPersonality(userId, personality)) {
      return {
        isLiked: false,
        likesCount: personality.likesCount,
        error: "No tienes permiso para interactuar con esta personalidad.",
      };
    }

    const idx = this.db.likes.findIndex(
      (l) => l.userId === userId && l.personalityId === personalityId
    );
    if (idx >= 0) {
      this.db.likes.splice(idx, 1);
      personality.likesCount = Math.max(0, personality.likesCount - 1);
      this.save();
      return { isLiked: false, likesCount: personality.likesCount };
    }

    this.db.likes.push({
      userId,
      personalityId,
      createdAt: new Date().toISOString(),
    });
    personality.likesCount += 1;
    this.save();
    return { isLiked: true, likesCount: personality.likesCount };
  }

  public getCommunityFeed(params: {
    query?: string;
    category?: string;
    tag?: string;
    sortBy?: string;
    page?: number;
    perPage?: number;
    currentUserId?: string | null;
  }) {
    const q = (params.query || "").trim().toLowerCase();
    const category = (params.category || "all").trim();
    const tag = (params.tag || "").trim().toLowerCase();
    const sortBy = params.sortBy || "popular";
    const page = Math.max(1, params.page || 1);
    const perPage = Math.max(1, Math.min(50, params.perPage || 12));

    let items = this.db.personalities.filter((p) => {
      if (p.visibility === "public" || p.isSystem) return true;
      if (
        p.visibility === "friends" &&
        params.currentUserId &&
        p.ownerId &&
        (p.ownerId === params.currentUserId ||
          this.areFriends(params.currentUserId, p.ownerId))
      ) {
        return true;
      }
      return false;
    });

    if (category && category !== "all") {
      items = items.filter((p) => p.category === category);
    }

    if (tag) {
      items = items.filter((p) =>
        p.tags.some((t) => t.toLowerCase() === tag)
      );
    }

    if (q) {
      items = items.filter((p) => {
        const owner = p.ownerId ? this.getUserById(p.ownerId) : null;
        const ownerMatch = owner
          ? owner.username.toLowerCase().includes(q)
          : false;
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          ownerMatch
        );
      });
    }

    items = [...items].sort((a, b) => {
      if (sortBy === "uses") return b.usesCount - a.usesCount;
      if (sortBy === "recent") return b.createdAt.localeCompare(a.createdAt);
      if (b.likesCount !== a.likesCount) return b.likesCount - a.likesCount;
      return b.usesCount - a.usesCount;
    });

    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(page, pages);
    const start = (safePage - 1) * perPage;
    const paged = items.slice(start, start + perPage);

    const likedIds = this.getUserLikedIds(params.currentUserId ?? null);

    return {
      items: paged.map((p) => {
        const owner = p.ownerId && !p.isSystem ? this.getUserById(p.ownerId) : null;
        return {
          personality: p,
          creatorName: p.isSystem ? "Equipo Dochad" : owner?.username || "Usuario",
          creatorAvatar: p.isSystem ? "✨" : owner?.avatar || "👤",
          creatorUsername: owner?.username || null,
          isLiked: likedIds.has(p.id),
        };
      }),
      total,
      page: safePage,
      perPage,
      pages,
      hasPrev: safePage > 1,
      hasNext: safePage < pages,
    };
  }

  // ---- Chats ----
  public getUserChats(userId: string, limit?: number): ChatRecord[] {
    const list = this.db.chats
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return limit ? list.slice(0, limit) : list;
  }

  public getChatForUser(
    userId: string,
    chatId: string
  ): { chat?: ChatRecord; error?: string } {
    const chat = this.db.chats.find((c) => c.id === chatId);
    if (!chat) return { error: "Conversación no encontrada." };
    if (chat.userId !== userId) {
      return { error: "No tienes permiso para acceder a esta conversación." };
    }
    return { chat };
  }

  private buildSnapshot(
    personality: PersonalityRecord,
    versionNumber?: number
  ): { version: number; snapshot: ChatSnapshot } {
    const targetNum = versionNumber ?? personality.currentVersion;
    const found =
      personality.versions.find((v) => v.versionNumber === targetNum) ??
      personality.versions[personality.versions.length - 1];

    if (found) {
      return {
        version: found.versionNumber,
        snapshot: {
          name: found.name,
          description: found.description,
          systemPrompt: found.systemPrompt,
          avatar: found.avatar,
          category: found.category,
          versionNumber: found.versionNumber,
          versionLabel: found.versionLabel,
        },
      };
    }

    return {
      version: personality.currentVersion,
      snapshot: {
        name: personality.name,
        description: personality.description,
        systemPrompt: personality.systemPrompt,
        avatar: personality.avatar,
        category: personality.category,
        versionNumber: personality.currentVersion,
        versionLabel: `v${personality.currentVersion}.0`,
      },
    };
  }

  public createChat(
    userId: string,
    personalityId: string,
    versionNumber?: number
  ): { chat?: ChatRecord; error?: string } {
    const personality = this.getPersonalityById(personalityId);
    if (!personality) return { error: "Personalidad no encontrada." };
    if (!this.canUserAccessPersonality(userId, personality)) {
      return { error: "No tienes permiso para usar esta personalidad." };
    }

    const { version, snapshot } = this.buildSnapshot(personality, versionNumber);
    const now = new Date().toISOString();

    const chat: ChatRecord = {
      id: `chat-${crypto.randomUUID()}`,
      userId,
      personalityId: personality.id,
      personalityVersion: version,
      personalitySnapshot: snapshot,
      title: `Chat con ${snapshot.name}`,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    personality.usesCount += 1;
    this.db.chats.push(chat);
    this.save();
    return { chat };
  }

  public syncChatPersonalityVersion(
    userId: string,
    chatId: string,
    targetVersion?: number
  ): { chat?: ChatRecord; error?: string } {
    const { chat, error } = this.getChatForUser(userId, chatId);
    if (error || !chat) return { error: error || "Chat no encontrado." };
    if (!chat.personalityId) {
      return { error: "Este chat ya no está vinculado a una personalidad activa." };
    }

    const personality = this.getPersonalityById(chat.personalityId);
    if (!personality) {
      return {
        error:
          "La personalidad original fue eliminada. El chat conserva su snapshot original de forma segura.",
      };
    }

    const { version, snapshot } = this.buildSnapshot(personality, targetVersion);
    chat.personalityVersion = version;
    chat.personalitySnapshot = snapshot;
    chat.updatedAt = new Date().toISOString();
    this.save();
    return { chat };
  }

  public appendChatMessage(
    chatId: string,
    role: "user" | "assistant",
    content: string
  ) {
    const chat = this.db.chats.find((c) => c.id === chatId);
    if (!chat) return null;

    const now = new Date().toISOString();
    if (
      role === "user" &&
      (chat.messages.length === 0 ||
        chat.title.startsWith("Chat con ") ||
        chat.title === "Nuevo chat")
    ) {
      const clean = content.trim();
      chat.title = clean.length > 35 ? `${clean.slice(0, 35).trim()}...` : clean;
    }

    const msg = {
      id: `msg-${crypto.randomUUID()}`,
      role,
      content,
      createdAt: now,
    };
    chat.messages.push(msg);
    chat.updatedAt = now;
    this.save();
    return msg;
  }

  public deleteChat(
    userId: string,
    chatId: string
  ): { ok: boolean; error?: string } {
    const { chat, error } = this.getChatForUser(userId, chatId);
    if (error || !chat) return { ok: false, error: error || "Chat no encontrado." };
    this.db.chats = this.db.chats.filter((c) => c.id !== chatId);
    this.save();
    return { ok: true };
  }
}

export const store = new Store();
