import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { api } from "../api";
import { DEFAULT_CATEGORIES, type Visibility } from "../types";
import type { AppRoute } from "../components/TopBar";
import { AvatarPicker } from "../components/AvatarPicker";

interface PersonalityFormPageProps {
  editId?: string;
  onNavigate: (route: AppRoute) => void;
}

export function PersonalityFormPage({
  editId,
  onNavigate,
}: PersonalityFormPageProps) {
  const isEdit = Boolean(editId);

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🤖");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [category, setCategory] = useState<string>("Productividad");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [tags, setTags] = useState("");
  const [changeNotes, setChangeNotes] = useState("");
  const [currentVersion, setCurrentVersion] = useState(1);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editId) return;
    let active = true;
    setLoading(true);
    api
      .getPersonality(editId)
      .then((res) => {
        if (!active) return;
        const p = res.personality;
        setName(p.name);
        setAvatar(p.avatar);
        setDescription(p.description);
        setSystemPrompt(p.systemPrompt);
        setCategory(p.category);
        setVisibility(p.visibility);
        setTags(p.tags.join(", "));
        setCurrentVersion(p.currentVersion);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "No se pudo cargar la personalidad."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [editId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isEdit && editId) {
        const res = await api.updatePersonality(editId, {
          name,
          description,
          systemPrompt,
          avatar,
          visibility,
          category,
          tags,
          changeNotes,
        });
        onNavigate({ name: "personality-detail", id: res.personality.id });
      } else {
        const res = await api.createPersonality({
          name,
          description,
          systemPrompt,
          avatar,
          visibility,
          category,
          tags,
        });
        onNavigate({ name: "personality-detail", id: res.personality.id });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="h-96 rounded-xl bg-[#F3F5F8] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <button
        type="button"
        onClick={() =>
          onNavigate(
            isEdit && editId
              ? { name: "personality-detail", id: editId }
              : { name: "personalities" }
          )
        }
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B6B6B] hover:text-[#1A1D24] mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver
      </button>

      <div className="bg-white border border-[#DBDBDB] rounded-2xl p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-[#1A1D24]">
            {isEdit ? `Editar ${name}` : "Nueva personalidad"}
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {isEdit
              ? `Al guardar se registrará automáticamente la versión v${currentVersion + 1}.0 en el historial.`
              : "Define su rol, instrucciones del sistema, visibilidad y avatar."}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="p-name"
              className="block text-xs font-medium text-[#1A1D24] mb-1.5"
            >
              Nombre de la personalidad *
            </label>
            <input
              id="p-name"
              type="text"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Arquitecto de Software"
              className="w-full h-10 px-3 text-sm rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-[#1A1D24] mb-1.5">
              Avatar
            </span>
            <AvatarPicker value={avatar} onChange={setAvatar} />
          </div>

          <div>
            <label
              htmlFor="p-desc"
              className="block text-xs font-medium text-[#1A1D24] mb-1.5"
            >
              Descripción breve *
            </label>
            <input
              id="p-desc"
              type="text"
              required
              maxLength={150}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Resumen corto de en qué ayuda este asistente (máx. 150 caracteres)"
              className="w-full h-10 px-3 text-sm rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
            />
          </div>

          <div>
            <label
              htmlFor="p-prompt"
              className="block text-xs font-medium text-[#1A1D24] mb-1.5"
            >
              System Prompt (Instrucciones del sistema) *
            </label>
            <textarea
              id="p-prompt"
              required
              rows={6}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Eres un especialista en... Responde siempre con..."
              className="w-full p-3 text-xs font-mono leading-relaxed rounded-lg border border-[#DBDBDB] bg-[#FAFBFD] text-[#1A1D24] focus:bg-white focus:border-[#5099D6]"
            />
            {isEdit && (
              <p className="text-[11px] text-[#6B6B6B] mt-1">
                Los chats ya iniciados conservan su snapshot anterior hasta que el usuario decida actualizarlos.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="p-category"
                className="block text-xs font-medium text-[#1A1D24] mb-1.5"
              >
                Categoría
              </label>
              <select
                id="p-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="p-visibility"
                className="block text-xs font-medium text-[#1A1D24] mb-1.5"
              >
                Visibilidad
              </label>
              <select
                id="p-visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as Visibility)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
              >
                <option value="public">Pública (Visible en Comunidad)</option>
                <option value="friends">Solo amigos</option>
                <option value="private">Privada (Solo tú)</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="p-tags"
              className="block text-xs font-medium text-[#1A1D24] mb-1.5"
            >
              Etiquetas (separadas por comas)
            </label>
            <input
              id="p-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ej. TypeScript, Arquitectura, Código"
              className="w-full h-10 px-3 text-sm rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
            />
          </div>

          {isEdit && (
            <div>
              <label
                htmlFor="p-notes"
                className="block text-xs font-medium text-[#1A1D24] mb-1.5"
              >
                Notas de cambio (para v{currentVersion + 1}.0)
              </label>
              <input
                id="p-notes"
                type="text"
                maxLength={200}
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
                placeholder="Ej. Mejoras en tono, ejemplos más concisos..."
                className="w-full h-10 px-3 text-sm rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E7E9EE]">
            <button
              type="button"
              onClick={() =>
                onNavigate(
                  isEdit && editId
                    ? { name: "personality-detail", id: editId }
                    : { name: "personalities" }
                )
              }
              className="px-4 py-2 text-xs font-medium rounded-lg border border-[#DBDBDB] text-[#1A1D24] bg-white hover:bg-[#F3F5F8] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] transition-colors disabled:opacity-60 cursor-pointer"
            >
              {saving
                ? "Guardando..."
                : isEdit
                ? `Guardar versión v${currentVersion + 1}.0`
                : "Crear personalidad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
