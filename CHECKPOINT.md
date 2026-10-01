# CHECKPOINT - Noche de Cartas

> Si estás leyendo esto en una conversación nueva, significa que la anterior expiró. Este archivo te permite recuperar el estado exacto del proyecto.

---

## Versión guardada

- **Version ID**: `565e7e3` (persistencia localStorage)
- **NUEVA Version ID**: `PENDIENTE` (SQLite + backend real + salas online)
- Para recuperar: usa el rollback en el panel de versiones de Kimi con el ID correspondiente.

---

## Qué funciona ahora mismo

### Frontend (preview estático)
1. **Layout móvil completo**: Header arriba, bottom nav (Cartas / Jugar / Sala), contenido centrado
2. **Editor de cartas**:
   - Mazos empiezan vacíos (el usuario crea sus propias cartas)
   - Crear carta: bottom-sheet modal desde abajo, con scroll interno
   - Editar carta: mismo modal
   - Eliminar carta: confirmación manual sin bloqueos
   - Tabs por mazo: "Mazo de Él" (lo que hará Ella) / "Mazo de Ella" (lo que hará Él)
3. **Persistencia demo**: las cartas se guardan en `localStorage` y sobreviven entre páginas y recargas
4. **Cartas especiales**: visibles como referencia (Roba dos, Doble acción, Manos nuevas)
5. **Navegación**: fluida entre editor (`/`), juego local (`/juego`) y salas (`/sala`)

### Backend (requiere `npm run dev`)
6. **Base de datos SQLite**: persistencia real de usuarios, cartas y salas
7. **Salas online**: crear sala con código, unirse, jugar con dos móviles
8. **OAuth Kimi**: autenticación real (necesita credenciales válidas)
9. **tRPC API completa**: auth, cards (CRUD), room (crear/unir/jugar/finalizar)

---

## Archivos clave modificados en la última sesión (SQLite + backend real)

| Archivo | Cambio |
|---------|--------|
| `db/schema.ts` | Migrado de MySQL a SQLite (sqliteTable, integer, text) |
| `db/relations.ts` | Vacío (no se usan relaciones complejas) |
| `drizzle.config.ts` | Dialect sqlite, URL por defecto `file:./db.sqlite` |
| `api/queries/connection.ts` | Usa `@libsql/client` en vez de `mysql2` |
| `api/queries/users.ts` | `onConflictDoUpdate` en vez de `onDuplicateKeyUpdate` |
| `api/queries/room.ts` | `.returning()` en vez de `$returningId()` |
| `src/App.tsx` | Añadida ruta `/sala/:code?` → `RoomGame` |
| `src/components/AuthLayout.tsx` | Añadida pestaña "Sala" en bottom nav |
| `src/pages/RoomGame.tsx` | Lee código de URL params + localStorage |
| `.env` | Creado con `DATABASE_URL=file:./db.sqlite` |
| `package.json` | Eliminado `mysql2`, añadido `@libsql/client` |

---

## Cómo continuar desde aquí

### Si recuperaste el proyecto desde la versión

```bash
cd /mnt/agents/output/app
npm install

# 1. Crear base de datos SQLite
npm run db:push

# 2. Desarrollo con backend real (servidor Hono en http://localhost:3000)
npm run dev

# 3. Preview estático sin backend (modo demo)
VITE_DEMO_MODE=true npm run dev
```

### Variables de entorno (archivo `.env`)

```env
# ── Backend ─────────────────────────────────────────────────────
APP_ID=tu_app_id
APP_SECRET=tu_app_secret

# ── Database ───────────────────────────────────────────────────
DATABASE_URL=file:./db.sqlite

# ── Frontend (expuesto al navegador por Vite) ───────────────────
VITE_KIMI_AUTH_URL=https://auth.kimi.com
VITE_APP_ID=tu_app_id

# ── Backend (Auth) ─────────────────────────────────────────────
KIMI_AUTH_URL=https://auth.kimi.com
KIMI_OPEN_URL=https://open.kimi.com

# ── Admin Role ──────────────────────────────────────────────────
OWNER_UNION_ID=tu_union_id
```

---

## Pendientes prioritarios

1. [x] **Migrar a SQLite**: Hecho. Base de datos funciona con `file:./db.sqlite`
2. [x] **Ruta RoomGame**: Hecho. Ruta `/sala/:code?` añadida en `App.tsx`
3. [ ] **Configurar OAuth real**: Obtener `APP_ID` y `APP_SECRET` de Kimi Portal
4. [ ] **Deploy backend en servidor**: El frontend estático no ejecuta el backend. Necesitas un VPS (Railway, Render, Fly.io) o ejecutar `npm start` en un servidor.
5. [ ] **Test en móvil real**: Verificar salas con dos móviles en la misma red WiFi
6. [ ] **Sonidos y vibración**: Asegurar que funcionan en producción
7. [ ] **WebSockets (opcional)**: Actualmente las salas usan polling cada 1.2s. WebSockets daría sincronización instantánea.

---

## Notas para el siguiente agente

- El proyecto usa **React 19 + Vite + Tailwind v3 + shadcn/ui**
- La autenticación es OAuth de Kimi (cookie `kimi_sid`)
- El backend es tRPC con Drizzle ORM sobre MySQL
- **Demo mode**: activado con `VITE_DEMO_MODE=true`. Usa estado local en vez de tRPC.
- Los mazos deben empezar vacíos. NO añadir cartas de ejemplo.
- Los modales de creación/edición son **bottom-sheets manuales** (no usan Dialog de shadcn/ui)
- El modal de eliminación es **manual** (no usa AlertDialog de shadcn/ui)
- Todas las animaciones usan Framer Motion
- El tema es oscuro forzado

---

*Guardado en versión: 565e7e3*
