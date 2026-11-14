import { Heart, MessageSquare, Pencil } from "lucide-react";
import type { Personality } from "../types";
import { AvatarDisplay } from "./AvatarDisplay";

interface PersonalityCardProps {
  personality: Personality;
  creatorName?: string;
  creatorUsername?: string | null;
  isLiked?: boolean;
  canEdit?: boolean;
  showLikeButton?: boolean;
  onOpenDetail: (id: string) => void;
  onStartChat: (id: string) => void;
  onToggleLike?: (id: string) => void;
  onEdit?: (id: string) => void;
  onOpenCreator?: (username: string) => void;
  onTagClick?: (tag: string) => void;
}

const VISIBILITY_LABEL: Record<Personality["visibility"], string> = {
  public: "Pública",
  friends: "Solo amigos",
  private: "Privada",
};

export function PersonalityCard({
  personality,
  creatorName,
  creatorUsername,
  isLiked = false,
  canEdit = false,
  showLikeButton = false,
  onOpenDetail,
  onStartChat,
  onToggleLike,
  onEdit,
  onOpenCreator,
  onTagClick,
}: PersonalityCardProps) {
  const scopeLabel = personality.isSystem
    ? "Oficial"
    : VISIBILITY_LABEL[personality.visibility];

  return (
    <article className="group flex flex-col justify-between p-5 rounded-xl bg-white border border-[#DBDBDB] hover:border-[#5099D6] transition-colors duration-150">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <AvatarDisplay avatar={personality.avatar} alt={personality.name} size="md" />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onOpenDetail(personality.id)}
                className="text-left font-display text-base font-semibold text-[#1A1D24] hover:text-[#3778AE] transition-colors truncate block max-w-full cursor-pointer"
              >
                {personality.name}
              </button>
              <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] truncate">
                <span
                  className={
                    personality.isSystem ? "text-[#3778AE] font-medium" : ""
                  }
                >
                  {scopeLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span>{personality.category}</span>
                {personality.currentVersion > 1 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      v{personality.currentVersion}.0
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {showLikeButton && onToggleLike && (
            <button
              type="button"
              onClick={() => onToggleLike(personality.id)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors tabular-nums shrink-0 cursor-pointer ${
                isLiked
                  ? "text-[#3778AE] bg-[#76A4F9]/15"
                  : "text-[#6B6B6B] hover:text-[#1A1D24] hover:bg-[#F3F5F8]"
              }`}
              aria-label={isLiked ? "Quitar me gusta" : "Dar me gusta"}
            >
              <Heart
                className={`w-3.5 h-3.5 ${isLiked ? "fill-[#5099D6] text-[#5099D6]" : ""}`}
              />
              <span>{personality.likesCount}</span>
            </button>
          )}
        </div>

        <p className="text-sm text-[#6B6B6B] leading-relaxed line-clamp-2 mb-3">
          {personality.description}
        </p>

        {creatorName && (
          <div className="text-xs text-[#6B6B6B] mb-3">
            Por{" "}
            {creatorUsername && onOpenCreator ? (
              <button
                type="button"
                onClick={() => onOpenCreator(creatorUsername)}
                className="text-[#1A1D24] font-medium hover:text-[#3778AE] underline-offset-2 hover:underline cursor-pointer"
              >
                @{creatorUsername}
              </button>
            ) : (
              <span className="text-[#1A1D24] font-medium">{creatorName}</span>
            )}
          </div>
        )}

        {personality.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#6B6B6B] mb-4">
            {personality.tags.slice(0, 3).map((tag) =>
              onTagClick ? (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick(tag)}
                  className="hover:text-[#3778AE] transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ) : (
                <span key={tag}>#{tag}</span>
              )
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E7E9EE]">
        <div className="flex items-center gap-2 text-xs text-[#6B6B6B] tabular-nums">
          <span>{personality.usesCount} usos</span>
          {!showLikeButton && (
            <>
              <span aria-hidden="true">·</span>
              <span>{personality.likesCount} likes</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {canEdit && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(personality.id)}
              className="p-2 rounded-lg text-[#6B6B6B] hover:text-[#1A1D24] hover:bg-[#F3F5F8] transition-colors cursor-pointer"
              title="Editar personalidad"
              aria-label="Editar personalidad"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenDetail(personality.id)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#DBDBDB] text-[#1A1D24] bg-white hover:bg-[#F3F5F8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Ver
          </button>
          <button
            type="button"
            onClick={() => onStartChat(personality.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chatear
          </button>
        </div>
      </div>
    </article>
  );
}
