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
  const { isLoading, user } = useFirebaseAuth();

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
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-serif text-stone-100">
              Noche de <span className="text-amber-400">Cartas</span>
            </h1>
            <p className="text-sm text-stone-500 text-center max-w-sm">
              Conectando con el servidor...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <MobileLayout>{children}</MobileLayout>;
}

function MobileLayout({ children }: { children: ReactNode }) {
  const { user } = useFirebaseAuth();
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
          className="relative h-8 w-8 rounded-full bg-stone-800/60 flex items-center justify-center text-sm font-medium border border-stone-700/60 text-stone-300"
        >
          {user?.uid?.substring(0, 2).toUpperCase() ?? "?"}
        </button>

        {/* Menú desplegable usuario */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-3 top-12 z-50 w-48 rounded-xl border border-stone-700 bg-stone-900 shadow-xl p-2">
              <div className="px-3 py-2 border-b border-stone-700/50 mb-1">
                <p className="text-sm font-medium text-stone-200 truncate">Jugador</p>
                <p className="text-xs text-stone-500 truncate">{user?.uid?.substring(0, 12) ?? "-"}</p>
              </div>
              <button
                onClick={() => { setShowMenu(false); }}
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
