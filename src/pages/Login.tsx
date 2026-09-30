import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles } from "lucide-react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card-luxe rounded-3xl w-full max-w-md px-8 py-12 text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
          className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-400 glow-rose flex items-center justify-center"
        >
          <Heart className="h-8 w-8 text-white" fill="currentColor" />
        </motion.div>
        <h1 className="font-display text-4xl font-semibold leading-tight">
          Noche de <span className="text-gradient-rose italic">Cartas</span>
        </h1>
        <p className="text-muted-foreground mt-3 mb-8 text-sm leading-relaxed">
          Vuestro juego de pareja. Inicia sesión para guardar vuestros mazos y
          retomarlos donde lo dejasteis.
        </p>
        <Button
          className="w-full rounded-full h-12 text-base bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 glow-rose border-0"
          size="lg"
          onClick={() => {
            window.location.href = getOAuthUrl();
          }}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Entrar con Kimi
        </Button>
        <p className="text-xs text-muted-foreground mt-6">
          Solo vosotros dos tendréis acceso a vuestras cartas.
        </p>
      </motion.div>
    </div>
  );
}
