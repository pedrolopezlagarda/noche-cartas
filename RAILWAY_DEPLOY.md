# Deploy en Railway (Gratuito)

## Pasos

### 1. Crear cuenta en Railway
- Ve a https://railway.app
- Regístrate con GitHub

### 2. Crear proyecto nuevo
- Click en "New Project"
- Selecciona "Deploy from GitHub repo"
- Conecta tu cuenta de GitHub
- Selecciona el repositorio (sube este código a GitHub primero)

### 3. Railway detectará automáticamente
- El `Dockerfile` → construirá la imagen
- El `railway.toml` → configurará el deploy

### 4. Variables de entorno (en Railway Dashboard)
Ve a "Variables" y añade:

```
NODE_ENV=production
DATABASE_URL=file:/app/data/db.sqlite
APP_ID=demo_app_id
APP_SECRET=demo_app_secret_for_dev_only
VITE_KIMI_AUTH_URL=https://auth.kimi.com
VITE_APP_ID=demo_app_id
KIMI_AUTH_URL=https://auth.kimi.com
KIMI_OPEN_URL=https://open.kimi.com
OWNER_UNION_ID=
```

> Nota: Railway generará automáticamente un `PORT` variable.

### 5. Deploy
- Railway hará build automáticamente
- La base de datos SQLite se creará al arrancar (`npx drizzle-kit push`)
- El frontend y backend corren en el mismo servidor

### 6. URL pública
- Railway te dará una URL tipo `https://noche-cartas.up.railway.app`
- Comparte esa URL con tu pareja
- Ambos abrís la URL en vuestros móviles
- ¡A jugar!

## Alternativa: Deploy sin GitHub

Si no quieres usar GitHub, puedes usar la CLI de Railway:

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init

# Deploy
railway up
```

## Notas importantes

- SQLite en Railway: los datos se mantienen mientras el servicio esté activo. Si Railway reinicia el contenedor, los datos persisten en el volumen.
- Plan gratuito: Railway ofrece $5 de crédito mensual (suficiente para este proyecto).
- Para mayor persistencia, considera añadir un volumen persistente en Railway.
