# Noche de Cartas - Resumen del Proyecto

> Juego de cartas íntimo para parejas. Cada jugador crea su mazo, y en su turno juega una carta que la pareja debe ejecutar. Con temporizador, cartas especiales y modo sala para dos móviles.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Estilos | Tailwind CSS v3 + shadcn/ui |
| Animaciones | Framer Motion |
| Backend | tRPC v11 (procedures HTTP) |
| ORM | Drizzle ORM |
| Base de datos | MySQL |
| Auth | OAuth 2.0 (Kimi) |
| Deploy | Static (frontend) / Node (backend) |

---

## Estructura de Carpetas

```
app/
├── api/                    # Backend tRPC
│   ├── router.ts           # AppRouter principal (auth, cards, room)
│   ├── auth-router.ts      # Login/logout/me con OAuth Kimi
│   ├── cards-router.ts     # CRUD de cartas
│   ├── room-router.ts      # Lógica de salas multijugador
│   ├── queries/            # Queries raw de BD
│   │   ├── cards.ts
│   │   └── room.ts
│   └── middleware.ts       # createRouter, publicQuery, authedQuery
├── db/
│   ├── schema.ts           # Tablas: users, cards, rooms, roomPlayers
│   ├── relations.ts        # Relaciones Drizzle
│   ├── seed.ts             # Seed (TODO)
│   └── migrations/         # Vacío (TODO: generar)
├── src/
│   ├── main.tsx            # Entry point. Bootstrap condicional para demo mode
│   ├── App.tsx             # Rutas: /, /juego, /login, *
│   ├── index.css           # Tailwind + tema oscuro + utilidades custom
│   ├── const.ts            # Rutas y constantes
│   ├── pages/
│   │   ├── Home.tsx        # Editor de cartas (CRUD + tabs por mazo)
│   │   ├── Juego.tsx       # Juego local "Un móvil"
│   │   ├── RoomGame.tsx    # Juego en sala "Dos móviles"
│   │   ├── Login.tsx       # Redirección OAuth
│   │   └── NotFound.tsx
│   ├── components/
│   │   ├── AuthLayout.tsx  # Layout móvil: header + bottom nav
│   │   ├── AuthLayoutSkeleton.tsx
│   │   └── ui/             # 50+ componentes shadcn/ui
│   ├── hooks/
│   │   ├── useAuth.ts      # Hook de autenticación
│   │   └── use-mobile.ts   # Detecta breakpoint móvil
│   ├── lib/
│   │   ├── utils.ts        # cn() para clases Tailwind
│   │   ├── specials.ts     # Definición de cartas especiales
│   │   ├── feedback.ts     # Efectos de sonido (Web Audio API)
│   │   ├── demoData.ts     # Datos de ejemplo para preview
│   │   └── demoFetch.ts    # Mock de fetch para tRPC en demo
│   └── providers/
│       └── trpc.tsx        # Provider de tRPC + React Query
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── index.html              # Fuentes Google (Cormorant Garamond + Manrope)
```

---

## Modelo de Datos (Drizzle)

### `users`
- `id`, `unionId` (OAuth), `name`, `email`, `avatar`, `role`
- `createdAt`, `updatedAt`, `lastSignInAt`

### `cards`
- `id`, `userId` (FK → users)
- `deck`: enum `["el", "ella"]`
- `text`: contenido de la carta
- `minSeconds`, `maxSeconds`: rango opcional de duración (null = usar rango por defecto de partida)
- `createdAt`, `updatedAt`

### `rooms` (salas multijugador)
- `id`, `code` (único, 4-8 chars)
- `status`: `["lobby", "playing", "finished"]`
- `activeRole`: quién tiene el turno
- `extraPlays`: contador de turnos extra (Doble acción)
- `currentCard`: JSON con la carta en juego
- `defMin`, `defMax`: rango de tiempo por defecto de la sala

### `roomPlayers`
- `id`, `roomId`, `userId`, `role`
- `hand`: JSON (secreto, solo se devuelve al propietario)
- `pile`: JSON (mazo restante)

---

## Rutas del Frontend

| Ruta | Componente | Layout |
|------|-----------|--------|
| `/` | `Home` | AuthLayout |
| `/juego` | `Juego` | AuthLayout |
| `/login` | `Login` | - |
| `*` | `NotFound` | - |

> Nota: `RoomGame` (salas) aún no está enlazado en `App.tsx`. Falta añadir la ruta `/sala/:code`.

---

## API tRPC (Backend)

### `auth`
- `auth.me` → usuario actual (cookie `kimi_sid`)
- `auth.logout` → limpia cookie y sesión

### `cards`
- `cards.list` → lista de cartas del usuario logueado
- `cards.create` → crear carta (deck, text, minSeconds, maxSeconds)
- `cards.update` → editar carta por id
- `cards.delete` → eliminar carta por id

### `room`
- `room.create` → crea sala, creador elige rol
- `room.join` → une jugador a sala por código
- `room.get` → estado de la sala (solo devuelve `hand` del jugador que pregunta)
- `room.start` → inicia partida (baraja y reparte 3 cartas)
- `room.play` → juega una carta de la mano
- `room.endTimer` → ejecutar cuando acaba temporizador
- `room.restart` → reinicia partida
- `room.leave` → abandona sala (transfiere ownership o termina)

---

## Lógica del Juego (Local - Un Móvil)

Archivo: `src/pages/Juego.tsx`

1. **Setup**: se elige quién empieza (`el` o `ella`) y rango de tiempo por defecto.
2. **Barajar**: las cartas de cada mazo se barajan.
3. **Repartir**: 3 cartas a cada jugador. El resto forma el montón (`pile`).
4. **Turno activo**: el jugador con el turno ve su mano. La pareja NO ve nada (pantalla de "handoff").
5. **Jugar carta**: 
   - Acción → se sortea tiempo dentro del rango y empieza temporizador circular.
   - Especial → se aplica efecto inmediato (roba cartas, doble turno, nueva mano).
6. **Temporizador**: cuenta atrás visual con anillo animado. Al acabar → recarga mano y pasa turno.
7. **Fin de partida**: cuando a un jugador se le acaba el montón y la mano.

### Cartas Especiales (siempre disponibles)
- **Roba dos** (`special_draw_2`): roba 2 cartas de tu mazo.
- **Doble acción** (`special_double`): juegas otra carta sin ceder turno.
- **Manos nuevas** (`special_shuffle`): devuelves tu mano al mazo, barajas y robas 3.

---

## Demo Mode (Preview sin Backend)

Para poder probar la UI sin base de datos ni servidor, existe un **modo demo** activado con la variable de entorno `VITE_DEMO_MODE=true`.

### Archivos involucrados
- `src/lib/demoData.ts` → cartas y usuario de ejemplo
- `src/lib/demoFetch.ts` → intercepta fetch y responde mock para `/api/trpc`
- `src/hooks/useAuth.ts` → devuelve `DEMO_USER` en vez de llamar a `auth.me`
- `src/pages/Home.tsx` → usa estado local `demoCards` para create/update/delete
- `src/pages/Juego.tsx` → carga `DEMO_CARDS` como cartas iniciales

### Cómo usar
```bash
VITE_DEMO_MODE=true npm run build
```

> **Importante**: el demo mode NO afecta al funcionamiento real. Sin `VITE_DEMO_MODE`, todo funciona con tRPC + MySQL.

---

## Estilos y Temas

- **Tema**: oscuro forzado (`dark` en `<html>`)
- **Colores principales**: negro profundo, púrpura/vino (`#1a0510`), oro/ámbar, rosa (`#e11d48`)
- **Tipografía**: 
  - Títulos: `Cormorant Garamond` (serif elegante)
  - Cuerpo: `Manrope` (sans-serif moderna)
- **Efectos visuales**:
  - `card-luxe`: tarjetas con glassmorphism, borde sutil y sombra
  - `text-gradient-rose`: degradado rosa-naranja
  - `glow-rose`: sombra luminosa rosa
  - `timer-ring`: anillo de progreso SVG animado
  - Orbes de luz difusa en el fondo (CSS radial-gradients)
  - Grano de película (`grain` overlay con `mix-blend-mode: overlay`)

---

## Pendientes / TODOs

1. **Migraciones de BD**: `db/migrations/` está vacío. Ejecutar `npm run db:generate` y `npm run db:push`.
2. **Seed**: completar `db/seed.ts` con cartas por defecto.
3. **Ruta RoomGame**: añadir en `App.tsx` la ruta `/sala/:code` que renderice `RoomGame`.
4. **Conectar backend en producción**: configurar `DATABASE_URL`, `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `COOKIE_SECRET`.
5. **WebSockets (opcional)**: actualmente las salas usan polling. Se podría migrar a WebSockets para sincronización instantánea.

---

## Comandos útiles

```bash
# Instalar dependencias
npm install

# Dev server
npm run dev

# Build producción
npm run build

# Build con demo mode
VITE_DEMO_MODE=true npm run build

# TypeScript check
npm run check

# Drizzle
npm run db:push        # Aplicar schema a BD
npm run db:generate    # Generar migraciones
npm run db:studio      # Drizzle Studio (UI de BD)
```

---

*Última actualización: sesión actual. Este archivo debe actualizarse cuando se añadan rutas, tablas o cambios arquitectónicos significativos.*

---

## Estado Actual (Checkpoint de esta sesión)

### Funciona correctamente
- Layout móvil: header sticky + bottom nav (Cartas / Jugar)
- Crear cartas: bottom-sheet modal con scroll interno, encima del teclado
- Editar cartas: mismo modal bottom-sheet
- Eliminar cartas: modal de confirmación manual (sin Radix), sin quedarse pillado
- Navegación entre tabs de mazos (Él / Ella)
- Demo mode: funciona sin backend
- Mazos empiezan vacíos (0 cartas de ejemplo)
- Cartas especiales visibles como referencia (no editables)

### Cambios hechos en esta sesión
1. **AuthLayout.tsx** reescrito: sidebar de escritorio eliminado, reemplazado por layout tipo app móvil
2. **Home.tsx**:
   - Estado local `demoCards` para CRUD sin backend
   - `AlertDialog` de Radix reemplazado por modal manual de confirmación
   - `Dialog` de Radix reemplazado por bottom-sheet manual con scroll propio
   - Imports de `AlertDialog` y `Dialog` de shadcn/ui eliminados
3. **AuthLayoutSkeleton.tsx** adaptado al nuevo layout móvil
4. **demoData.ts**: `DEMO_CARDS` vacío (sin cartas de ejemplo)
5. **demoFetch.ts** + **useAuth.ts**: mock de usuario y fetch para demo mode

### Pendientes / TODOs actualizados
1. **Migraciones de BD**: `db/migrations/` vacío. Ejecutar `npm run db:generate` y `npm run db:push`.
2. **Seed**: completar `db/seed.ts`.
3. **Ruta RoomGame**: añadir en `App.tsx` la ruta `/sala/:code` → `RoomGame`.
4. **Conectar backend en producción**: `DATABASE_URL`, `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `COOKIE_SECRET`.
5. **WebSockets (opcional)**: salas usan polling actualmente.
6. **Textarea en bottom-sheet**: probar en móvil real para asegurar que el foco sube el modal encima del teclado.
7. **Haptic feedback / sonidos**: activar en modo producción (actualmente solo en Juego.tsx).
