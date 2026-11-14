import { useEffect, useState, type FormEvent } from "react";
import { Check, UserPlus, X } from "lucide-react";
import { api } from "../api";
import type { FriendshipItem } from "../types";
import type { AppRoute } from "../components/TopBar";
import { AvatarDisplay } from "../components/AvatarDisplay";
import { ConfirmDialog } from "../components/ConfirmDialog";

interface FriendshipsPageProps {
  onNavigate: (route: AppRoute) => void;
  onPendingCountChange?: (count: number) => void;
}

export function FriendshipsPage({
  onNavigate,
  onPendingCountChange,
}: FriendshipsPageProps) {
  const [friends, setFriends] = useState<FriendshipItem[]>([]);
  const [pendingReceived, setPendingReceived] = useState<FriendshipItem[]>([]);
  const [pendingSent, setPendingSent] = useState<FriendshipItem[]>([]);

  const [usernameInput, setUsernameInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [removeTarget, setRemoveTarget] = useState<FriendshipItem | null>(null);
  const [removing, setRemoving] = useState(false);

  async function loadFriendships() {
    setLoading(true);
    try {
      const res = await api.getFriendships();
      setFriends(res.friends);
      setPendingReceived(res.pendingReceived);
      setPendingSent(res.pendingSent);
      onPendingCountChange?.(res.pendingReceived.length);
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las amistades.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFriendships();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSendRequest(e: FormEvent) {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await api.sendFriendRequest(usernameInput.trim());
      setUsernameInput("");
      setFeedback({ type: "success", text: res.message });
      await loadFriendships();
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "No se pudo enviar la solicitud.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAccept(id: string) {
    setFeedback(null);
    try {
      await api.acceptFriendRequest(id);
      setFeedback({ type: "success", text: "Solicitud aceptada." });
      await loadFriendships();
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error al aceptar.",
      });
    }
  }

  async function handleReject(id: string) {
    setFeedback(null);
    try {
      await api.rejectFriendRequest(id);
      await loadFriendships();
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error al actualizar.",
      });
    }
  }

  async function handleConfirmRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.removeFriendship(removeTarget.user.id);
      setRemoveTarget(null);
      await loadFriendships();
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "No se pudo eliminar.",
      });
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1A1D24]">
          Amigos y conexiones
        </h1>
        <p className="text-sm text-[#6B6B6B] mt-1">
          Conecta con otros creadores para acceder a sus personalidades compartidas para amigos.
        </p>
      </div>

      {feedback && (
        <div
          role="status"
          className={`px-4 py-3 rounded-xl border text-xs ${
            feedback.type === "success"
              ? "bg-[#5099D6]/10 border-[#76A4F9]/40 text-[#1A1D24]"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Add Friend + Pending Requests */}
        <div className="lg:col-span-5 space-y-6">
          <section className="p-5 rounded-2xl bg-white border border-[#DBDBDB] space-y-3">
            <h2 className="font-display text-base font-semibold text-[#1A1D24]">
              Añadir amigo
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Prueba buscar usuarios como <span className="font-mono">elena_dev</span> o{" "}
              <span className="font-mono">mateo_edu</span>.
            </p>
            <form onSubmit={handleSendRequest} className="flex gap-2">
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Nombre de usuario"
                className="flex-1 h-10 px-3 text-sm rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 h-10 px-4 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Enviar
              </button>
            </form>
          </section>

          <section className="p-5 rounded-2xl bg-white border border-[#DBDBDB] space-y-4">
            <h2 className="font-display text-base font-semibold text-[#1A1D24] tabular-nums">
              Solicitudes recibidas ({pendingReceived.length})
            </h2>

            {loading ? (
              <div className="h-16 rounded-lg bg-[#F3F5F8] animate-pulse" />
            ) : pendingReceived.length > 0 ? (
              <div className="divide-y divide-[#E7E9EE]">
                {pendingReceived.map((req) => (
                  <div
                    key={req.friendshipId}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AvatarDisplay
                        avatar={req.user.avatar}
                        alt={req.user.username}
                        size="sm"
                        fallback="👤"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate({
                            name: "profile",
                            username: req.user.username,
                          })
                        }
                        className="text-xs font-semibold text-[#1A1D24] hover:text-[#3778AE] truncate cursor-pointer"
                      >
                        @{req.user.username}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAccept(req.friendshipId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aceptar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(req.friendshipId)}
                        className="p-1.5 rounded-lg border border-[#DBDBDB] text-[#6B6B6B] hover:text-red-600 hover:border-red-200 cursor-pointer"
                        aria-label="Rechazar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6B6B6B]">
                No tienes solicitudes pendientes.
              </p>
            )}
          </section>

          {pendingSent.length > 0 && (
            <section className="p-5 rounded-2xl bg-white border border-[#DBDBDB] space-y-4">
              <h2 className="font-display text-base font-semibold text-[#1A1D24] tabular-nums">
                Solicitudes enviadas ({pendingSent.length})
              </h2>
              <div className="divide-y divide-[#E7E9EE]">
                {pendingSent.map((req) => (
                  <div
                    key={req.friendshipId}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AvatarDisplay
                        avatar={req.user.avatar}
                        alt={req.user.username}
                        size="sm"
                        fallback="👤"
                      />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate({
                              name: "profile",
                              username: req.user.username,
                            })
                          }
                          className="text-xs font-semibold text-[#1A1D24] hover:text-[#3778AE] truncate block cursor-pointer"
                        >
                          @{req.user.username}
                        </button>
                        <span className="text-[11px] text-[#6B6B6B]">
                          Pendiente de confirmación
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReject(req.friendshipId)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#DBDBDB] text-[#6B6B6B] hover:text-[#1A1D24] cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Accepted Friends */}
        <div className="lg:col-span-7">
          <section className="p-6 rounded-2xl bg-white border border-[#DBDBDB] space-y-5">
            <h2 className="font-display text-base font-semibold text-[#1A1D24] tabular-nums">
              Mis amigos ({friends.length})
            </h2>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-28 rounded-xl bg-[#F3F5F8] animate-pulse"
                  />
                ))}
              </div>
            ) : friends.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {friends.map((friend) => (
                  <div
                    key={friend.user.id}
                    className="p-4 rounded-xl border border-[#DBDBDB] bg-[#FAFBFD] flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <AvatarDisplay
                        avatar={friend.user.avatar}
                        alt={friend.user.username}
                        size="md"
                        fallback="👤"
                      />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate({
                              name: "profile",
                              username: friend.user.username,
                            })
                          }
                          className="text-sm font-semibold text-[#1A1D24] hover:text-[#3778AE] truncate block cursor-pointer"
                        >
                          @{friend.user.username}
                        </button>
                        <p className="text-xs text-[#6B6B6B] line-clamp-2 mt-0.5">
                          {friend.user.bio || "Sin biografía"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7E9EE]">
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate({
                            name: "profile",
                            username: friend.user.username,
                          })
                        }
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] hover:bg-[#F3F5F8] cursor-pointer"
                      >
                        Ver perfil
                      </button>
                      <button
                        type="button"
                        onClick={() => setRemoveTarget(friend)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-[#DBDBDB] text-center">
                <p className="text-sm font-medium text-[#1A1D24]">
                  Aún no tienes amigos agregados
                </p>
                <p className="text-xs text-[#6B6B6B] mt-1">
                  Envía una solicitud usando el formulario lateral para desbloquear personalidades exclusivas.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Eliminar amistad"
        description={
          removeTarget
            ? `¿Deseas eliminar a @${removeTarget.user.username} de tu lista de amigos?`
            : ""
        }
        confirmLabel="Eliminar"
        danger
        loading={removing}
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
