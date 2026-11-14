import { useEffect, useState } from "react";
import { ArrowLeft, Heart, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { api } from "../api";
import type { Personality, PublicUser } from "../types";
import type { AppRoute } from "../components/TopBar";
import { AvatarDisplay } from "../components/AvatarDisplay";
import { ConfirmDialog } from "../components/ConfirmDialog";

interface PersonalityDetailPageProps {
  id: string;
  currentUser: PublicUser | null;
  onNavigate: (route: AppRoute) => void;
  onStartChat: (personalityId: string, version?: number) => void;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function PersonalityDetailPage({
  id,
  currentUser,
  onNavigate,
  onStartChat,
}: PersonalityDetailPageProps) {
  const [personality, setPersonality] = useState<Personality | null>(null);
  const [owner, setOwner] = useState<PublicUser | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number>(1);
  const [deleted, setDeleted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setDeleted(false);
    setError("");
    api
      .getPersonality(id)
      .then((res) => {
        if (!active) return;
        setPersonality(res.personality);
        setOwner(res.owner);
        setIsLiked(res.isLiked);
        setCanEdit(res.canEdit);
        setSelectedVersion(res.personality.currentVersion);
      })
      .catch((err: Error & { deleted?: boolean }) => {
        if (!active) return;
        if (err.deleted) setDeleted(true);
        else setError(err.message || "No se pudo cargar la personalidad.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  async function handleLike() {
    if (!currentUser) {
      onNavigate({ name: "auth", mode: "login" });
      return;
    }
    if (!personality) return;
    try {
      const res = await api.toggleLike(personality.id);
      setIsLiked(res.isLiked);
      setPersonality({ ...personality, likesCount: res.likesCount });
    } catch {
      // ignore transient
    }
  }

  async function handleDelete() {
    if (!personality) return;
    setDeleting(true);
    try {
      await api.deletePersonality(personality.id);
      setConfirmDeleteOpen(false);
      onNavigate({ name: "personalities" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar.");
      setConfirmDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="h-44 rounded-2xl bg-[#F3F5F8] animate-pulse" />
        <div className="h-64 rounded-2xl bg-[#F3F5F8] animate-pulse" />
      </div>
    );
  }

  if (deleted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="p-8 rounded-2xl bg-white border border-[#DBDBDB] space-y-3">
          <h1 className="font-display text-xl font-bold text-[#1A1D24]">
            Personalidad no disponible
          </h1>
          <p className="text-sm text-[#6B6B6B]">
            Esta personalidad fue eliminada por su autor. Tus conversaciones previas con ella siguen funcionando normalmente gracias a su snapshot guardado.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate({ name: "community" })}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] cursor-pointer"
            >
              Explorar comunidad
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !personality) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error || "Error al cargar."}
        </div>
      </div>
    );
  }

  const visLabel = personality.isSystem
    ? "Oficial"
    : personality.visibility === "public"
    ? "Pública"
    : personality.visibility === "friends"
    ? "Solo amigos"
    : "Privada";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      <button
        type="button"
        onClick={() =>
          onNavigate(currentUser ? { name: "personalities" } : { name: "community" })
        }
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B6B6B] hover:text-[#1A1D24] cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver
      </button>

      {/* Hero Detail Card */}
      <section className="bg-white border border-[#DBDBDB] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <AvatarDisplay
              avatar={personality.avatar}
              alt={personality.name}
              size="xl"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6B6B] mb-1">
                <span
                  className={
                    personality.isSystem
                      ? "text-[#3778AE] font-semibold"
                      : "font-medium"
                  }
                >
                  {visLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span>{personality.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  v{personality.currentVersion}.0
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1A1D24]">
                {personality.name}
              </h1>

              <p className="text-sm text-[#6B6B6B] leading-relaxed mt-2">
                {personality.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6B6B] mt-3">
                <span>
                  Creado por{" "}
                  {personality.isSystem ? (
                    <strong className="text-[#1A1D24] font-medium">
                      Equipo Dochad
                    </strong>
                  ) : owner ? (
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate({
                          name: "profile",
                          username: owner.username,
                        })
                      }
                      className="text-[#1A1D24] font-medium hover:text-[#3778AE] hover:underline cursor-pointer"
                    >
                      @{owner.username}
                    </button>
                  ) : (
                    "Usuario"
                  )}
                </span>
                <span aria-hidden="true">·</span>
                <span>{formatDate(personality.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {personality.versions.length > 1 && (
              <select
                aria-label="Versión a usar"
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(Number(e.target.value))}
                className="h-10 px-3 text-xs font-mono rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
              >
                {[...personality.versions].reverse().map((v) => (
                  <option key={v.versionNumber} value={v.versionNumber}>
                    {v.versionLabel}
                    {v.versionNumber === personality.currentVersion
                      ? " (Última)"
                      : ""}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => onStartChat(personality.id, selectedVersion)}
              className="inline-flex items-center gap-2 h-10 px-5 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Iniciar Chat
            </button>

            <button
              type="button"
              onClick={handleLike}
              className={`inline-flex items-center gap-1.5 h-10 px-4 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer ${
                isLiked
                  ? "border-[#5099D6] bg-[#76A4F9]/15 text-[#3778AE]"
                  : "border-[#DBDBDB] bg-white text-[#1A1D24] hover:bg-[#F3F5F8]"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  isLiked ? "fill-[#5099D6] text-[#5099D6]" : ""
                }`}
              />
              <span>{isLiked ? "Te gusta" : "Me gusta"}</span>
              <span className="font-mono">({personality.likesCount})</span>
            </button>
          </div>
        </div>

        {/* Clean 3-column metrics strip */}
        <div className="grid grid-cols-3 divide-x divide-[#E7E9EE] pt-5 border-t border-[#E7E9EE]">
          <div className="pr-4">
            <div className="font-display text-xl font-bold text-[#1A1D24] tabular-nums">
              {personality.usesCount}
            </div>
            <div className="text-xs text-[#6B6B6B]">Conversaciones</div>
          </div>
          <div className="px-4">
            <div className="font-display text-xl font-bold text-[#1A1D24] tabular-nums">
              {personality.likesCount}
            </div>
            <div className="text-xs text-[#6B6B6B]">Likes de la comunidad</div>
          </div>
          <div className="pl-4">
            <div className="font-display text-xl font-bold text-[#1A1D24] tabular-nums">
              {personality.versions.length}
            </div>
            <div className="text-xs text-[#6B6B6B]">
              {personality.versions.length === 1
                ? "Versión publicada"
                : "Versiones publicadas"}
            </div>
          </div>
        </div>
      </section>

      {/* System Prompt */}
      <section className="bg-white border border-[#DBDBDB] rounded-2xl p-6 space-y-3">
        <h2 className="font-display text-base font-semibold text-[#1A1D24]">
          Instrucciones y rol del sistema
        </h2>
        <pre className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E7E9EE] text-xs font-mono text-[#1A1D24] whitespace-pre-wrap leading-relaxed">
          {personality.systemPrompt}
        </pre>
      </section>

      {/* Tags & Owner Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white border border-[#DBDBDB] rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-base font-semibold text-[#1A1D24]">
            Etiquetas
          </h2>
          {personality.tags.length > 0 ? (
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {personality.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onNavigate({ name: "community", tag })}
                  className="text-xs font-medium text-[#3778AE] hover:underline cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#6B6B6B]">Sin etiquetas registradas.</p>
          )}
        </section>

        {canEdit && (
          <section className="bg-white border border-[#DBDBDB] rounded-2xl p-6 space-y-3">
            <h2 className="font-display text-base font-semibold text-[#1A1D24]">
              Administración del creador
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Edita la configuración para publicar una nueva versión o elimina esta personalidad.
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() =>
                  onNavigate({ name: "personality-edit", id: personality.id })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#DBDBDB] text-[#1A1D24] hover:bg-[#F3F5F8] cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Version History */}
      <section className="bg-white border border-[#DBDBDB] rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-base font-semibold text-[#1A1D24] tabular-nums">
          Historial de versiones ({personality.versions.length})
        </h2>

        <div className="divide-y divide-[#E7E9EE]">
          {[...personality.versions].reverse().map((v) => {
            const isCurrent = v.versionNumber === personality.currentVersion;
            return (
              <div
                key={v.versionNumber}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <AvatarDisplay avatar={v.avatar} alt={v.name} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-[#1A1D24]">
                        {v.versionLabel}
                      </span>
                      {isCurrent && (
                        <span className="text-[#3778AE] font-medium">
                          · Publicación actual
                        </span>
                      )}
                      <span className="text-[#6B6B6B]">
                        · {formatDate(v.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      {v.changeNotes || "Actualización de parámetros"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onStartChat(personality.id, v.versionNumber)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-[#DBDBDB] text-[#1A1D24] bg-white hover:border-[#5099D6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Chatear con {v.versionLabel}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Eliminar personalidad"
        description="¿Seguro que deseas eliminar esta personalidad? Los chats existentes conservarán su snapshot intacto, pero no podrán crearse nuevos chats con ella."
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
