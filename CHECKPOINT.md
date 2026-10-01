# CHECKPOINT - Noche de Cartas

> Si estás leyendo esto en una conversación nueva, significa que la anterior expiró. Este archivo te permite recuperar el estado exacto del proyecto.

---

## Versión guardada

- **Version ID**: `565e7e3` (persistencia localStorage, demo mode)
- **Version ID**: `a46ff4a` (SQLite + backend real + salas online)
- **Version ID**: `32d8720` (SQLite gratuito + auth automático + salas online)
- Para recuperar: usa el rollback en el panel de versiones de Kimi con el ID correspondiente.

---

## Qué funciona ahora mismo

### Todo funciona con backend real (gratuito)
1. **Layout móvil completo**: Header arriba, bottom nav (Cartas / Jugar / Sala), contenido centrado
2. **Auth automático**: entras y ya tienes usuario, sin configurar OAuth
3. **Editor de cartas** (guardado en SQLite gratuito):
   - Mazos empiezan vacíos (el usuario crea sus propias cartas)
   - Crear/editar/eliminar cartas: guardadas en BD real
   - Tabs por mazo: "Mazo de Él" (lo que hará Ella) / "Mazo de Ella" (lo que hará Él)
4. **Juego local** (`/juego`): un móvil, pasáis el teléfono
5. **Salas online** (`/sala`): dos móviles con código de sala
   - Uno crea sala → obtiene código de 4 letras
   - El otro introduce el código → se unen
   - Juegan en tiempo real con polling cada 1.2s
6. **Cartas especiales**: Roba dos, Doble acción, Manos nuevas
7. **Base de datos SQLite**: archivo local `db.sqlite`, cero costos

---

## Archivos clave modificados en la última sesión (SQLite gratuito + auth automático)

| Archivo | Cambio |
|---------|--------|
| `db/schema.ts` | SQLite: users, cards, rooms, roomPlayers |
| `api/dev-auth-router.ts` | Auth automático sin OAuth (crea usuario demo) |
| `api/router.ts` | Registrado `devAuth` router |
| `src/hooks/useAuth.ts` | Intenta `auth.me`, si falla llama `devAuth.autoLogin` |
| `src/pages/Home.tsx` | Usa BD real vía tRPC (eliminado demo mode) |
| `src/pages/Juego.tsx` | Usa BD real vía tRPC (eliminado demo mode) |
| `src/main.tsx` | Simplificado, sin lógica de demo mode |
| `src/lib/demoData.ts` | Eliminado |
| `src/lib/demoFetch.ts` | Eliminado |
| `src/hooks/useDemoCards.ts` | Eliminado |
| `.env` | `DATABASE_URL=file:./db.sqlite` |

---

## Cómo continuar desde aquí

### Si recuperaste el proyecto desde la versión

```bash
cd /mnt/agents/output/app
npm install

# 1. Crear base de datos SQLite (gratuita)
npm run db:push

# 2. Desarrollo con backend real (servidor en http://localhost:3000)
npm run dev
```

### Variables de entorno (archivo `.env`)

```env
# ── Database (SQLite gratuita) ─────────────────────────────────
DATABASE_URL=file:./db.sqlite

# ── Auth (automático, no necesitas OAuth para probar) ──────────
APP_ID=demo
APP_SECRET=demo_secret

# ── Frontend ───────────────────────────────────────────────────
VITE_KIMI_AUTH_URL=https://auth.kimi.com
VITE_APP_ID=demo

# ── Backend ────────────────────────────────────────────────────
KIMI_AUTH_URL=https://auth.kimi.com
KIMI_OPEN_URL=https://open.kimi.com
```

---

## Pendientes prioritarios

1. [x] **SQLite gratuito**: Hecho. Base de datos en archivo local `db.sqlite`
2. [x] **Auth automático**: Hecho. Sin necesidad de OAuth para probar
3. [x] **Salas online**: Hecho. Dos móviles con código de sala
4. [ ] **Test en móvil real**: Verificar salas con dos móviles en la misma red WiFi
5. [ ] **Sonidos y vibración**: Asegurar que funcionan en producción
6. [ ] **WebSockets (opcional)**: Actualmente las salas usan polling cada 1.2s
7. [ ] **Deploy en servidor**: Para jugar online fuera de la WiFi local (Railway, Render, Fly.io free tier)

---

## Notas para el siguiente agente

- El proyecto usa **React 19 + Vite + Tailwind v3 + shadcn/ui**
- **Auth**: automático vía `devAuth.autoLogin`. Crea usuario demo si no hay sesión.
- Para OAuth real: configurar `APP_ID` y `APP_SECRET` de Kimi Portal.
- El backend es tRPC con Drizzle ORM sobre **SQLite** (gratuito)
- Base de datos: archivo `db.sqlite` local, cero costos
- Los mazos deben empezar vacíos. NO añadir cartas de ejemplo.
- Los modales de creación/edición son **bottom-sheets manuales**
- El modal de eliminación es **manual** (no usa AlertDialog)
- Todas las animaciones usan Framer Motion
- El tema es oscuro forzado

---

*Guardado en versión: 565e7e3*
