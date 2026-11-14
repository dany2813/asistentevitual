import { useEffect, useState } from "react";
import { ArrowRight, MessageSquare, Plus } from "lucide-react";
import { api } from "../api";
import type { DashboardResponse, PublicUser } from "../types";
import type { AppRoute } from "../components/TopBar";
import { AvatarDisplay } from "../components/AvatarDisplay";
import { PersonalityCard } from "../components/PersonalityCard";

interface DashboardPageProps {
  user: PublicUser;
  onNavigate: (route: AppRoute) => void;
  onStartChat: (personalityId: string) => void;
  onPendingCountChange?: (count: number) => void;
}

function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

export function DashboardPage({
  user,
  onNavigate,
  onStartChat,
  onPendingCountChange,
}: DashboardPageProps) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getDashboard()
      .then((res) => {
        if (!active) return;
        setData(res);
        onPendingCountChange?.(res.pendingRequestsCount);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Error cargando inicio.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onPendingCountChange]);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="h-16 bg-[#F3F5F8] rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-[#F3F5F8] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          {error || "No se pudo cargar el panel."}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-12">
      {/* Header + Minimalist Summary Strip */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1A1D24]">
              Hola, @{user.username}
            </h1>
            <p className="text-sm text-[#6B6B6B] mt-1">
              Elige un asistente especializado o continúa una conversación reciente.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate({ name: "chats" })}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] hover:bg-[#F3F5F8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#5099D6]" />
              Ir a Chats
            </button>
            <button
              type="button"
              onClick={() => onNavigate({ name: "personality-create" })}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva Personalidad
            </button>
          </div>
        </div>

        {/* 4-column flat stats strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#DBDBDB] rounded-xl border border-[#DBDBDB] bg-white">
          <button
            type="button"
            onClick={() => onNavigate({ name: "chats" })}
            className="p-4 text-left hover:bg-[#FAFBFD] transition-colors cursor-pointer"
          >
            <div className="text-xs text-[#6B6B6B]">Conversaciones</div>
            <div className="font-display text-2xl font-bold text-[#1A1D24] mt-1 tabular-nums">
              {data.recentChats.length}
            </div>
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ name: "personalities" })}
            className="p-4 text-left hover:bg-[#FAFBFD] transition-colors cursor-pointer"
          >
            <div className="text-xs text-[#6B6B6B]">Mis personalidades</div>
            <div className="font-display text-2xl font-bold text-[#1A1D24] mt-1 tabular-nums">
              {data.myPersonalities.length}
            </div>
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ name: "community" })}
            className="p-4 text-left hover:bg-[#FAFBFD] transition-colors cursor-pointer"
          >
            <div className="text-xs text-[#6B6B6B]">Oficiales listas</div>
            <div className="font-display text-2xl font-bold text-[#1A1D24] mt-1 tabular-nums">
              {data.systemPersonalities.length}
            </div>
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ name: "friendships" })}
            className="p-4 text-left hover:bg-[#FAFBFD] transition-colors cursor-pointer"
          >
            <div className="text-xs text-[#6B6B6B]">
              Amigos
              {data.pendingRequestsCount > 0 && (
                <span className="text-[#3778AE] font-medium ml-1.5 tabular-nums">
                  · {data.pendingRequestsCount} pendiente
                  {data.pendingRequestsCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="font-display text-2xl font-bold text-[#1A1D24] mt-1 tabular-nums">
              {data.friendsCount}
            </div>
          </button>
        </div>
      </section>

      {/* Recent Chats */}
      {data.recentChats.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#1A1D24]">
                Conversaciones recientes
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Retoma tu último hilo al instante
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate({ name: "chats" })}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#3778AE] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ver todas
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recentChats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => onNavigate({ name: "chats", chatId: chat.id })}
                className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-[#DBDBDB] hover:border-[#5099D6] transition-colors text-left cursor-pointer"
              >
                <AvatarDisplay
                  avatar={chat.personalitySnapshot.avatar}
                  alt={chat.personalitySnapshot.name}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[#1A1D24] truncate">
                    {chat.title}
                  </div>
                  <div className="text-xs text-[#6B6B6B] truncate mt-0.5 tabular-nums">
                    {chat.personalitySnapshot.name} · v{chat.personalityVersion}.0 ·{" "}
                    {chat.messages.length} msg · {formatShortDate(chat.updatedAt)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Official Personalities */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#1A1D24]">
            Personalidades oficiales
          </h2>
          <p className="text-xs text-[#6B6B6B]">
            Especialistas listos para interactuar de inmediato
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.systemPersonalities.map((p) => (
            <PersonalityCard
              key={p.id}
              personality={p}
              onOpenDetail={(id) => onNavigate({ name: "personality-detail", id })}
              onStartChat={onStartChat}
            />
          ))}
        </div>
      </section>

      {/* My Personalities */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#1A1D24]">
              Mis personalidades creadas
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Asistentes diseñados y versionados por ti
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ name: "personality-create" })}
            className="text-xs font-medium text-[#3778AE] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            + Nueva
          </button>
        </div>

        {data.myPersonalities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.myPersonalities.map((p) => (
              <PersonalityCard
                key={p.id}
                personality={p}
                canEdit
                onOpenDetail={(id) =>
                  onNavigate({ name: "personality-detail", id })
                }
                onEdit={(id) => onNavigate({ name: "personality-edit", id })}
                onStartChat={onStartChat}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl border border-dashed border-[#DBDBDB] bg-white text-center">
            <h3 className="text-sm font-semibold text-[#1A1D24]">
              Aún no has creado personalidades
            </h3>
            <p className="text-xs text-[#6B6B6B] mt-1 mb-4 max-w-md mx-auto">
              Diseña un asistente con su propio rol, instrucciones del sistema y control de versiones.
            </p>
            <button
              type="button"
              onClick={() => onNavigate({ name: "personality-create" })}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear mi primera personalidad
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
