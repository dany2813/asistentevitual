import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  ChevronLeft,
  History,
  Info,
  MessageSquare,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { api } from "../api";
import type { Chat, Personality } from "../types";
import type { AppRoute } from "../components/TopBar";
import { AvatarDisplay } from "../components/AvatarDisplay";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { NewChatModal } from "../components/NewChatModal";

interface ChatsPageProps {
  initialChatId?: string;
  onNavigate: (route: AppRoute) => void;
}

export function ChatsPage({ initialChatId, onNavigate }: ChatsPageProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [systemPersonalities, setSystemPersonalities] = useState<Personality[]>([]);
  const [myPersonalities, setMyPersonalities] = useState<Personality[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [linkedPersonality, setLinkedPersonality] = useState<Personality | null>(
    null
  );

  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [input, setInput] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "active" | "empty">("all");
  const [mobileShowList, setMobileShowList] = useState(!initialChatId);

  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [syncingVersion, setSyncingVersion] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function loadChatList(selectId?: string) {
    setLoadingList(true);
    try {
      const res = await api.getChats();
      setChats(res.chats);
      setSystemPersonalities(res.systemPersonalities);
      setMyPersonalities(res.myPersonalities);

      const targetId = selectId || initialChatId;
      if (targetId) {
        await openChat(targetId);
      } else {
        setActiveChat(null);
        setLinkedPersonality(null);
      }
    } catch (err) {
      setChatError(
        err instanceof Error ? err.message : "No se pudieron cargar los chats."
      );
    } finally {
      setLoadingList(false);
    }
  }

  async function openChat(chatId: string) {
    setLoadingChat(true);
    setChatError("");
    setMobileShowList(false);
    try {
      const res = await api.getChat(chatId);
      setActiveChat(res.chat);
      setLinkedPersonality(res.personality);
    } catch (err) {
      setChatError(
        err instanceof Error ? err.message : "No se pudo abrir la conversación."
      );
    } finally {
      setLoadingChat(false);
    }
  }

  useEffect(() => {
    loadChatList(initialChatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages.length, sending]);

  async function handleCreateChat(personalityId: string) {
    setNewChatModalOpen(false);
    try {
      const res = await api.createChat(personalityId);
      setChats((prev) => [res.chat, ...prev]);
      onNavigate({ name: "chats", chatId: res.chat.id });
    } catch (err) {
      setChatError(
        err instanceof Error ? err.message : "No se pudo crear la conversación."
      );
    }
  }

  async function handleSend() {
    if (!activeChat || !input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setChatError("");

    const optimisticUserMsg = {
      id: `tmp-${Date.now()}`,
      role: "user" as const,
      content: text,
      createdAt: new Date().toISOString(),
    };

    setActiveChat((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimisticUserMsg] } : prev
    );
    setSending(true);

    try {
      const res = await api.sendMessage(activeChat.id, text);
      setActiveChat(res.chat);
      setChats((prev) =>
        [res.chat, ...prev.filter((c) => c.id !== res.chat.id)]
      );
    } catch (err) {
      setChatError(
        err instanceof Error ? err.message : "Error al enviar el mensaje."
      );
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleSyncVersion(versionNumber: number) {
    if (!activeChat) return;
    setSyncingVersion(versionNumber);
    try {
      const res = await api.syncChatPersonality(activeChat.id, versionNumber);
      setActiveChat(res.chat);
      setChats((prev) =>
        prev.map((c) => (c.id === res.chat.id ? res.chat : c))
      );
      setVersionModalOpen(false);
    } catch (err) {
      setChatError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la versión del chat."
      );
    } finally {
      setSyncingVersion(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await api.deleteChat(deleteTargetId);
      const remaining = chats.filter((c) => c.id !== deleteTargetId);
      setChats(remaining);
      if (activeChat?.id === deleteTargetId) {
        setActiveChat(null);
        setLinkedPersonality(null);
        onNavigate({ name: "chats" });
      }
      setDeleteTargetId(null);
    } catch (err) {
      setChatError(
        err instanceof Error ? err.message : "No se pudo eliminar el chat."
      );
    } finally {
      setDeleting(false);
    }
  }

  const filteredChats = chats.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.personalitySnapshot.name.toLowerCase().includes(q) ||
      c.messages.some((m) => m.content.toLowerCase().includes(q));

    const hasMessages = c.messages.length > 0;
    if (filterMode === "active" && !hasMessages) return false;
    if (filterMode === "empty" && hasMessages) return false;
    return matchesQuery;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-0 sm:px-6 py-0 sm:py-6 h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="flex-1 min-h-0 flex rounded-none sm:rounded-2xl border-y sm:border border-[#DBDBDB] bg-white overflow-hidden">
        {/* Left Sidebar: Chat List & Search */}
        <aside
          className={`w-full md:w-[310px] shrink-0 border-r border-[#DBDBDB] flex flex-col bg-[#FAFBFD] ${
            mobileShowList ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="p-4 border-b border-[#E7E9EE] space-y-3 bg-white">
            <div className="flex items-center justify-between gap-2">
              <h1 className="font-display text-base font-semibold text-[#1A1D24]">
                Conversaciones
              </h1>
              <button
                type="button"
                onClick={() => setNewChatModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo chat
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título o personalidad..."
                className="w-full h-9 pl-8 pr-8 text-xs rounded-lg border border-[#DBDBDB] bg-[#FAFBFD] text-[#1A1D24] focus:bg-white focus:border-[#5099D6]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#1A1D24] cursor-pointer"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-[#F3F5F8] border border-[#E7E9EE]">
              {(
                [
                  { id: "all", label: "Todos" },
                  { id: "active", label: "Activos" },
                  { id: "empty", label: "Vacíos" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterMode(f.id)}
                  className={`py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    filterMode === f.id
                      ? "bg-white text-[#1A1D24] border border-[#DBDBDB]"
                      : "text-[#6B6B6B] hover:text-[#1A1D24]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
            {loadingList ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-lg bg-[#E7E9EE]/60 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredChats.length > 0 ? (
              filteredChats.map((c) => {
                const isSelected = activeChat?.id === c.id;
                return (
                  <div
                    key={c.id}
                    className={`group flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors ${
                      isSelected
                        ? "bg-white border-[#5099D6]"
                        : "bg-transparent border-transparent hover:bg-white hover:border-[#E7E9EE]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate({ name: "chats", chatId: c.id })
                      }
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <AvatarDisplay
                        avatar={c.personalitySnapshot.avatar}
                        alt={c.personalitySnapshot.name}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-[#1A1D24] truncate">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-[#6B6B6B] truncate tabular-nums">
                          {c.personalitySnapshot.name} · v{c.personalityVersion}.0
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(c.id)}
                      className="p-1.5 rounded-lg text-[#6B6B6B] opacity-60 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all shrink-0 cursor-pointer"
                      aria-label="Eliminar conversación"
                      title="Eliminar conversación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 px-4">
                <p className="text-xs text-[#6B6B6B]">
                  {chats.length === 0
                    ? "No tienes conversaciones todavía."
                    : "No hay conversaciones que coincidan con tu filtro."}
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Right Main Chat Area */}
        <main
          className={`flex-1 flex flex-col min-w-0 bg-white ${
            mobileShowList ? "hidden md:flex" : "flex"
          }`}
        >
          {loadingChat ? (
            <div className="flex-1 flex items-center justify-center text-sm text-[#6B6B6B]">
              Cargando conversación...
            </div>
          ) : activeChat ? (
            <>
              {/* Active Chat Header */}
              <div className="px-4 sm:px-6 py-3.5 border-b border-[#E7E9EE] flex items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileShowList(true)}
                    className="md:hidden p-1.5 -ml-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1D24] hover:bg-[#F3F5F8] cursor-pointer"
                    aria-label="Volver a la lista"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <AvatarDisplay
                    avatar={activeChat.personalitySnapshot.avatar}
                    alt={activeChat.personalitySnapshot.name}
                    size="md"
                  />
                  <div className="min-w-0">
                    <h2 className="font-display text-sm sm:text-base font-semibold text-[#1A1D24] truncate">
                      {activeChat.personalitySnapshot.name}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] truncate tabular-nums">
                      <span>{activeChat.personalitySnapshot.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">
                        v{activeChat.personalityVersion}.0
                      </span>
                      {linkedPersonality &&
                        linkedPersonality.currentVersion >
                          activeChat.personalityVersion && (
                          <>
                            <span aria-hidden="true">·</span>
                            <button
                              type="button"
                              onClick={() => setVersionModalOpen(true)}
                              className="text-[#3778AE] font-medium hover:underline cursor-pointer"
                            >
                              Nueva v{linkedPersonality.currentVersion}.0 disponible
                            </button>
                          </>
                        )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {linkedPersonality && (
                    <button
                      type="button"
                      onClick={() => setVersionModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#DBDBDB] text-[#1A1D24] hover:bg-[#F3F5F8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-[#5099D6]" />
                      <span className="hidden sm:inline">Versiones</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setInfoModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#DBDBDB] text-[#1A1D24] hover:bg-[#F3F5F8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-[#6B6B6B]" />
                    <span className="hidden sm:inline">Snapshot</span>
                  </button>
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 bg-[#FAFBFD]">
                {activeChat.messages.length === 0 && (
                  <div className="max-w-lg mx-auto my-8 p-6 rounded-2xl bg-white border border-[#DBDBDB] text-center space-y-2">
                    <div className="flex justify-center mb-2">
                      <AvatarDisplay
                        avatar={activeChat.personalitySnapshot.avatar}
                        alt={activeChat.personalitySnapshot.name}
                        size="lg"
                      />
                    </div>
                    <h3 className="font-display text-base font-semibold text-[#1A1D24]">
                      Conversa con {activeChat.personalitySnapshot.name}
                    </h3>
                    <p className="text-xs text-[#6B6B6B] leading-relaxed">
                      {activeChat.personalitySnapshot.description}
                    </p>
                  </div>
                )}

                {activeChat.messages.map((msg) =>
                  msg.role === "user" ? (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[82%] sm:max-w-[70%] px-4 py-3 rounded-2xl rounded-tr-sm bg-[#5099D6]/12 border border-[#76A4F9]/35 text-sm text-[#1A1D24] leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="flex items-start gap-3 max-w-3xl">
                      <AvatarDisplay
                        avatar={activeChat.personalitySnapshot.avatar}
                        alt={activeChat.personalitySnapshot.name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0 px-4 py-3.5 rounded-2xl rounded-tl-sm bg-white border border-[#DBDBDB]">
                        <MarkdownRenderer content={msg.content} />
                      </div>
                    </div>
                  )
                )}

                {sending && (
                  <div className="flex items-start gap-3 max-w-3xl">
                    <AvatarDisplay
                      avatar={activeChat.personalitySnapshot.avatar}
                      alt={activeChat.personalitySnapshot.name}
                      size="sm"
                    />
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-[#DBDBDB] text-xs text-[#6B6B6B]">
                      Escribiendo respuesta...
                    </div>
                  </div>
                )}

                {chatError && (
                  <div
                    role="alert"
                    className="max-w-2xl mx-auto px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700"
                  >
                    {chatError}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="p-4 sm:px-6 border-t border-[#E7E9EE] bg-white">
                <div className="max-w-3xl mx-auto flex items-end gap-2.5">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(
                        e.target.scrollHeight,
                        160
                      )}px`;
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={`Escribe un mensaje a ${activeChat.personalitySnapshot.name}...`}
                    className="flex-1 resize-none min-h-[42px] max-h-[160px] px-3.5 py-2.5 text-sm rounded-xl border border-[#DBDBDB] bg-[#FAFBFD] text-[#1A1D24] focus:bg-white focus:border-[#5099D6]"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="h-[42px] px-4 rounded-xl bg-[#3778AE] text-white hover:bg-[#2E6796] disabled:opacity-45 transition-colors inline-flex items-center justify-center shrink-0 cursor-pointer"
                    aria-label="Enviar mensaje"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="max-w-3xl mx-auto text-[11px] text-[#6B6B6B] mt-2">
                  Enter para enviar · Shift + Enter para nueva línea
                </p>
              </div>
            </>
          ) : (
            /* Empty / Hub Overview when no chat selected */
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center bg-[#FAFBFD]">
              <div className="max-w-lg space-y-5">
                <div className="w-12 h-12 rounded-2xl bg-[#5099D6]/12 border border-[#76A4F9]/30 flex items-center justify-center mx-auto text-[#3778AE]">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-[#1A1D24]">
                    Espacio de conversación
                  </h2>
                  <p className="text-sm text-[#6B6B6B] mt-1">
                    Selecciona un hilo en el panel lateral o comienza un nuevo chat con cualquier personalidad.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewChatModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Elegir personalidad
                  </button>
                </div>

                {systemPersonalities.length > 0 && (
                  <div className="pt-4 border-t border-[#E7E9EE] text-left">
                    <div className="text-xs font-medium text-[#6B6B6B] mb-2.5">
                      Inicio rápido con especialistas oficiales
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {systemPersonalities.slice(0, 4).map((sp) => (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => handleCreateChat(sp.id)}
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-[#DBDBDB] hover:border-[#5099D6] transition-colors text-left cursor-pointer"
                        >
                          <AvatarDisplay avatar={sp.avatar} alt={sp.name} size="sm" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#1A1D24] truncate">
                              {sp.name}
                            </div>
                            <div className="text-[11px] text-[#6B6B6B] truncate">
                              {sp.category}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        open={newChatModalOpen}
        systemPersonalities={systemPersonalities}
        myPersonalities={myPersonalities}
        onClose={() => setNewChatModalOpen(false)}
        onSelectPersonality={handleCreateChat}
        onCreatePersonality={() => onNavigate({ name: "personality-create" })}
        onExploreCommunity={() => onNavigate({ name: "community" })}
      />

      {/* Snapshot Info Modal */}
      {infoModalOpen && activeChat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4"
          onClick={() => setInfoModalOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-xl bg-white border border-[#DBDBDB] shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-4 border-b border-[#E7E9EE] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <AvatarDisplay
                  avatar={activeChat.personalitySnapshot.avatar}
                  alt={activeChat.personalitySnapshot.name}
                  size="md"
                />
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-[#1A1D24] truncate">
                    {activeChat.personalitySnapshot.name}
                  </h3>
                  <p className="text-xs text-[#6B6B6B] tabular-nums">
                    {activeChat.personalitySnapshot.category} · Versión{" "}
                    {activeChat.personalitySnapshot.versionLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInfoModalOpen(false)}
                className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#1A1D24] hover:bg-[#F3F5F8] cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-[#1A1D24] mb-1">
                  Descripción
                </h4>
                <p className="text-sm text-[#6B6B6B]">
                  {activeChat.personalitySnapshot.description}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#1A1D24] mb-1.5">
                  Instrucciones del sistema (Snapshot activo)
                </h4>
                <pre className="p-3.5 rounded-lg bg-[#FAFBFD] border border-[#DBDBDB] text-xs font-mono text-[#1A1D24] whitespace-pre-wrap leading-relaxed">
                  {activeChat.personalitySnapshot.systemPrompt}
                </pre>
              </div>
              <div className="p-3.5 rounded-lg bg-[#5099D6]/8 border border-[#76A4F9]/30 text-xs text-[#1A1D24] leading-relaxed">
                <strong>Estabilidad garantizada:</strong> este chat opera sobre un snapshot independiente. Si la personalidad original es editada o eliminada por su autor, tu conversación conserva su rol y tono intactos.
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-[#E7E9EE] bg-[#FAFBFD] flex items-center justify-end gap-2">
              {linkedPersonality && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setInfoModalOpen(false);
                      setVersionModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] hover:bg-[#F3F5F8] cursor-pointer"
                  >
                    Gestionar versiones
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInfoModalOpen(false);
                      onNavigate({
                        name: "personality-detail",
                        id: linkedPersonality.id,
                      });
                    }}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] hover:bg-[#F3F5F8] cursor-pointer"
                  >
                    Ver ficha
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setInfoModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version Selector Modal */}
      {versionModalOpen && activeChat && linkedPersonality && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4"
          onClick={() => setVersionModalOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-xl bg-white border border-[#DBDBDB] shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-4 border-b border-[#E7E9EE] flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#1A1D24]">
                  Versiones de {linkedPersonality.name}
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  Sincroniza este chat con cualquier versión publicada
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVersionModalOpen(false)}
                className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#1A1D24] hover:bg-[#F3F5F8] cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {[...linkedPersonality.versions].reverse().map((v) => {
                const isActiveInChat =
                  v.versionNumber === activeChat.personalityVersion;
                const isLatest =
                  v.versionNumber === linkedPersonality.currentVersion;
                return (
                  <div
                    key={v.versionNumber}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActiveInChat
                        ? "border-[#5099D6] bg-[#5099D6]/5"
                        : "border-[#DBDBDB] bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <AvatarDisplay avatar={v.avatar} alt={v.name} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-semibold text-[#1A1D24]">
                            {v.versionLabel}
                          </span>
                          {isActiveInChat && (
                            <span className="text-[#3778AE] font-medium">
                              · Activa en este chat
                            </span>
                          )}
                          {isLatest && (
                            <span className="text-[#6B6B6B]">
                              · Última publicada
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6B6B6B] mt-1">
                          {v.changeNotes || "Actualización de parámetros"}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isActiveInChat ? (
                        <span className="text-xs font-medium text-[#3778AE]">
                          En uso
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={syncingVersion === v.versionNumber}
                          onClick={() => handleSyncVersion(v.versionNumber)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] hover:border-[#5099D6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {syncingVersion === v.versionNumber
                            ? "Aplicando..."
                            : `Usar ${v.versionLabel}`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Delete Chat Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title="Eliminar conversación"
        description="Esta acción eliminará el historial completo de mensajes de este chat. No se puede deshacer."
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
