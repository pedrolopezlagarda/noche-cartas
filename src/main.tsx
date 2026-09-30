import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'

async function bootstrap() {
  if (import.meta.env.VITE_DEMO_MODE === "true") {
    const { installDemoFetch } = await import("@/lib/demoFetch");
    installDemoFetch();
  }
  const { TRPCProvider } = await import("@/providers/trpc");
  const { default: App } = await import("./App.tsx");

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <TRPCProvider>
          <App />
        </TRPCProvider>
      </BrowserRouter>
    </StrictMode>,
  );
}

bootstrap();
