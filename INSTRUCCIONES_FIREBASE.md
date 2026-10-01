# 🎴 Noche de Cartas - Despliegue en Firebase (GRATIS, sin tarjeta)

## PASO 1: Crear proyecto en Firebase (2 minutos)

1. Abre tu navegador y ve a: https://console.firebase.google.com
2. Click en **"Crear un proyecto"** (botón azul grande)
3. Escribe el nombre: `Noche de Cartas`
4. **Desmarca** la casilla que dice "Activar Google Analytics" (no lo necesitamos)
5. Click en **"Crear proyecto"**
6. Espera a que termine (unos segundos)
7. Click en **"Continuar"**

## PASO 2: Obtener la configuración (1 minuto)

1. En la pantalla principal del proyecto, busca un icono de **engranaje** (⚙️) al lado del nombre del proyecto, arriba a la izquierda
2. Click en **"Configuración del proyecto"**
3. Baja hasta donde dice **"Tus apps"**
4. Click en el icono **"</>"** (esto significa "Web")
5. Dale un nombre a la app: `noche-cartas-web`
6. **Desmarca** "Configura Firebase Hosting" (lo haremos después)
7. Click en **"Registrar app"**
8. Verás un código como este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "noche-cartas-12345.firebaseapp.com",
  projectId: "noche-cartas-12345",
  storageBucket: "noche-cartas-12345.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

9. **Copia esos valores** (apiKey, authDomain, projectId, etc.)

## PASO 3: Pegar la configuración en el código (1 minuto)

1. Abre la carpeta del proyecto en tu ordenador
2. Busca el archivo: `src/lib/firebase.ts`
3. Abrelo con cualquier editor de texto (Bloc de notas, VS Code, etc.)
4. Verás esto:

```javascript
const firebaseConfig = {
  apiKey: "Pega aqui tu apiKey",
  authDomain: "Pega aqui tu authDomain",
  ...
};
```

5. **Reemplaza** los textos entre comillas con los valores que copiaste del paso 2
6. Guarda el archivo (Ctrl+S)

## PASO 4: Activar Firestore (base de datos) (1 minuto)

1. Vuelve a https://console.firebase.google.com
2. En el menu de la izquierda, busca **"Firestore Database"**
3. Click en **"Crear base de datos"**
4. Selecciona **"Comenzar en modo de prueba"** (las reglas de seguridad estarán abiertas)
5. Click en **"Siguiente"**
6. Elige la ubicación más cercana a ti (por ejemplo `europe-west` si estás en España)
7. Click en **"Habilitar"**

## PASO 5: Activar Auth (login anónimo) (30 segundos)

1. En el menu de la izquierda, busca **"Authentication"**
2. Click en **"Comenzar"**
3. Ve a la pestaña **"Sign-in method"** (Método de inicio de sesión)
4. Busca **"Anonymous"** (Anónimo)
5. Click en el lápiz (editar)
6. Actívalo (switch a ON)
7. Click en **"Guardar"**

## PASO 6: Instalar Firebase CLI (1 vez, 2 minutos)

Abre la terminal en tu ordenador y ejecuta:

```bash
npm install -g firebase-tools
```

Si te da error en Windows, prueba con:
```bash
npm install -g firebase-tools --force
```

## PASO 7: Hacer login en Firebase (30 segundos)

En la terminal, ejecuta:

```bash
firebase login
```

Se abrirá una ventana del navegador. Elige tu cuenta de Google y acepta los permisos.

## PASO 8: Configurar el proyecto (30 segundos)

En la terminal, dentro de la carpeta del proyecto, ejecuta:

```bash
firebase use --add
```

Te preguntará:
- ¿Qué proyecto quieres usar? → Selecciona `Noche de Cartas`
- ¿Qué alias quieres? → Escribe `default` y dale Enter

## PASO 9: Hacer build (1 minuto)

En la terminal, ejecuta:

```bash
npm run build
```

Esto creará la carpeta `dist/public` con tu app lista.

## PASO 10: Desplegar (1 minuto)

En la terminal, ejecuta:

```bash
firebase deploy
```

Espera unos segundos...

## 🎉 ¡LISTO!

Verás un mensaje como este:

```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/noche-cartas-12345/overview
Hosting URL: https://noche-cartas-12345.web.app
```

**Esa URL (https://noche-cartas-12345.web.app) es tu juego.**

Compártela con tu pareja y jugad desde cualquier lugar. 🃏💕

---

## 🆘 Si algo falla

### "firebase no se reconoce como comando"
→ Cierra la terminal y vuelve a abrirla

### "Error: No project active"
→ Ejecuta `firebase use --add` y selecciona tu proyecto

### "No tengo permisos"
→ Asegúrate de haber hecho `firebase login` correctamente

### Las cartas no se guardan
→ Verifica que activaste Firestore (Paso 4)

### No puedo entrar a la app
→ Verifica que activaste Auth Anónimo (Paso 5)
