import { useState } from "react";
import { MessageSquare, Plus, X } from "lucide-react";
import type { Personality } from "../types";
import { AvatarDisplay } from "./AvatarDisplay";

interface NewChatModalProps {
  open: boolean;
  systemPersonalities: Personality[];
  myPersonalities: Personality[];
  onClose: () => void;
  onSelectPersonality: (personalityId: string) => void;
  onCreatePersonality: () => void;
  onExploreCommunity: () => void;
}

export function NewChatModal({
  open,
  systemPersonalities,
  myPersonalities,
  onClose,
  onSelectPersonality,
  onCreatePersonality,
  onExploreCommunity,
}: NewChatModalProps) {
  const [tab, setTab] = useState<"official" | "mine">("official");

  if (!open) return null;

  const list = tab === "official" ? systemPersonalities : myPersonalities;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white border border-[#DBDBDB] shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E9EE]">
          <div>
            <h3 className="text-base font-semibold text-[#1A1D24]">
              Nueva conversación
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Elige la personalidad con la que deseas interactuar
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#1A1D24] hover:bg-[#F3F5F8] cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#F3F5F8] border border-[#E7E9EE]">
            <button
              type="button"
              onClick={() => setTab("official")}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer ${
                tab === "official"
                  ? "bg-white text-[#1A1D24] border border-[#DBDBDB]"
                  : "text-[#6B6B6B] hover:text-[#1A1D24]"
              }`}
            >
              Oficiales ({systemPersonalities.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("mine")}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer ${
                tab === "mine"
                  ? "bg-white text-[#1A1D24] border border-[#DBDBDB]"
                  : "text-[#6B6B6B] hover:text-[#1A1D24]"
              }`}
            >
              Mis Personalidades ({myPersonalities.length})
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-2.5 flex-1">
          {list.length > 0 ? (
            list.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-[#E7E9EE] hover:border-[#5099D6] transition-colors bg-white"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AvatarDisplay avatar={p.avatar} alt={p.name} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#1A1D24] truncate">
                        {p.name}
                      </span>
                      <span className="text-xs text-[#6B6B6B]">· {p.category}</span>
                    </div>
                    <p className="text-xs text-[#6B6B6B] line-clamp-1">
                      {p.description}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectPersonality(p.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chatear
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 px-4 border border-dashed border-[#DBDBDB] rounded-xl">
              <p className="text-sm text-[#6B6B6B] mb-3">
                Aún no has creado personalidades propias.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCreatePersonality();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-[#DBDBDB] text-[#1A1D24] hover:bg-[#F3F5F8] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Crear personalidad
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#E7E9EE] bg-[#FAFBFD]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onExploreCommunity();
            }}
            className="text-xs font-medium text-[#3778AE] hover:underline cursor-pointer"
          >
            Explorar comunidad
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-[#DBDBDB] text-[#1A1D24] bg-white hover:bg-[#F3F5F8] cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
