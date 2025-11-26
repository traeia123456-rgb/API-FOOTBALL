# 🚀 Football Assistant - Migración a Next.js

## ✅ Migración Completada

El sistema ha sido migrado exitosamente de HTML/JS estático a **Next.js 14** con App Router.

---

## 📋 Estructura del Proyecto

```
API-FOOTBALL/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── football/         # Proxy de Football API
│   │   └── ai/               # Proxy de AI APIs
│   ├── auth/                 # Páginas de autenticación
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/            # Dashboard principal
│   ├── layout.tsx            # Layout raíz
│   ├── page.tsx              # Página principal (redirect)
│   └── globals.css           # Estilos globales
├── components/               # Componentes React
│   └── Toast.tsx
├── lib/                      # Utilidades y servicios
│   ├── supabase.ts          # Cliente Supabase (cliente)
│   ├── supabase-server.ts   # Cliente Supabase (servidor)
│   ├── ai-service.ts        # Servicio de IA
│   └── data-renderers.tsx   # Renderizadores de datos
├── next.config.js           # Configuración de Next.js
├── package.json             # Dependencias
└── tsconfig.json            # Configuración TypeScript
```

---

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Turnstile Configuration
NEXT_PUBLIC_TURNSTILE_SITE_KEY=tu-site-key-aqui
TURNSTILE_SECRET_KEY=tu-secret-key-aqui

# Football API Configuration
RAPIDAPI_FOOTBALL_BASE_URL=https://api-football-v1.p.rapidapi.com/v3
RAPIDAPI_FOOTBALL_API_KEY=tu-api-key-aqui
RAPIDAPI_FOOTBALL_HOST=api-football-v1.p.rapidapi.com

# AI API Configuration (opcional)
OPENAI_API_KEY=tu-openai-key-aqui
DEEPSEEK_API_KEY=tu-deepseek-key-aqui
```

### 3. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### 4. Compilar para Producción

```bash
npm run build
npm start
```

---

## 🔄 Cambios Principales

### ✅ Migraciones Realizadas

1. **Estructura de Páginas**
   - ✅ `index.html` → `app/page.tsx` (redirect)
   - ✅ `auth/login.html` → `app/auth/login/page.tsx`
   - ✅ `auth/register.html` → `app/auth/register/page.tsx`
   - ✅ `dashboard/dashboard.html` → `app/dashboard/page.tsx`

2. **Servicios Migrados**
   - ✅ `ai-service.js` → `lib/ai-service.ts`
   - ✅ `data-renderers.js` → `lib/data-renderers.tsx`
   - ✅ `shared/supabase-config.js` → `lib/supabase.ts`

3. **API Routes**
   - ✅ `server.js` (proxy Express) → `app/api/football/[...path]/route.ts`
   - ✅ `server.js` (AI proxy) → `app/api/ai/[provider]/route.ts`

4. **Estilos**
   - ✅ `styles.css` → `app/globals.css`
   - ✅ `dashboard/dashboard.css` → `app/dashboard/dashboard.module.css`
   - ✅ `assets/css/auth.css` → `app/auth/login/auth.module.css`

5. **Componentes**
   - ✅ Sistema de Toast migrado a `components/Toast.tsx`

---

## 🎯 Funcionalidades

### ✅ Implementadas

- ✅ Autenticación con Supabase
- ✅ Login y Registro con Turnstile
- ✅ Dashboard con chat
- ✅ Consultas a Football API
- ✅ Renderizado de datos (fixtures, standings, goleadores)
- ✅ Sistema de tokens
- ✅ Historial de consultas
- ✅ Protección de rutas

### ⏳ Pendientes (Opcionales)

- [ ] Página de forgot-password
- [ ] Página de reset-password
- [ ] Historial de conversaciones completo
- [ ] Panel de administración

---

## 📝 Notas Importantes

### Variables de Entorno

- Las variables que empiezan con `NEXT_PUBLIC_` son accesibles en el cliente
- Las demás solo están disponibles en el servidor (API routes)

### API Routes

- `/api/football/*` - Proxy para Football API
- `/api/ai/[provider]` - Proxy para AI APIs (openai, deepseek)

### Supabase

- El cliente de Supabase se inicializa en `lib/supabase.ts`
- Para uso en servidor, usar `lib/supabase-server.ts`

---

## 🐛 Solución de Problemas

### Error: "Module not found"

```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: "Missing environment variables"

Verifica que todas las variables en `.env.local` estén configuradas correctamente.

### Error: "Supabase client not initialized"

Asegúrate de que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estén en `.env.local`.

---

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard
3. Deploy automático en cada push

### Otros Proveedores

Next.js puede desplegarse en cualquier plataforma que soporte Node.js:
- Netlify
- Railway
- Render
- AWS Amplify

---

## 📚 Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)

---

## ✨ Próximos Pasos

1. Configurar variables de entorno
2. Probar autenticación
3. Probar consultas de fútbol
4. Personalizar estilos si es necesario
5. Desplegar a producción

---

**¡La migración está completa!** 🎉

