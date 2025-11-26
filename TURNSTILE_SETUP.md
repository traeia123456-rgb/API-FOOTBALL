# 🛡️ Configuración de Cloudflare Turnstile

## ¿Qué es Turnstile?

Cloudflare Turnstile es un CAPTCHA invisible y amigable que protege tus formularios de bots sin molestar a los usuarios reales. Es más moderno y eficiente que reCAPTCHA.

---

## 🔑 Obtener Claves de Turnstile

### 1. Crear Cuenta en Cloudflare

1. Ve a [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Crea una cuenta gratuita
3. Verifica tu email

### 2. Acceder a Turnstile

1. Inicia sesión en [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. En el menú lateral, busca **Turnstile**
3. O ve directamente a: `https://dash.cloudflare.com/?to=/:account/turnstile`

### 3. Crear un Sitio

1. Click en **"Add site"** o **"Crear sitio"**
2. Completa los datos:
   - **Site name**: `Football Assistant`
   - **Domain**: `localhost` (para desarrollo) o tu dominio
   - **Widget mode**: `Managed` (recomendado)
3. Click en **"Create"**

### 4. Copiar las Claves

Después de crear el sitio, verás dos claves:

- **Site Key** (Clave pública): `0x4AAAAAAA...`
  - Esta se usa en el frontend (HTML/JavaScript)
  - Es seguro exponerla públicamente

- **Secret Key** (Clave secreta): `0x4AAAAAAA...`
  - Esta se usa SOLO en el backend
  - NUNCA la expongas en el frontend

---

## ⚙️ Configurar en el Proyecto

### 1. Actualizar `turnstile-config.js`

Abre `shared/turnstile-config.js` y reemplaza:

```javascript
const TURNSTILE_CONFIG = {
    siteKey: 'TU_SITE_KEY_AQUI',
    secretKey: 'TU_SECRET_KEY_AQUI'  // Solo para backend
};
```

### 2. Las Páginas Ya Están Listas

Ya he integrado Turnstile en:
- ✅ `auth/login.html`
- ✅ `auth/register.html`

---

## 🧪 Modo de Prueba (Testing)

Si quieres probar sin crear una cuenta de Cloudflare, puedes usar estas claves de prueba:

**Site Key de prueba**:
```
1x00000000000000000000AA
```

**Secret Key de prueba**:
```
1x0000000000000000000000000000000AA
```

**Nota**: Estas claves siempre devuelven éxito, son solo para testing.

---

## 📝 Cómo Funciona

### Flujo de Autenticación con Turnstile

```
1. Usuario completa formulario
   ↓
2. Turnstile genera token automáticamente
   ↓
3. Token se envía con el formulario
   ↓
4. Backend valida token con Cloudflare
   ↓
5. Si es válido → Permite login/registro
   Si es inválido → Rechaza la solicitud
```

### En el Frontend (Ya implementado)

```html
<!-- Widget de Turnstile (invisible) -->
<div class="cf-turnstile" 
     data-sitekey="TU_SITE_KEY"
     data-theme="dark"
     data-size="normal">
</div>
```

### En el Backend (Necesitas implementar)

Para validar el token en el servidor, necesitarás:

```javascript
async function validateTurnstile(token, remoteip) {
    const formData = new FormData();
    formData.append('secret', 'TU_SECRET_KEY');
    formData.append('response', token);
    formData.append('remoteip', remoteip);

    const response = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
            method: 'POST',
            body: formData
        }
    );

    const result = await response.json();
    return result.success;
}
```

---

## 🎯 Próximos Pasos

1. **Obtener claves** de Cloudflare Turnstile
2. **Actualizar** `shared/turnstile-config.js`
3. **Probar** el login/registro
4. **(Opcional)** Implementar validación en backend

---

## 🔒 Seguridad

### ⚠️ IMPORTANTE

- ✅ **SÍ** exponer el Site Key en el frontend
- ❌ **NO** exponer el Secret Key en el frontend
- ✅ **SÍ** validar tokens en el backend
- ❌ **NO** confiar solo en validación del frontend

### Recomendaciones

1. **Siempre valida en el backend**: Aunque Turnstile funciona en el frontend, la validación real debe ser en el servidor
2. **Usa HTTPS**: En producción, siempre usa HTTPS
3. **Monitorea intentos**: Cloudflare te muestra estadísticas de intentos de bots

---

## 📊 Características Implementadas

- ✅ Widget invisible (no molesta al usuario)
- ✅ Tema oscuro (matching con el diseño)
- ✅ Tamaño normal
- ✅ Callback de éxito
- ✅ Callback de error
- ✅ Reset automático en errores
- ✅ Integración con formularios

---

## 🐛 Solución de Problemas

### Error: "Invalid site key"

**Causa**: La Site Key no es correcta o no coincide con el dominio.

**Solución**:
- Verifica que copiaste correctamente la Site Key
- Asegúrate de que el dominio en Cloudflare incluya `localhost` para desarrollo

### El widget no aparece

**Causa**: El script de Turnstile no se cargó.

**Solución**:
- Verifica tu conexión a internet
- Revisa la consola del navegador (F12) para errores
- Asegúrate de que no haya bloqueadores de ads

### Error: "Token validation failed"

**Causa**: El token expiró o ya fue usado.

**Solución**:
- Los tokens expiran en 5 minutos
- Cada token solo se puede usar una vez
- Implementa reset del widget en errores

---

**¿Listo para continuar?** Una vez que tengas las claves de Turnstile, podemos proceder con la **Fase 2: Dashboard** 🚀
