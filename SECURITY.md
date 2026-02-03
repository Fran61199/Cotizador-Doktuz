# Seguridad y priorización de riesgos

## Cambios implementados (validación de sesión)

- **Backend**: Todas las rutas del API exigen `Authorization: Bearer <BACKEND_API_SECRET>`. Las rutas protegidas (catálogo, precios, generador, propuestas, usuarios) exigen además headers `X-User-Id` y `X-User-Email` (enviados por el proxy tras validar el JWT).
- **Frontend**: Las peticiones al backend pasan por el proxy Next.js (`/api/backend/*`). El proxy valida la sesión (JWT de NextAuth), añade el secret y el usuario, y reenvía al backend. Sin sesión válida no se envían headers de usuario y el backend devuelve 401 en rutas protegidas.
- **Rutas públicas** (solo secret, sin sesión): login (`/api/auth/verify`), allowed, registro, olvidé contraseña, reset contraseña.
- **Rate limiting (backend)**: slowapi por IP en auth (login /verify sin límite; register/forgot/reset 5/min, allowed/user-by-email 30/min). Respuesta 429 al superar el límite.
- **require_user**: valida que `X-User-Id` exista en la tabla `users`; rechaza IDs arbitrarios aunque se conozca el secret.

**Variables de entorno**: En frontend y backend debe definirse el mismo `BACKEND_API_SECRET` (por ejemplo `openssl rand -base64 32`). Ver `frontend/.env.example` y `backend/.env.example`.

---

## Priorización de riesgos

### P1 – Crítico (mitigado)

| Riesgo | Estado | Notas |
|--------|--------|--------|
| API sin validación de sesión: cualquiera podía llamar al backend directamente | **Mitigado** | Backend exige secret + usuario en rutas protegidas; el cliente usa proxy que valida JWT. |

### P2 – Alto

| Riesgo | Estado | Recomendación |
|--------|--------|----------------|
| `SKIP_AUTH=true` desactiva el login en producción | **Mitigado** | Solo tiene efecto si `NODE_ENV === 'development'` (middleware frontend). |
| Sin rate limiting en login, registro y “olvidé contraseña” | **Mitigado** | Backend: slowapi por IP en register/forgot/reset (5/min), allowed/user-by-email (30/min). Login sin límite. |
| `NEXTAUTH_SECRET` o `BACKEND_API_SECRET` débiles o no definidos | Configuración | Asegurar valores fuertes y únicos en producción. |

### P3 – Medio

| Riesgo | Estado | Recomendación |
|--------|--------|----------------|
| User enumeration vía `/api/auth/allowed?email=...` | Abierto | Valorar no exponer este endpoint o devolver siempre la misma forma de respuesta. |
| CORS mal configurado (`*` o orígenes incorrectos) | Configuración | Revisar `CORS_ORIGINS` en producción. |

### P4 – Bajo

| Riesgo | Estado | Recomendación |
|--------|--------|----------------|
| Contraseña temporal de 6 dígitos en registro/invite | Aceptado | Mantener como temporal y forzar cambio en primer uso si se quiere endurecer. |
| Uso de `dangerouslySetInnerHTML` en layout (script de tema) | Bajo | Contenido estático; no introducir datos de usuario. |
| Usuario seed `admin123` en producción | Configuración | No dejar usuarios de seed con contraseñas débiles en producción. |

---

## Resumen de prioridades

1. **P1**: API protegida con secret + sesión (hecho).
2. **P2**: SKIP_AUTH restringido a desarrollo; rate limiting en auth; revisar secrets en prod.
3. **P3**: Valorar allowed, revisar CORS. (Cron: se usa job externo que hace ping al backend `/health`.)
4. **P4**: Buenas prácticas (contraseñas temporales, seed, HTML dinámico).
