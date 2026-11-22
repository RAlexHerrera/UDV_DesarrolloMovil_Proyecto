# PerfilApi

Backend de **PerfilApp** (Proyecto — Desarrollo de Aplicaciones Móviles, Universidad Da Vinci de
Guatemala). Registro, login, y perfil de usuario con foto.

## Tecnologías

- **Node.js + Express** — servidor HTTP
- **PostgreSQL** — base de datos relacional
- **bcryptjs** — hash de contraseñas
- **jsonwebtoken** — tokens de sesión (JWT)

## Cómo ejecutarlo

Requiere PostgreSQL corriendo. Luego:

```
npm install
npm start
```

Al arrancar, crea automáticamente la tabla `usuarios` si no existe. La consola imprime las URLs
a usar como URL base en la app (emulador de Android y, si aplica, dispositivo físico en la misma
red Wi-Fi).

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar según tu instalación de PostgreSQL:

```
PORT=3001
JWT_SECRET=clave-secreta

PGHOST=localhost
PGPORT=5433
PGDATABASE=perfil_db
PGUSER=perfilapp
PGPASSWORD=tu-password
```

## Crear la base de datos (una sola vez)

```sql
CREATE USER perfilapp WITH PASSWORD 'tu-password';
CREATE DATABASE perfil_db OWNER perfilapp;
```

## Endpoints

| Método | Ruta | Auth | Body | Descripción |
|---|---|---|---|---|
| POST | `/api/auth/register` | No | `{ nombre, email, password }` | Crea la cuenta. **No** inicia sesión automáticamente — el usuario debe hacer login aparte. |
| POST | `/api/auth/login` | No | `{ email, password }` | Autentica y devuelve `{ token, usuario }`, con la foto de perfil (si tiene) ya incluida en Base64. |
| GET | `/api/perfil` | **Sí** | — | Datos del usuario autenticado, incluida la foto. |
| PUT | `/api/perfil/foto` | **Sí** | `{ foto }` | Actualiza la foto de perfil. `foto` es un string Base64 (o data URL `data:image/...;base64,...`). Enviar `foto: null` para quitarla. |

## La foto de perfil NO se guarda como archivo

A propósito: la imagen se recibe y se devuelve como **Base64** por la API, y se almacena en la
columna `foto_perfil` (tipo `BYTEA`) de la tabla `usuarios` en PostgreSQL — nunca se escribe un
archivo en el disco del servidor ni se usa un bucket de almacenamiento externo.

## Probar sin la app (curl)

```bash
# Registro
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan Perez","email":"juan@correo.com","password":"1234"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@correo.com","password":"1234"}'

# Actualizar foto (reemplazar <TOKEN>)
curl -X PUT http://localhost:3001/api/perfil/foto \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"foto":"data:image/png;base64,iVBORw0KGgo..."}'

# Ver perfil
curl http://localhost:3001/api/perfil -H "Authorization: Bearer <TOKEN>"
```

## App relacionada

[../PerfilApp](../PerfilApp) — PerfilApp (Ionic + Angular + Capacitor), en este mismo repositorio.

## Autor

Rodrigo Alexander Herrera Solares
