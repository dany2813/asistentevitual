import { useState, useRef, useEffect } from "react";
import { Menu, Plus, X, LogOut, User as UserIcon } from "lucide-react";
import type { PublicUser } from "../types";
import { AvatarDisplay } from "./AvatarDisplay";

export type AppRoute =
  | { name: "auth"; mode?: "login" | "register" }
  | { name: "dashboard" }
  | { name: "chats"; chatId?: string }
  | { name: "personalities" }
  | { name: "personality-create" }
  | { name: "personality-detail"; id: string }
  | { name: "personality-edit"; id: string }
  | { name: "community"; tag?: string }
  | { name: "friendships" }
  | { name: "profile"; username: string };

interface TopBarProps {
  user: PublicUser | null;
  route: AppRoute;
  pendingRequestsCount?: number;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
}

export function TopBar({
  user,
  route,
  pendingRequestsCount = 0,
  onNavigate,
  onLogout,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const navItems: Array<{ label: string; route: AppRoute; active: boolean; count?: number }> = user
    ? [
        {
          label: "Inicio",
          route: { name: "dashboard" },
          active: route.name === "dashboard",
        },
        {
          label: "Chats",
          route: { name: "chats" },
          active: route.name === "chats",
        },
        {
          label: "Personalidades",
          route: { name: "personalities" },
          active:
            route.name === "personalities" ||
            route.name === "personality-detail" ||
            route.name === "personality-edit",
        },
        {
          label: "Comunidad",
          route: { name: "community" },
          active: route.name === "community",
        },
        {
          label: "Amigos",
          route: { name: "friendships" },
          active: route.name === "friendships",
          count: pendingRequestsCount,
        },
      ]
    : [
        {
          label: "Comunidad",
          route: { name: "community" },
          active: route.name === "community",
        },
      ];

  function handleNavClick(target: AppRoute) {
    setMobileNavOpen(false);
    setMenuOpen(false);
    onNavigate(target);
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-[#DBDBDB]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() =>
            handleNavClick(user ? { name: "dashboard" } : { name: "community" })
          }
          className="font-display text-lg font-bold tracking-tight text-[#1A1D24] whitespace-nowrap shrink-0 flex items-center gap-2.5 cursor-pointer"
        >
          <span className="w-8 h-8 rounded-lg overflow-hidden bg-[#17191C] border border-[#DBDBDB] flex items-center justify-center shrink-0">
            <img
              src="/assets/aistudio/Chiaki__3__b0640476.png"
              alt="Logo de Dochad"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </span>
          <span>Dochad</span>
        </button>

        {/* Zone 2: Clean Single-Line Nav Links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navegación principal">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleNavClick(item.route)}
              className={`relative py-4 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                item.active
                  ? "text-[#1A1D24]"
                  : "text-[#6B6B6B] hover:text-[#1A1D24]"
              }`}
            >
              <span>{item.label}</span>
              {typeof item.count === "number" && item.count > 0 && (
                <span className="ml-1.5 text-[11px] font-mono tabular-nums text-[#3778AE]">
                  ({item.count})
                </span>
              )}
              {item.active && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#5099D6]"
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Zone 3: Single Primary Action + Compact User Access */}
        <div className="flex items-center gap-2.5 shrink-0">
          {user ? (
            <>
              <button
                type="button"
                onClick={() => handleNavClick({ name: "personality-create" })}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Personalidad</span>
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg border border-[#DBDBDB] bg-white hover:bg-[#F3F5F8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  aria-expanded={menuOpen}
                  aria-label="Menú de usuario"
                >
                  <AvatarDisplay avatar={user.avatar} alt={user.username} size="xs" fallback="👤" />
                  <span className="text-xs font-medium text-[#1A1D24] max-w-[100px] truncate">
                    @{user.username}
                  </span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-[#DBDBDB] shadow-lg py-1.5 z-50">
                    <button
                      type="button"
                      onClick={() =>
                        handleNavClick({ name: "profile", username: user.username })
                      }
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#1A1D24] hover:bg-[#F3F5F8] flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-[#6B6B6B]" />
                      Mi Perfil
                    </button>
                    <div className="my-1 border-t border-[#E7E9EE]" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => handleNavClick({ name: "auth", mode: "login" })}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Iniciar sesión
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-[#6B6B6B] hover:text-[#1A1D24] hover:bg-[#F3F5F8] cursor-pointer"
            aria-label="Abrir menú"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="md:hidden border-t border-[#E7E9EE] bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleNavClick(item.route)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                item.active
                  ? "bg-[#5099D6]/10 text-[#3778AE]"
                  : "text-[#6B6B6B] hover:text-[#1A1D24] hover:bg-[#F3F5F8]"
              }`}
            >
              {item.label}
              {typeof item.count === "number" && item.count > 0 && (
                <span className="ml-1.5 text-xs tabular-nums">({item.count})</span>
              )}
            </button>
          ))}
          {user && (
            <button
              type="button"
              onClick={() => handleNavClick({ name: "personality-create" })}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#3778AE] hover:bg-[#5099D6]/10 cursor-pointer"
            >
              + Nueva Personalidad
            </button>
          )}
        </div>
      )}
    </header>
  );
}
