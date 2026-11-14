import { useEffect, useState, type FormEvent } from "react";
import { Pencil, UserMinus, UserPlus } from "lucide-react";
import { api } from "../api";
import type { Personality, PublicUser } from "../types";
import type { AppRoute } from "../components/TopBar";
import { AvatarDisplay } from "../components/AvatarDisplay";
import { AvatarPicker } from "../components/AvatarPicker";
import { PersonalityCard } from "../components/PersonalityCard";
import { ConfirmDialog } from "../components/ConfirmDialog";

interface UserProfilePageProps {
  username: string;
  currentUser: PublicUser | null;
  onUserUpdated: (user: PublicUser) => void;
  onNavigate: (route: AppRoute) => void;
  onStartChat: (personalityId: string) => void;
}

export function UserProfilePage({
  username,
  currentUser,
  onUserUpdated,
  onNavigate,
  onStartChat,
}: UserProfilePageProps) {
  const [profileUser, setProfileUser] = useState<PublicUser | null>(null);
  const [personalities, setPersonalities] = useState<Personality[]>([]);
  const [isSelf, setIsSelf] = useState(false);
  const [areFriends, setAreFriends] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"sent" | "received" | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [avatarInput, setAvatarInput] = useState("👤");
  const [saving, setSaving] = useState(false);
  const [confirmUnfriend, setConfirmUnfriend] = useState(false);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const res = await api.getUserProfile(username);
      setProfileUser(res.user);
      setPersonalities(res.personalities);
      setIsSelf(res.isSelf);
      setAreFriends(res.areFriends);
      setPendingStatus(res.pendingStatus);
      setBioInput(res.user.bio);
      setAvatarInput(res.user.avatar);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar el perfil."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setEditing(false);
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateProfile(bioInput, avatarInput);
      setProfileUser(res.user);
      onUserUpdated(res.user);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddFriend() {
    if (!profileUser) return;
    try {
      await api.sendFriendRequest(profileUser.username);
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar solicitud.");
    }
  }

  async function handleRemoveFriend() {
    if (!profileUser) return;
    try {
      await api.removeFriendship(profileUser.id);
      setConfirmUnfriend(false);
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="h-36 rounded-2xl bg-[#F3F5F8] animate-pulse" />
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error || "Usuario no encontrado."}
        </div>
      </div>
    );
  }

  const joined = new Date(profileUser.createdAt).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      <section className="bg-white border border-[#DBDBDB] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <AvatarDisplay
              avatar={profileUser.avatar}
              alt={profileUser.username}
              size="xl"
              fallback="👤"
            />
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold text-[#1A1D24]">
                @{profileUser.username}
              </h1>
              <p className="text-sm text-[#6B6B6B] mt-1 max-w-xl">
                {profileUser.bio || "Sin biografía disponible."}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6B6B] mt-2.5 tabular-nums">
                <span>Miembro desde {joined}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {personalities.length} personalidad
                  {personalities.length === 1 ? "" : "es"} visible
                  {personalities.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {isSelf ? (
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] hover:bg-[#F3F5F8] cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                {editing ? "Cancelar edición" : "Editar perfil"}
              </button>
            ) : (
              currentUser &&
              (areFriends ? (
                <button
                  type="button"
                  onClick={() => setConfirmUnfriend(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  Eliminar amistad
                </button>
              ) : pendingStatus === "sent" ? (
                <span className="text-xs font-medium text-[#6B6B6B]">
                  Solicitud enviada
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleAddFriend}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Añadir como amigo
                </button>
              ))
            )}
          </div>
        </div>

        {editing && isSelf && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-6 pt-6 border-t border-[#E7E9EE] space-y-4"
          >
            <div>
              <span className="block text-xs font-medium text-[#1A1D24] mb-1.5">
                Avatar de perfil
              </span>
              <AvatarPicker
                value={avatarInput}
                onChange={setAvatarInput}
                defaultEmoji="👤"
                quickEmojis={["👤", "👩‍💻", "🧑‍🏫", "🧠", "🎨", "🚀", "🦉", "⚡"]}
              />
            </div>

            <div>
              <label
                htmlFor="profile-bio"
                className="block text-xs font-medium text-[#1A1D24] mb-1.5"
              >
                Biografía
              </label>
              <textarea
                id="profile-bio"
                rows={3}
                maxLength={240}
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                placeholder="Cuéntale a la comunidad qué tipo de asistentes creas..."
                className="w-full p-3 text-sm rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-[#DBDBDB] text-[#1A1D24] bg-white hover:bg-[#F3F5F8] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] cursor-pointer"
              >
                {saving ? "Guardando..." : "Guardar perfil"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-[#1A1D24]">
          Personalidades creadas por @{profileUser.username}
        </h2>

        {personalities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {personalities.map((p) => (
              <PersonalityCard
                key={p.id}
                personality={p}
                canEdit={isSelf}
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
            <p className="text-sm font-medium text-[#1A1D24]">
              Sin personalidades visibles
            </p>
            <p className="text-xs text-[#6B6B6B] mt-1">
              Este usuario aún no tiene personalidades públicas o compartidas contigo.
            </p>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmUnfriend}
        title="Eliminar amistad"
        description={`¿Seguro que deseas eliminar a @${profileUser.username} de tus amigos?`}
        confirmLabel="Eliminar"
        danger
        onConfirm={handleRemoveFriend}
        onCancel={() => setConfirmUnfriend(false)}
      />
    </div>
  );
}
