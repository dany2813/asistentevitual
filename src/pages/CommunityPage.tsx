import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { api } from "../api";
import {
  DEFAULT_CATEGORIES,
  type CommunityFeedResponse,
  type PublicUser,
} from "../types";
import type { AppRoute } from "../components/TopBar";
import { PersonalityCard } from "../components/PersonalityCard";

interface CommunityPageProps {
  initialTag?: string;
  currentUser: PublicUser | null;
  onNavigate: (route: AppRoute) => void;
  onStartChat: (personalityId: string) => void;
}

export function CommunityPage({
  initialTag = "",
  currentUser,
  onNavigate,
  onStartChat,
}: CommunityPageProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [tag, setTag] = useState(initialTag);
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);

  const [feed, setFeed] = useState<CommunityFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setTag(initialTag);
    setPage(1);
  }, [initialTag]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      api
        .getCommunity({ q: query, category, tag, sort, page })
        .then((res) => {
          if (active) setFeed(res);
        })
        .catch((err) => {
          if (active) {
            setError(
              err instanceof Error
                ? err.message
                : "Error al cargar la comunidad."
            );
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, category, tag, sort, page]);

  async function handleToggleLike(id: string) {
    if (!currentUser) {
      onNavigate({ name: "auth", mode: "login" });
      return;
    }
    try {
      const res = await api.toggleLike(id);
      setFeed((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((item) =>
                item.personality.id === id
                  ? {
                      ...item,
                      isLiked: res.isLiked,
                      personality: {
                        ...item.personality,
                        likesCount: res.likesCount,
                      },
                    }
                  : item
              ),
            }
          : prev
      );
    } catch {
      // ignore transient error
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1A1D24]">
            Comunidad
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Descubre personalidades públicas y compartidas por tus amigos.
          </p>
        </div>
        {currentUser && (
          <button
            type="button"
            onClick={() => onNavigate({ name: "personality-create" })}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            + Publicar personalidad
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#DBDBDB] space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre, descripción, etiqueta o @usuario..."
              className="w-full h-10 pl-9 pr-9 text-sm rounded-lg border border-[#DBDBDB] bg-[#FAFBFD] text-[#1A1D24] focus:bg-white focus:border-[#5099D6]"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#1A1D24] cursor-pointer"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            aria-label="Categoría"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 text-sm rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
          >
            <option value="all">Todas las categorías</option>
            {DEFAULT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            aria-label="Ordenar por"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 text-sm rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
          >
            <option value="popular">Más populares</option>
            <option value="uses">Más usadas</option>
            <option value="recent">Más recientes</option>
          </select>
        </div>

        {(tag || category !== "all" || query) && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E7E9EE] text-xs text-[#6B6B6B]">
            <div className="flex flex-wrap items-center gap-3">
              {tag && (
                <button
                  type="button"
                  onClick={() => {
                    setTag("");
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 text-[#3778AE] font-medium hover:underline cursor-pointer"
                >
                  <span>Etiqueta: #{tag}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {feed && (
                <span className="tabular-nums">
                  {feed.total} resultado{feed.total === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setTag("");
                setSort("popular");
                setPage(1);
              }}
              className="text-[#6B6B6B] hover:text-[#1A1D24] underline cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-[#F3F5F8] animate-pulse" />
          ))}
        </div>
      ) : feed && feed.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {feed.items.map((item) => (
              <PersonalityCard
                key={item.personality.id}
                personality={item.personality}
                creatorName={item.creatorName}
                creatorUsername={item.creatorUsername}
                isLiked={item.isLiked}
                showLikeButton
                onToggleLike={handleToggleLike}
                onOpenDetail={(id) =>
                  onNavigate({ name: "personality-detail", id })
                }
                onStartChat={onStartChat}
                onOpenCreator={(username) =>
                  onNavigate({ name: "profile", username })
                }
                onTagClick={(clickedTag) => {
                  setTag(clickedTag);
                  setPage(1);
                }}
              />
            ))}
          </div>

          {feed.pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                disabled={!feed.hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] hover:bg-[#F3F5F8] disabled:opacity-45 cursor-pointer"
              >
                Anterior
              </button>
              <span className="text-xs text-[#6B6B6B] tabular-nums">
                Página {feed.page} de {feed.pages}
              </span>
              <button
                type="button"
                disabled={!feed.hasNext}
                onClick={() => setPage((p) => p + 1)}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] hover:bg-[#F3F5F8] disabled:opacity-45 cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="p-10 rounded-xl border border-dashed border-[#DBDBDB] bg-white text-center space-y-2">
          <h3 className="text-sm font-semibold text-[#1A1D24]">
            No se encontraron personalidades
          </h3>
          <p className="text-xs text-[#6B6B6B]">
            Intenta ajustar tu búsqueda o categoría.
          </p>
        </div>
      )}
    </div>
  );
}
