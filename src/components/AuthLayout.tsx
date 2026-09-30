import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LOGIN_PATH } from "@/const";
import { Heart, LogOut, Spade } from "lucide-react";
import { type ReactNode, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { AuthLayoutSkeleton } from "./AuthLayoutSkeleton";

const tabs = [
  { icon: Spade, label: "Cartas", path: "/" },
  { icon: Heart, label: "Jugar", path: "/juego" },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <AuthLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Noche de Cartas
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Inicia sesión para guardar tus cartas y jugar con tu pareja.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = LOGIN_PATH; }}
            size="lg"
            className="w-full rounded-full bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 glow-rose border-0"
          >
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return <MobileLayout>{children}</MobileLayout>;
}

function MobileLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const activePath = location.pathname;

  const handleNav = useCallback((path: string) => {
    if (activePath !== path) navigate(path);
  }, [activePath, navigate]);

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Header móvil */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl font-semibold tracking-tight">
            Noche de <span className="text-gradient-rose italic">Cartas</span>
          </span>
        </div>
        <button
          onClick={() => setShowMenu((s) => !s)}
          className="relative h-8 w-8 rounded-full bg-secondary/60 flex items-center justify-center text-sm font-medium border border-border/60"
        >
          {user?.name?.charAt(0).toUpperCase() ?? "?"}
        </button>

        {/* Menú desplegable usuario */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-3 top-12 z-50 w-48 rounded-xl border border-border bg-card shadow-xl p-2">
              <div className="px-3 py-2 border-b border-border/50 mb-1">
                <p className="text-sm font-medium truncate">{user?.name || "-"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "-"}</p>
              </div>
              <button
                onClick={() => { logout(); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </header>

      {/* Contenido principal */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4 pb-24">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-md border-t border-border/40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 max-w-2xl mx-auto">
          {tabs.map((t) => {
            const isActive = activePath === t.path;
            return (
              <button
                key={t.path}
                onClick={() => handleNav(t.path)}
                className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
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
