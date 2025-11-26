# 🔧 Solución de Problemas de Despliegue

## Problemas Identificados y Solucionados

### 1. ✅ Advertencias de Tailwind CSS

**Problema**: Tailwind estaba instalado pero no configurado.

**Solución**: Eliminado de `package.json` ya que no se está usando (solo CSS modules).

**Acción requerida**:
```bash
npm install
```

### 2. ✅ Variables de Entorno

**Problema**: Las variables de entorno pueden no estar configuradas.

**Solución**: Verifica que tengas un archivo `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_TURNSTILE_SITE_KEY=tu-site-key
RAPIDAPI_FOOTBALL_API_KEY=tu-api-key
RAPIDAPI_FOOTBALL_HOST=api-football-v1.p.rapidapi.com
```

### 3. ✅ Configuración de TypeScript

**Problema**: Puede haber errores de tipos.

**Solución**: Archivo `next-env.d.ts` creado.

---

## 🚀 Pasos para Desplegar

### Opción 1: Vercel (Recomendado)

1. **Instalar Vercel CLI** (opcional):
```bash
npm i -g vercel
```

2. **Desplegar**:
```bash
vercel
```

3. **Configurar variables de entorno** en el dashboard de Vercel:
   - Ve a Settings → Environment Variables
   - Agrega todas las variables de `.env.local`

### Opción 2: Build Local y Deploy Manual

1. **Instalar dependencias**:
```bash
npm install
```

2. **Crear build de producción**:
```bash
npm run build
```

3. **Verificar que no hay errores**:
   - Si hay errores, se mostrarán en la consola
   - Corrige cualquier error antes de continuar

4. **Iniciar servidor de producción**:
```bash
npm start
```

### Opción 3: Docker (Opcional)

Si prefieres usar Docker, crea un `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

---

## 🐛 Errores Comunes y Soluciones

### Error: "Module not found"

```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: "Missing environment variables"

- Verifica que `.env.local` existe
- Verifica que todas las variables están configuradas
- En producción, configura las variables en tu plataforma de hosting

### Error: "Cannot find module '@/lib/...'"

- Verifica que `tsconfig.json` tiene la configuración de paths correcta
- Reinicia el servidor de desarrollo

### Error: "Supabase client not initialized"

- Verifica que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` están configuradas
- Las variables deben empezar con `NEXT_PUBLIC_` para estar disponibles en el cliente

---

## ✅ Checklist Pre-Deploy

- [ ] Todas las dependencias instaladas (`npm install`)
- [ ] Variables de entorno configuradas
- [ ] Build exitoso (`npm run build`)
- [ ] No hay errores de TypeScript
- [ ] Pruebas locales funcionando (`npm run dev`)
- [ ] Variables de entorno configuradas en plataforma de hosting

---

## 📝 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar producción
npm start

# Verificar tipos
npx tsc --noEmit

# Limpiar cache
rm -rf .next node_modules
npm install
```

---

## 🎯 Próximos Pasos

1. Ejecuta `npm install` para actualizar dependencias
2. Verifica que `.env.local` existe y está configurado
3. Ejecuta `npm run build` para verificar que compila
4. Si todo está bien, despliega a tu plataforma preferida

