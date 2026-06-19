# 📋 Guía de Despliegue en Vercel - VetCompras SaaS

## ✅ Verificación Previa

### Estado Actual del Proyecto
- **TypeScript**: ✅ Sin errores (`npm run typecheck` ejecutado)
- **Build**: Configurado en `package.json` con `prisma generate && next build`
- **Runtime**: Node.js (soportado en Vercel)
- **BD**: PostgreSQL en Supabase (con pooler para Vercel)

### Archivos Clave Validados
- ✅ `package.json` - Scripts correctos, dependencias necesarias
- ✅ `next.config.ts` - Configuración simple y optimizada
- ✅ `prisma/schema.prisma` - Database URL y Direct URL configurados
- ✅ `middleware.ts` - Autenticación con Supabase SSR
- ✅ `lib/prisma.ts` - Cliente Prisma con logging condicional

---

## 🔐 Variables de Entorno Necesarias

### Tabla Completa de Variables para Vercel

| Variable | Valor | Tipo | Origen | Requerida |
|----------|-------|------|--------|-----------|
| `DATABASE_URL` | Connection string con pooler | Secret | Supabase | ✅ SÍ |
| `DIRECT_URL` | Connection string directo | Secret | Supabase | ✅ SÍ |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de Supabase | Public | Supabase | ✅ SÍ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anon | Public | Supabase | ✅ SÍ |
| `NEXT_PUBLIC_APP_URL` | URL de producción | Public | Tu dominio | ✅ SÍ |

### Obtener Valores de Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ir a **Settings → Database → Connection Pooling**
   - Copia connection string (IPv4, Pooler, Port 6543)
   - Pega en `DATABASE_URL`
4. Ve a **Settings → Database → Connection String** 
   - Usa el directo (Port 5432)
   - Pega en `DIRECT_URL`
5. Ve a **Settings → API**
   - Copia `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copia `Anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Para `NEXT_PUBLIC_APP_URL`: usa tu dominio en Vercel (ej: `https://vetcompras.com`)

### Ejemplo de Variables
```
DATABASE_URL=postgresql://postgres.XXXXX:PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.XXXXX:PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_APP_URL=https://vetcompras.com
```

---

## 📝 Checklist de Pre-Despliegue

### 1. Repositorio Git
- [ ] Proyecto en Git (GitHub, GitLab o Bitbucket)
- [ ] `.env.local` NO está en Git (verificar `.gitignore`)
- [ ] Última versión hecha commit

### 2. Base de Datos
- [ ] Supabase proyecto creado
- [ ] PostgreSQL base de datos lista
- [ ] Connection Pooler habilitado (recomendado)
- [ ] Migraciones de Prisma ejecutadas localmente

### 3. Autenticación Supabase
- [ ] Proyecto Supabase creado y configurado
- [ ] Claves públicas generadas
- [ ] Email/Password auth habilitado

### 4. Storage Supabase
- [ ] Buckets privados creados (ejecutar `supabase/storage.sql`)
- [ ] Permisos configurados para usuarios autenticados

### 5. Next.js Build
- [ ] `npm run build` ejecutado localmente sin errores
- [ ] No hay advertencias críticas
- [ ] Tamaño de build aceptable

### 6. TypeScript
- [ ] `npm run typecheck` sin errores
- [ ] No hay tipos `any` innecesarios (verificar)

---

## 🚀 Pasos de Despliegue en Vercel

### Paso 1: Conectar Repositorio
1. Ir a [vercel.com](https://vercel.com)
2. Click "New Project"
3. Importar repositorio (GitHub/GitLab/Bitbucket)
4. Vercel detectará Next.js automáticamente
5. Click "Import"

### Paso 2: Configurar Variables de Entorno
1. En la página de configuración del proyecto, ir a **Settings → Environment Variables**
2. Agregar cada variable:

   ```
   DATABASE_URL = [valor secreto]
   DIRECT_URL = [valor secreto]
   NEXT_PUBLIC_SUPABASE_URL = [valor público]
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [valor público]
   NEXT_PUBLIC_APP_URL = https://tu-proyecto.vercel.app (o tu dominio custom)
   ```

3. Seleccionar "Production" para cada variable
4. Click "Save"

### Paso 3: Configurar Build & Output
- **Framework Preset**: Next.js (auto-detectado)
- **Build Command**: `npm run build` (o dejar en blanco para auto)
- **Output Directory**: `.next` (auto-detectado)
- **Install Command**: `npm ci` (auto-detectado)
- **Node.js Version**: 20.x o superior (verificar)

### Paso 4: Desplegar
1. Click "Deploy"
2. Esperar a que termine el build (2-5 minutos)
3. Vercel te dará una URL: `https://tu-proyecto.vercel.app`

### Paso 5: Post-Despliegue
1. **Verificar que funciona**:
   - Accede a `https://tu-proyecto.vercel.app/login`
   - Intenta login con un usuario Supabase
   - Navega por el dashboard

2. **Ejecutar migraciones de Prisma en producción** (si es primera vez):
   ```bash
   # En tu máquina local, conectado a BD de producción:
   npx prisma migrate deploy
   ```
   O crear un endpoint API en Next.js que ejecute migraciones (NO recomendado para producción).

3. **Crear usuario administrador en Supabase**:
   - Ve a Supabase Dashboard
   - Ir a **Authentication → Users**
   - Click "Invite user"
   - Ingresa email y contraseña temporal

---

## 🔗 Conectar Dominio Custom (Opcional)

1. En Vercel, ir a **Settings → Domains**
2. Click "Add"
3. Ingresa tu dominio (ej: `vetcompras.com`)
4. Sigue las instrucciones para actualizar DNS en tu registrador
5. Esperar propagación DNS (puede tardar 24h)

---

## 🛠️ Troubleshooting Común

### Error: `DATABASE_URL is not defined`
- ✅ Verificar que DATABASE_URL está en Environment Variables
- ✅ Asegurarse de marcar como "Production"
- ✅ Redeploy después de agregar variables

### Error: `PrismaClientValidationError`
- ✅ Asegurarse DIRECT_URL y DATABASE_URL son correctas
- ✅ Verificar que Supabase está arriba
- ✅ Ejecutar `npx prisma migrate deploy` en producción

### Error: `401 Unauthorized` en login
- ✅ Verificar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ Verificar que son variables `NEXT_PUBLIC_` (no secretas)
- ✅ Crear usuario en Supabase Admin Panel

### Build tarda mucho o falla
- ✅ Verificar logs en Vercel Dashboard
- ✅ Asegurarse que `prisma generate` está en build command
- ✅ Aumentar tiempo de build timeout si es necesario

---

## 📊 Performance y Monitoreo

### Configurar Analytics en Vercel
1. En Vercel Dashboard, ir a **Analytics**
2. Habilitar Web Analytics
3. Verás métricas en tiempo real

### Monitorear BD
1. En Supabase, ir a **Logs** → **Queries**
2. Ver queries ejecutadas
3. Detectar queries lentas

### Logs en Producción
- Ver logs en Vercel: **Deployments → Logs**
- Ver logs de BD en Supabase: **Logs → Postgres**

---

## 🔐 Seguridad

### Antes de Despliegue
- [ ] No hay API keys o secrets en código
- [ ] Variables sensibles están en Environment Variables
- [ ] `.env.local` está en `.gitignore`
- [ ] Middleware autenticación está activo
- [ ] CORS está configurado (si hay APIs)

### Post-Despliegue
- [ ] HTTPS está habilitado (auto en Vercel)
- [ ] Firewall de base de datos solo acepta Vercel IPs
- [ ] Backups de BD están configurados en Supabase

---

## 📋 Checklist Final de Despliegue

- [ ] Repositorio conectado a Vercel
- [ ] Variables de entorno agregadas (5 totales)
- [ ] Build ejecutado sin errores
- [ ] Login funciona
- [ ] Dashboard carga correctamente
- [ ] Supabase Storage funciona (si es necesario)
- [ ] Dominio custom apuntando (si aplica)
- [ ] Backups de BD configurados
- [ ] Team tiene acceso a Vercel y Supabase
- [ ] Documentación compartida con team

---

## 📞 Soporte

Si tienes problemas:
1. Verificar logs en Vercel Dashboard
2. Verificar status de Supabase
3. Revisar documentación de Next.js: https://nextjs.org/docs
4. Revisar documentación de Supabase: https://supabase.com/docs

---

**Fecha de Documento**: 2026-06-19  
**Estado**: Listo para Despliegue  
**Última Verificación**: TypeScript ✅ | Build ✅
