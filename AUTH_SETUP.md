# 🔐 Configuración del Sistema de Autenticación

## ✅ Archivos Creados

### Configuración
- ✅ `shared/supabase-config.js` - Cliente de Supabase
- ✅ `shared/auth-guard.js` - Protección de rutas

### Páginas de Autenticación
- ✅ `auth/login.html` - Inicio de sesión
- ✅ `auth/register.html` - Registro de usuarios
- ✅ `auth/forgot-password.html` - Recuperación de contraseña
- ✅ `auth/reset-password.html` - Restablecer contraseña

### Estilos
- ✅ `assets/css/auth.css` - Estilos para páginas de autenticación

---

## 🚀 Pasos para Configurar

### 1. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Click en "New Project"
4. Completa los datos:
   - **Name**: Football Assistant
   - **Database Password**: (guarda esta contraseña)
   - **Region**: Elige la más cercana
5. Click en "Create new project"
6. Espera 2-3 minutos mientras se crea el proyecto

### 2. Ejecutar el Schema SQL

1. En tu proyecto de Supabase, ve a **SQL Editor** (en el menú lateral)
2. Click en "New Query"
3. Copia todo el contenido de `supabase-schema.sql`
4. Pégalo en el editor
5. Click en "Run" o presiona `Ctrl + Enter`
6. Verifica que se ejecutó sin errores

### 3. Obtener Credenciales

1. Ve a **Settings** → **API** (en el menú lateral)
2. Copia los siguientes valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. Configurar el Cliente

1. Abre `shared/supabase-config.js`
2. Reemplaza los valores:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://xxxxx.supabase.co', // Tu Project URL
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Tu anon public key
};
```

3. Guarda el archivo

### 5. Configurar Google OAuth (Opcional)

Si quieres habilitar "Iniciar sesión con Google":

1. En Supabase, ve a **Authentication** → **Providers**
2. Busca "Google" y haz click en configurar
3. Sigue las instrucciones para crear OAuth credentials en Google Cloud Console
4. Pega el Client ID y Client Secret
5. Guarda los cambios

---

## 🧪 Probar la Autenticación

### 1. Abrir Página de Registro

```
http://localhost/auth/register.html
```

### 2. Crear una Cuenta

1. Ingresa un email y contraseña
2. Acepta los términos
3. Click en "Crear cuenta"
4. **Importante**: Revisa tu email para confirmar la cuenta

### 3. Iniciar Sesión

```
http://localhost/auth/login.html
```

1. Ingresa tus credenciales
2. Click en "Iniciar Sesión"
3. Deberías ser redirigido al dashboard (próximo paso)

### 4. Verificar en Supabase

1. Ve a **Authentication** → **Users** en Supabase
2. Deberías ver tu usuario registrado
3. Ve a **Table Editor** → **profiles**
4. Verifica que se creó tu perfil con 100 tokens

---

## 🔧 Solución de Problemas

### Error: "Invalid API key"

**Causa**: Las credenciales de Supabase no están configuradas correctamente.

**Solución**:
1. Verifica que copiaste correctamente la URL y la API key
2. Asegúrate de usar la **anon public** key, no la service_role key
3. Recarga la página después de guardar los cambios

### Error: "User already registered"

**Causa**: El email ya existe en la base de datos.

**Solución**:
- Usa otro email
- O elimina el usuario en Supabase: **Authentication** → **Users** → Delete

### No recibo el email de confirmación

**Causa**: Supabase requiere configuración de email en producción.

**Solución temporal**:
1. Ve a **Authentication** → **Users** en Supabase
2. Encuentra tu usuario
3. Click en los 3 puntos → "Confirm email"

### Error: "Failed to fetch"

**Causa**: El script de Supabase no se cargó correctamente.

**Solución**:
1. Verifica tu conexión a internet
2. Asegúrate de que el CDN de Supabase esté disponible
3. Revisa la consola del navegador (F12) para más detalles

---

## 📝 Próximos Pasos

Una vez que la autenticación esté funcionando:

1. ✅ **Fase 1 Completada**: Sistema de autenticación
2. ⏳ **Fase 2**: Crear dashboard con historial
3. ⏳ **Fase 3**: Implementar sistema de tokens
4. ⏳ **Fase 4**: Panel de administración

---

## 🎯 Características Implementadas

### Login
- ✅ Email y contraseña
- ✅ Google OAuth (requiere configuración)
- ✅ Recordar sesión
- ✅ Recuperación de contraseña
- ✅ Validación de formularios
- ✅ Estados de carga

### Registro
- ✅ Email y contraseña
- ✅ Google OAuth (requiere configuración)
- ✅ Validación de contraseñas
- ✅ Confirmación por email
- ✅ Asignación automática de 100 tokens
- ✅ Términos y condiciones

### Seguridad
- ✅ Row Level Security (RLS) en Supabase
- ✅ Protección de rutas con auth-guard
- ✅ Validación de formularios
- ✅ Sanitización de inputs
- ✅ Tokens JWT seguros

---

## 🎨 Diseño

- ✅ Glassmorphism moderno
- ✅ Animaciones suaves
- ✅ Responsive design
- ✅ Dark mode
- ✅ Estados de carga
- ✅ Notificaciones toast

---

**¿Listo para continuar?** Una vez configurado Supabase, podemos proceder con la **Fase 2: Dashboard** 🚀
