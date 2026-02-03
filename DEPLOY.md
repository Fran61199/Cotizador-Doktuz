# Guía de despliegue - Cotizador EMOs

Despliegue en **Vercel** (frontend) + **Render** (backend) + **Neon** (PostgreSQL).

---

## Requisitos previos

- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Render](https://render.com)
- Cuenta en [Neon](https://neon.tech)
- Repositorio en GitHub con el código
- Dominio propio (opcional, para subdominios)

---

## 1. Base de datos - Neon

1. Entra a [console.neon.tech](https://console.neon.tech) y crea un proyecto.
2. Copia la **Connection string** (formato `postgresql://user:pass@host/dbname?sslmode=require`).
3. Guárdala para el paso 3 (Render).

---

## 2. Backend - Render

1. Entra a [dashboard.render.com](https://dashboard.render.com).
2. **New** → **Blueprint** y conecta tu repo (Render usará `render.yaml`).
   - O **New** → **Web Service** y configura manualmente (ver abajo).
3. Si usas Web Service manual:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. En **Environment**, añade (todas obligatorias en producción):
   - `DATABASE_URL` = tu connection string de Neon
   - `CORS_ORIGINS` = `https://tu-app.vercel.app` (URL de Vercel; actualízala tras el deploy)
   - `BACKEND_API_SECRET` = el mismo valor que en Vercel (genera con `openssl rand -base64 32`)
   - `FRONTEND_URL` = `https://tu-app.vercel.app` (para enlaces en emails: restablecer clave, invitaciones)
   - Para emails (Olvidé mi contraseña): `RESEND_API_KEY` y `RESEND_FROM` (ver backend/.env.example)
5. **Create Web Service** y anota la URL (ej: `https://cotizador-api-xxx.onrender.com`).
6. Tras desplegar el frontend en Vercel, actualiza `CORS_ORIGINS` en Render con la URL real (ej: `https://cotizador-emos.vercel.app`).

### Cron para evitar sleep (plan free)

- Entra a [cron-job.org](https://cron-job.org) o [uptimerobot.com](https://uptimerobot.com).
- Crea un monitor/ping cada **10–14 minutos** a:
  `https://tu-api.onrender.com/health`

---

## 3. Crear usuario y datos iniciales (Neon)

Con la BD vacía, necesitas crear un usuario admin. Opciones:

**A) Desde tu máquina local** (recomendado)

```bash
cd backend
# Crea .env con DATABASE_URL=postgresql://... (tu Neon)
pip install -r requirements.txt
python -m scripts.create_user admin@doktuz.com admin123
python -m scripts.seed_db
```

**B) Desde Render Shell**

- En Render → tu servicio → **Shell**.
- Ejecuta los mismos comandos (con `DATABASE_URL` ya configurada).

---

## 4. Frontend - Vercel

1. Entra a [vercel.com](https://vercel.com) y **Add New Project**.
2. Importa tu repo de GitHub.
3. Configura:
   - **Root Directory**: `frontend` (importante)
   - **Framework Preset**: Next.js (auto-detectado)
4. En **Environment Variables**, añade:

   | Variable | Valor |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://tu-api.onrender.com` (URL de Render) |
   | `NEXTAUTH_URL` | `https://tu-app.vercel.app` (tu URL de Vercel) |
   | `NEXTAUTH_SECRET` | Genera con `openssl rand -base64 32` |
   | `GOOGLE_CLIENT_ID` | Tu Client ID de Google OAuth |
   | `GOOGLE_CLIENT_SECRET` | Tu Client Secret de Google OAuth |
   | `BACKEND_API_SECRET` | El mismo valor que en Render (obligatorio para proxy y auth) |

5. **Deploy**.

### Google OAuth (producción)

En [Google Cloud Console](https://console.cloud.google.com):

- APIs & Services → Credentials → tu OAuth 2.0 Client.
- En **Authorized redirect URIs** añade:
  `https://tu-app.vercel.app/api/auth/callback/google`
- En **Authorized JavaScript origins** añade:
  `https://tu-app.vercel.app`

---

## 5. Subdominios (opcional)

### Vercel (frontend)

- Project → **Settings** → **Domains**.
- Añade `cotizador.tudominio.com`.
- En tu DNS, crea un CNAME:
  - Nombre: `cotizador` (o el subdominio que uses)
  - Valor: `cname.vercel-dns.com`

### Render (backend)

- Service → **Settings** → **Custom Domains**.
- Añade `api-cotizador.tudominio.com`.
- En tu DNS, crea un CNAME:
  - Nombre: `api-cotizador`
  - Valor: `tu-servicio.onrender.com` (el que muestre Render)

### Actualizar variables

- En Vercel: `NEXTAUTH_URL=https://cotizador.tudominio.com`
- En Vercel: `NEXT_PUBLIC_API_URL=https://api-cotizador.tudominio.com`
- En Render: `CORS_ORIGINS=https://cotizador.tudominio.com`

---

## Resumen de variables

### Backend (Render)

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string de Neon |
| `CORS_ORIGINS` | URL del frontend (Vercel o tu dominio), sin barra final |
| `BACKEND_API_SECRET` | Mismo valor que en Vercel (proxy y validación de peticiones) |
| `FRONTEND_URL` | URL del frontend para enlaces en emails (restablecer clave, invitaciones) |
| `RESEND_API_KEY` | (Opcional) API Key de Resend para enviar emails |
| `RESEND_FROM` | (Opcional) Remitente del correo, ej. `Cotizador <onboarding@resend.dev>` |

### Frontend (Vercel)

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL del backend (Render) |
| `NEXTAUTH_URL` | URL del frontend (Vercel o tu dominio) |
| `NEXTAUTH_SECRET` | Secret para NextAuth (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | OAuth Google |
| `GOOGLE_CLIENT_SECRET` | OAuth Google |
| `BACKEND_API_SECRET` | Mismo valor que en Render (obligatorio si usas proxy) |

---

## Checklist

- [ ] Neon: proyecto creado, connection string copiada
- [ ] Render: servicio creado, `DATABASE_URL` y `CORS_ORIGINS` configurados
- [ ] Render: cron/ping a `/health` cada 10–14 min
- [ ] Backend: usuario admin y seed ejecutados
- [ ] Vercel: proyecto con root `frontend`
- [ ] Vercel: variables de entorno configuradas
- [ ] Google OAuth: redirect URIs actualizados para producción
- [ ] (Opcional) Subdominios configurados en DNS

---

## Notas

- **Proposal counter**: Los números de propuesta (0001, 0002…) se guardan en un archivo JSON. En Render el disco es efímero, así que pueden reiniciarse al redeployar. Para persistencia total, habría que migrar a BD.
- **Neon**: Si la conexión falla, asegúrate de que la URL termine con `?sslmode=require` si Neon lo requiere.
