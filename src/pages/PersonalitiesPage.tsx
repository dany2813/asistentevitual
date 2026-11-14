import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api } from "../api";
import type { Personality } from "../types";
import type { AppRoute } from "../components/TopBar";
import { PersonalityCard } from "../components/PersonalityCard";

interface PersonalitiesPageProps {
  onNavigate: (route: AppRoute) => void;
  onStartChat: (personalityId: string) => void;
}

export function PersonalitiesPage({
  onNavigate,
  onStartChat,
}: PersonalitiesPageProps) {
  const [myPersonalities, setMyPersonalities] = useState<Personality[]>([]);
  const [systemPersonalities, setSystemPersonalities] = useState<Personality[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getPersonalities()
      .then((res) => {
        if (!active) return;
        setMyPersonalities(res.myPersonalities);
        setSystemPersonalities(res.systemPersonalities);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las personalidades."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="h-12 bg-[#F3F5F8] rounded-xl animate-pulse w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-[#F3F5F8] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1A1D24]">
            Personalidades de IA
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Gestiona tus propias creaciones y explora los especialistas oficiales del sistema.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate({ name: "personality-create" })}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Crear personalidad
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Creadas por mí */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E7E9EE] pb-3">
          <h2 className="font-display text-lg font-semibold text-[#1A1D24] tabular-nums">
            Creadas por mí ({myPersonalities.length})
          </h2>
        </div>

        {myPersonalities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myPersonalities.map((p) => (
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
              Aún no has creado ninguna personalidad
            </h3>
            <p className="text-xs text-[#6B6B6B] mt-1 mb-4">
              Define un asistente con instrucciones, categoría, visibilidad y avatar propios.
            </p>
            <button
              type="button"
              onClick={() => onNavigate({ name: "personality-create" })}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear mi primera personalidad
            </button>
          </div>
        )}
      </section>

      {/* Oficiales */}
      <section className="space-y-4">
        <div className="border-b border-[#E7E9EE] pb-3">
          <h2 className="font-display text-lg font-semibold text-[#1A1D24] tabular-nums">
            Personalidades oficiales ({systemPersonalities.length})
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {systemPersonalities.map((p) => (
            <PersonalityCard
              key={p.id}
              personality={p}
              onOpenDetail={(id) =>
                onNavigate({ name: "personality-detail", id })
              }
              onStartChat={onStartChat}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
