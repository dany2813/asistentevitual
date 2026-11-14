import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { api, getStoredToken, setStoredToken } from "./api";
import type { PublicUser } from "./types";
import { TopBar, type AppRoute } from "./components/TopBar";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ChatsPage } from "./pages/ChatsPage";
import { PersonalitiesPage } from "./pages/PersonalitiesPage";
import { PersonalityFormPage } from "./pages/PersonalityFormPage";
import { PersonalityDetailPage } from "./pages/PersonalityDetailPage";
import { CommunityPage } from "./pages/CommunityPage";
import { FriendshipsPage } from "./pages/FriendshipsPage";
import { UserProfilePage } from "./pages/UserProfilePage";

export default function App() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [route, setRoute] = useState<AppRoute>({ name: "dashboard" });
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const token = getStoredToken();
        if (token) {
          const res = await api.me();
          if (active && res.user) {
            setUser(res.user);
            setRoute({ name: "dashboard" });
            setAuthChecked(true);
            return;
          }
          setStoredToken(null);
        }
        // Auto-sign into demo workspace only if no explicit logout, OR show clean Auth/Community?
        // Wait: to keep UX fluid and distraction-free, let's check if user visited before;
        // if not signed in, default to AuthPage (which has 1-click Demo) or Community!
        if (active) {
          setUser(null);
          setRoute({ name: "auth", mode: "login" });
        }
      } catch {
        if (active) {
          setUser(null);
          setRoute({ name: "auth", mode: "login" });
        }
      } finally {
        if (active) setAuthChecked(true);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 3500);
  }, []);

  const handleNavigate = useCallback(
    (next: AppRoute) => {
      const protectedRoutes: AppRoute["name"][] = [
        "dashboard",
        "chats",
        "personalities",
        "personality-create",
        "personality-edit",
        "friendships",
      ];
      if (!user && protectedRoutes.includes(next.name)) {
        setRoute({ name: "auth", mode: "login" });
        return;
      }
      setRoute(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [user]
  );

  const handleStartChat = useCallback(
    async (personalityId: string, version?: number) => {
      if (!user) {
        showToast("Inicia sesión para comenzar una conversación.");
        setRoute({ name: "auth", mode: "login" });
        return;
      }
      try {
        const res = await api.createChat(personalityId, version);
        setRoute({ name: "chats", chatId: res.chat.id });
      } catch (err) {
        showToast(
          err instanceof Error
            ? err.message
            : "No se pudo iniciar la conversación."
        );
      }
    },
    [user, showToast]
  );

  const handleLogout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setStoredToken(null);
    setUser(null);
    setPendingRequestsCount(0);
    setRoute({ name: "auth", mode: "login" });
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFBFD] text-xs text-[#6B6B6B]">
        Cargando Dochad...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFD] text-[#1A1D24]">
      <TopBar
        user={user}
        route={route}
        pendingRequestsCount={pendingRequestsCount}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[#5099D6] shadow-lg text-xs text-[#1A1D24]">
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-[#6B6B6B] hover:text-[#1A1D24] cursor-pointer"
            aria-label="Cerrar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1">
        {route.name === "auth" && (
          <AuthPage
            initialMode={route.mode}
            onSuccess={(loggedUser) => {
              setUser(loggedUser);
              setRoute({ name: "dashboard" });
            }}
            onNavigate={handleNavigate}
          />
        )}

        {route.name === "dashboard" && user && (
          <DashboardPage
            user={user}
            onNavigate={handleNavigate}
            onStartChat={handleStartChat}
            onPendingCountChange={setPendingRequestsCount}
          />
        )}

        {route.name === "chats" && user && (
          <ChatsPage initialChatId={route.chatId} onNavigate={handleNavigate} />
        )}

        {route.name === "personalities" && user && (
          <PersonalitiesPage
            onNavigate={handleNavigate}
            onStartChat={handleStartChat}
          />
        )}

        {route.name === "personality-create" && user && (
          <PersonalityFormPage onNavigate={handleNavigate} />
        )}

        {route.name === "personality-edit" && user && (
          <PersonalityFormPage editId={route.id} onNavigate={handleNavigate} />
        )}

        {route.name === "personality-detail" && (
          <PersonalityDetailPage
            id={route.id}
            currentUser={user}
            onNavigate={handleNavigate}
            onStartChat={handleStartChat}
          />
        )}

        {route.name === "community" && (
          <CommunityPage
            initialTag={route.tag}
            currentUser={user}
            onNavigate={handleNavigate}
            onStartChat={handleStartChat}
          />
        )}

        {route.name === "friendships" && user && (
          <FriendshipsPage
            onNavigate={handleNavigate}
            onPendingCountChange={setPendingRequestsCount}
          />
        )}

        {route.name === "profile" && (
          <UserProfilePage
            username={route.username}
            currentUser={user}
            onUserUpdated={setUser}
            onNavigate={handleNavigate}
            onStartChat={handleStartChat}
          />
        )}
      </div>

      {route.name !== "chats" && (
        <footer className="border-t border-[#E7E9EE] bg-white py-5 px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B6B6B]">
            <span>Dochad · Asistentes con personalidades configurables</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleNavigate({ name: "community" })}
                className="hover:text-[#1A1D24] cursor-pointer"
              >
                Comunidad
              </button>
              {user && (
                <button
                  type="button"
                  onClick={() => handleNavigate({ name: "personalities" })}
                  className="hover:text-[#1A1D24] cursor-pointer"
                >
                  Personalidades
                </button>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
