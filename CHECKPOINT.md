# CHECKPOINT - Noche de Cartas

> Si estás leyendo esto en una conversación nueva, significa que la anterior expiró. Este archivo te permite recuperar el estado exacto del proyecto.

---

## Versión guardada

- **Version ID**: `565e7e3`
- Para recuperar: usa el rollback en el panel de versiones de Kimi con este ID.

---

## Qué funciona ahora mismo

1. **Layout móvil completo**: Header arriba, bottom nav (Cartas / Jugar), contenido centrado
2. **Editor de cartas**:
   - Mazos empiezan vacíos (el usuario crea sus propias cartas)
   - Crear carta: bottom-sheet modal desde abajo, con scroll interno
   - Editar carta: mismo modal
   - Eliminar carta: confirmación manual sin bloqueos
   - Tabs por mazo: "Mazo de Él" (lo que hará Ella) / "Mazo de Ella" (lo que hará Él)
3. **Persistencia**: las cartas se guardan en `localStorage` y sobreviven entre páginas y recargas
4. **Demo mode**: funciona sin backend ni base de datos
5. **Cartas especiales**: visibles como referencia (Roba dos, Doble acción, Manos nuevas)
6. **Navegación**: fluida entre editor (`/`) y juego (`/juego`)

---

## Archivos clave modificados en la última sesión

| Archivo | Cambio |
|---------|--------|
| `src/components/AuthLayout.tsx` | Layout móvil con bottom nav |
| `src/components/AuthLayoutSkeleton.tsx` | Skeleton adaptado al nuevo layout |
| `src/pages/Home.tsx` | CRUD demo, bottom-sheet manual, modal delete manual |
| `src/lib/demoData.ts` | `DEMO_CARDS` vacío |
| `src/lib/demoFetch.ts` | Mock de fetch para tRPC |
| `src/hooks/useAuth.ts` | Mock de usuario para demo |
| `src/hooks/useDemoCards.ts` | Persistencia de cartas en localStorage |
| `src/main.tsx` | Bootstrap condicional para demo mode |
| `RESUMEN.md` | Documentación completa del proyecto |
| `CHECKPOINT.md` | Este archivo |

---

## Cómo continuar desde aquí

### Si recuperaste el proyecto desde la versión

```bash
cd /mnt/agents/output/app
npm install

# Para preview sin backend
VITE_DEMO_MODE=true npm run dev

# Para desarrollo con backend (necesitas .env)
npm run dev
```

### Variables de entorno necesarias para backend real

Crear archivo `.env`:

```env
DATABASE_URL=mysql://usuario:pass@host:3306/noche_cartas
OAUTH_CLIENT_ID=tu_client_id
OAUTH_CLIENT_SECRET=tu_client_secret
COOKIE_SECRET=una_clave_secreta_larga
```

---

## Pendientes prioritarios

1. [ ] **Conectar backend**: Crear `.env` y probar con base de datos real
2. [ ] **Migraciones**: `npm run db:generate` y `npm run db:push`
3. [ ] **Ruta RoomGame**: Añadir `/sala/:code` en `App.tsx` para el modo dos móviles
4. [ ] **Test en móvil real**: Verificar que el bottom-sheet sube encima del teclado virtual
5. [ ] **Sonidos y vibración**: Asegurar que funcionan en producción

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
