# ⚽ Football AI Assistant

Un asistente inteligente de fútbol construido con Next.js, Supabase y APIs de datos deportivos en tiempo real.

![Next.js](https://img.shields.io/badge/Next.js-14.0-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth-green?style=flat-square&logo=supabase)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Turnstile-orange?style=flat-square&logo=cloudflare)

## 🌟 Características

- 💬 **Consultas en lenguaje natural** - Pregunta sobre equipos, ligas, jugadores y más
- 📊 **Datos en tiempo real** - Información actualizada de partidos, clasificaciones y estadísticas
- 🔐 **Autenticación segura** - Sistema de usuarios con Supabase y protección Cloudflare Turnstile
- 💾 **Historial de conversaciones** - Guarda y consulta tus búsquedas anteriores
- 🎯 **Sistema de tokens** - Control de uso con tokens por usuario
- 🎨 **Interfaz moderna** - Diseño premium estilo ChatGPT con modo oscuro

## 🚀 Tecnologías

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: CSS Modules + Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth + Cloudflare Turnstile
- **APIs de datos**:
  - API-Football (equipos, ligas, jugadores)
  - BetsAPI (apuestas, datos en vivo)
- **Optimización de imágenes**: Sharp

## 📋 Requisitos previos

- Node.js 18+ y npm
- Cuenta de Supabase
- Cuenta de Cloudflare (para Turnstile)
- API Keys de RapidAPI (API-Football y BetsAPI)

## 🛠️ Instalación

1. **Clona el repositorio**

```bash
git clone https://github.com/traeia123456-rgb/API-FOOTBALL.git
cd API-FOOTBALL
```

2. **Instala las dependencias**

```bash
npm install
```

3. **Configura las variables de entorno**

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=tu_site_key
TURNSTILE_SECRET_KEY=tu_secret_key

# API Football
RAPIDAPI_FOOTBALL_API_KEY=tu_api_key_football

# BetsAPI
RAPIDAPI_BETS_API_KEY=tu_api_key_bets
```

4. **Configura la base de datos**

Ejecuta el script SQL en tu proyecto de Supabase:

```bash
# El archivo supabase-schema.sql contiene todas las tablas necesarias
```

5. **Inicia el servidor de desarrollo**

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Scripts disponibles

```bash
npm run dev      # Inicia el servidor de desarrollo
npm run build    # Construye la aplicación para producción
npm run start    # Inicia el servidor de producción
npm run lint     # Ejecuta el linter
```

## 🔑 Obtener API Keys

### Supabase

1. Crea una cuenta en [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a Settings → API para obtener tus keys

### Cloudflare Turnstile

1. Crea una cuenta en [Cloudflare](https://dash.cloudflare.com)
2. Ve a Turnstile en el dashboard
3. Crea un nuevo sitio y obtén tus keys
4. Para desarrollo, usa la clave de prueba: `1x00000000000000000000AA`

### RapidAPI

1. Crea una cuenta en [RapidAPI](https://rapidapi.com)
2. Suscríbete a:
   - [API-Football](https://rapidapi.com/api-sports/api/api-football)
   - [BetsAPI](https://rapidapi.com/betsapi/api/betsapi2)

## 🏗️ Estructura del proyecto

```
API-FOOTBALL/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── ai/              # Endpoints de IA
│   │   ├── football/        # Proxy para API-Football
│   │   ├── bets/            # Proxy para BetsAPI
│   │   └── verify-turnstile/# Verificación de Turnstile
│   ├── auth/                # Páginas de autenticación
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/           # Dashboard principal
│   ├── layout.tsx           # Layout raíz
│   └── globals.css          # Estilos globales
├── components/              # Componentes React
├── lib/                     # Utilidades y configuración
│   ├── supabase.ts         # Cliente de Supabase
│   └── ...
├── public/                  # Archivos estáticos
├── .env.example            # Ejemplo de variables de entorno
└── next.config.js          # Configuración de Next.js
```

## 🎨 Características de diseño

- **Modo oscuro** por defecto
- **Glassmorphism** y efectos modernos
- **Animaciones suaves** y micro-interacciones
- **Responsive design** para móviles y tablets
- **Tipografía premium** con Google Fonts (Inter)

## 🔒 Seguridad

- ✅ Variables de entorno protegidas con `.gitignore`
- ✅ Autenticación con Supabase (JWT)
- ✅ Protección anti-bot con Cloudflare Turnstile
- ✅ Validación server-side de tokens
- ✅ Rate limiting en API routes

## 📝 Documentación adicional

- [AUTH_SETUP.md](./AUTH_SETUP.md) - Configuración de autenticación
- [TURNSTILE_SETUP.md](./TURNSTILE_SETUP.md) - Configuración de Turnstile
- [DEPLOYMENT_FIX.md](./DEPLOYMENT_FIX.md) - Solución de problemas de deployment

## 🚀 Deployment

### Vercel (Recomendado)

1. Conecta tu repositorio de GitHub a Vercel
2. Configura las variables de entorno en el dashboard de Vercel
3. Deploy automático en cada push

### Otras plataformas

El proyecto es compatible con cualquier plataforma que soporte Next.js:

- Netlify
- Railway
- Render
- AWS Amplify

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👨‍💻 Autor

**traeia123456-rgb**

- GitHub: [@traeia123456-rgb](https://github.com/traeia123456-rgb)

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) - Framework de React
- [Supabase](https://supabase.com/) - Backend as a Service
- [API-Football](https://www.api-football.com/) - Datos de fútbol
- [Cloudflare](https://www.cloudflare.com/) - Seguridad y protección

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!
