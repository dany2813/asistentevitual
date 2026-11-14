import { useState, type FormEvent } from "react";
import { api, setStoredToken } from "../api";
import type { PublicUser } from "../types";
import type { AppRoute } from "../components/TopBar";

interface AuthPageProps {
  initialMode?: "login" | "register";
  onSuccess: (user: PublicUser) => void;
  onNavigate: (route: AppRoute) => void;
}

export function AuthPage({
  initialMode = "login",
  onSuccess,
  onNavigate,
}: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await api.login(identifier, password);
        setStoredToken(res.token);
        onSuccess(res.user);
      } else {
        const res = await api.register({ email, username, password, bio });
        setStoredToken(res.token);
        onSuccess(res.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[#DBDBDB] rounded-2xl p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-9 h-9 rounded-xl overflow-hidden bg-[#17191C] border border-[#DBDBDB] flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/Chiaki__3__b0640476.png"
                alt="Logo de Dochad"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </span>
            <span className="font-display text-base font-bold text-[#1A1D24]">
              Dochad
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[#1A1D24]">
            {mode === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta"}
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {mode === "login"
              ? "Accede a tus personalidades, conversaciones y amigos."
              : "Diseña asistentes con instrucciones y versiones propias."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#F3F5F8] border border-[#E7E9EE] mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              mode === "login"
                ? "bg-white text-[#1A1D24] border border-[#DBDBDB]"
                : "text-[#6B6B6B] hover:text-[#1A1D24]"
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              mode === "register"
                ? "bg-white text-[#1A1D24] border border-[#DBDBDB]"
                : "text-[#6B6B6B] hover:text-[#1A1D24]"
            }`}
          >
            Registrarse
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "login" ? (
            <div>
              <label
                htmlFor="login-identifier"
                className="block text-xs font-medium text-[#1A1D24] mb-1.5"
              >
                Usuario o correo electrónico
              </label>
              <input
                id="login-identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="usuario o correo@ejemplo.com"
                className="w-full h-10 px-3 text-sm rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
              />
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-medium text-[#1A1D24] mb-1.5"
                >
                  Correo electrónico
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-username"
                  className="block text-xs font-medium text-[#1A1D24] mb-1.5"
                >
                  Nombre de usuario
                </label>
                <input
                  id="reg-username"
                  type="text"
                  required
                  minLength={3}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="creador_ia"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
                />
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-medium text-[#1A1D24] mb-1.5"
            >
              Contraseña
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full h-10 px-3 text-sm rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
            />
          </div>

          {mode === "register" && (
            <div>
              <label
                htmlFor="reg-bio"
                className="block text-xs font-medium text-[#1A1D24] mb-1.5"
              >
                Biografía breve (opcional)
              </label>
              <input
                id="reg-bio"
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ej. Diseñando asistentes de código y escritura"
                maxLength={140}
                className="w-full h-10 px-3 text-sm rounded-lg border border-[#DBDBDB] bg-white text-[#1A1D24] focus:border-[#5099D6]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 px-4 text-sm font-medium rounded-lg bg-[#3778AE] text-white hover:bg-[#2E6796] transition-colors disabled:opacity-60 cursor-pointer"
          >
            {loading
              ? "Procesando..."
              : mode === "login"
              ? "Entrar"
              : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-[#E7E9EE]">
          <button
            type="button"
            onClick={() => onNavigate({ name: "community" })}
            className="w-full py-2 text-xs font-medium text-[#6B6B6B] hover:text-[#1A1D24] transition-colors cursor-pointer"
          >
            Explorar personalidades públicas sin cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
