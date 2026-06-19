# 🚀 Quick Deploy Checklist - VetCompras

## ✅ Estado Actual
- TypeScript: **✅ Sin errores**
- Build Config: **✅ Correcto**
- Prisma Schema: **✅ Validado**
- Middleware: **✅ Funcional**

---

## 🎯 5 Pasos para Despliegue

### 1️⃣ Verificar Build Localmente
```bash
npm run build
```
**Esperado**: Sin errores, Prisma genera `/prisma/client`

### 2️⃣ Crear Proyecto en Vercel
- Ir a https://vercel.com/new
- Conectar tu repositorio Git
- Seleccionar "VetCompras" project
- Click "Import"

### 3️⃣ Configurar 5 Variables
En **Settings → Environment Variables**, agregar:

```
DATABASE_URL: postgresql://postgres.XXXXX:PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL: postgresql://postgres.XXXXX:PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL: https://jcypigvypyphdphhcrjb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY: sb_publishable_iDXfV0R8zsyog8HdKJYlWA_hojFlq6D
NEXT_PUBLIC_APP_URL: https://tu-proyecto.vercel.app
```

### 4️⃣ Deploy
- Click "Deploy"
- Esperar 2-5 minutos
- Vercel te da URL automática

### 5️⃣ Verificar Funciona
```
https://tu-proyecto.vercel.app/login
→ Ingresa credenciales Supabase
→ Deberías ver dashboard
```

---

## 📄 Variables de Supabase

### Cómo Obtenerlas

**DATABASE_URL** (Connection Pooler):
- Supabase Dashboard → Settings → Database → Connection Pooling
- Copiar: `postgresql://postgres.XXXXX:PASSWORD@...?pgbouncer=true`

**DIRECT_URL** (Session):
- Supabase Dashboard → Settings → Database → Connection String
- Copiar el directo (Port 5432)

**NEXT_PUBLIC_SUPABASE_URL**:
- Supabase Dashboard → Settings → API
- Copiar "Project URL"

**NEXT_PUBLIC_SUPABASE_ANON_KEY**:
- Supabase Dashboard → Settings → API
- Copiar "Anon public key" (la pública)

**NEXT_PUBLIC_APP_URL**:
- Tu URL en Vercel (ej: `https://vetcompras-production.vercel.app`)

---

## ⚠️ Problemas Comunes

| Error | Solución |
|-------|----------|
| `DATABASE_URL undefined` | Verificar que está en Environment Variables |
| `Connection refused` | Asegurarse que DATABASE_URL es pooler (port 6543) |
| `401 Unauthorized` | Verificar que NEXT_PUBLIC_SUPABASE_ANON_KEY es la anon key |
| `Build failed` | Ver logs en Vercel, ejecutar `npm run build` localmente |

---

## 🔗 Links Importantes

- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Console: https://app.supabase.com
- Next.js Docs: https://nextjs.org/docs

---

**Listo para Despliegue** ✅
