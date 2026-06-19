# ✅ Post-Deployment Verification - VetCompras

## 🎯 Después que Vercel Dice "Ready"

### 1. Acceder a la Aplicación
```
https://tu-proyecto.vercel.app
```
Deberías redirigir a `/login` automáticamente.

### 2. Probar Login
- Email: usuario que creaste en Supabase
- Contraseña: la contraseña que configuraste
- Click "Sign in"

### ✅ Si funciona el login
- ✅ Supabase Auth está conectado correctamente
- ✅ Middleware de autenticación funciona
- ✅ Variables `NEXT_PUBLIC_SUPABASE_*` son correctas

### 3. Navegar el Dashboard
Una vez logueado:
- [ ] Dashboard carga (home page)
- [ ] Sidebar aparece
- [ ] Puedo hacer click en diferentes secciones
- [ ] No hay errores en consola (F12)

### 4. Verificar API Endpoints
En consola del navegador (F12 → Console):
```javascript
// Probar que API está respondiendo
fetch('/api/productos').then(r => r.json()).then(console.log)
```
Deberías ver un array de productos.

### 5. Verificar Base de Datos
En Supabase Dashboard:
- Ir a **SQL Editor**
- Ejecutar:
```sql
SELECT COUNT(*) as "Total Productos" FROM "Productos";
SELECT COUNT(*) as "Total Proveedores" FROM "Proveedores";
SELECT COUNT(*) as "Total Cotizaciones" FROM "Cotizaciones";
```
Si retorna números → BD está conectada ✅

### 6. Monitorear Logs en Vercel
1. Ve a **Vercel Dashboard → Deployments**
2. Click en el deployment actual
3. Ir a **Logs → Production**
4. Buscar errores (en rojo)
5. Si ves `PrismaClientValidationError` → problema de BD
6. Si ves `SUPABASE_ANON_KEY undefined` → problema de variables

---

## 🔄 Tareas Post-Deployment

### ✅ Base de Datos
- [ ] Supabase backups automáticos habilitados
  - Settings → Database → Backups
- [ ] Migraciones de Prisma ejecutadas (si es primera vez)
  ```bash
  npx prisma migrate deploy
  ```

### ✅ Usuarios
- [ ] Usuario admin creado en Supabase
  - Supabase Dashboard → Authentication → Users → Invite
- [ ] Usuario tiene acceso (login funciona)
- [ ] Contraseña temporal compartida de forma segura

### ✅ Storage (Si aplica)
- [ ] Buckets privados creados
  - Supabase Dashboard → Storage
  - Crear: `cotizaciones`, `facturas` (privados)
- [ ] Permisos configurados
  - Solo usuarios autenticados pueden leer/escribir

### ✅ Monitoreo
- [ ] Alertas configuradas en Vercel
  - Settings → Alerts → Deployment Failed
- [ ] Email de team para recibir alertas
- [ ] Logs monitoreados periódicamente

### ✅ Dominio Custom (Opcional)
- [ ] Dominio comprado o transferido
- [ ] DNS apuntando a Vercel
  - Seguir instrucciones en Vercel Settings → Domains
- [ ] SSL certificado automático (Vercel lo genera)
- [ ] HTTPS verificado

---

## 🔐 NO HACER Post-Deployment

### ❌ NO Modificar
- ❌ No cambiar variables manualmente en BD (usar Prisma migrations)
- ❌ No editar código y hacer push sin testing local
- ❌ No compartir DATABASE_URL por chat
- ❌ No usar admin key de Supabase en cliente (usar anon key)

### ❌ NO Desactivar
- ❌ No desactivar middleware de autenticación
- ❌ No dejar buckets públicos (si contienen datos sensibles)
- ❌ No usar contraseñas débiles en Supabase
- ❌ No dejar backdoors de desarrollo en producción

### ❌ NO Hacer Cambios Funcionales
Según instrucciones del proyecto:
- ❌ No modificar inventario
- ❌ No cambiar cotizaciones
- ❌ No tocar compras
- ❌ No editar dashboard
- ❌ Solo despliegue, sin cambios funcionales

---

## 📊 Health Check Script

Ejecuta esto en consola del navegador para verificar sistema completo:

```javascript
async function healthCheck() {
  console.log("🏥 VetCompras Health Check...\n");
  
  try {
    // 1. Check API
    const apiRes = await fetch('/api/productos');
    const apiOk = apiRes.ok ? "✅ API" : "❌ API";
    console.log(apiOk);
    
    // 2. Check Auth
    const session = await fetch('/api/auth').then(r => r.json());
    const authOk = session ? "✅ Auth" : "❌ Auth";
    console.log(authOk);
    
    // 3. Check DB
    const dbRes = await fetch('/api/proveedores');
    const dbOk = dbRes.ok ? "✅ Database" : "❌ Database";
    console.log(dbOk);
    
    console.log("\n✅ Sistema OK" + (apiOk.includes("❌") ? " (con problemas)" : ""));
  } catch(err) {
    console.error("❌ Error:", err.message);
  }
}

healthCheck();
```

---

## 📞 Si Algo Falla

### 1. Verificar Logs
```
Vercel Dashboard → Deployments → Logs → Production
```
Busca líneas en rojo para errores.

### 2. Verificar Variables
```
Vercel Dashboard → Settings → Environment Variables
```
Confirma que todas 5 variables están presentes.

### 3. Verificar Supabase
```
Supabase Dashboard → Project Status
```
¿Está todo en verde?

### 4. Redeploy
```
Vercel Dashboard → Deployments
Click "Redeploy" en deployment actual
```
A veces ayuda a resetear variables.

### 5. Logs Locales
Si redeployaste, busca en logs recientes:
```
Vercel → Deployments → Logs → Output
```

---

## ✨ Señales de Éxito

- ✅ Login funciona con usuario Supabase
- ✅ Dashboard carga sin errores
- ✅ Puedo navegar entre secciones
- ✅ API responde (F12 → Network)
- ✅ BD tiene datos (SQL query retorna números)
- ✅ No hay errores en Vercel logs
- ✅ Supabase status es "healthy"

---

**Implementado**: 2026-06-19  
**Estado**: Listo para Verificación
