import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Heart, LogOut, Spade, Wifi } from "lucide-react";
import { type ReactNode, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";

const tabs = [
  { icon: Spade, label: "Cartas", path: "/" },
  { icon: Heart, label: "Jugar", path: "/juego" },
  { icon: Wifi, label: "Sala", path: "/sala" },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { isLoading, user, signInWithGoogle } = useFirebaseAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-stone-950">
        <div className="text-sm text-stone-500">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-stone-950">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full">
          <h1 className="text-2xl font-serif text-stone-100">
            Noche de <span className="text-amber-400">Cartas</span>
          </h1>
          <p className="text-sm text-stone-500 text-center">
            Inicia sesión para guardar tus cartas y jugar con tu pareja.
          </p>
          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-3 px-6 py-3 bg-white text-stone-900 rounded-xl font-medium hover:bg-stone-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar con Google
          </button>
        </div>
      </div>
    );
  }

  return <MobileLayout>{children}</MobileLayout>;
}

function MobileLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useFirebaseAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const activePath = location.pathname;

  const handleNav = useCallback((path: string) => {
    if (activePath !== path) navigate(path);
  }, [activePath, navigate]);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-stone-950">
      {/* Header móvil */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-stone-950/80 backdrop-blur-md border-b border-stone-800/40">
        <div className="flex items-center gap-2">
          <span className="font-serif text-xl font-semibold text-stone-100">
            Noche de <span className="text-amber-400 italic">Cartas</span>
          </span>
        </div>
        <button
          onClick={() => setShowMenu((s) => !s)}
          className="relative h-8 w-8 rounded-full bg-stone-800/60 flex items-center justify-center text-sm font-medium border border-stone-700/60 text-stone-300 overflow-hidden"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            user?.displayName?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? "?"
          )}
        </button>

        {/* Menú desplegable usuario */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-3 top-12 z-50 w-56 rounded-xl border border-stone-700 bg-stone-900 shadow-xl p-2">
              <div className="px-3 py-2 border-b border-stone-700/50 mb-1">
                <p className="text-sm font-medium text-stone-200 truncate">{user?.displayName ?? "Jugador"}</p>
                <p className="text-xs text-stone-500 truncate">{user?.email ?? ""}</p>
              </div>
              <button
                onClick={() => { signOut(); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </header>

      {/* Contenido principal */}
      <main className="flex-1 w-full max-w-2xl mx-auto py-2 pb-24">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-stone-950/90 backdrop-blur-md border-t border-stone-800/40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 max-w-2xl mx-auto">
          {tabs.map((t) => {
            const isActive = activePath === t.path;
            return (
              <button
                key={t.path}
                onClick={() => handleNav(t.path)}
                className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                  isActive ? "text-amber-400" : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <t.icon className="h-5 w-5" />
                <span className="text-[11px] font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
